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

export interface FilterAuditOptions {
  userFilter?: string;
  categoryFilter?: string;
  projectId?: string;
  limit?: number;
}

export async function getFilteredAuditLogs(options: FilterAuditOptions = {}) {
  await connectMongoDB();
  const { userFilter, categoryFilter, projectId, limit = 100 } = options;
  const filter: any = {};

  if (userFilter && userFilter !== 'ALL') {
    filter.user = new RegExp(userFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  if (projectId && projectId !== 'ALL') {
    filter.$or = [
      { projectId: projectId },
      { 'metadata.projectId': projectId },
      { entity: 'Project', entityId: projectId }
    ];
  }

  if (categoryFilter && categoryFilter !== 'ALL') {
    switch (categoryFilter) {
      case 'LOGINS':
        filter.action = { $in: ['USER_LOGIN_SUCCESS', 'ADMIN_USER_SEEDED'] };
        break;
      case 'FINANCIAL':
        filter.action = { $in: ['EXPENSE_CREATED', 'PAYMENT_CREATED', 'PAYMENT_VOIDED', 'WAGE_CALCULATED'] };
        break;
      case 'PROGRESS_STOCK':
        filter.action = { $in: ['WORK_PROGRESS_UPDATED', 'MATERIAL_STOCK_UPDATED', 'MATERIAL_RECEIVED'] };
        break;
      case 'USER_ADMIN':
        filter.action = { $in: ['USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'ADMIN_USER_SEEDED'] };
        break;
    }
  }

  const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(limit).lean().exec();
  return JSON.parse(JSON.stringify(logs));
}

export async function getAuditSummaryStats() {
  await connectMongoDB();

  const totalActions = await AuditLog.countDocuments().exec();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayActions = await AuditLog.countDocuments({ timestamp: { $gte: todayStart } }).exec();
  const todayLogins = await AuditLog.countDocuments({
    action: 'USER_LOGIN_SUCCESS',
    timestamp: { $gte: todayStart }
  }).exec();

  const uniqueUsers = await (AuditLog as any).distinct('user').exec();

  return {
    totalActions,
    todayActions,
    todayLogins,
    activeMonitoredUsersCount: uniqueUsers.length
  };
}
