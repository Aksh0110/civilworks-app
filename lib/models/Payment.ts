import mongoose, { Schema } from 'mongoose';

export type PaymentType = 'LABOUR_PAYMENT' | 'VENDOR_PAYMENT' | 'LABOUR_ADVANCE' | 'VENDOR_ADVANCE';
export type RecipientType = 'WORKER' | 'VENDOR';
export type PaymentMethod = 'CASH' | 'ONLINE' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentStatus = 'COMPLETED' | 'VOIDED';

export interface IPayment {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  paymentType: PaymentType;
  recipientType: RecipientType;
  recipientId: string | mongoose.Types.ObjectId;
  recipientName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  receiptId: string;
  status: PaymentStatus;
  voidReason?: string;
  voidedAt?: Date;
  voidedBy?: string;
  idempotencyKey?: string;
  transactionRef?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    paymentType: {
      type: String,
      enum: ['LABOUR_PAYMENT', 'VENDOR_PAYMENT', 'LABOUR_ADVANCE', 'VENDOR_ADVANCE'],
      required: true,
      index: true
    },
    recipientType: {
      type: String,
      enum: ['WORKER', 'VENDOR'],
      required: true,
      index: true
    },
    recipientId: { type: Schema.Types.ObjectId, required: true, index: true },
    recipientName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'ONLINE', 'BANK_TRANSFER', 'OTHER'],
      required: true,
      default: 'CASH'
    },
    paymentDate: { type: Date, required: true, default: Date.now, index: true },
    receiptId: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ['COMPLETED', 'VOIDED'],
      default: 'COMPLETED',
      index: true
    },
    voidReason: { type: String, trim: true },
    voidedAt: { type: Date },
    voidedBy: { type: String, trim: true },
    idempotencyKey: { type: String, trim: true, index: true },
    transactionRef: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: String, default: 'Site Supervisor', trim: true }
  },
  { timestamps: true }
);

PaymentSchema.index({ projectId: 1, paymentDate: -1 });
PaymentSchema.index({ projectId: 1, recipientId: 1, status: 1 });
PaymentSchema.index({ projectId: 1, paymentType: 1, status: 1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
