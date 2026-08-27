import { NextResponse } from 'next/server';
import { getDailyReportData } from '@/lib/services/progressService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const date = searchParams.get('date');

    if (!projectId || !date) {
      return NextResponse.json({ message: 'projectId and date are required' }, { status: 400 });
    }

    const report = await getDailyReportData(projectId, date);
    if (!report) {
      return NextResponse.json({ message: 'Daily progress report not found for date' }, { status: 404 });
    }

    return NextResponse.json({ data: report });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch report data' },
      { status: 400 }
    );
  }
}
