import mongoose, { Schema } from 'mongoose';

export interface IExpenseCategory {
  _id?: string;
  name: string;
  icon?: string;
  sortOrder?: number;
  status: 'ACTIVE' | 'INACTIVE';
  isDefault?: boolean;
}

const ExpenseCategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, default: '💸', trim: true },
  sortOrder: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Transport / Vehicle', icon: '🚚', sortOrder: 1 },
  { name: 'Fuel / Diesel', icon: '⛽', sortOrder: 2 },
  { name: 'Tools / Hardware', icon: '🛠️', sortOrder: 3 },
  { name: 'Equipment', icon: '🚜', sortOrder: 4 },
  { name: 'Labour Support', icon: '👷', sortOrder: 5 },
  { name: 'Tea / Food', icon: '☕', sortOrder: 6 },
  { name: 'Water / Utility', icon: '💧', sortOrder: 7 },
  { name: 'Miscellaneous', icon: '📋', sortOrder: 8 },
  { name: 'Other', icon: '🏷️', sortOrder: 9 }
];

export const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: '💵' },
  { id: 'UPI_ONLINE', label: 'UPI / Online', icon: '📱' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
  { id: 'ADVANCE', label: 'Advance', icon: '🤝' },
  { id: 'OTHER', label: 'Other', icon: '💳' }
] as const;

export type PaymentMethodId = typeof PAYMENT_METHODS[number]['id'];

export const ExpenseCategory = mongoose.models.ExpenseCategory || mongoose.model('ExpenseCategory', ExpenseCategorySchema);
