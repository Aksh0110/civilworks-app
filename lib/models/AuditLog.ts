import mongoose, { Schema } from 'mongoose';

export interface IAuditLog {
  _id?: string;
  user: string;
  action: string;
  entity: string;
  entityId?: string;
  projectId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const AuditLogSchema = new Schema({
  user: { type: String, default: 'System Supervisor', trim: true },
  action: { type: String, required: true, trim: true },
  entity: { type: String, required: true, trim: true },
  entityId: { type: String, trim: true },
  projectId: { type: String, trim: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

AuditLogSchema.index({ projectId: 1, timestamp: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
