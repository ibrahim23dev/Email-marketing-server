import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Template from '../models/template.model';
import AuditLog from '../models/auditLog.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET ALL TEMPLATES
// ======================
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, category, search } = req.query;

    const query: any = { userId };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [templates, total] = await Promise.all([
      Template.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Template.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: templates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get templates error:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// ======================
// GET TEMPLATE BY ID
// ======================
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const template = await Template.findOne({ _id: id, userId });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({ ok: true, data: template });
  } catch (error) {
    logger.error('Get template error:', error);
    return res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// ======================
// CREATE TEMPLATE
// ======================
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, subject, body, category, thumbnail, isDefault, variables } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Template subject is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Template body is required' });
    }

    const template = await Template.create({
      userId,
      name,
      subject,
      body,
      category: category || 'general',
      thumbnail,
      isDefault: isDefault || false,
      variables: variables || []
    });

    await AuditLog.create({
      userId,
      action: 'TEMPLATE_CREATED',
      entityType: 'Template',
      entityId: template._id,
      newValues: { name, subject },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      ok: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    logger.error('Create template error:', error);
    return res.status(500).json({ error: 'Failed to create template' });
  }
};

// ======================
// UPDATE TEMPLATE
// ======================
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = req.body;

    const template = await Template.findOne({ _id: id, userId });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updated = await Template.findByIdAndUpdate(id, updates, { new: true });

    await AuditLog.create({
      userId,
      action: 'TEMPLATE_UPDATED',
      entityType: 'Template',
      entityId: template._id,
      oldValues: { name: template.name },
      newValues: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      data: updated,
      message: 'Template updated successfully'
    });
  } catch (error) {
    logger.error('Update template error:', error);
    return res.status(500).json({ error: 'Failed to update template' });
  }
};

// ======================
// DELETE TEMPLATE
// ======================
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const template = await Template.findOne({ _id: id, userId });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await Template.findByIdAndDelete(id);

    await AuditLog.create({
      userId,
      action: 'TEMPLATE_DELETED',
      entityType: 'Template',
      entityId: template._id,
      oldValues: { name: template.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Delete template error:', error);
    return res.status(500).json({ error: 'Failed to delete template' });
  }
};

// ======================
// GET DEFAULT TEMPLATES
// ======================
export const getDefaultTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await Template.find({ isDefault: true });
    return res.json({ ok: true, data: templates });
  } catch (error) {
    logger.error('Get default templates error:', error);
    return res.status(500).json({ error: 'Failed to fetch default templates' });
  }
};
