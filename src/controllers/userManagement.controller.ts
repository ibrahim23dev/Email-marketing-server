import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import UserSettings from '../models/userSettings.model';
import AuditLog from '../models/auditLog.model';
import Campaign from '../models/campaign.model';
import Subscriber from '../models/subscriber.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET ALL USERS (Admin)
// ======================
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ======================
// GET USER BY ID (Admin)
// ======================
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user stats
    const [campaignCount, subscriberCount] = await Promise.all([
      Campaign.countDocuments({ userId: id }),
      Subscriber.countDocuments({ userId: id })
    ]);

    return res.json({
      ok: true,
      data: {
        ...user.toObject(),
        stats: {
          campaigns: campaignCount,
          subscribers: subscriberCount
        }
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// ======================
// CREATE USER (Admin)
// ======================
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role || 'user',
      phone,
      company,
      isEmailVerified: true
    });

    // Create default settings
    await UserSettings.create({ userId: user._id });

    await AuditLog.create({
      userId: getUserId(req),
      action: 'ADMIN_USER_CREATED',
      entityType: 'User',
      entityId: user._id,
      newValues: { name, email, role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      ok: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'User created successfully'
    });
  } catch (error) {
    logger.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

// ======================
// UPDATE USER (Admin)
// ======================
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, phone, company, timezone } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent modifying superadmin
    if (user.role === 'superadmin' && (req as any).user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Cannot modify superadmin' });
    }

    if (name) user.name = name;
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      user.email = email.toLowerCase();
    }
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (phone !== undefined) user.phone = phone;
    if (company !== undefined) user.company = company;
    if (timezone !== undefined) user.timezone = timezone;

    await user.save();

    await AuditLog.create({
      userId: getUserId(req),
      action: 'ADMIN_USER_UPDATED',
      entityType: 'User',
      entityId: user._id,
      oldValues: { name: (await User.findById(id))?.name, role: (await User.findById(id))?.role },
      newValues: { name: user.name, role: user.role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

// ======================
// DELETE USER (Admin)
// ======================
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deleteData } = req.query;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete superadmin' });
    }

    if (deleteData === 'true') {
      // Delete all user data
      await Promise.all([
        Campaign.deleteMany({ userId: id }),
        Subscriber.deleteMany({ userId: id }),
        UserSettings.deleteMany({ userId: id }),
        AuditLog.deleteMany({ userId: id })
      ]);
    }

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      userId: getUserId(req),
      action: 'ADMIN_USER_DELETED',
      entityType: 'User',
      entityId: user._id,
      oldValues: { name: user.name, email: user.email },
      metadata: { deleteData: deleteData === 'true' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ======================
// RESET USER PASSWORD (Admin)
// ======================
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(id, { password: hashed });

    await UserSettings.findOneAndUpdate(
      { userId: id },
      { 'security.lastPasswordChange': new Date() }
    );

    await AuditLog.create({
      userId: getUserId(req),
      action: 'ADMIN_PASSWORD_RESET',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
};

// ======================
// GET USER STATS (Admin)
// ======================
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          admins: { $sum: { $cond: [{ $in: ['$role', ['admin', 'superadmin']] }, 1, 0] } },
          verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
        }
      }
    ]);

    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const recentRegistrations = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      ok: true,
      data: {
        summary: stats[0] || { total: 0, active: 0, admins: 0, verified: 0 },
        roleDistribution: roleDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        recentRegistrations
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};
