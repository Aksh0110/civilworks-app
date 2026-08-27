import { NextResponse } from 'next/server';
import { getProjectOverview } from '@/lib/services/projectService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const overview = await getProjectOverview(id);
    return NextResponse.json({ data: overview });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Project overview not found' },
      { status: 404 }
    );
  }
}
