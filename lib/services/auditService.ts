import { connectMongoDB } from '../mongodb';
import { AuditLog } from '../models/AuditLog';

export interface AuditParams {
  user?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export async function logAuditAction(params: AuditParams) {
  try {
    await connectMongoDB();
    return await AuditLog.create({
      user: params.user || 'Site Supervisor',
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      timestamp: new Date(),
      metadata: params.metadata || {}
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    return null;
  }
}

export async function getAuditLogs(entity?: string, entityId?: string, limit = 50) {
  await connectMongoDB();
  const filter: any = {};
  if (entity) filter.entity = entity;
  if (entityId) filter.entityId = entityId;
  return AuditLog.find(filter).sort({ timestamp: -1 }).limit(limit).lean();
}
