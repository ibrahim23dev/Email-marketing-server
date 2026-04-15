import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILead extends Document {
  userId: Types.ObjectId;
  email: string;
  name?: string;
  source?: string;
  status: 'new' | 'contacted' | 'converted' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
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
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      default: 'manual'
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'failed'],
      default: 'new'
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

LeadSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.model<ILead>('Lead', LeadSchema);
