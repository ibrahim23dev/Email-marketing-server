declare module 'apify-client' {
  // Basic any types for ApifyClient to avoid TS errors.
  export class ApifyClient {
    constructor(opts?: any);
    actor(actorId: string): any;
    dataset(datasetId: string): any;
    run(runId: string): any;
  }
}
