import mongoose, { Schema } from 'mongoose';
import { DEFAULT_VENDOR_CATEGORIES } from '../constants/vendorCategories';
export { DEFAULT_VENDOR_CATEGORIES };

export interface IVendor {
  _id?: string;
  name: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  category?: string;
  status: 'ACTIVE' | 'INACTIVE';
  gstNumber?: string;
  address?: string;
  notes?: string;
  normalizedName?: string;
  normalizedPhone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const VendorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    category: { type: String, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    gstNumber: { type: String, trim: true, uppercase: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    normalizedName: { type: String, trim: true, lowercase: true, index: true },
    normalizedPhone: { type: String, trim: true, index: true }
  },
  { timestamps: true }
);

VendorSchema.index({ name: 1 });
VendorSchema.index({ status: 1 });
VendorSchema.index({ category: 1 });

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
export const VendorModel = Vendor;
