import { Router } from 'express';
import { ScrapeController } from '../controllers/scrape.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();
const scrapeController = new ScrapeController();

const scrapeSchema = z.object({
  body: z.object({
    website: z.string().url().optional(),
    domains: z.array(z.string()).optional(),
    industry: z.string().optional()
  })
});

// Only Admin can trigger scraping
router.post('/', authenticate, authorize('ADMIN'), validate(scrapeSchema), scrapeController.startScrape);

export default router;
