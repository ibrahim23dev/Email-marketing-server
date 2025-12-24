import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true
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
    trialEndsAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
