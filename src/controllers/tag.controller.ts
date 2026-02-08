import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Tag from '../models/tag.model';
import AuditLog from '../models/auditLog.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// ======================
// GET ALL TAGS
// ======================
export const getTags = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { search } = req.query;

    const query: any = { userId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const tags = await Tag.find(query).sort({ name: 1 });

    return res.json({
      ok: true,
      data: tags
    });
  } catch (error) {
    logger.error('Get tags error:', error);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

// ======================
// GET TAG BY ID
// ======================
export const getTagById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const tag = await Tag.findOne({ _id: id, userId });
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    return res.json({ ok: true, data: tag });
  } catch (error) {
    logger.error('Get tag error:', error);
    return res.status(500).json({ error: 'Failed to fetch tag' });
  }
};

// ======================
// CREATE TAG
// ======================
export const createTag = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, color, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const slug = generateSlug(name);

    // Check for duplicate slug
    const existing = await Tag.findOne({ userId, slug });
    if (existing) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }

    const tag = await Tag.create({
      userId,
      name: name.trim(),
      slug,
      color: color || '#3498db',
      description,
      subscriberCount: 0
    });

    await AuditLog.create({
      userId,
      action: 'TAG_CREATED',
      entityType: 'Tag',
      entityId: tag._id,
      newValues: { name, slug },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      ok: true,
      data: tag,
      message: 'Tag created successfully'
    });
  } catch (error) {
    logger.error('Create tag error:', error);
    return res.status(500).json({ error: 'Failed to create tag' });
  }
};

// ======================
// UPDATE TAG
// ======================
export const updateTag = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, color, description } = req.body;

    const tag = await Tag.findOne({ _id: id, userId });
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // If name is changing, update slug
    if (name && name !== tag.name) {
      const newSlug = generateSlug(name);
      const existing = await Tag.findOne({ userId, slug: newSlug, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: 'Tag with this name already exists' });
      }
      (tag as any).slug = newSlug;
    }

    if (name) tag.name = name.trim();
    if (color) tag.color = color;
    if (description !== undefined) tag.description = description;

    await tag.save();

    await AuditLog.create({
      userId,
      action: 'TAG_UPDATED',
      entityType: 'Tag',
      entityId: tag._id,
      oldValues: { name: (await Tag.findById(id))?.name },
      newValues: { name: tag.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      data: tag,
      message: 'Tag updated successfully'
    });
  } catch (error) {
    logger.error('Update tag error:', error);
    return res.status(500).json({ error: 'Failed to update tag' });
  }
};

// ======================
// DELETE TAG
// ======================
export const deleteTag = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const tag = await Tag.findOne({ _id: id, userId });
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await Tag.findByIdAndDelete(id);

    await AuditLog.create({
      userId,
      action: 'TAG_DELETED',
      entityType: 'Tag',
      entityId: tag._id,
      oldValues: { name: tag.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      ok: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    logger.error('Delete tag error:', error);
    return res.status(500).json({ error: 'Failed to delete tag' });
  }
};

// ======================
// MERGE TAGS
// ======================
export const mergeTags = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { sourceTagIds, targetTagId } = req.body;

    if (!Array.isArray(sourceTagIds) || sourceTagIds.length === 0 || !targetTagId) {
      return res.status(400).json({ error: 'Source and target tags are required' });
    }

    const targetTag = await Tag.findOne({ _id: targetTagId, userId });
    if (!targetTag) {
      return res.status(404).json({ error: 'Target tag not found' });
    }

    // Get source tags
    const sourceTags = await Tag.find({ _id: { $in: sourceTagIds }, userId });

    // Update subscribers
    for (const tag of sourceTags) {
      await Tag.updateMany(
        { userId, tags: tag.name },
        { $addToSet: { tags: targetTag.name } }
      );
    }

    // Delete source tags
    await Tag.deleteMany({ _id: { $in: sourceTagIds } });

    return res.json({
      ok: true,
      message: 'Tags merged successfully'
    });
  } catch (error) {
    logger.error('Merge tags error:', error);
    return res.status(500).json({ error: 'Failed to merge tags' });
  }
};
