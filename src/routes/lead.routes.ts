import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  addLeadsToAudience
} from '../controllers/lead.controller.js';
import { authGuard } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authGuard);

router.post('/', createLead);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/add-to-audience', addLeadsToAudience);

export default router;