import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriber extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  tags: string[];
  source: string;
  metadata: Record<string, any>;
  customFields: Record<string, any>;
  stats: {
    campaignsReceived: number;
    campaignsOpened: number;
    campaignsClicked: number;
    lastOpenedAt?: Date;
    lastClickedAt?: Date;
  };
  emailValidation: {
    isValid: boolean;
    validationDate?: Date;
  };
  unsubscribedAt?: Date;
  bouncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    firstName: String,
    lastName: String,
    status: {
      type: String,
      enum: ['active', 'unsubscribed', 'bounced', 'complained'],
      default: 'active',
      index: true
    },
    tags: [{ type: String, trim: true }],
    source: {
      type: String,
      default: 'manual'
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    customFields: { type: Schema.Types.Mixed, default: {} },
    stats: {
      campaignsReceived: { type: Number, default: 0 },
      campaignsOpened: { type: Number, default: 0 },
      campaignsClicked: { type: Number, default: 0 },
      lastOpenedAt: Date,
      lastClickedAt: Date
    },
    emailValidation: {
      isValid: { type: Boolean, default: true },
      validationDate: Date
    },
    unsubscribedAt: Date,
    bouncedAt: Date
  },
  { timestamps: true }
);

// Compound indexes
SubscriberSchema.index({ userId: 1, email: 1 }, { unique: true });
SubscriberSchema.index({ userId: 1, status: 1 });
SubscriberSchema.index({ userId: 1, tags: 1 });

export default mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);
