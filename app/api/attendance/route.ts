import { NextResponse } from 'next/server';
import { getAttendanceForDate, saveAttendanceBulk, deleteAttendanceByDate } from '@/lib/services/attendanceService';

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

    const records = await getAttendanceForDate(projectId, date);
    return NextResponse.json({ data: records });
  } catch (error) {
    console.error('API GET /api/attendance error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch attendance' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.date || !Array.isArray(body?.records)) {
      return NextResponse.json(
        { message: 'projectId, date, and records array are required' },
        { status: 400 }
      );
    }

    const result = await saveAttendanceBulk(
      body.projectId,
      body.date,
      body.records,
      body.user
    );

    return NextResponse.json({
      ok: true,
      data: result.summary,
      savedCount: result.savedCount
    });
  } catch (error) {
    console.error('API POST /api/attendance error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to save attendance' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const date = searchParams.get('date');

    if (!projectId || !date) {
      return NextResponse.json({ message: 'projectId and date are required' }, { status: 400 });
    }

    const res = await deleteAttendanceByDate(projectId, date, 'Site Supervisor');
    return NextResponse.json({ data: res });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete attendance' },
      { status: 400 }
    );
  }
}

