import { Router } from 'express';
import {
  getOverallAnalytics,
  getAnalyticsByCampaign,
  getTimeSeriesAnalytics,
  getTopCampaigns,
  getEngagementMetrics
} from '../controllers/analytics.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.use(authGuard);

router.get('/', getOverallAnalytics);
router.get('/campaign/:id', getAnalyticsByCampaign);
router.get('/timeseries', getTimeSeriesAnalytics);
router.get('/top-campaigns', getTopCampaigns);
router.get('/engagement', getEngagementMetrics);

export default router;
