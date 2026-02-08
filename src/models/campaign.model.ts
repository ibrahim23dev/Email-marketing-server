import mongoose, { Schema, Document } from 'mongoose';
import { CAMPAIGN_STATUS, CAMPAIGN_TYPE, EMAIL_PROVIDER } from '../config/campaigns';

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  body: string;
  status: string;
  type: string;
  provider: string;
  audienceId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  scheduledAt?: Date;
  sentAt?: Date;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    complained: number;
  };
  settings: {
    trackOpens: boolean;
    trackClicks: boolean;
    unsubscribeLink: boolean;
    replyTo?: string;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    body: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(CAMPAIGN_STATUS),
      default: CAMPAIGN_STATUS.DRAFT,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(CAMPAIGN_TYPE),
      default: CAMPAIGN_TYPE.NEWSLETTER
    },
    provider: {
      type: String,
      enum: Object.values(EMAIL_PROVIDER),
      default: EMAIL_PROVIDER.SENDGRID
    },
    audienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Audience',
      required: true
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template'
    },
    scheduledAt: {
      type: Date,
      index: true
    },
    sentAt: Date,
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
      complained: { type: Number, default: 0 }
    },
    settings: {
      trackOpens: { type: Boolean, default: true },
      trackClicks: { type: Boolean, default: true },
      unsubscribeLink: { type: Boolean, default: true },
      replyTo: String
    },
    tags: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

// Compound index for user campaigns
CampaignSchema.index({ userId: 1, status: 1, createdAt: -1 });
CampaignSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
