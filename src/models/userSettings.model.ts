import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  notifications: {
    emailCampaignReports: boolean;
    subscriberActivity: boolean;
    systemUpdates: boolean;
    marketingEmails: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: Date;
    loginAlerts: boolean;
  };
  preferences: {
    timezone: string;
    dateFormat: string;
    language: string;
    emailProvider: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    notifications: {
      emailCampaignReports: { type: Boolean, default: true },
      subscriberActivity: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false }
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      lastPasswordChange: Date,
      loginAlerts: { type: Boolean, default: true }
    },
    preferences: {
      timezone: { type: String, default: 'UTC' },
      dateFormat: { type: String, default: 'YYYY-MM-DD' },
      language: { type: String, default: 'en' },
      emailProvider: { type: String, default: 'sendgrid' }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
