import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updatePassword,
  updateSecuritySettings,
  getAllSettings,
  updateAllSettings
} from '../controllers/settings.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.use(authGuard);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Notifications
router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);

// Security
router.get('/security', getSecuritySettings);
router.put('/password', updatePassword);
router.put('/security', updateSecuritySettings);

// All settings
router.get('/', getAllSettings);
router.put('/', updateAllSettings);

export default router;
