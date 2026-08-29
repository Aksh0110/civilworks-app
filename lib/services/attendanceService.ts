import { connectMongoDB } from '../mongodb';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import { Worker } from '../models/Worker';
import { WageEntry } from '../models/WageEntry';
import { calculateWageSummary, WageSummaryResult } from './wageService';
import { logAuditAction } from './auditService';
import mongoose from 'mongoose';

export function normalizeDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day));
}

export function dateQueryRange(dateStr: string) {
  const target = normalizeDate(dateStr);
  const start = new Date(target);
  const end = new Date(target);
  end.setUTCDate(end.getUTCDate() + 1);
  return { $gte: start, $lt: end };
}

export async function getAttendanceForDate(projectId: string, dateStr: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid projectId');
  }

  const range = dateQueryRange(dateStr);
  const query: any = { projectId, date: range };
  const records = await Attendance.find(query).populate('workerId', 'name category dailyRate status').lean().exec();
  return JSON.parse(JSON.stringify(records));
}

export interface SaveAttendanceItem {
  workerId: string;
  status: AttendanceStatus;
  notes?: string;
}

export async function saveAttendanceBulk(
  projectId: string,
  dateStr: string,
  records: SaveAttendanceItem[],
  user?: string
): Promise<{ savedCount: number; summary: WageSummaryResult }> {
  await connectMongoDB();

  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid projectId');
  }
  if (!dateStr || !Array.isArray(records) || records.length === 0) {
    throw new Error('projectId, date, and valid records array are required.');
  }

  const targetDate = normalizeDate(dateStr);
  const dateRange = dateQueryRange(dateStr);

  const filterCount: any = { projectId, date: dateRange };
  const existingCount = await Attendance.countDocuments(filterCount);
  const isEdit = existingCount > 0;

  const workerIds = records.map((r) => r.workerId).filter((id) => mongoose.isValidObjectId(id));
  const activeWorkerQuery: any = { _id: { $in: workerIds }, projectId };
  const activeWorkers = await Worker.find(activeWorkerQuery).exec();

  const workerMap = new Map<string, { dailyRate: number; name: string }>();
  activeWorkers.forEach((w: any) => {
    workerMap.set(w._id.toString(), { dailyRate: w.dailyRate || 0, name: w.name });
  });

  const ops: any[] = records.map((rec) => ({
    updateOne: {
      filter: {
        projectId,
        workerId: rec.workerId,
        date: dateRange
      },
      update: {
        $set: {
          projectId,
          workerId: rec.workerId,
          date: targetDate,
          status: rec.status,
          notes: rec.notes?.trim(),
          markedAt: new Date()
        }
      },
      upsert: true
    }
  }));

  await (Attendance as any).bulkWrite(ops);

  const wageInputs = records.map((rec) => {
    const workerInfo = workerMap.get(rec.workerId);
    return {
      workerId: rec.workerId,
      dailyRate: workerInfo?.dailyRate || 0,
      status: rec.status
    };
  });

  const summary = calculateWageSummary(wageInputs);

  const wageEntryFilter: any = { projectId, date: dateRange };
  await (WageEntry as any).findOneAndUpdate(
    wageEntryFilter,
    {
      $set: {
        projectId,
        date: targetDate,
        totalWorkers: summary.totalWorkers,
        presentCount: summary.presentCount,
        halfDayCount: summary.halfDayCount,
        absentCount: summary.absentCount,
        totalWageCost: summary.totalWageCost,
        calculatedAt: new Date()
      }
    },
    { upsert: true }
  );

  await logAuditAction({
    user,
    action: isEdit ? 'ATTENDANCE_EDITED' : 'ATTENDANCE_SAVED',
    entity: 'Attendance',
    entityId: `${projectId}_${dateStr}`,
    metadata: {
      date: dateStr,
      presentCount: summary.presentCount,
      halfDayCount: summary.halfDayCount,
      absentCount: summary.absentCount,
      totalWageCost: summary.totalWageCost
    }
  });

  return {
    savedCount: records.length,
    summary
  };
}

export async function getAttendanceHistory(projectId: string, limitDays = 14) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid projectId');
  }

  const query: any = { projectId };
  const wageEntries = await WageEntry.find(query)
    .sort({ date: -1 })
    .limit(limitDays)
    .exec();

  return JSON.parse(JSON.stringify(wageEntries));
}

export async function getAttendanceSummary(projectId: string, dateStr: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid projectId');
  }

  const range = dateQueryRange(dateStr);
  const query: any = { projectId, date: range };
  const wageEntry = await WageEntry.findOne(query).lean().exec();
  if (wageEntry) {
    return JSON.parse(JSON.stringify(wageEntry));
  }

  const records = await Attendance.find(query)
    .populate('workerId', 'dailyRate')
    .lean()
    .exec();

  const wageInputs = records.map((r: any) => ({
    workerId: r.workerId?._id?.toString(),
    dailyRate: r.workerId?.dailyRate || 0,
    status: r.status as AttendanceStatus
  }));

  const summary = calculateWageSummary(wageInputs);
  return {
    projectId,
    date: normalizeDate(dateStr),
    ...summary
  };
}

export async function deleteAttendanceByDate(projectId: string, dateStr: string, user?: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) throw new Error('Invalid projectId');

  const range = dateQueryRange(dateStr);
  const query: any = { projectId, date: range };

  await Attendance.deleteMany(query).exec();
  await WageEntry.deleteMany(query).exec();

  await logAuditAction({
    user,
    action: 'ATTENDANCE_DELETED',
    entity: 'Attendance',
    entityId: `${projectId}_${dateStr}`,
    metadata: { projectId, dateStr }
  });

  return { ok: true, projectId, dateStr };
}

