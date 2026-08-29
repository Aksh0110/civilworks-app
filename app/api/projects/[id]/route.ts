import { NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@/lib/services/projectService';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (session && session.role !== 'ADMIN' && !session.assignedProjectIds.includes(id)) {
      return NextResponse.json(
        { message: 'Access Denied. You do not have permission to access this project site.' },
        { status: 403 }
      );
    }

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ data: project });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (session && session.role !== 'ADMIN' && !session.assignedProjectIds.includes(id)) {
      return NextResponse.json(
        { message: 'Access Denied. You do not have permission to modify this project site.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = await updateProject(id, body, session?.name || body.user || 'Site Supervisor');
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update project' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (session && session.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Access Denied. Only System Administrators can delete project sites.' },
        { status: 403 }
      );
    }

    const res = await deleteProject(id, session?.name || 'Site Supervisor');
    return NextResponse.json({ data: res });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete project' },
      { status: 400 }
    );
  }
}

