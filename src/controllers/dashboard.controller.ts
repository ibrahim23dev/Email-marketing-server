import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/campaign.model';
import Subscriber from '../models/subscriber.model';
import Audience from '../models/audience.model';
import Template from '../models/template.model';
import Tag from '../models/tag.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET DASHBOARD DATA
// ======================
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { period = '30d' } = req.query;

    // Calculate date range
    const days = parseInt(period as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get counts
    const [
      totalCampaigns,
      activeCampaigns,
      totalSubscribers,
      activeSubscribers,
      totalAudiences,
      totalTemplates,
      totalTags
    ] = await Promise.all([
      Campaign.countDocuments({ userId }),
      Campaign.countDocuments({ userId, status: 'sending' }),
      Subscriber.countDocuments({ userId }),
      Subscriber.countDocuments({ userId, status: 'active' }),
      Audience.countDocuments({ userId }),
      Template.countDocuments({ userId }),
      Tag.countDocuments({ userId })
    ]);

    // Get campaign stats
    const campaignStats = await Campaign.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: '$stats.sent' },
          totalOpened: { $sum: '$stats.opened' },
          totalClicked: { $sum: '$stats.clicked' },
          totalBounced: { $sum: '$stats.bounced' },
          totalUnsubscribed: { $sum: '$stats.unsubscribed' }
        }
      }
    ]);

    const stats = campaignStats[0] || {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalUnsubscribed: 0
    };

    const delivered = stats.totalSent - stats.totalBounced;
    const openRate = delivered > 0 ? (stats.totalOpened / delivered) * 100 : 0;
    const clickRate = stats.totalOpened > 0 ? (stats.totalClicked / stats.totalOpened) * 100 : 0;
    const bounceRate = stats.totalSent > 0 ? (stats.totalBounced / stats.totalSent) * 100 : 0;
    const unsubscribeRate = delivered > 0 ? (stats.totalUnsubscribed / delivered) * 100 : 0;

    // Get recent campaigns
    const recentCampaigns = await Campaign.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name status createdAt stats.sent stats.opened');

    // Get recent subscribers
    const recentSubscribers = await Subscriber.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email firstName lastName status createdAt');

    // Get top tags
    const topTags = await Tag.find({ userId })
      .sort({ subscriberCount: -1 })
      .limit(10)
      .select('name subscriberCount color');

    // Get campaigns by status
    const campaignsByStatus = await Campaign.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get subscriber growth (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const subscriberGrowth = await Subscriber.aggregate([
      { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
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
        overview: {
          totalCampaigns,
          activeCampaigns,
          totalSubscribers,
          activeSubscribers,
          totalAudiences,
          totalTemplates,
          totalTags
        },
        emailMetrics: {
          totalSent: stats.totalSent,
          totalOpened: stats.totalOpened,
          totalClicked: stats.totalClicked,
          totalBounced: stats.totalBounced,
          totalUnsubscribed: stats.totalUnsubscribed,
          rates: {
            openRate: openRate.toFixed(2),
            clickRate: clickRate.toFixed(2),
            bounceRate: bounceRate.toFixed(2),
            unsubscribeRate: unsubscribeRate.toFixed(2)
          }
        },
        recentCampaigns,
        recentSubscribers,
        topTags,
        campaignsByStatus: campaignsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        subscriberGrowth
      }
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// ======================
// GET CAMPAIGN PERFORMANCE
// ======================
export const getCampaignPerformance = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    const campaigns = await Campaign.find({ userId })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('name subject status createdAt stats');

    const total = await Campaign.countDocuments({ userId });

    // Calculate rates for each campaign
    const campaignsWithRates = campaigns.map(c => {
      const delivered = c.stats.sent - c.stats.bounced;
      const openRate = delivered > 0 ? (c.stats.opened / delivered) * 100 : 0;
      const clickRate = c.stats.opened > 0 ? (c.stats.clicked / c.stats.opened) * 100 : 0;

      return {
        ...c.toObject(),
        rates: {
          openRate: openRate.toFixed(2),
          clickRate: clickRate.toFixed(2)
        }
      };
    });

    return res.json({
      ok: true,
      data: campaignsWithRates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get campaign performance error:', error);
    return res.status(500).json({ error: 'Failed to fetch performance data' });
  }
};

// ======================
// GET SUBSCRIBER ANALYTICS
// ======================
export const getSubscriberAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const [total, active, unsubscribed, bounced, complained] = await Promise.all([
      Subscriber.countDocuments({ userId }),
      Subscriber.countDocuments({ userId, status: 'active' }),
      Subscriber.countDocuments({ userId, status: 'unsubscribed' }),
      Subscriber.countDocuments({ userId, status: 'bounced' }),
      Subscriber.countDocuments({ userId, status: 'complained' })
    ]);

    const growthData = await Subscriber.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const sourceBreakdown = await Subscriber.aggregate([
      { $match: { userId } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return res.json({
      ok: true,
      data: {
        summary: {
          total,
          active,
          unsubscribed,
          bounced,
          complained,
          activeRate: total > 0 ? ((active / total) * 100).toFixed(2) : 0
        },
        growthData,
        sourceBreakdown
      }
    });
  } catch (error) {
    logger.error('Get subscriber analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
