import { Router } from 'express';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getDefaultTemplates
} from '../controllers/template.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.use(authGuard);

router.get('/', getTemplates);
router.get('/default', getDefaultTemplates);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
