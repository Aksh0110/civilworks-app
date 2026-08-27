import mongoose, { Schema } from 'mongoose';

export type StockStatus = 'GOOD' | 'LOW' | 'OUT_OF_STOCK';

export interface IMaterialStock {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  materialId: string | mongoose.Types.ObjectId;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  status: StockStatus;
  lastUpdated: Date;
}

const MaterialStockSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
  currentStock: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 0 },
  unit: { type: String, required: true },
  status: { type: String, enum: ['GOOD', 'LOW', 'OUT_OF_STOCK'], default: 'GOOD' },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

MaterialStockSchema.index({ projectId: 1, materialId: 1 }, { unique: true });
MaterialStockSchema.index({ projectId: 1, status: 1 });

export const MaterialStock = mongoose.models.MaterialStock || mongoose.model('MaterialStock', MaterialStockSchema);
