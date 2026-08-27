import mongoose, { Schema } from 'mongoose';
import { PaymentMethodId } from './ExpenseCategory';

export type ExpenseStatus = 'ACTIVE' | 'VOIDED';

export interface IExpense {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  categoryId: string | mongoose.Types.ObjectId;
  categoryName: string;
  categoryIcon?: string;
  amount: number;
  paymentMethod: PaymentMethodId;
  expenseDate: Date;
  vendorPerson?: string;
  referenceNumber?: string;
  remark?: string;
  photoUrl?: string;
  status: ExpenseStatus;
  voidReason?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ExpenseSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true, index: true },
  categoryName: { type: String, required: true, trim: true },
  categoryIcon: { type: String, default: '💸', trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI_ONLINE', 'BANK_TRANSFER', 'ADVANCE', 'OTHER'],
    required: true,
    index: true
  },
  expenseDate: { type: Date, required: true, index: true },
  vendorPerson: { type: String, trim: true },
  referenceNumber: { type: String, trim: true },
  remark: { type: String, trim: true },
  photoUrl: { type: String, trim: true },
  status: { type: String, enum: ['ACTIVE', 'VOIDED'], default: 'ACTIVE', index: true },
  voidReason: { type: String, trim: true },
  createdBy: { type: String, default: 'Site Supervisor', trim: true }
}, { timestamps: true });

ExpenseSchema.index({ projectId: 1, expenseDate: -1 });
ExpenseSchema.index({ projectId: 1, categoryId: 1 });
ExpenseSchema.index({ projectId: 1, status: 1 });

export const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
