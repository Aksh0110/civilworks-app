import { NextResponse } from 'next/server';
import { getDailyProgressHistory } from '@/lib/services/progressService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const result = await getDailyProgressHistory(projectId, page, limit);
    return NextResponse.json({ data: result.history, pagination: result.pagination });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 400 }
    );
  }
}
