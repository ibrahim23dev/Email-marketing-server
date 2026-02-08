import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  body: string;
  category: string;
  thumbnail?: string;
  isDefault: boolean;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
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
    category: {
      type: String,
      default: 'general'
    },
    thumbnail: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    variables: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

TemplateSchema.index({ userId: 1, category: 1 });

export default mongoose.model<ITemplate>('Template', TemplateSchema);
