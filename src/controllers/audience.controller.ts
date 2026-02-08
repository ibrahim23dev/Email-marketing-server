import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Audience from '../models/audience.model';
import Subscriber from '../models/subscriber.model';
import AuditLog from '../models/auditLog.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET ALL AUDIENCES
// ======================
export const getAudiences = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, search } = req.query;

    const query: any = { userId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [audiences, total] = await Promise.all([
      Audience.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Audience.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: audiences,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get audiences error:', error);
    return res.status(500).json({ error: 'Failed to fetch audiences' });
  }
};

// ======================
// GET AUDIENCE BY ID
// ======================
export const getAudienceById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const audience = await Audience.findOne({ _id: id, userId });
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }

    return res.json({ ok: true, data: audience });
  } catch (error) {
    logger.error('Get audience error:', error);
    return res.status(500).json({ error: 'Failed to fetch audience' });
  }
};

// ======================
// CREATE AUDIENCE
// ======================
export const createAudience = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, description, tags, filters } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Audience name is required' });
    }

    const audience = await Audience.create({
      userId,
      name,
      description,
      tags: tags || [],
      filters: filters || [],
      subscriberCount: 0
    });

    await AuditLog.create({
      userId,
      action: 'AUDIENCE_CREATED',
      entityType: 'Audience',
      entityId: audience._id,
      newValues: { name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      ok: true,
      data: audience,
      message: 'Audience created successfully'
    });
  } catch (error) {
    logger.error('Create audience error:', error);
    return res.status(500).json({ error: 'Failed to create audience' });
  }
};

// ======================
// UPDATE AUDIENCE
// ======================
export const updateAudience = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = req.body;

    const audience = await Audience.findOne({ _id: id, userId });
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }

    const updated = await Audience.findByIdAndUpdate(id, updates, { new: true });

    await AuditLog.create({
      userId,
      action: 'AUDIENCE_UPDATED',
      entityType: 'Audience',
      entityId: audience._id,
      oldValues: { name: audience.name },
      newValues: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      data: updated,
      message: 'Audience updated successfully'
    });
  } catch (error) {
    logger.error('Update audience error:', error);
    return res.status(500).json({ error: 'Failed to update audience' });
  }
};

// ======================
// DELETE AUDIENCE
// ======================
export const deleteAudience = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const audience = await Audience.findOne({ _id: id, userId });
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }

    await Audience.findByIdAndDelete(id);

    await AuditLog.create({
      userId,
      action: 'AUDIENCE_DELETED',
      entityType: 'Audience',
      entityId: audience._id,
      oldValues: { name: audience.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Audience deleted successfully'
    });
  } catch (error) {
    logger.error('Delete audience error:', error);
    return res.status(500).json({ error: 'Failed to delete audience' });
  }
};

// ======================
// ADD SUBSCRIBERS TO AUDIENCE
// ======================
export const addSubscribersToAudience = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { subscriberIds } = req.body;

    const audience = await Audience.findOne({ _id: id, userId });
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }

    // Update subscriber audience
    await Subscriber.updateMany(
      { _id: { $in: subscriberIds }, userId },
      { $addToSet: { tags: audience.name } }
    );

    // Update subscriber count
    const subscriberCount = await Subscriber.countDocuments({
      userId,
      tags: audience.name,
      status: 'active'
    });

    await Audience.findByIdAndUpdate(id, { subscriberCount });

    return res.json({
      ok: true,
      message: 'Subscribers added successfully',
      subscriberCount
    });
  } catch (error) {
    logger.error('Add subscribers error:', error);
    return res.status(500).json({ error: 'Failed to add subscribers' });
  }
};

// ======================
// SYNC AUDIENCE SUBSCRIBERS
// ======================
export const syncAudienceSubscribers = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const audience = await Audience.findOne({ _id: id, userId });
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }

    // Count subscribers with audience tags
    const subscriberCount = await Subscriber.countDocuments({
      userId,
      tags: audience.name,
      status: { $ne: 'bounced' }
    });

    await Audience.findByIdAndUpdate(id, { subscriberCount });

    return res.json({
      ok: true,
      message: 'Audience synced',
      subscriberCount
    });
  } catch (error) {
    logger.error('Sync audience error:', error);
    return res.status(500).json({ error: 'Failed to sync audience' });
  }
};
