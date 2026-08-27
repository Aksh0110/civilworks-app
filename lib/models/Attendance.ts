import mongoose, { Schema } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'ABSENT';

export interface IAttendance {
  _id?: string;
  projectId: string | mongoose.Types.ObjectId;
  workerId: string | mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  markedBy?: string | mongoose.Types.ObjectId;
  markedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttendanceSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: ['PRESENT', 'HALF_DAY', 'ABSENT'], required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  markedAt: { type: Date, default: Date.now },
  notes: { type: String, trim: true }
}, { timestamps: true });

AttendanceSchema.index({ projectId: 1, workerId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ projectId: 1, date: 1, status: 1 });

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

