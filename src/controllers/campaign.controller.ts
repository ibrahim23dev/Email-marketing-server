import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/campaign.model';
import Template from '../models/template.model';
import Audience from '../models/audience.model';
import Analytics from '../models/analytics.model';
import AuditLog from '../models/auditLog.model';
import { CAMPAIGN_STATUS, CAMPAIGN_TYPE, EMAIL_PROVIDER, CAMPAIGN_VALIDATION } from '../config/campaigns';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET ALL CAMPAIGNS
// ======================
export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = { userId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('audienceId', 'name')
        .populate('templateId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Campaign.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    logger.error('Get campaigns error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

// ======================
// GET CAMPAIGN BY ID
// ======================
export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId })
      .populate('audienceId', 'name subscriberCount')
      .populate('templateId', 'name subject body');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json({ ok: true, data: campaign });
  } catch (error) {
    logger.error('Get campaign error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaign' });
  }
};

// ======================
// CREATE CAMPAIGN
// ======================
export const createCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, subject, body, type, provider, audienceId, templateId, scheduledAt, tags } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }
    if (!subject || subject.length < CAMPAIGN_VALIDATION.MIN_SUBJECT_LENGTH) {
      return res.status(400).json({ error: `Subject must be at least ${CAMPAIGN_VALIDATION.MIN_SUBJECT_LENGTH} characters` });
    }
    if (!body || body.length < CAMPAIGN_VALIDATION.MIN_BODY_LENGTH) {
      return res.status(400).json({ error: `Body must be at least ${CAMPAIGN_VALIDATION.MIN_BODY_LENGTH} characters` });
    }
    if (!audienceId) {
      return res.status(400).json({ error: 'Audience ID is required' });
    }

    // Verify audience exists
    const audience = await Audience.findOne({ _id: audienceId, userId });
    if (!audience) {
      return res.status(400).json({ error: 'Audience not found' });
    }

    // Verify template if provided
    if (templateId) {
      const template = await Template.findOne({ _id: templateId, userId });
      if (!template) {
        return res.status(400).json({ error: 'Template not found' });
      }
    }

    const campaign = await Campaign.create({
      userId,
      name,
      subject,
      body,
      type: type || CAMPAIGN_TYPE.NEWSLETTER,
      provider: provider || EMAIL_PROVIDER.SENDGRID,
      audienceId,
      templateId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      tags: tags || [],
      status: scheduledAt ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.DRAFT
    });

    await AuditLog.create({
      userId,
      action: 'CAMPAIGN_CREATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      newValues: { name, subject, type },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      ok: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    logger.error('Create campaign error:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
};

// ======================
// UPDATE CAMPAIGN
// ======================
export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = req.body;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Cannot update if campaign is sending or completed
    if ([CAMPAIGN_STATUS.SENDING, CAMPAIGN_STATUS.COMPLETED].includes(campaign.status as any)) {
      return res.status(400).json({ error: 'Cannot update a sending or completed campaign' });
    }

    // Validate if updating subject/body
    if (updates.subject && updates.subject.length < CAMPAIGN_VALIDATION.MIN_SUBJECT_LENGTH) {
      return res.status(400).json({ error: `Subject must be at least ${CAMPAIGN_VALIDATION.MIN_SUBJECT_LENGTH} characters` });
    }
    if (updates.body && updates.body.length < CAMPAIGN_VALIDATION.MIN_BODY_LENGTH) {
      return res.status(400).json({ error: `Body must be at least ${CAMPAIGN_VALIDATION.MIN_BODY_LENGTH} characters` });
    }

    // Track old values for audit
    const oldValues = { name: campaign.name, subject: campaign.subject, body: campaign.body };

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    await AuditLog.create({
      userId,
      action: 'CAMPAIGN_UPDATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      oldValues,
      newValues: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      data: updatedCampaign,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    logger.error('Update campaign error:', error);
    return res.status(500).json({ error: 'Failed to update campaign' });
  }
};

// ======================
// DELETE CAMPAIGN
// ======================
export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === CAMPAIGN_STATUS.SENDING) {
      return res.status(400).json({ error: 'Cannot delete a sending campaign' });
    }

    await Campaign.findByIdAndDelete(id);

    await AuditLog.create({
      userId,
      action: 'CAMPAIGN_DELETED',
      entityType: 'Campaign',
      entityId: campaign._id,
      oldValues: { name: campaign.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    logger.error('Delete campaign error:', error);
    return res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

// ======================
// SEND CAMPAIGN
// ======================
export const sendCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId })
      .populate('audienceId', 'name subscriberCount');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === CAMPAIGN_STATUS.SENDING) {
      return res.status(400).json({ error: 'Campaign is already sending' });
    }

    if (campaign.status === CAMPAIGN_STATUS.COMPLETED) {
      return res.status(400).json({ error: 'Campaign has already been sent' });
    }

    if (!campaign.name || !campaign.subject || !campaign.body) {
      return res.status(400).json({ error: 'Campaign is incomplete' });
    }

    const Subscriber = (await import('../models/subscriber.model.js')).default;
    const { addEmailToQueue } = await import('../queues/email.queue.js');

    const subscribers = await Subscriber.find({
      userId,
      status: 'active',
      tags: (campaign.audienceId as any)?.name
    }).select('email firstName lastName');

    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No active subscribers found in audience' });
    }

    campaign.status = CAMPAIGN_STATUS.SENDING;
    campaign.stats.sent = 0;
    campaign.stats.delivered = 0;
    campaign.stats.bounced = 0;
    (campaign as any)._totalRecipients = subscribers.length;
    await campaign.save();

    const emailJobs = subscribers.map(sub => ({
      campaignId: id.toString(),
      subscriberEmail: sub.email,
      subscriberName: sub.firstName || sub.lastName ? `${sub.firstName || ''} ${sub.lastName || ''}`.trim() : undefined,
      subject: campaign.subject,
      html: campaign.body,
      totalRecipients: subscribers.length
    }));

    for (const job of emailJobs) {
      await addEmailToQueue(job);
    }

    await AuditLog.create({
      userId,
      action: 'CAMPAIGN_SENT',
      entityType: 'Campaign',
      entityId: campaign._id,
      newValues: { status: 'sending', recipientCount: subscribers.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    logger.info(`Campaign ${id} queued ${subscribers.length} emails`);

    return res.json({
      ok: true,
      message: 'Campaign sending started',
      data: { campaignId: id, recipientCount: subscribers.length }
    });
  } catch (error) {
    logger.error('Send campaign error:', error);
    return res.status(500).json({ error: 'Failed to send campaign' });
  }
};

// ======================
// SCHEDULE CAMPAIGN
// ======================
export const scheduleCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ error: 'Scheduled date/time is required' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled date must be in the future' });
    }

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaign.status = CAMPAIGN_STATUS.SCHEDULED;
    campaign.scheduledAt = scheduledDate;
    await campaign.save();

    await AuditLog.create({
      userId,
      action: 'CAMPAIGN_SCHEDULED',
      entityType: 'Campaign',
      entityId: campaign._id,
      newValues: { scheduledAt: scheduledDate },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Campaign scheduled successfully',
      data: { campaignId: id, scheduledAt: scheduledDate }
    });
  } catch (error) {
    logger.error('Schedule campaign error:', error);
    return res.status(500).json({ error: 'Failed to schedule campaign' });
  }
};

