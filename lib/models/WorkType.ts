import mongoose, { Schema } from 'mongoose';

export interface IWorkType {
  _id?: string;
  name: string;
  defaultUnit: string;
  icon?: string;
  sortOrder?: number;
  status: 'ACTIVE' | 'INACTIVE';
  isDefault?: boolean;
}

const WorkTypeSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  defaultUnit: { type: String, required: true, default: 'Sq.ft', trim: true },
  icon: { type: String, default: '🏗️', trim: true },
  sortOrder: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export const DEFAULT_WORK_TYPES = [
  { name: 'Excavation', defaultUnit: 'Cu.m', icon: '🚜', sortOrder: 1 },
  { name: 'RCC / Concrete', defaultUnit: 'Cu.m', icon: '🏗️', sortOrder: 2 },
  { name: 'Slab Work', defaultUnit: 'Floor', icon: '🏛️', sortOrder: 3 },
  { name: 'Shuttering', defaultUnit: 'Sq.ft', icon: '📐', sortOrder: 4 },
  { name: 'Reinforcement / Steel', defaultUnit: 'MT', icon: '⛓️', sortOrder: 5 },
  { name: 'Brickwork', defaultUnit: 'Sq.ft', icon: '🧱', sortOrder: 6 },
  { name: 'Blockwork', defaultUnit: 'Sq.ft', icon: '🪨', sortOrder: 7 },
  { name: 'Plaster', defaultUnit: 'Sq.ft', icon: '🖌️', sortOrder: 8 },
  { name: 'Flooring / Tiling', defaultUnit: 'Sq.ft', icon: '🔲', sortOrder: 9 },
  { name: 'Waterproofing', defaultUnit: 'Sq.ft', icon: '💧', sortOrder: 10 },
  { name: 'Painting', defaultUnit: 'Sq.ft', icon: '🎨', sortOrder: 11 },
  { name: 'Electrical', defaultUnit: 'm', icon: '⚡', sortOrder: 12 },
  { name: 'Plumbing', defaultUnit: 'Rft', icon: '🚰', sortOrder: 13 },
  { name: 'Fabrication', defaultUnit: 'Kg', icon: '🛠️', sortOrder: 14 },
  { name: 'Roofing', defaultUnit: 'Sq.ft', icon: '🏠', sortOrder: 15 },
  { name: 'Doors / Windows', defaultUnit: 'Nos', icon: '🚪', sortOrder: 16 },
  { name: 'External Works', defaultUnit: 'Item', icon: '🚧', sortOrder: 17 },
  { name: 'Other', defaultUnit: 'Item', icon: '📋', sortOrder: 18 }
];

export const WORK_UNITS = [
  'Sq.ft',
  'Cu.m',
  'Rft',
  'Kg',
  'MT',
  'Floor',
  'Nos',
  'm',
  'Item',
  'Bags',
  'Trips'
] as const;

export const WorkType = mongoose.models.WorkType || mongoose.model('WorkType', WorkTypeSchema);
