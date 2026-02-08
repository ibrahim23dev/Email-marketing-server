import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/auditLog.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET AUDIT LOGS (Admin)
// ======================
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;

    const query: any = {};
    
    // Admin can see all logs, users see only their own
    const requestingUser = (req as any).user;
    if (requestingUser.role === 'user') {
      query.userId = getUserId(req);
    } else if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId as string);
    }
    
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// ======================
// GET AUDIT LOG BY ID
// ======================
export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id)
      .populate('userId', 'name email');

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    return res.json({ ok: true, data: log });
  } catch (error) {
    logger.error('Get audit log error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};

// ======================
// GET AUDIT LOGS BY ENTITY
// ======================
export const getAuditLogsByEntity = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const query: any = { entityType, entityId: new mongoose.Types.ObjectId(entityId) };
    
    // Users can only see their own entity logs
    if ((req as any).user.role === 'user') {
      query.userId = getUserId(req);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get entity audit logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// ======================
// GET AUDIT LOG STATS
// ======================
export const getAuditLogStats = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    const query: any = {};
    
    if (requestingUser.role === 'user') {
      query.userId = getUserId(req);
    }

    // Last 30 days activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    query.createdAt = { $gte: thirtyDaysAgo };

    const actionBreakdown = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const entityBreakdown = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const dailyActivity = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      ok: true,
      data: {
        actionBreakdown,
        entityBreakdown,
        dailyActivity
      }
    });
  } catch (error) {
    logger.error('Get audit log stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ======================
// GET MY AUDIT LOGS
// ======================
export const getMyAuditLogs = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 50, action, entityType } = req.query;

    const query: any = { userId };
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    return res.json({
      ok: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get my audit logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// ======================
// EXPORT AUDIT LOGS
// ======================
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const query: any = {};
    
    // Users can only export their own logs
    if ((req as any).user.role === 'user') {
      query.userId = getUserId(req);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10000);

    if (format === 'csv') {
      const headers = ['Date', 'User', 'Action', 'Entity Type', 'IP Address'];
      const csv = [
        headers.join(','),
        ...logs.map(log => [
          log.createdAt.toISOString(),
          (log.userId as any)?.name || 'N/A',
          log.action,
          log.entityType,
          log.ipAddress || ''
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      return res.send(csv);
    }

    return res.json({
      ok: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    logger.error('Export audit logs error:', error);
    return res.status(500).json({ error: 'Failed to export audit logs' });
  }
};
