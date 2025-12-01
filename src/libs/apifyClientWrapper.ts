// A small wrapper in case you want to add helpers later (not required)
// Keep as placeholder for future expansions (webhooks, actorTasks, etc)

import { ApifyClient } from 'apify-client';
const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

export default client;
