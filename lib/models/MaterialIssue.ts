import mongoose, { Schema } from 'mongoose';

export interface IMaterialIssueItem {
  materialId: string | mongoose.Types.ObjectId;
  materialName: string;
  quantity: number;
  unit: string;
}

export interface IMaterialIssue {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  date: Date;
  locationWorkArea?: string;
  issuedTo?: string;
  remarks?: string;
  items: IMaterialIssueItem[];
  issuedBy?: string;
  createdAt?: Date;
}

const MaterialIssueItemSchema = new Schema({
  materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: String, required: true }
});

const MaterialIssueSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  date: { type: Date, required: true, index: true },
  locationWorkArea: { type: String, trim: true },
  issuedTo: { type: String, trim: true },
  remarks: { type: String, trim: true },
  items: [MaterialIssueItemSchema],
  issuedBy: { type: String, default: 'Site Supervisor', trim: true }
}, { timestamps: true });

MaterialIssueSchema.index({ projectId: 1, date: -1 });

export const MaterialIssue = mongoose.models.MaterialIssue || mongoose.model('MaterialIssue', MaterialIssueSchema);
