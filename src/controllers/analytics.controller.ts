import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/campaign.model';
import Analytics from '../models/analytics.model';
import Subscriber from '../models/subscriber.model';
import logger from '../utils/logger';

const getUserId = (req: Request): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId((req as any).user.id);
};

// ======================
// GET OVERALL ANALYTICS
// ======================
export const getOverallAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { startDate, endDate } = req.query;

    const dateFilter: any = { userId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    // Aggregate campaign stats
    const stats = await Campaign.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          totalSent: { $sum: '$stats.sent' },
          totalDelivered: { $sum: '$stats.delivered' },
          totalOpened: { $sum: '$stats.opened' },
          totalClicked: { $sum: '$stats.clicked' },
          totalBounced: { $sum: '$stats.bounced' },
          totalUnsubscribed: { $sum: '$stats.unsubscribed' },
          totalComplained: { $sum: '$stats.complained' }
        }
      }
    ]);

    const data = stats[0] || {
      totalCampaigns: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalUnsubscribed: 0,
      totalComplained: 0
    };

    // Calculate rates
    const openRate = data.totalDelivered > 0 
      ? (data.totalOpened / data.totalDelivered) * 100 
      : 0;
    const clickRate = data.totalOpened > 0 
      ? (data.totalClicked / data.totalOpened) * 100 
      : 0;
    const bounceRate = data.totalSent > 0 
      ? (data.totalBounced / data.totalSent) * 100 
      : 0;
    const unsubscribeRate = data.totalDelivered > 0 
      ? (data.totalUnsubscribed / data.totalDelivered) * 100 
      : 0;

    return res.json({
      ok: true,
      data: {
        totalCampaigns: data.totalCampaigns,
        totals: {
          sent: data.totalSent,
          delivered: data.totalDelivered,
          opened: data.totalOpened,
          clicked: data.totalClicked,
          bounced: data.totalBounced,
          unsubscribed: data.totalUnsubscribed,
          complained: data.totalComplained
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
    logger.error('Get overall analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// ======================
// GET CAMPAIGN ANALYTICS
// ======================
export const getAnalyticsByCampaign = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const { stats } = campaign;
    const delivered = stats.sent - stats.bounced;
    
    const openRate = delivered > 0 ? (stats.opened / delivered) * 100 : 0;
    const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
    const bounceRate = stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0;
    const unsubscribeRate = delivered > 0 ? (stats.unsubscribed / delivered) * 100 : 0;

    return res.json({
      ok: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          subject: campaign.subject,
          status: campaign.status,
          createdAt: campaign.createdAt,
          sentAt: campaign.sentAt
        },
        stats: {
          sent: stats.sent,
          delivered,
          opened: stats.opened,
          clicked: stats.clicked,
          bounced: stats.bounced,
          unsubscribed: stats.unsubscribed,
          complained: stats.complained
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
    return res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
};

// ======================
// GET TIME SERIES ANALYTICS
// ======================
export const getTimeSeriesAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { startDate, endDate, granularity = 'day' } = req.query;

    const dateFilter: any = { userId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    const dateFormat = granularity === 'week' ? '%Y-W%V' : '%Y-%m-%d';

    const timeSeries = await Campaign.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          campaigns: { $sum: 1 },
          sent: { $sum: '$stats.sent' },
          opened: { $sum: '$stats.opened' },
          clicked: { $sum: '$stats.clicked' },
          bounced: { $sum: '$stats.bounced' },
          unsubscribed: { $sum: '$stats.unsubscribed' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      ok: true,
      data: timeSeries
    });
  } catch (error) {
    logger.error('Get time series analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// ======================
// GET TOP PERFORMING CAMPAIGNS
// ======================
export const getTopCampaigns = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { limit = 10, metric = 'openRate' } = req.query;

    const campaigns = await Campaign.find({ 
      userId, 
      'stats.sent': { $gt: 0 },
      status: 'completed'
    })
      .sort({ [`stats.${metric === 'clickRate' ? 'clicked' : 'opened'}`]: -1 })
      .limit(Number(limit))
      .select('name subject stats createdAt');

    const enriched = campaigns.map(c => {
      const delivered = c.stats.sent - c.stats.bounced;
      return {
        ...c.toObject(),
        rates: {
          openRate: delivered > 0 ? ((c.stats.opened / delivered) * 100).toFixed(2) : 0,
          clickRate: c.stats.opened > 0 ? ((c.stats.clicked / c.stats.opened) * 100).toFixed(2) : 0
        }
      };
    });

    return res.json({
      ok: true,
      data: enriched
    });
  } catch (error) {
    logger.error('Get top campaigns error:', error);
    return res.status(500).json({ error: 'Failed to fetch top campaigns' });
  }
};

// ======================
// GET ENGAGEMENT METRICS
// ======================
export const getEngagementMetrics = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    // Get subscriber engagement breakdown
    const engagementBreakdown = await Subscriber.aggregate([
      { $match: { userId, status: 'active' } },
      {
        $bucket: {
          groupBy: '$stats.campaignsOpened',
          boundaries: [0, 1, 5, 10, 20, 50, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgClicks: { $avg: '$stats.campaignsClicked' }
          }
        }
      }
    ]);

    // Get best performing hours
    const hourPerformance = await Campaign.aggregate([
      { $match: { userId, sentAt: { $exists: true } } },
      {
        $group: {
          _id: { $hour: '$sentAt' },
          avgOpenRate: { $avg: { $cond: [{ $gt: ['$stats.delivered', 0] }, { $divide: ['$stats.opened', '$stats.delivered'] }, 0] } },
          totalSent: { $sum: '$stats.sent' }
        }
      },
      { $sort: { avgOpenRate: -1 } }
    ]);

    return res.json({
      ok: true,
      data: {
        engagementBreakdown,
        bestHours: hourPerformance.slice(0, 5)
      }
    });
  } catch (error) {
    logger.error('Get engagement metrics error:', error);
    return res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
};
