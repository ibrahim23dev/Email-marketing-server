import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Lead from '../models/lead.js';
import AuditLog from '../models/auditLog.model.js';
import logger from '../utils/logger.js';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { email, name, source } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingLead = await Lead.findOne({ userId, email: email.toLowerCase() });
    if (existingLead) {
      return res.status(409).json({ error: 'Lead with this email already exists' });
    }

    const lead = await Lead.create({
      userId,
      email: email.toLowerCase(),
      name: name?.trim(),
      source: source || 'manual',
      status: 'new'
    });

    await AuditLog.create({
      userId,
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead._id,
      newValues: { email: lead.email, name: lead.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      ok: true,
      data: lead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    logger.error('Create lead error:', error);
    return res.status(500).json({ error: 'Failed to create lead' });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, search, status } = req.query;

    const query: any = { userId };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get leads error:', error);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const lead = await Lead.findOne({ _id: id, userId });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    return res.json({ ok: true, data: lead });
  } catch (error) {
    logger.error('Get lead error:', error);
    return res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, status, metadata } = req.body;

    const lead = await Lead.findOne({ _id: id, userId });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const oldValues = { name: lead.name, status: lead.status };

    const updated = await Lead.findByIdAndUpdate(
      id,
      { name, status, metadata },
      { new: true }
    );

    await AuditLog.create({
      userId,
      action: 'LEAD_UPDATED',
      entityType: 'Lead',
      entityId: lead._id,
      oldValues,
      newValues: { name, status, metadata },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      data: updated,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    logger.error('Update lead error:', error);
    return res.status(500).json({ error: 'Failed to update lead' });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const lead = await Lead.findOne({ _id: id, userId });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await Lead.findByIdAndDelete(id);

    await AuditLog.create({
      userId,
      action: 'LEAD_DELETED',
      entityType: 'Lead',
      entityId: lead._id,
      oldValues: { email: lead.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    logger.error('Delete lead error:', error);
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
};

export const addLeadsToAudience = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { audienceId } = req.body;

    if (!audienceId) {
      return res.status(400).json({ error: 'Audience ID is required' });
    }

    const Audience = (await import('../models/audience.model.js')).default;
    const Subscriber = (await import('../models/subscriber.model.js')).default;

    const audience = await Audience.findOne({ _id: audienceId, userId });
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }

    const leads = await Lead.find({ userId, status: 'new' }).select('email name');

    if (leads.length === 0) {
      return res.status(400).json({ error: 'No new leads to add' });
    }

    const subscriberDocs = leads.map(lead => ({
      userId,
      email: lead.email,
      firstName: lead.name?.split(' ')[0],
      lastName: lead.name?.split(' ').slice(1).join(' '),
      tags: [audience.name],
      status: 'active' as const,
      source: 'lead'
    }));

    await Subscriber.insertMany(subscriberDocs, { ordered: false });

    await Lead.updateMany(
      { _id: { $in: leads.map(l => l._id) } },
      { status: 'contacted' }
    );

    const subscriberCount = await Subscriber.countDocuments({
      userId,
      tags: audience.name,
      status: 'active'
    });

    await Audience.findByIdAndUpdate(audienceId, { subscriberCount });

    await AuditLog.create({
      userId,
      action: 'LEADS_ADDED_TO_AUDIENCE',
      entityType: 'Audience',
      entityId: audienceId,
      newValues: { leadCount: leads.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: `${leads.length} leads added to audience`,
      subscriberCount
    });
  } catch (error) {
    logger.error('Add leads to audience error:', error);
    return res.status(500).json({ error: 'Failed to add leads to audience' });
  }
};