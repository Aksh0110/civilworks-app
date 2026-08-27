import mongoose, { Schema } from 'mongoose';

export interface IVendor {
  _id?: string;
  name: string;
  mobile?: string;
  category?: string;
  status: 'ACTIVE' | 'INACTIVE';
  gstNumber?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const VendorSchema = new Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, trim: true },
  category: { type: String, trim: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  gstNumber: { type: String, trim: true, uppercase: true },
  address: { type: String, trim: true }
}, { timestamps: true });

VendorSchema.index({ name: 1 });
VendorSchema.index({ status: 1 });

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
