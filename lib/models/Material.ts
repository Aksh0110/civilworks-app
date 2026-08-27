import mongoose, { Schema } from 'mongoose';

export interface IMaterial {
  _id?: string;
  name: string;
  category: string;
  unit: string;
  minStockLevel: number;
  status: 'ACTIVE' | 'INACTIVE';
  defaultRate?: number;
  code?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MaterialSchema = new Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  unit: { type: String, required: true, trim: true },
  minStockLevel: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  defaultRate: { type: Number, default: 0, min: 0 },
  code: { type: String, trim: true, uppercase: true },
  description: { type: String, trim: true }
}, { timestamps: true });

MaterialSchema.index({ name: 1, category: 1 });
MaterialSchema.index({ status: 1 });

export const Material = mongoose.models.Material || mongoose.model('Material', MaterialSchema);
