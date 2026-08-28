import { NextResponse } from 'next/server';
import { getProjectOverview } from '@/lib/services/projectService';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const allowedProjectIds = session && session.role !== 'ADMIN' ? session.assignedProjectIds : undefined;

    const { id } = await params;
    const overview = await getProjectOverview(id, allowedProjectIds);
    return NextResponse.json({ data: overview });
  } catch (error: any) {
    const isAccessDenied = error.message?.includes('Access Denied');
    return NextResponse.json(
      { message: error.message || 'Project overview not found' },
      { status: isAccessDenied ? 403 : 404 }
    );
  }
}
