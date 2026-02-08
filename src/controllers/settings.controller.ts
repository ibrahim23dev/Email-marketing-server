import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import UserSettings from '../models/userSettings.model';
import AuditLog from '../models/auditLog.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET PROFILE
// ======================
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = await UserSettings.findOne({ userId });

    return res.json({
      ok: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          company: user.company,
          timezone: user.timezone,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        settings: settings || {}
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ======================
// UPDATE PROFILE
// ======================
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, phone, company, timezone, avatar } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldValues = { name: user.name, phone: user.phone, company: user.company };

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (company !== undefined) user.company = company;
    if (timezone !== undefined) user.timezone = timezone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    await AuditLog.create({
      userId,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: user._id,
      oldValues,
      newValues: { name, phone, company, timezone },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        timezone: user.timezone,
        avatar: user.avatar
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ======================
// GET NOTIFICATION SETTINGS
// ======================
export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    return res.json({
      ok: true,
      data: settings.notifications
    });
  } catch (error) {
    logger.error('Get notification settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// ======================
// UPDATE NOTIFICATION SETTINGS
// ======================
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { 
      emailCampaignReports, 
      subscriberActivity, 
      systemUpdates, 
      marketingEmails 
    } = req.body;

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    if (emailCampaignReports !== undefined) settings.notifications.emailCampaignReports = emailCampaignReports;
    if (subscriberActivity !== undefined) settings.notifications.subscriberActivity = subscriberActivity;
    if (systemUpdates !== undefined) settings.notifications.systemUpdates = systemUpdates;
    if (marketingEmails !== undefined) settings.notifications.marketingEmails = marketingEmails;

    await settings.save();

    await AuditLog.create({
      userId,
      action: 'NOTIFICATION_SETTINGS_UPDATED',
      entityType: 'UserSettings',
      entityId: settings._id,
      newValues: { notifications: settings.notifications },
      ipAddress: req.ip
    });

    return res.json({
      ok: true,
      data: settings.notifications,
      message: 'Notification settings updated'
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
};

// ======================
// GET SECURITY SETTINGS
// ======================
export const getSecuritySettings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    return res.json({
      ok: true,
      data: {
        twoFactorEnabled: settings.security.twoFactorEnabled,
        loginAlerts: settings.security.loginAlerts,
        lastPasswordChange: settings.security.lastPasswordChange
      }
    });
  } catch (error) {
    logger.error('Get security settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// ======================
// UPDATE PASSWORD
// ======================
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { password: hashed });

    await UserSettings.findOneAndUpdate(
      { userId },
      { 'security.lastPasswordChange': new Date() }
    );

    await AuditLog.create({
      userId,
      action: 'PASSWORD_UPDATED',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Update password error:', error);
    return res.status(500).json({ error: 'Failed to update password' });
  }
};

// ======================
// UPDATE SECURITY SETTINGS
// ======================
export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { loginAlerts } = req.body;

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    if (loginAlerts !== undefined) {
      settings.security.loginAlerts = loginAlerts;
      await settings.save();
    }

    await AuditLog.create({
      userId,
      action: 'SECURITY_SETTINGS_UPDATED',
      entityType: 'UserSettings',
      entityId: settings._id,
      newValues: { loginAlerts },
      ipAddress: req.ip
    });

    return res.json({
      ok: true,
      message: 'Security settings updated'
    });
  } catch (error) {
    logger.error('Update security settings error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
};

// ======================
// GET ALL SETTINGS
// ======================
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    return res.json({
      ok: true,
      data: {
        profile: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          company: user.company,
          timezone: user.timezone,
          avatar: user.avatar
        },
        notifications: settings.notifications,
        security: {
          twoFactorEnabled: settings.security.twoFactorEnabled,
          loginAlerts: settings.security.loginAlerts,
          lastPasswordChange: settings.security.lastPasswordChange
        },
        preferences: settings.preferences
      }
    });
  } catch (error) {
    logger.error('Get all settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// ======================
// UPDATE ALL SETTINGS
// ======================
export const updateAllSettings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { profile, notifications, preferences } = req.body;

    // Update profile
    if (profile) {
      await User.findByIdAndUpdate(userId, {
        name: profile.name,
        phone: profile.phone,
        company: profile.company,
        timezone: profile.timezone,
        avatar: profile.avatar
      });
    }

    // Update settings
    let settings = await UserSettings.findOne({ userId });
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    if (notifications) {
      settings.notifications = { ...settings.notifications, ...notifications };
    }
    if (preferences) {
      settings.preferences = { ...settings.preferences, ...preferences };
    }

    await settings.save();

    await AuditLog.create({
      userId,
      action: 'SETTINGS_UPDATED',
      entityType: 'UserSettings',
      entityId: settings._id,
      ipAddress: req.ip
    });

    return res.json({
      ok: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    logger.error('Update all settings error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
};
