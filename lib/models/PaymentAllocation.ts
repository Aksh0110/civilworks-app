import mongoose, { Schema } from 'mongoose';

export type AllocationSourceType = 'WAGE' | 'VENDOR_BILL' | 'ADVANCE';

export interface IPaymentAllocation {
  _id?: string;
  paymentId: string | mongoose.Types.ObjectId;
  sourceType: AllocationSourceType;
  sourceId: string | mongoose.Types.ObjectId;
  allocatedAmount: number;
  createdAt?: Date;
}

const PaymentAllocationSchema = new Schema(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    sourceType: {
      type: String,
      enum: ['WAGE', 'VENDOR_BILL', 'ADVANCE'],
      required: true,
      index: true
    },
    sourceId: { type: Schema.Types.ObjectId, required: true, index: true },
    allocatedAmount: { type: Number, required: true, min: 0.01 }
  },
  { timestamps: true }
);

PaymentAllocationSchema.index({ paymentId: 1, sourceType: 1 });
PaymentAllocationSchema.index({ sourceId: 1, sourceType: 1 });

export const PaymentAllocation =
  mongoose.models.PaymentAllocation ||
  mongoose.model('PaymentAllocation', PaymentAllocationSchema);
