import { Router } from 'express';
import authRoutes from './auth.routes';
import leadRoutes from './lead.routes';
import scrapeRoutes from './scrape.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/scrape', scrapeRoutes);

export default router;