// ======================
// PAUSE CAMPAIGN
// ======================
export const pauseCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== CAMPAIGN_STATUS.SENDING && campaign.status !== CAMPAIGN_STATUS.SCHEDULED) {
      return res.status(400).json({ error: 'Campaign cannot be paused' });
    }

    campaign.status = CAMPAIGN_STATUS.PAUSED;
    await campaign.save();

    await AuditLog.create({
      userId,
      action: 'CAMPAIGN_PAUSED',
      entityType: 'Campaign',
      entityId: campaign._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Campaign paused',
      data: { campaignId: id }
    });
  } catch (error) {
    logger.error('Pause campaign error:', error);
    return res.status(500).json({ error: 'Failed to pause campaign' });
  }
};

// ======================
// RESUME CAMPAIGN
// ======================
export const resumeCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== CAMPAIGN_STATUS.PAUSED) {
      return res.status(400).json({ error: 'Campaign is not paused' });
    }

    campaign.status = campaign.scheduledAt ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.DRAFT;
    await campaign.save();

    await AuditLog.create({
      userId,
      action: 'CAMPAIGN_RESUMED',
      entityType: 'Campaign',
      entityId: campaign._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Campaign resumed',
      data: { campaignId: id }
    });
  } catch (error) {
    logger.error('Resume campaign error:', error);
    return res.status(500).json({ error: 'Failed to resume campaign' });
  }
};

