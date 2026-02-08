import { Router } from 'express';
import {
  getDashboard,
  getCampaignPerformance,
  getSubscriberAnalytics
} from '../controllers/dashboard.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.use(authGuard);

router.get('/', getDashboard);
router.get('/campaigns', getCampaignPerformance);
router.get('/subscribers', getSubscriberAnalytics);

export default router;
