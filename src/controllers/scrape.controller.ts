import { Request, Response } from 'express';
import apifyService from '../services/apify.service';
import Lead from '../models/lead';
import logger from '../utils/logger';
import { validateEmails } from '../utils/validator';

export async function startScrape(req: Request, res: Response) {
  try {
    const { actorId, input } = req.body;

    if (!actorId) {
      return res.status(400).json({ ok: false, error: 'actorId is required' });
    }

    logger.info(`Starting Apify actor: ${actorId}`);

    // 1️⃣ Run actor & fetch dataset items
    const { run, items } = await apifyService.runActorAndFetchResults(actorId, input);

    if (!items || !items.length) {
      return res.json({
        ok: true,
        actorRun: run,
        itemsCount: 0,
        savedCount: 0,
        message: 'No leads found'
      });
    }

    // 2️⃣ Normalize Apify dataset items → Lead docs
    const docs = items.map((it: any) => {
      const emails = Array.isArray(it.emails) ? it.emails : [];
      const phones = Array.isArray(it.phones) ? it.phones : [];

      return {
        name: it.title || it.name || '',
        website: it.url || '',
        emails,
        phones,
        address: it.address || '',
        sourceActor: actorId,
        validatedEmails: undefined as string[] | undefined,
        raw: it
      };
    });

    // 3️⃣ Optional email validation
    if (
      process.env.ENABLE_EMAIL_VALIDATION === 'true' &&
      process.env.EMAIL_VALIDATOR_API_KEY
    ) {
      logger.info('Running email validation...');
      for (const doc of docs) {
        if (doc.emails.length) {
          doc.validatedEmails = await validateEmails(doc.emails);
        }
      }
    }

    // 4️⃣ Save with deduplication
    let savedCount = 0;

    for (const doc of docs) {
      const filter =
        doc.website
          ? { website: doc.website }
          : doc.emails.length
          ? { emails: { $in: doc.emails } }
          : null;

      if (!filter) continue;

      await Lead.findOneAndUpdate(
        filter,
        {
          $set: {
            name: doc.name,
            phones: doc.phones,
            address: doc.address,
            sourceActor: doc.sourceActor,
            raw: doc.raw,
            ...(doc.validatedEmails ? { validatedEmails: doc.validatedEmails } : {})
          },
          $setOnInsert: {
            website: doc.website,
            emails: doc.emails
          }
        },
        { upsert: true }
      );

      savedCount++;
    }

    return res.json({
      ok: true,
      actorRun: {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt
      },
      itemsCount: items.length,
      savedCount
    });
  } catch (err: any) {
    logger.error('startScrape error:', err?.message || err);
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Internal server error'
    });
  }
}

/* =========================
   LIST LEADS
========================= */
export async function listLeads(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const q = (req.query.q as string) || '';

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { website: new RegExp(q, 'i') },
        { emails: new RegExp(q, 'i') }
      ];
    }

    const total = await Lead.countDocuments(filter);
    const items = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      ok: true,
      total,
      page,
      limit,
      items
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Server error'
    });
  }
}

/* =========================
   GET SINGLE LEAD
========================= */
export async function getLead(req: Request, res: Response) {
  try {
    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead not found' });
    }

    return res.json({ ok: true, lead });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Server error'
    });
  }
}
