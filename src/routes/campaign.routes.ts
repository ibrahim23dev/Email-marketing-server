import { Router } from 'express';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  scheduleCampaign,
  pauseCampaign,
  resumeCampaign,
  duplicateCampaign,
  validateCampaign,
  getCampaignAnalytics,
  getCampaignStats
} from '../controllers/campaign.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Campaign CRUD
router.get('/', getCampaigns);
router.post('/', createCampaign);
router.get('/validate', validateCampaign);
router.get('/:id', getCampaignById);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

// Campaign actions
router.post('/:id/send', sendCampaign);
router.post('/:id/schedule', scheduleCampaign);
router.post('/:id/pause', pauseCampaign);
router.post('/:id/resume', resumeCampaign);
router.post('/:id/duplicate', duplicateCampaign);

// Campaign analytics
router.get('/:id/analytics', getCampaignAnalytics);
router.get('/:id/stats', getCampaignStats);

export default router;
