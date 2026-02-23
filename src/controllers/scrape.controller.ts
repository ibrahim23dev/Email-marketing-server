import { Request, Response } from 'express';
import { ScrapeService } from '../services/scrape.service';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/async-handler';

const scrapeService = new ScrapeService();

export class ScrapeController {
  startScrape = asyncHandler(async (req: Request, res: Response) => {
    const { website, domains, industry } = req.body;
    const result = await scrapeService.triggerScrape(website, domains, industry);
    res.status(202).json(ApiResponse.success('Scrape job started', result));
  });
}
