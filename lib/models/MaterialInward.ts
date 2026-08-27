import mongoose, { Schema } from 'mongoose';

export interface IMaterialInwardItem {
  materialId: string | mongoose.Types.ObjectId;
  materialName: string;
  quantity: number;
  unit: string;
  rate?: number;
  amount?: number;
}

export interface IMaterialInward {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  date: Date;
  vendorId?: string | mongoose.Types.ObjectId;
  vendorName?: string;
  invoiceNumber?: string;
  challanNumber?: string;
  vehicleNumber?: string;
  remarks?: string;
  photoUrl?: string;
  totalAmount: number;
  items: IMaterialInwardItem[];
  receivedBy?: string;
  createdAt?: Date;
}

const MaterialInwardItemSchema = new Schema({
  materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: String, required: true },
  rate: { type: Number, default: 0, min: 0 },
  amount: { type: Number, default: 0, min: 0 }
});

const MaterialInwardSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  date: { type: Date, required: true, index: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName: { type: String, trim: true },
  invoiceNumber: { type: String, trim: true },
  challanNumber: { type: String, trim: true },
  vehicleNumber: { type: String, trim: true },
  remarks: { type: String, trim: true },
  photoUrl: { type: String, trim: true },
  totalAmount: { type: Number, default: 0, min: 0 },
  items: [MaterialInwardItemSchema],
  receivedBy: { type: String, default: 'Site Supervisor', trim: true }
}, { timestamps: true });

MaterialInwardSchema.index({ projectId: 1, date: -1 });
MaterialInwardSchema.index({ projectId: 1, vendorId: 1 });

export const MaterialInward = mongoose.models.MaterialInward || mongoose.model('MaterialInward', MaterialInwardSchema);
