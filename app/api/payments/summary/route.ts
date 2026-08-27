import { NextResponse } from 'next/server';
import { getProjectPaymentSummary } from '@/lib/services/paymentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const summary = await getProjectPaymentSummary(projectId);
    return NextResponse.json({ data: summary });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch project payment summary' },
      { status: 500 }
    );
  }
}
