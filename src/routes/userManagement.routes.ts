import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUserStats
} from '../controllers/userManagement.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authGuard);
router.use(allowRoles('admin', 'superadmin'));

// Stats (all admins can see)
router.get('/stats', getUserStats);

// CRUD operations
router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;
