import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  color: string;
  description?: string;
  subscriberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
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
      maxlength: 50
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    color: {
      type: String,
      default: '#3498db'
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    },
    subscriberCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

TagSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.model<ITag>('Tag', TagSchema);
