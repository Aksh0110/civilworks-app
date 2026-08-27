import mongoose, { Schema } from 'mongoose';

export interface IWageEntry {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  date: Date;
  totalWorkers: number;
  presentCount: number;
  halfDayCount: number;
  absentCount: number;
  totalWageCost: number;
  calculatedAt: Date;
}

const WageEntrySchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  date: { type: Date, required: true, index: true },
  totalWorkers: { type: Number, default: 0 },
  presentCount: { type: Number, default: 0 },
  halfDayCount: { type: Number, default: 0 },
  absentCount: { type: Number, default: 0 },
  totalWageCost: { type: Number, default: 0 },
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

WageEntrySchema.index({ projectId: 1, date: 1 }, { unique: true });

export const WageEntry = mongoose.models.WageEntry || mongoose.model('WageEntry', WageEntrySchema);
