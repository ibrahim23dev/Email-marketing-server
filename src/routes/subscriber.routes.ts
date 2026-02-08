import { Router } from 'express';
import {
  getSubscribers,
  getSubscriberById,
  createSubscriber,
  bulkCreateSubscribers,
  updateSubscriber,
  deleteSubscriber,
  unsubscribe,
  getSubscriberStats
} from '../controllers/subscriber.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.use(authGuard);

router.get('/', getSubscribers);
router.get('/stats', getSubscriberStats);
router.get('/:id', getSubscriberById);
router.post('/', createSubscriber);
router.post('/bulk', bulkCreateSubscribers);
router.put('/:id', updateSubscriber);
router.delete('/:id', deleteSubscriber);
router.post('/:id/unsubscribe', unsubscribe);

export default router;
