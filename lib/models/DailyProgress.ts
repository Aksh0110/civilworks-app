import mongoose, { Schema } from 'mongoose';

export type WorkItemStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
export type IssueSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface IDailyProgressItem {
  _id?: string;
  workTypeId: string | mongoose.Types.ObjectId;
  workTypeName: string; // Snapshot for historical stability
  workTypeIcon?: string;
  quantity: number;
  unit: string; // Snapshot for historical stability
  status: WorkItemStatus;
  location?: string; // Block A, First Floor, Flat 102, etc.
  remark?: string;
  assignedTeam?: string;
}

export interface IProgressIssue {
  _id?: string;
  issueType: string; // Material Delay, Labour Shortage, Equipment Problem, etc.
  severity: IssueSeverity;
  description: string;
  resolved?: boolean;
}

export interface IProgressPhoto {
  _id?: string;
  url: string;
  caption?: string;
  workItemId?: string;
  uploadedAt?: Date;
}

export interface IDailyProgress {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  date: Date;
  weather?: string;
  workforceCount?: number; // Snapshot from attendance
  labourCost?: number; // Snapshot from wages summary
  workItems: IDailyProgressItem[];
  issues: IProgressIssue[];
  photos: IProgressPhoto[];
  status: 'DRAFT' | 'SUBMITTED';
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DailyProgressItemSchema = new Schema({
  workTypeId: { type: Schema.Types.ObjectId, ref: 'WorkType', required: true },
  workTypeName: { type: String, required: true, trim: true },
  workTypeIcon: { type: String, default: '🏗️', trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, required: true, trim: true },
  status: { type: String, enum: ['COMPLETED', 'IN_PROGRESS', 'PENDING'], default: 'IN_PROGRESS', required: true },
  location: { type: String, trim: true },
  remark: { type: String, trim: true },
  assignedTeam: { type: String, trim: true }
}, { _id: true });

const ProgressIssueSchema = new Schema({
  issueType: { type: String, required: true, trim: true },
  severity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM', required: true },
  description: { type: String, required: true, trim: true },
  resolved: { type: Boolean, default: false }
}, { _id: true });

const ProgressPhotoSchema = new Schema({
  url: { type: String, required: true, trim: true },
  caption: { type: String, trim: true },
  workItemId: { type: String, trim: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const DailyProgressSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  date: { type: Date, required: true, index: true },
  weather: { type: String, trim: true },
  workforceCount: { type: Number, default: 0 },
  labourCost: { type: Number, default: 0 },
  workItems: [DailyProgressItemSchema],
  issues: [ProgressIssueSchema],
  photos: [ProgressPhotoSchema],
  status: { type: String, enum: ['DRAFT', 'SUBMITTED'], default: 'SUBMITTED' },
  createdBy: { type: String, default: 'Site Supervisor', trim: true },
  updatedBy: { type: String, default: 'Site Supervisor', trim: true }
}, { timestamps: true });

DailyProgressSchema.index({ projectId: 1, date: -1 }, { unique: true });
DailyProgressSchema.index({ projectId: 1, createdAt: -1 });

export const ISSUE_TYPES = [
  'Material Delay',
  'Labour Shortage',
  'Equipment Problem',
  'Weather',
  'Access Problem',
  'Quality Issue',
  'Safety Issue',
  'Client/Approval Delay',
  'Other'
] as const;

export const DailyProgress = mongoose.models.DailyProgress || mongoose.model('DailyProgress', DailyProgressSchema);
