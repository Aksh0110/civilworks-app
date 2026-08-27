import mongoose, { Schema } from 'mongoose';

export type BillStatus = 'OPEN' | 'PARTIAL' | 'SETTLED';

export interface IVendorBill {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  vendorId: string | mongoose.Types.ObjectId;
  vendorName: string;
  billNumber: string;
  billDate: Date;
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  materialInwardId?: string | mongoose.Types.ObjectId;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const VendorBillSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    vendorName: { type: String, required: true, trim: true },
    billNumber: { type: String, required: true, trim: true },
    billDate: { type: Date, required: true, default: Date.now },
    totalAmount: { type: Number, required: true, min: 0.01 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['OPEN', 'PARTIAL', 'SETTLED'],
      default: 'OPEN',
      index: true
    },
    materialInwardId: { type: Schema.Types.ObjectId, ref: 'MaterialInward' },
    remarks: { type: String, trim: true }
  },
  { timestamps: true }
);

VendorBillSchema.index({ projectId: 1, vendorId: 1, status: 1 });

export const VendorBill =
  mongoose.models.VendorBill || mongoose.model('VendorBill', VendorBillSchema);
