import { ApifyClient } from 'apify-client';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();
const APIFY_TOKEN = process.env.APIFY_TOKEN || '';

if (!APIFY_TOKEN) {
  logger.error('APIFY_TOKEN is not set in .env — Apify calls will fail.');
}

const client = new ApifyClient({ token: APIFY_TOKEN });

async function runActorAndFetchResults(actorId: string, input: any = {}) {
  
  logger.info('Calling actor:', actorId);
  // এখানে শুধু input পাস করবেন, কোনো options নয়
  const run = await client.actor(actorId).call(input);

  const datasetId = run.defaultDatasetId;
  let items: any[] = [];

  if (datasetId) {
    logger.info('Fetching dataset items for dataset:', datasetId);
    const datasetClient = client.dataset(datasetId);

    let continuationToken: string | undefined = undefined;
    
    do {
      // ✅ পরিবর্তন এখানে: options অবজেক্টটি ডাইনামিকলি তৈরি করা হচ্ছে
      const listOptions: any = { limit: 1000 };
      if (continuationToken) {
        listOptions.continuationToken = continuationToken;
      }

      const page = await datasetClient.listItems(listOptions);

      // Apify এর নতুন ভার্সনে ডাটা সাধারণত page.items এর ভেতরে থাকে
      const pageItems = page.items || [];
      
      if (Array.isArray(pageItems) && pageItems.length > 0) {
        items.push(...pageItems);
      }

      // টাইপ কাস্টিং করে continuationToken নেওয়া হচ্ছে
      continuationToken = (page as any).continuationToken;

    } while (continuationToken);

  } else {
    logger.info('No defaultDatasetId on run, nothing to fetch');
  }

  return { run, items };
}

export default { runActorAndFetchResults };