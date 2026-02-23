import mongoose, { Schema, Document } from 'mongoose';

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED'
}

export interface ILead extends Document {
  name?: string;
  company?: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  country?: string;
  status: LeadStatus;
  verified: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, trim: true },
    company: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true, index: true },
    country: { type: String, trim: true, index: true },
    status: { type: String, enum: Object.values(LeadStatus), default: LeadStatus.NEW, index: true },
    verified: { type: Boolean, default: false },
    source: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound indexes for faster querying and analytics
leadSchema.index({ status: 1, country: 1 });
leadSchema.index({ createdAt: -1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
