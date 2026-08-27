import { NextResponse } from 'next/server';
import { getWorkersWithDue, getWorkerWageDetail } from '@/lib/services/paymentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const workerId = searchParams.get('workerId');

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    if (workerId) {
      const detail = await getWorkerWageDetail(projectId, workerId);
      if (!detail) {
        return NextResponse.json({ message: 'Worker not found' }, { status: 404 });
      }
      return NextResponse.json({ data: detail });
    }

    const workers = await getWorkersWithDue(projectId);
    return NextResponse.json({ data: workers });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch labour wage due' },
      { status: 500 }
    );
  }
}
