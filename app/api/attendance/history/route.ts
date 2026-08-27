import { NextResponse } from 'next/server';
import { getAttendanceHistory } from '@/lib/services/attendanceService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 14;

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const history = await getAttendanceHistory(projectId, limit);
    return NextResponse.json({ data: history });
  } catch (error) {
    console.error('API GET /api/attendance/history error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch attendance history' },
      { status: 400 }
    );
  }
}
