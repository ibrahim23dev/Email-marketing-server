import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  type: 'email_verification' | 'password_reset' | 'two_factor';
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset', 'two_factor'],
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

OTPSchema.index({ email: 1, type: 1, isUsed: 1 });

// TTL index to automatically delete expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOTP>('OTP', OTPSchema);
