import { AttendanceStatus } from '../models/Attendance';

export interface WageSummaryResult {
  totalWorkers: number;
  presentCount: number;
  halfDayCount: number;
  absentCount: number;
  totalWageCost: number;
  breakdown: Array<{
    workerId?: string;
    dailyRate: number;
    status: AttendanceStatus;
    workedDays: number;
    wageAmount: number;
  }>;
}

export function calculateWorkedDays(status: AttendanceStatus): number {
  switch (status) {
    case 'PRESENT':
      return 1.0;
    case 'HALF_DAY':
      return 0.5;
    case 'ABSENT':
      return 0.0;
    default:
      return 0.0;
  }
}

export function calculateWorkerWage(dailyRate: number, status: AttendanceStatus): number {
  if (!dailyRate || dailyRate < 0) return 0;
  const workedDays = calculateWorkedDays(status);
  return Math.round(workedDays * dailyRate);
}

export function calculateWageSummary(
  records: Array<{ workerId?: string; dailyRate: number; status: AttendanceStatus }>
): WageSummaryResult {
  let presentCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let totalWageCost = 0;

  const breakdown = records.map((rec) => {
    const workedDays = calculateWorkedDays(rec.status);
    const wageAmount = calculateWorkerWage(rec.dailyRate, rec.status);

    if (rec.status === 'PRESENT') presentCount++;
    else if (rec.status === 'HALF_DAY') halfDayCount++;
    else if (rec.status === 'ABSENT') absentCount++;

    totalWageCost += wageAmount;

    return {
      workerId: rec.workerId,
      dailyRate: rec.dailyRate,
      status: rec.status,
      workedDays,
      wageAmount
    };
  });

  return {
    totalWorkers: records.length,
    presentCount,
    halfDayCount,
    absentCount,
    totalWageCost,
    breakdown
  };
}
