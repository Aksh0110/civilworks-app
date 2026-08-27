import { NextResponse } from 'next/server';
import { getDailyProgressByDate, createOrUpdateDailyProgress } from '@/lib/services/progressService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const date = searchParams.get('date');

    if (!projectId || !date) {
      return NextResponse.json({ message: 'projectId and date are required' }, { status: 400 });
    }

    const progress = await getDailyProgressByDate(projectId, date);
    return NextResponse.json({ data: progress });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch daily progress' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.date || !body?.workItems) {
      return NextResponse.json({ message: 'projectId, date, and workItems are required' }, { status: 400 });
    }

    const progress = await createOrUpdateDailyProgress(body, body.user);
    return NextResponse.json({ ok: true, data: progress }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to save daily progress' },
      { status: 400 }
    );
  }
}
