import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentRequest extends Document {
  userId: mongoose.Types.ObjectId;
  packageAmount: number;
  creditsToAdd: number;
  transactionId: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRequestSchema = new Schema<IPaymentRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    packageAmount: {
      type: Number,
      required: true,
      enum: [5, 10, 20, 50] // Package amounts in USD
    },
    creditsToAdd: {
      type: Number,
      required: true
    },
    transactionId: {
      type: String,
      required: true,
      trim: true
    },
    note: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

PaymentRequestSchema.index({ userId: 1 });
PaymentRequestSchema.index({ status: 1 });

export default mongoose.model<IPaymentRequest>('PaymentRequest', PaymentRequestSchema);
