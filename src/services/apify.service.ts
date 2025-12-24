import { ApifyClient } from 'apify-client';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();
/* =========================
   ENV VALIDATION
========================= */
if (!process.env.APIFY_TOKEN) {
  throw new Error('❌ APIFY_TOKEN is missing. Check your .env file.');
}

/* =========================
   APIFY CLIENT
========================= */
const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

/* =========================
   RUN ACTOR + FETCH DATASET
========================= */
async function runActorAndFetchResults(actorId: string, input: any) {
  try {
    logger.info(`Calling Apify actor: ${actorId}`);

    const run = await client.actor(actorId).call(input);

    if (!run || !run.defaultDatasetId) {
      throw new Error('Actor finished but no defaultDatasetId returned');
    }

    const dataset = client.dataset(run.defaultDatasetId);
    const items: any[] = [];

    let offset = 0;
    const limit = 1000;

    while (true) {
      const res = await dataset.listItems({ offset, limit });

      if (!res?.items || res.items.length === 0) break;

      items.push(...res.items);
      offset += limit;
    }

    logger.info(`Fetched ${items.length} dataset items`);

    return { run, items };
  } catch (err: any) {
    // 🔥 FULL ERROR LOG (VERY IMPORTANT)
    console.error('APIFY SERVICE ERROR =>', err?.response?.data || err);
    throw err;
  }
}

export default { runActorAndFetchResults };
