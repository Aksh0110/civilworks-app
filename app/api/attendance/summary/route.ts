import { NextResponse } from 'next/server';
import { getAttendanceSummary } from '@/lib/services/attendanceService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const date = searchParams.get('date');

    if (!projectId || !date) {
      return NextResponse.json(
        { message: 'projectId and date are required' },
        { status: 400 }
      );
    }

    const summary = await getAttendanceSummary(projectId, date);
    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error('API GET /api/attendance/summary error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch attendance summary' },
      { status: 400 }
    );
  }
}
