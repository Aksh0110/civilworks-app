import { connectMongoDB } from '../mongodb';
import { AuditLog } from '../models/AuditLog';

export interface AuditParams {
  user?: string;
  action: string;
  entity: string;
  entityId?: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

export async function logAuditAction(params: AuditParams) {
  try {
    await connectMongoDB();
    const projId = params.projectId || params.metadata?.projectId || (params.entity === 'Project' ? params.entityId : undefined);
    return await AuditLog.create({
      user: params.user || 'Site Supervisor',
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      projectId: projId,
      timestamp: new Date(),
      metadata: params.metadata || {}
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    return null;
  }
}

export async function getAuditLogs(entity?: string, entityId?: string, limit = 50, projectId?: string) {
  await connectMongoDB();
  const filter: any = {};
  if (entity) filter.entity = entity;
  if (entityId) filter.entityId = entityId;
  if (projectId) {
    filter.$or = [
      { projectId: projectId },
      { 'metadata.projectId': projectId },
      { entity: 'Project', entityId: projectId }
    ];
  }
  return AuditLog.find(filter).sort({ timestamp: -1 }).limit(limit).lean();
}
