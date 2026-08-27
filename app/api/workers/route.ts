import { NextResponse } from 'next/server';
import { getWorkers, createWorker } from '@/lib/services/workerService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const workers = await getWorkers(projectId, { category, status });
    return NextResponse.json({ data: workers });
  } catch (error) {
    console.error('API GET /api/workers error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch workers' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.name || !body?.category || body?.dailyRate === undefined) {
      return NextResponse.json(
        { message: 'projectId, name, category, and dailyRate are required' },
        { status: 400 }
      );
    }

    const worker = await createWorker(body);
    return NextResponse.json({ data: worker }, { status: 201 });
  } catch (error) {
    console.error('API POST /api/workers error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create worker' },
      { status: 400 }
    );
  }
}
