import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'user';
  isActive: boolean;
  isEmailVerified: boolean;
  trialEndsAt?: Date;
  lastLoginAt?: Date;
  avatar?: string;
  phone?: string;
  company?: string;
  timezone: string;
  // SaaS Fields
  credits: number;
  trialStartDate: Date;
  scrapeCount: number;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'user'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    trialEndsAt: Date,
    lastLoginAt: Date,
    avatar: String,
    phone: String,
    company: String,
    timezone: {
      type: String,
      default: 'UTC'
    },
    credits: {
      type: Number,
      default: 300
    },
    trialStartDate: {
      type: Date,
      default: Date.now
    },
    scrapeCount: {
      type: Number,
      default: 0
    },
    isPremium: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);
