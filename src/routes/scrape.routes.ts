import { Router } from 'express';
import { startScrape, listLeads, getLead } from '../controllers/scrape.controller';

const router = Router();

/**
 * POST /api/scrape
 * body: { actorId: string, input: object }
 */
router.post('/scrape', startScrape);
router.get('/leads', listLeads);
router.get('/leads/:id', getLead);

export default router;
