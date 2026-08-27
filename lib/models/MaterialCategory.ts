import mongoose, { Schema } from 'mongoose';

export interface IMaterialCategory {
  _id?: string;
  name: string;
  code: string;
  isDefault?: boolean;
}

const MaterialCategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export const DEFAULT_MATERIAL_CATEGORIES = [
  'Cement',
  'Steel',
  'Sand',
  'Aggregate',
  'Bricks',
  'Blocks',
  'Tiles',
  'Pipes',
  'Electrical',
  'Plumbing',
  'Paint',
  'Hardware',
  'Other'
];

export const DEFAULT_UNITS = [
  'Bags',
  'Ton',
  'kg',
  'm³',
  'ft³',
  'sq.ft',
  'Running ft',
  'Nos',
  'Litre',
  'Piece'
];

export const MaterialCategory = mongoose.models.MaterialCategory || mongoose.model('MaterialCategory', MaterialCategorySchema);
