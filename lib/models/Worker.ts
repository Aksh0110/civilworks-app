import mongoose, { Schema } from 'mongoose';

export interface IWorker {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  workerIdCode?: string;
  name: string;
  category: string;
  mobile?: string;
  dailyRate: number;
  overtimeRate?: number;
  status: 'ACTIVE' | 'INACTIVE';
  contractorVendor?: string;
  joiningDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const WorkerSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  workerIdCode: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  mobile: { type: String, trim: true },
  dailyRate: { type: Number, required: true, min: 0 },
  overtimeRate: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  contractorVendor: { type: String, trim: true },
  joiningDate: Date,
  notes: { type: String, trim: true }
}, { timestamps: true });

WorkerSchema.index({ projectId: 1, status: 1 });
WorkerSchema.index({ projectId: 1, name: 1 });
WorkerSchema.index({ projectId: 1, category: 1 });

export const Worker = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);

