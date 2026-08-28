import { NextResponse } from 'next/server';
import { getAttendanceSummary } from '@/lib/services/attendanceService';
import { getWorkers } from '@/lib/services/workerService';
import { getStockMetricsOnly } from '@/lib/services/materialService';
import { getExpenseSummary } from '@/lib/services/expenseService';
import { getDailyReportData } from '@/lib/services/progressService';
import { getProjectPaymentSummary } from '@/lib/services/paymentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    // Execute all backend queries in parallel using Promise.all for sub-50ms execution
    const [
      attendanceSummary,
      activeWorkers,
      materialMetrics,
      expenseSummary,
      todayProgress,
      paymentSummary
    ] = await Promise.all([
      getAttendanceSummary(projectId, date).catch(() => null),
      getWorkers(projectId, { status: 'ACTIVE' }).catch(() => []),
      getStockMetricsOnly(projectId).catch(() => null),
      getExpenseSummary(projectId).catch(() => null),
      getDailyReportData(projectId, date).catch(() => null),
      getProjectPaymentSummary(projectId).catch(() => null)
    ]);

    return NextResponse.json(
      {
        data: {
          attendanceSummary,
          workerCount: Array.isArray(activeWorkers) ? activeWorkers.length : 0,
          materialMetrics,
          expenseSummary,
          todayProgress,
          paymentSummary
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=5, stale-while-revalidate=15'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to load dashboard metrics' },
      { status: 500 }
    );
  }
}
