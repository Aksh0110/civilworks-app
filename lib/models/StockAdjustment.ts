import mongoose, { Schema } from 'mongoose';

export type AdjustmentType = 'ADD' | 'SUBTRACT' | 'SET';

export interface IStockAdjustment {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  date: Date;
  materialId: string | mongoose.Types.ObjectId;
  materialName: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  reason: string;
  adjustedBy?: string;
  createdAt?: Date;
}

const StockAdjustmentSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  date: { type: Date, default: Date.now, index: true },
  materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
  materialName: { type: String, required: true },
  adjustmentType: { type: String, enum: ['ADD', 'SUBTRACT', 'SET'], required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: { type: String, required: true, trim: true },
  adjustedBy: { type: String, default: 'Site Supervisor', trim: true }
}, { timestamps: true });

StockAdjustmentSchema.index({ projectId: 1, date: -1 });

export const StockAdjustment = mongoose.models.StockAdjustment || mongoose.model('StockAdjustment', StockAdjustmentSchema);
