import { NextResponse } from 'next/server';
import { getExpenseSummary } from '@/lib/services/expenseService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const summary = await getExpenseSummary(projectId);
    return NextResponse.json({ data: summary });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch expense summary' },
      { status: 400 }
    );
  }
}
