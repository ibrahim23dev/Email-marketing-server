import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  date: Date;
  events: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    complained: number;
  };
  uniqueEvents: {
    opened: number;
    clicked: number;
  };
  rates: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  createdAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    events: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
      complained: { type: Number, default: 0 }
    },
    uniqueEvents: {
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 }
    },
    rates: {
      openRate: { type: Number, default: 0 },
      clickRate: { type: Number, default: 0 },
      bounceRate: { type: Number, default: 0 },
      unsubscribeRate: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

AnalyticsSchema.index({ userId: 1, date: -1 });
AnalyticsSchema.index({ campaignId: 1, date: -1 });

export default mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
