import { Router } from 'express';
import { 
  register, 
  login, 
  verifyEmail, 
  resendVerificationOTP,
  forgotPassword, 
  resetPassword,
  changePassword,
  logout,
  getCurrentUser
} from '../controllers/auth.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authGuard, getCurrentUser);
router.post('/change-password', authGuard, changePassword);
router.post('/logout', authGuard, logout);

export default router;
