import mongoose, { Schema, Document } from 'mongoose';

export interface IAudience extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  subscriberCount: number;
  tags: string[];
  filters: {
    field: string;
    operator: string;
    value: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AudienceSchema = new Schema<IAudience>(
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
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    subscriberCount: {
      type: Number,
      default: 0
    },
    tags: [{ type: String, trim: true }],
    filters: [{
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: { type: String, required: true }
    }]
  },
  { timestamps: true }
);

AudienceSchema.index({ userId: 1, name: 1 });

export default mongoose.model<IAudience>('Audience', AudienceSchema);
