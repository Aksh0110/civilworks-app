import { NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/services/projectService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const projects = await getProjects(status);
    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error('API GET /api/projects error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || !body?.code) {
      return NextResponse.json({ message: 'Project name and code are required' }, { status: 400 });
    }
    const project = await createProject(body);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error('API POST /api/projects error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 400 }
    );
  }
}
