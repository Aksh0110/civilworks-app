import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id?: string;
  name: string;
  role: 'SUPERVISOR' | 'PROJECT_MANAGER' | 'ADMIN';
  phone?: string;
}

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['SUPERVISOR', 'PROJECT_MANAGER', 'ADMIN'], default: 'SUPERVISOR' },
  phone: { type: String, trim: true }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
