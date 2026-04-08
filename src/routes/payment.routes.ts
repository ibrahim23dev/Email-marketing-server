import { Router, Request, Response } from 'express';
import { authGuard, AuthRequest } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';
import { createPaymentRequest, approvePaymentRequest, getPaymentRequests } from '../controllers/payment.controller';

const router = Router();

// All payment routes require authentication
router.use(authGuard);

// User endpoints
router.post('/', (req: Request, res: Response) => createPaymentRequest(req as unknown as AuthRequest, res));

// Admin endpoints
router.get('/', allowRoles('superadmin', 'admin'), (req: Request, res: Response) => getPaymentRequests(req as unknown as AuthRequest, res));
router.patch('/:id/approve', allowRoles('superadmin', 'admin'), (req: Request, res: Response) => approvePaymentRequest(req as unknown as AuthRequest, res));

export default router;
