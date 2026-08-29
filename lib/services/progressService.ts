import { connectMongoDB } from '../mongodb';
import { DailyProgress, IDailyProgressItem, IProgressIssue, IProgressPhoto } from '../models/DailyProgress';
import { WorkType, DEFAULT_WORK_TYPES, WORK_UNITS } from '../models/WorkType';
import { logAuditAction } from './auditService';
import mongoose from 'mongoose';
import { Attendance } from '../models/Attendance';
import { WageEntry } from '../models/WageEntry';

export async function getWorkTypes() {
  await connectMongoDB();
  const query: any = { status: 'ACTIVE' };
  let workTypes = await WorkType.find(query).sort({ sortOrder: 1, name: 1 }).exec();

  if (workTypes.length === 0) {
    const seedOps = DEFAULT_WORK_TYPES.map((wt) => ({
      name: wt.name,
      defaultUnit: wt.defaultUnit,
      icon: wt.icon,
      sortOrder: wt.sortOrder,
      isDefault: true,
      status: 'ACTIVE' as const
    }));
    await (WorkType as any).insertMany(seedOps);
    workTypes = await WorkType.find(query).sort({ sortOrder: 1, name: 1 }).exec();
  }

  return JSON.parse(JSON.stringify(workTypes));
}

export async function createWorkType(data: { name: string; defaultUnit: string; icon?: string; sortOrder?: number }, user?: string) {
  await connectMongoDB();
  if (!data.name?.trim()) {
    throw new Error('Work type name is required.');
  }
  if (!data.defaultUnit?.trim()) {
    throw new Error('Default unit is required.');
  }

  const query: any = { name: data.name.trim() };
  const existing = await WorkType.findOne(query).exec();
  if (existing) {
    throw new Error(`Work type "${data.name}" already exists.`);
  }

  const wt = await WorkType.create({
    name: data.name.trim(),
    defaultUnit: data.defaultUnit.trim(),
    icon: data.icon?.trim() || '🏗️',
    sortOrder: Number(data.sortOrder || 99),
    status: 'ACTIVE',
    isDefault: false
  });

  await logAuditAction({
    user,
    action: 'WORK_TYPE_CREATED',
    entity: 'WorkType',
    entityId: wt._id.toString(),
    metadata: { name: wt.name, defaultUnit: wt.defaultUnit }
  });

  return JSON.parse(JSON.stringify(wt));
}

export async function updateWorkType(id: string, data: { name?: string; defaultUnit?: string; icon?: string }, user?: string) {
  await connectMongoDB();
  const wt = await (WorkType as any).findById(id).exec();
  if (!wt) throw new Error('Work type not found.');

  if (data.name?.trim()) wt.name = data.name.trim();
  if (data.defaultUnit?.trim()) wt.defaultUnit = data.defaultUnit.trim();
  if (data.icon?.trim()) wt.icon = data.icon.trim();

  await wt.save();

  await logAuditAction({
    user,
    action: 'WORK_TYPE_UPDATED',
    entity: 'WorkType',
    entityId: id,
    metadata: { updates: data }
  });

  return JSON.parse(JSON.stringify(wt));
}

export async function deleteWorkType(id: string, user?: string) {
  await connectMongoDB();
  const wt = await (WorkType as any).findById(id).exec();
  if (!wt) throw new Error('Work type not found.');

  await (WorkType as any).findByIdAndDelete(id).exec();

  await logAuditAction({
    user,
    action: 'WORK_TYPE_DELETED',
    entity: 'WorkType',
    entityId: id,
    metadata: { name: wt.name }
  });

  return { ok: true, id };
}

export async function deleteDailyProgressByDate(projectId: string, date: string, user?: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) throw new Error('Invalid projectId.');
  const targetDate = new Date(date);
  const normalizedDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

  const query = { projectId, date: normalizedDate };
  const existing = await (DailyProgress as any).findOne(query).exec();
  if (!existing) throw new Error('Daily progress report not found for specified date.');

  await (DailyProgress as any).deleteOne(query).exec();

  await logAuditAction({
    user,
    action: 'DAILY_PROGRESS_DELETED',
    entity: 'DailyProgress',
    entityId: existing._id.toString(),
    metadata: { projectId, date }
  });

  return { ok: true, projectId, date };
}


