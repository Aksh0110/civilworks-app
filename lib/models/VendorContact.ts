import mongoose, { Schema } from 'mongoose';

export interface IVendorContact {
  _id?: string;
  vendorId: string | mongoose.Types.ObjectId;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const VendorContactSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true, default: 'Contact' },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isPrimary: { type: Boolean, default: false }
  },
  { timestamps: true }
);

VendorContactSchema.index({ vendorId: 1, name: 1 });

export const VendorContact =
  mongoose.models.VendorContact || mongoose.model('VendorContact', VendorContactSchema);
