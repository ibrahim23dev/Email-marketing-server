import { Router } from 'express';
import { authGuard } from '../../middlewares/auth.middleware';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getDefaultTemplates,
} from './template.controller';

const router = Router();

// All template routes require authentication
router.use(authGuard);

// Template CRUD routes
router.get('/', getTemplates);
router.get('/default', getDefaultTemplates);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
