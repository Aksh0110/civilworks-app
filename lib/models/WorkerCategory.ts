import mongoose, { Schema } from 'mongoose';

export interface IWorkerCategory {
  _id?: string;
  name: string;
  code: string;
  isDefault?: boolean;
}

const WorkerCategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export const DEFAULT_WORKER_CATEGORIES = [
  'Mason',
  'Helper',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Welder',
  'Operator',
  'General Labour'
];

export const WorkerCategory = mongoose.models.WorkerCategory || mongoose.model('WorkerCategory', WorkerCategorySchema);
