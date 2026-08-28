import { NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@/lib/services/projectService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { id } = await params;
    const body = await request.json();

    const updated = await updateProject(id, body, body.user || 'Site Supervisor');
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
    const { id } = await params;
    const res = await deleteProject(id, 'Site Supervisor');
    return NextResponse.json({ data: res });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete project' },
      { status: 400 }
    );
  }
}

