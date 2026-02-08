import { Router } from 'express';
import {
  getAudiences,
  getAudienceById,
  createAudience,
  updateAudience,
  deleteAudience,
  addSubscribersToAudience,
  syncAudienceSubscribers
} from '../controllers/audience.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.use(authGuard);

router.get('/', getAudiences);
router.get('/:id', getAudienceById);
router.post('/', createAudience);
router.put('/:id', updateAudience);
router.delete('/:id', deleteAudience);
router.post('/:id/subscribers', addSubscribersToAudience);
router.post('/:id/sync', syncAudienceSubscribers);

export default router;
