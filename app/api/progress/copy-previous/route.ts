import { NextResponse } from 'next/server';
import { copyYesterdayProgress } from '@/lib/services/progressService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, date } = body || {};

    if (!projectId || !date) {
      return NextResponse.json({ message: 'projectId and date are required' }, { status: 400 });
    }

    const result = await copyYesterdayProgress(projectId, date);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to copy yesterday progress' },
      { status: 400 }
    );
  }
}
