import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Subscriber from '../models/subscriber.model';
import Tag from '../models/tag.model';
import AuditLog from '../models/auditLog.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET ALL SUBSCRIBERS
// ======================
export const getSubscribers = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, search, status, tags } = req.query;

    const query: any = { userId };
    if (status) query.status = status;
    if (tags) query.tags = { $in: (tags as string).split(',') };
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [subscribers, total] = await Promise.all([
      Subscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Subscriber.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: subscribers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get subscribers error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
};

// ======================
// GET SUBSCRIBER BY ID
// ======================
export const getSubscriberById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const subscriber = await Subscriber.findOne({ _id: id, userId });
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    return res.json({ ok: true, data: subscriber });
  } catch (error) {
    logger.error('Get subscriber error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriber' });
  }
};

// ======================
// CREATE SUBSCRIBER
// ======================
export const createSubscriber = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { email, firstName, lastName, tags, source, customFields } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check for duplicate
    const existing = await Subscriber.findOne({ userId, email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const subscriber = await Subscriber.create({
      userId,
      email: email.toLowerCase(),
      firstName,
      lastName,
      tags: tags || [],
      source: source || 'manual',
      customFields: customFields || {},
      status: 'active'
    });

    // Update tag counts
    if (tags && tags.length > 0) {
      await Tag.updateMany(
        { userId, name: { $in: tags } },
        { $inc: { subscriberCount: 1 } }
      );
    }

    await AuditLog.create({
      userId,
      action: 'SUBSCRIBER_CREATED',
      entityType: 'Subscriber',
      entityId: subscriber._id,
      newValues: { email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      ok: true,
      data: subscriber,
      message: 'Subscriber created successfully'
    });
  } catch (error) {
    logger.error('Create subscriber error:', error);
    return res.status(500).json({ error: 'Failed to create subscriber' });
  }
};

// ======================
// BULK CREATE SUBSCRIBERS
// ======================
export const bulkCreateSubscribers = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { subscribers, source = 'import' } = req.body;

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({ error: 'Subscribers array is required' });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const sub of subscribers) {
      if (!sub.email) {
        results.errors.push('Missing email');
        continue;
      }

      try {
        const existing = await Subscriber.findOne({ userId, email: sub.email.toLowerCase() });
        if (existing) {
          results.skipped++;
          continue;
        }

        await Subscriber.create({
          userId,
          email: sub.email.toLowerCase(),
          firstName: sub.firstName,
          lastName: sub.lastName,
          tags: sub.tags || [],
          source,
          customFields: sub.customFields || {},
          status: 'active'
        });
        results.created++;
      } catch (err) {
        results.errors.push(`Failed to create: ${sub.email}`);
      }
    }

    // Update tag counts
    const allTags = [...new Set(subscribers.flatMap((s: any) => s.tags || []))];
    if (allTags.length > 0) {
      await Tag.updateMany(
        { userId, name: { $in: allTags } },
        { $inc: { subscriberCount: results.created } }
      );
    }

    return res.json({
      ok: true,
      data: results,
      message: 'Bulk import completed'
    });
  } catch (error) {
    logger.error('Bulk create subscribers error:', error);
    return res.status(500).json({ error: 'Failed to bulk create subscribers' });
  }
};

// ======================
// UPDATE SUBSCRIBER
// ======================
export const updateSubscriber = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = req.body;

    const subscriber = await Subscriber.findOne({ _id: id, userId });
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    // Handle email change
    if (updates.email && updates.email !== subscriber.email) {
      const existing = await Subscriber.findOne({ userId, email: updates.email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      updates.email = updates.email.toLowerCase();
    }

    const updated = await Subscriber.findByIdAndUpdate(id, updates, { new: true });

    await AuditLog.create({
      userId,
      action: 'SUBSCRIBER_UPDATED',
      entityType: 'Subscriber',
      entityId: subscriber._id,
      oldValues: { email: subscriber.email },
      newValues: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      data: updated,
      message: 'Subscriber updated successfully'
    });
  } catch (error) {
    logger.error('Update subscriber error:', error);
    return res.status(500).json({ error: 'Failed to update subscriber' });
  }
};

// ======================
// DELETE SUBSCRIBER
// ======================
export const deleteSubscriber = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const subscriber = await Subscriber.findOne({ _id: id, userId });
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    // Update tag counts
    if (subscriber.tags && subscriber.tags.length > 0) {
      await Tag.updateMany(
        { userId, name: { $in: subscriber.tags } },
        { $inc: { subscriberCount: -1 } }
      );
    }

    await Subscriber.findByIdAndDelete(id);

    await AuditLog.create({
      userId,
      action: 'SUBSCRIBER_DELETED',
      entityType: 'Subscriber',
      entityId: subscriber._id,
      oldValues: { email: subscriber.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Subscriber deleted successfully'
    });
  } catch (error) {
    logger.error('Delete subscriber error:', error);
    return res.status(500).json({ error: 'Failed to delete subscriber' });
  }
};

// ======================
// UNSUBSCRIBE
// ======================
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const subscriber = await Subscriber.findOne({ _id: id, userId });
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    subscriber.status = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    await AuditLog.create({
      userId,
      action: 'SUBSCRIBER_UNSUBSCRIBED',
      entityType: 'Subscriber',
      entityId: subscriber._id,
      newValues: { status: 'unsubscribed' },
      ipAddress: req.ip
    });

    return res.json({
      ok: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error) {
    logger.error('Unsubscribe error:', error);
    return res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

// ======================
// GET SUBSCRIBER STATS
// ======================
export const getSubscriberStats = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const [total, active, unsubscribed, bounced] = await Promise.all([
      Subscriber.countDocuments({ userId }),
      Subscriber.countDocuments({ userId, status: 'active' }),
      Subscriber.countDocuments({ userId, status: 'unsubscribed' }),
      Subscriber.countDocuments({ userId, status: 'bounced' })
    ]);

    return res.json({
      ok: true,
      data: {
        total,
        active,
        unsubscribed,
        bounced,
        unsubscribeRate: total > 0 ? ((unsubscribed / total) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    logger.error('Get subscriber stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
