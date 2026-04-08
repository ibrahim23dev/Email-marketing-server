import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/user.model';
import OTP from '../models/otp.model';
import UserSettings from '../models/userSettings.model';
import AuditLog from '../models/auditLog.model';
import { signToken, verifyToken } from '../utils/jwt';
import logger from '../utils/logger';
import { getEmailService } from '../infrastructure/email/emailService';

// Generate 6-digit OTP
const generateOTP = (): string => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Send OTP via email service
const sendOTPEmail = async (email: string, otp: string, type: string): Promise<void> => {
  try {
    const emailService = getEmailService();
    
    if (type === 'email_verification') {
      const result = await emailService.sendVerificationEmail(email, otp);
      if (!result.success) {
        logger.error(`Failed to send verification email to ${email}:`, result.error);
        throw new Error(result.error || 'Failed to send verification email');
      }
      logger.info(`Verification OTP sent to ${email}`);
    } else if (type === 'password_reset') {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const resetLink = `${clientUrl}/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`;
      const result = await emailService.sendPasswordResetEmail(email, resetLink);
      if (!result.success) {
        logger.error(`Failed to send password reset email to ${email}:`, result.error);
        throw new Error(result.error || 'Failed to send password reset email');
      }
      logger.info(`Password reset email sent to ${email}`);
    }
  } catch (error) {
    logger.error('Error sending OTP email:', error);
    throw error;
  }
};

// ======================
// REGISTER
// ======================
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 1);

    const user = await User.create({
      name,
      email,
      password: hashed,
      trialEndsAt
    });

    // Create default settings
    await UserSettings.create({ userId: user._id });

    // Generate verification OTP
    const otp = generateOTP();
    await OTP.create({
      email,
      otp,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      newValues: { email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Send verification OTP
    await sendOTPEmail(email, otp, 'email_verification');

    return res.status(201).json({
      ok: true,
      message: 'Registration successful. Please verify your email.',
      userId: user._id
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

// ======================
// LOGIN
// ======================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Trial expiration is handled by checkCreditsBeforeScrape on the scrape endpoint now.
    // Users can always log in.

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const token = signToken({
      id: user._id,
      role: user.role,
      email: user.email
    });

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        credits: user.credits,
        trialStartDate: user.trialStartDate,
        scrapeCount: user.scrapeCount,
        isPremium: user.isPremium,
        trialEndsAt: user.trialEndsAt
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

// ======================
// VERIFY EMAIL
// ======================
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'email_verification',
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Mark OTP as used
    await OTP.findByIdAndUpdate(otpRecord._id, { isUsed: true });

    // Update user as email verified
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    if (user) {
      await AuditLog.create({
        userId: user._id,
        action: 'EMAIL_VERIFIED',
        entityType: 'User',
        entityId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    return res.json({
      ok: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
};

// ======================
// RESEND VERIFICATION OTP
// ======================
export const resendVerificationOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Invalidate existing OTPs
    await OTP.updateMany(
      { email, type: 'email_verification', isUsed: false },
      { isUsed: true }
    );

    // Generate new OTP
    const otp = generateOTP();
    await OTP.create({
      email,
      otp,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await sendOTPEmail(email, otp, 'email_verification');

    return res.json({
      ok: true,
      message: 'Verification OTP sent'
    });
  } catch (error) {
    logger.error('Resend OTP error:', error);
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

// ======================
// FORGOT PASSWORD
// ======================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found (security)
      return res.json({
        ok: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    await OTP.create({
      email,
      otp,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
    });

    await sendOTPEmail(email, otp, 'password_reset');

    return res.json({
      ok: true,
      message: 'If the email exists, a reset link has been sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
};

// ======================
// RESET PASSWORD
// ======================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'password_reset',
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Mark OTP as used
    await OTP.findByIdAndUpdate(otpRecord._id, { isUsed: true });

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 12);

    // Update password
    const user = await User.findOneAndUpdate(
      { email },
      { 
        password: hashed,
        isActive: true // Reactivate if was deactivated
      },
      { new: true }
    );

    if (user) {
      await AuditLog.create({
        userId: user._id,
        action: 'PASSWORD_RESET',
        entityType: 'User',
        entityId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      await UserSettings.findOneAndUpdate(
        { userId: user._id },
        { 'security.lastPasswordChange': new Date() }
      );
    }

    return res.json({
      ok: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    return res.status(500).json({ error: 'Password reset failed' });
  }
};

// ======================
// CHANGE PASSWORD (Authenticated)
// ======================
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { password: hashed });

    await AuditLog.create({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await UserSettings.findOneAndUpdate(
      { userId },
      { 'security.lastPasswordChange': new Date() }
    );

    return res.json({
      ok: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    return res.status(500).json({ error: 'Password change failed' });
  }
};

// ======================
// LOGOUT
// ======================
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await AuditLog.create({
      userId,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
};

// ======================
// GET CURRENT USER
// ======================
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = await UserSettings.findOne({ userId });

    return res.json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        credits: user.credits,
        trialStartDate: user.trialStartDate,
        scrapeCount: user.scrapeCount,
        isPremium: user.isPremium,
        trialEndsAt: user.trialEndsAt,
        lastLoginAt: user.lastLoginAt,
        avatar: user.avatar,
        phone: user.phone,
        company: user.company,
        timezone: user.timezone,
        settings: settings || {}
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
};
