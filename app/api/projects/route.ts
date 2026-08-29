import { NextResponse } from 'next/server';
import { getProjectsOverviewList, createProject } from '@/lib/services/projectService';
import { getSession } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const allowedProjectIds = session && session.role !== 'ADMIN' ? session.assignedProjectIds : undefined;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const projects = await getProjectsOverviewList(status, allowedProjectIds);
    return NextResponse.json({ data: projects });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.name || !body?.code) {
      return NextResponse.json(
        { message: 'Project name and unique project code are required' },
        { status: 400 }
      );
    }

    const project = await createProject(body, body.user || 'Site Supervisor');
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to create project' },
      { status: 400 }
    );
  }
}
