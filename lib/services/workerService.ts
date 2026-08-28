import { connectMongoDB } from '../mongodb';
import { Worker, IWorker } from '../models/Worker';
import { WorkerCategory, DEFAULT_WORKER_CATEGORIES } from '../models/WorkerCategory';
import { logAuditAction } from './auditService';
import mongoose from 'mongoose';

export async function getWorkers(projectId: string, filter?: { category?: string; status?: string }) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid projectId');
  }

  const query: any = { projectId };
  if (filter?.category) query.category = filter.category;
  if (filter?.status) query.status = filter.status;
  else query.status = 'ACTIVE';

  const workers = await Worker.find(query).sort({ name: 1 }).exec();
  return JSON.parse(JSON.stringify(workers));
}

export async function getWorkerById(id: string) {
  await connectMongoDB();
  const worker = await (Worker as any).findById(id).exec();
  return worker ? JSON.parse(JSON.stringify(worker)) : null;
}

export async function createWorker(data: Partial<IWorker>, user?: string) {
  await connectMongoDB();
  if (!data.projectId || !data.name || !data.category || data.dailyRate === undefined) {
    throw new Error('projectId, name, category, and dailyRate are required.');
  }

  if (!mongoose.isValidObjectId(data.projectId)) {
    throw new Error('Invalid projectId');
  }

  const worker = await Worker.create({
    projectId: data.projectId,
    workerIdCode: data.workerIdCode?.trim(),
    name: data.name.trim(),
    category: data.category.trim(),
    mobile: data.mobile?.trim(),
    dailyRate: Number(data.dailyRate),
    overtimeRate: Number(data.overtimeRate || 0),
    status: data.status || 'ACTIVE',
    contractorVendor: data.contractorVendor?.trim(),
    joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
    notes: data.notes?.trim()
  });

  await logAuditAction({
    user,
    action: 'WORKER_CREATED',
    entity: 'Worker',
    entityId: worker._id.toString(),
    metadata: { name: worker.name, category: worker.category, dailyRate: worker.dailyRate }
  });

  return JSON.parse(JSON.stringify(worker));
}

export async function updateWorker(id: string, data: Partial<IWorker>, user?: string) {
  await connectMongoDB();
  const worker = await (Worker as any).findById(id).exec();
  if (!worker) {
    throw new Error('Worker not found.');
  }

  if (data.name) worker.name = data.name.trim();
  if (data.category) worker.category = data.category.trim();
  if (data.mobile !== undefined) worker.mobile = data.mobile.trim();
  if (data.dailyRate !== undefined) worker.dailyRate = Number(data.dailyRate);
  if (data.overtimeRate !== undefined) worker.overtimeRate = Number(data.overtimeRate);
  if (data.status) worker.status = data.status;
  if (data.workerIdCode !== undefined) worker.workerIdCode = data.workerIdCode.trim();
  if (data.contractorVendor !== undefined) worker.contractorVendor = data.contractorVendor.trim();
  if (data.notes !== undefined) worker.notes = data.notes.trim();

  await worker.save();

  await logAuditAction({
    user,
    action: 'WORKER_UPDATED',
    entity: 'Worker',
    entityId: worker._id.toString(),
    metadata: { updates: data }
  });

  return JSON.parse(JSON.stringify(worker));
}

export async function deleteWorker(id: string, user?: string) {
  await connectMongoDB();
  const worker = await (Worker as any).findById(id).exec();
  if (!worker) {
    throw new Error('Worker not found.');
  }

  await (Worker as any).findByIdAndDelete(id).exec();

  await logAuditAction({
    user,
    action: 'WORKER_DELETED',
    entity: 'Worker',
    entityId: id,
    metadata: { name: worker.name, category: worker.category }
  });

  return { ok: true, id };
}

export async function getWorkerCategories() {
  await connectMongoDB();
  const customCategories = await WorkerCategory.find().sort({ name: 1 }).exec();
  const names = Array.from(new Set([...DEFAULT_WORKER_CATEGORIES, ...customCategories.map((c: any) => c.name)]));
  return names;
}