// ======================
// DUPLICATE CAMPAIGN
// ======================
export const duplicateCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const original = await Campaign.findOne({ _id: id, userId });
    if (!original) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const duplicated = await Campaign.create({
      userId,
      name: `Copy of ${original.name}`,
      subject: original.subject,
      body: original.body,
      type: original.type,
      provider: original.provider,
      audienceId: original.audienceId,
      templateId: original.templateId,
      tags: original.tags,
      status: CAMPAIGN_STATUS.DRAFT
    });

    await AuditLog.create({
      userId,
      action: 'CAMPAIGN_DUPLICATED',
      entityType: 'Campaign',
      entityId: duplicated._id,
      newValues: { from: original._id, name: duplicated.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      ok: true,
      data: duplicated,
      message: 'Campaign duplicated successfully'
    });
  } catch (error) {
    logger.error('Duplicate campaign error:', error);
    return res.status(500).json({ error: 'Failed to duplicate campaign' });
  }
};

// ======================
// VALIDATE CAMPAIGN
// ======================
export const validateCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const data = req.body;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.name || !data.name.trim()) {
      errors.push('Campaign name is required');
    }
    if (!data.subject || data.subject.length < CAMPAIGN_VALIDATION.MIN_SUBJECT_LENGTH) {
      errors.push(`Subject must be at least ${CAMPAIGN_VALIDATION.MIN_SUBJECT_LENGTH} characters`);
    }
    if (!data.body || data.body.length < CAMPAIGN_VALIDATION.MIN_BODY_LENGTH) {
      errors.push(`Body must be at least ${CAMPAIGN_VALIDATION.MIN_BODY_LENGTH} characters`);
    }
    if (!data.audienceId) {
      errors.push('Audience ID is required');
    }

    // Warnings
    if (data.subject && data.subject.length > 60) {
      warnings.push('Subject line is quite long and may be truncated');
    }
    if (data.body && !data.body.includes('{{unsubscribe}}')) {
      warnings.push('Consider adding an unsubscribe link for better deliverability');
    }

    return res.json({
      ok: true,
      data: {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    });
  } catch (error) {
    logger.error('Validate campaign error:', error);
    return res.status(500).json({ error: 'Failed to validate campaign' });
  }
};

// ======================
// GET CAMPAIGN ANALYTICS
// ======================
export const getCampaignAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const { sent, delivered, opened, clicked, bounced, unsubscribed, complained } = campaign.stats;

    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;
    const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

    return res.json({
      ok: true,
      data: {
        stats: {
          sent,
          delivered,
          opened,
          clicked,
          bounced,
          unsubscribed,
          complained
        },
        rates: {
          openRate: openRate.toFixed(2),
          clickRate: clickRate.toFixed(2),
          bounceRate: bounceRate.toFixed(2),
          unsubscribeRate: unsubscribeRate.toFixed(2)
        }
      }
    });
  } catch (error) {
    logger.error('Get campaign analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// ======================
// GET CAMPAIGN STATS
// ======================
export const getCampaignStats = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId }).select('stats status sentAt');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json({
      ok: true,
      data: {
        sentCount: campaign.stats.sent,
        failedCount: campaign.stats.bounced,
        status: campaign.status,
        sentAt: campaign.sentAt
      }
    });
  } catch (error) {
    logger.error('Get campaign stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
};