export interface SaveDailyProgressPayload {
  projectId: string;
  date: string; // YYYY-MM-DD
  weather?: string;
  workforceCount?: number;
  labourCost?: number;
  workItems: Array<{
    workTypeId: string;
    quantity: number;
    unit?: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
    location?: string;
    remark?: string;
    assignedTeam?: string;
  }>;
  issues?: Array<{
    issueType: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    resolved?: boolean;
  }>;
  photos?: Array<{
    url: string;
    caption?: string;
    workItemId?: string;
  }>;
}

export async function createOrUpdateDailyProgress(payload: SaveDailyProgressPayload, user?: string) {
  await connectMongoDB();

  if (!mongoose.isValidObjectId(payload.projectId)) {
    throw new Error('Invalid projectId.');
  }
  if (!payload.date) {
    throw new Error('Progress date is required.');
  }

  const targetDate = new Date(payload.date);
  const normalizedDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

  if (!Array.isArray(payload.workItems) || payload.workItems.length === 0) {
    throw new Error('At least one work item is required to save daily progress.');
  }

  // Validate and snapshot work items
  const processedWorkItems: IDailyProgressItem[] = [];
  for (const item of payload.workItems) {
    if (!mongoose.isValidObjectId(item.workTypeId)) {
      throw new Error(`Invalid workTypeId: ${item.workTypeId}`);
    }
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Work item quantity must be greater than 0.`);
    }
    const validStatuses = ['COMPLETED', 'IN_PROGRESS', 'PENDING'];
    if (!validStatuses.includes(item.status)) {
      throw new Error(`Invalid work item status: ${item.status}`);
    }

    const wtDoc = await (WorkType as any).findById(item.workTypeId).exec();
    if (!wtDoc || wtDoc.status !== 'ACTIVE') {
      throw new Error(`Work type is invalid or inactive.`);
    }

    processedWorkItems.push({
      workTypeId: item.workTypeId,
      workTypeName: wtDoc.name, // Snapshot
      workTypeIcon: wtDoc.icon || '🏗️',
      quantity: Math.round(qty * 100) / 100,
      unit: (item.unit || wtDoc.defaultUnit).trim(), // Snapshot
      status: item.status,
      location: item.location?.trim(),
      remark: item.remark?.trim(),
      assignedTeam: item.assignedTeam?.trim()
    });
  }

  // Validate issues
  const processedIssues: IProgressIssue[] = [];
  if (Array.isArray(payload.issues)) {
    for (const iss of payload.issues) {
      if (!iss.issueType?.trim() || !iss.description?.trim()) {
        throw new Error('Issue type and description are required for site issues.');
      }
      const validSeverities = ['HIGH', 'MEDIUM', 'LOW'];
      if (!validSeverities.includes(iss.severity)) {
        throw new Error(`Invalid issue severity: ${iss.severity}`);
      }
      processedIssues.push({
        issueType: iss.issueType.trim(),
        severity: iss.severity,
        description: iss.description.trim(),
        resolved: Boolean(iss.resolved)
      });
    }
  }

  // Validate photos
  const processedPhotos: IProgressPhoto[] = [];
  if (Array.isArray(payload.photos)) {
    for (const ph of payload.photos) {
      if (!ph.url?.trim()) continue;
      processedPhotos.push({
        url: ph.url.trim(),
        caption: ph.caption?.trim(),
        workItemId: ph.workItemId,
        uploadedAt: new Date()
      });
    }
  }

  // Auto-populate attendance workforce count & labour cost if not provided
  let workforceCount = payload.workforceCount || 0;
  let labourCost = payload.labourCost || 0;

  if (!workforceCount || !labourCost) {
    try {
      const attendanceRecords = await Attendance.find({
        projectId: payload.projectId,
        date: normalizedDate
      } as any).exec();

      if (attendanceRecords.length > 0) {
        workforceCount = workforceCount || attendanceRecords.filter((a: any) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
        
        // Calculate labour cost from wage entries if available
        const wageEntries = await WageEntry.find({
          projectId: payload.projectId,
          date: normalizedDate
        } as any).exec();
        
        if (wageEntries.length > 0) {
          const totalWages = wageEntries.reduce((sum: number, w: any) => sum + (w.totalWage || 0), 0);
          labourCost = labourCost || totalWages;
        }
      }
    } catch (err) {
      // Non-blocking auto-population fallback
    }
  }

  // Idempotent Upsert (Find existing report for date or create new)
  const query: any = { projectId: payload.projectId, date: normalizedDate };
  let progress = await DailyProgress.findOne(query).exec();

  if (progress) {
    progress.weather = payload.weather?.trim();
    progress.workforceCount = workforceCount;
    progress.labourCost = labourCost;
    progress.workItems = processedWorkItems;
    progress.issues = processedIssues;
    progress.photos = processedPhotos;
    progress.updatedBy = user || 'Site Supervisor';
    progress.status = 'SUBMITTED';
    await progress.save();
  } else {
    progress = await DailyProgress.create({
      projectId: payload.projectId,
      date: normalizedDate,
      weather: payload.weather?.trim(),
      workforceCount,
      labourCost,
      workItems: processedWorkItems,
      issues: processedIssues,
      photos: processedPhotos,
      status: 'SUBMITTED',
      createdBy: user || 'Site Supervisor',
      updatedBy: user || 'Site Supervisor'
    });
  }

  await logAuditAction({
    user,
    action: 'DAILY_PROGRESS_SAVED',
    entity: 'DailyProgress',
    entityId: progress._id.toString(),
    metadata: {
      date: payload.date,
      workItemCount: processedWorkItems.length,
      issueCount: processedIssues.length,
      photoCount: processedPhotos.length
    }
  });

  return JSON.parse(JSON.stringify(progress));
}

export async function getDailyProgressByDate(projectId: string, dateStr: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId) || !dateStr) {
    throw new Error('Invalid projectId or date.');
  }

  const d = new Date(dateStr);
  const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  const query: any = { projectId, date: normalizedDate };
  const progress = await DailyProgress.findOne(query).exec();
  return progress ? JSON.parse(JSON.stringify(progress)) : null;
}

export async function copyYesterdayProgress(projectId: string, todayDateStr: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId) || !todayDateStr) {
    throw new Error('Invalid projectId or date.');
  }

  const today = new Date(todayDateStr);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const normalizedYesterday = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate()));

  const query: any = { projectId, date: normalizedYesterday };
  const previousProgress = await DailyProgress.findOne(query).exec();

  if (!previousProgress || previousProgress.workItems.length === 0) {
    return {
      message: 'No previous daily progress report found for yesterday.',
      draftWorkItems: []
    };
  }

  // Copy work items into a draft array (same project guaranteed)
  const draftWorkItems = previousProgress.workItems.map((item: any) => ({
    workTypeId: item.workTypeId.toString(),
    workTypeName: item.workTypeName,
    workTypeIcon: item.workTypeIcon,
    quantity: item.quantity,
    unit: item.unit,
    status: item.status,
    location: item.location || '',
    remark: item.remark || '',
    assignedTeam: item.assignedTeam || ''
  }));

  return {
    copiedFromDate: previousProgress.date,
    draftWorkItems
  };
}

export async function getDailyProgressHistory(projectId: string, page = 1, limit = 20) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid projectId.');
  }

  const query: any = { projectId };
  const skip = (Math.max(1, page) - 1) * limit;

  const records = await DailyProgress.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  const total = await DailyProgress.countDocuments(query);
  const plainRecords = JSON.parse(JSON.stringify(records));

  // Format compact cards
  const formattedHistory = plainRecords.map((rec: any) => {
    const completedCount = rec.workItems.filter((i: any) => i.status === 'COMPLETED').length;
    const inProgressCount = rec.workItems.filter((i: any) => i.status === 'IN_PROGRESS').length;
    const pendingCount = rec.workItems.filter((i: any) => i.status === 'PENDING').length;

    return {
      _id: rec._id,
      date: rec.date,
      totalWorkItems: rec.workItems.length,
      completedCount,
      inProgressCount,
      pendingCount,
      issueCount: rec.issues.length,
      photoCount: rec.photos.length,
      workforceCount: rec.workforceCount || 0,
      labourCost: rec.labourCost || 0,
      weather: rec.weather
    };
  });

  return {
    history: formattedHistory,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getDailyReportData(projectId: string, dateStr: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId) || !dateStr) {
    throw new Error('Invalid projectId or date.');
  }

  const d = new Date(dateStr);
  const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  const query: any = { projectId, date: normalizedDate };
  const progress = await DailyProgress.findOne(query).lean().exec();

  if (!progress) {
    return null;
  }

  const plain: any = progress;

  const completedWork = plain.workItems.filter((i: any) => i.status === 'COMPLETED');
  const inProgressWork = plain.workItems.filter((i: any) => i.status === 'IN_PROGRESS');
  const pendingWork = plain.workItems.filter((i: any) => i.status === 'PENDING');

  return {
    ...plain,
    completedWork,
    inProgressWork,
    pendingWork
  };
}
