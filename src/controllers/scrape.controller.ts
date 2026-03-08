import { Response } from 'express';
import apifyService from '../services/apify.service';
import Lead from '../models/lead';
import logger from '../utils/logger';
import { AuthRequest } from '../middlewares/auth.middleware';

const GOOGLE_ACTOR = 'compass/google-maps-extractor';
const EMAIL_ACTOR  = 'vdrmota/contact-info-scraper';
const SOCIAL_ACTOR = 'tri_angle/social-media-finder';

/* ─────────────────────────────────────────────────────────
   Helper – is the caller a privileged admin?
───────────────────────────────────────────────────────── */
function isAdmin(role: string): boolean {
  return role === 'superadmin' || role === 'admin';
}

/* ==========================================================
   START SCRAPE PIPELINE
   POST /api/v1/scrape
   Body: { keyword: string, limit?: number }
========================================================== */
export async function startScrape(req: AuthRequest, res: Response) {
  try {
    const userId  = req.user.id;
    const keyword: string = req.body.keyword?.trim();
    const limit: number   = Math.min(Number(req.body.limit) || 20, 100);

    if (!keyword) {
      return res.status(400).json({ ok: false, error: 'keyword is required' });
    }

    logger.info(`[user:${userId}] Lead scraping started → "${keyword}"`);

    /* ── STEP 1: Google Maps ──────────────────────────── */
    const { items: businesses } = await apifyService.runActorAndFetchResults(
      GOOGLE_ACTOR,
      { searchStringsArray: [keyword], maxCrawledPlacesPerSearch: limit }
    );

    if (!businesses?.length) {
      return res.json({ ok: true, message: 'No businesses found' });
    }

    let savedCount = 0;

    for (const business of businesses) {
      try {
        const website: string  = business.website || '';
        const phones: string[] = business.phone ? [business.phone] : [];
        let   emails: string[] = [];

        /* ── STEP 2: Website email scrape ─────────────── */
        if (website) {
          try {
            const { items } = await apifyService.runActorAndFetchResults(
              EMAIL_ACTOR,
              { startUrls: [{ url: website }], maxDepth: 1 }
            );
            emails = items?.flatMap((i: any) => i.emails || []) || [];
          } catch {
            logger.warn(`[user:${userId}] Email scrape failed → ${website}`);
          }
        }

        /* ── STEP 3: Social scrape ────────────────────── */
        let socials: any[] = [];
        try {
          const { items } = await apifyService.runActorAndFetchResults(
            SOCIAL_ACTOR,
            { query: business.title }
          );
          socials = items || [];
        } catch {
          logger.warn(`[user:${userId}] Social scrape failed → ${business.title}`);
        }

        /* ── Normalize ────────────────────────────────── */
        const doc = {
          userId,                              // ← owner
          searchKeyword: keyword,
          name:          business.title || '',
          website,
          emails:        [...new Set<string>(emails)],
          phones,
          address:       business.address || '',
          sourceActor:   'lead-pipeline',
          raw:           { business, socials }
        };

        /* ── Dedup filter (scoped per user) ───────────── */
        const baseFilter: any = { userId };   // never cross user boundaries

        const uniqueFilter =
          website              ? { ...baseFilter, website }                     :
          emails.length        ? { ...baseFilter, emails: { $in: emails } }     :
          phones.length        ? { ...baseFilter, phones: { $in: phones } }     :
          null;

        if (!uniqueFilter) continue;

        /* ── Upsert (per-user) ────────────────────────── */
        await Lead.findOneAndUpdate(
          uniqueFilter,
          { $set: doc },
          { upsert: true, new: true }
        );

        savedCount++;
      } catch (err) {
        logger.error(`[user:${userId}] Business processing failed → ${business.title}`, err);
      }
    }

    return res.json({
      ok: true,
      keyword,
      businessesFound: businesses.length,
      leadsSaved:      savedCount
    });

  } catch (err: any) {
    logger.error('Scrape pipeline failed', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Internal server error' });
  }
}


/* ==========================================================
   LIST LEADS
   GET /api/v1/leads?page=1&limit=50&q=searchTerm
   • Regular users see only their own leads.
   • admins / superadmins see everyone's (with optional userId filter).
========================================================== */
export async function listLeads(req: AuthRequest, res: Response) {
  try {
    const { id: callerId, role } = req.user;

    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const q     = (req.query.q as string) || '';

    /* ── Ownership scope ──────────────────────────────── */
    const filter: any = isAdmin(role)
      ? {}                               // admins optionally filter by ?userId=
      : { userId: callerId };            // users see only their own

    // Admins can further narrow by ?userId=<id>
    if (isAdmin(role) && req.query.userId) {
      filter.userId = req.query.userId;
    }

    /* ── Text search ──────────────────────────────────── */
    if (q) {
      filter.$or = [
        { name:    new RegExp(q, 'i') },
        { website: new RegExp(q, 'i') },
        { emails:  new RegExp(q, 'i') },
        { phones:  new RegExp(q, 'i') },
        { searchKeyword: new RegExp(q, 'i') }
      ];
    }

    const [total, items] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email')   // handy for admin views
        .lean()
    ]);

    return res.json({
      ok: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items
    });

  } catch (err: any) {
    logger.error('listLeads error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Server error' });
  }
}


/* ==========================================================
   GET SINGLE LEAD
   GET /api/v1/leads/:id
   • Regular users can only access their own leads.
   • Admins can access any lead.
========================================================== */
export async function getLead(req: AuthRequest, res: Response) {
  try {
    const { id: callerId, role } = req.user;

    const lead = await Lead.findById(req.params.id)
      .populate('userId', 'name email')
      .lean();

    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead not found' });
    }

    /* ── Ownership check for non-admins ──────────────── */
    if (!isAdmin(role) && String(lead.userId) !== callerId) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }

    return res.json({ ok: true, lead });

  } catch (err: any) {
    logger.error('getLead error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Server error' });
  }
}


/* ==========================================================
   DELETE LEAD
   DELETE /api/v1/leads/:id
   • Regular users can only delete their own leads.
   • Admins can delete any lead.
========================================================== */
export async function deleteLead(req: AuthRequest, res: Response) {
  try {
    const { id: callerId, role } = req.user;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead not found' });
    }

    /* ── Ownership check for non-admins ──────────────── */
    if (!isAdmin(role) && String(lead.userId) !== callerId) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }

    await lead.deleteOne();

    logger.info(`Lead ${req.params.id} deleted by user ${callerId}`);

    return res.json({ ok: true, message: 'Lead deleted successfully' });

  } catch (err: any) {
    logger.error('deleteLead error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Server error' });
  }
}