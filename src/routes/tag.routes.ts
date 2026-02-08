import { Router } from 'express';
import {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  mergeTags
} from '../controllers/tag.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.use(authGuard);

router.get('/', getTags);
router.get('/:id', getTagById);
router.post('/', createTag);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);
router.post('/merge', mergeTags);

export default router;
