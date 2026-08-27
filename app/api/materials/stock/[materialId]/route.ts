import { NextResponse } from 'next/server';
import { getMaterialDetail } from '@/lib/services/materialService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const detail = await getMaterialDetail(projectId, materialId);
    return NextResponse.json({ data: detail });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch material detail' },
      { status: 400 }
    );
  }
}
