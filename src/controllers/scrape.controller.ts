import { Request, Response } from 'express';
import apifyService from '../services/apify.service';
import Lead from '../models/lead';
import logger from '../utils/logger';
import { validateEmails } from '../utils/validator';

export async function startScrape(req: Request, res: Response) {
  try {
    const { actorId, input } = req.body;
    if (!actorId) return res.status(400).json({ error: 'actorId is required' });

    logger.info('Starting actor:', actorId);
    const { run, items } = await apifyService.runActorAndFetchResults(actorId, input);

    // Normalize items into Lead docs
    const docs = (items || []).map((it: any) => {
      const emails = Array.isArray(it.emails) ? it.emails : it.email ? [it.email] : [];
      const phones = Array.isArray(it.phones) ? it.phones : it.phone ? [it.phone] : [];

      return {
        name: it.name || it.title || it.company || '',
        website: it.website || it.url || it.websiteUrl || '',
        emails,
        phones,
        address: it.address || it.location || '',
        sourceActor: actorId,
        // ensure property exists so TypeScript allows assignment later
        validatedEmails: undefined as string[] | undefined,
        raw: it
      };
    });

    // Optional: validate emails (if enabled)
    if (process.env.ENABLE_EMAIL_VALIDATION === 'true' && process.env.EMAIL_VALIDATOR_API_KEY) {
      logger.info('Validating emails for scraped leads...');
      for (const doc of docs) {
        if (doc.emails && doc.emails.length) {
          doc.validatedEmails = await validateEmails(doc.emails);
        }
      }
    }

    // Insert with dedupe: we'll upsert by website or email
    const savedDocs: any[] = [];
    for (const doc of docs) {
      // prefer dedupe by website or first email
      const filter: any = {};
      if (doc.website) filter.website = doc.website;
      else if (doc.emails && doc.emails.length) filter.emails = { $in: doc.emails };

      if (Object.keys(filter).length) {
        // update existing or insert
        const updated = await Lead.findOneAndUpdate(
          filter,
          { $setOnInsert: doc, $set: { updatedAt: new Date() } },
          { upsert: true, new: true }
        ).lean();
        savedDocs.push(updated);
      } else {
        // no dedupe key, just insert
        const created = await Lead.create(doc);
        savedDocs.push(created);
      }
    }

    return res.json({
      ok: true,
      actorRun: run,
      itemsCount: items.length,
      savedCount: savedDocs.length
    });
  } catch (err: any) {
    logger.error('startScrape error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}

export async function listLeads(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const q = (req.query.q as string) || '';

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { website: { $regex: q, $options: 'i' } },
        { emails: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await Lead.countDocuments(filter);
    const items = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ ok: true, total, page, limit, items });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}

export async function getLead(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const lead = await Lead.findById(id).lean();
    if (!lead) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, lead });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
