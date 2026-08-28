import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'WORKER_MANAGER';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  assignedProjectIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends Document, Omit<IUser, '_id'> {}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'SUPERVISOR', 'WORKER_MANAGER'],
      default: 'SUPERVISOR',
      index: true
    },
    assignedProjectIds: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    },
    createdBy: { type: String, trim: true }
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
