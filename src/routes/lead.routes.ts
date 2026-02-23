import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();
const leadController = new LeadController();

const createLeadSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    company: z.string().optional(),
    industry: z.string().optional(),
    source: z.string()
  })
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'REJECTED'])
  })
});

// Protected routes
router.use(authenticate);

// Standard USER can view, add, and update status
router.post('/', validate(createLeadSchema), leadController.create);
router.get('/', leadController.getAll);
router.patch('/:id/status', validate(updateStatusSchema), leadController.updateStatus);

export default router;
