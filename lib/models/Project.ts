import mongoose, { Schema } from 'mongoose';

export interface IProjectModules {
  workers: boolean;
  attendance: boolean;
  materials: boolean;
  expenses: boolean;
  vendors: boolean;
  progress: boolean;
  payments: boolean;
  documents: boolean;
  reports: boolean;
}

export interface IProject {
  _id?: string;
  name: string;
  code: string;
  location?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  startDate?: Date;
  expectedEndDate?: Date;
  siteContact?: string;
  managerName?: string;
  notes?: string;
  modules?: IProjectModules;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  location: { type: String, trim: true },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD'], default: 'ACTIVE' },
  startDate: Date,
  expectedEndDate: Date,
  siteContact: { type: String, trim: true },
  managerName: { type: String, trim: true },
  notes: { type: String, trim: true },
  modules: {
    workers: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
    materials: { type: Boolean, default: true },
    expenses: { type: Boolean, default: true },
    vendors: { type: Boolean, default: true },
    progress: { type: Boolean, default: true },
    payments: { type: Boolean, default: true },
    documents: { type: Boolean, default: true },
    reports: { type: Boolean, default: true }
  }
}, { timestamps: true });

ProjectSchema.index({ code: 1 }, { unique: true });
ProjectSchema.index({ status: 1 });

export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

