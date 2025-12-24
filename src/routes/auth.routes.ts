import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { allowRoles } from '../middlewares/role.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);

/* Protected examples */
router.get('/admin',
  authGuard,
  allowRoles('admin', 'superadmin'),
  (req, res) => res.json({ ok: true, msg: 'Admin access' })
);

router.get('/superadmin',
  authGuard,
  allowRoles('superadmin'),
  (req, res) => res.json({ ok: true, msg: 'Superadmin access' })
);

export default router;
