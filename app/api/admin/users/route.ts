import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getAllUsers, createUser } from '@/lib/services/userService';
import { getProjects } from '@/lib/services/projectService';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const [users, projects] = await Promise.all([
      getAllUsers(),
      getProjects()
    ]);

    const formattedProjects = projects.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      code: p.code,
      location: p.location
    }));

    return NextResponse.json({
      data: {
        users,
        projects: formattedProjects
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch admin users data.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newUser = await createUser({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      assignedProjectIds: body.assignedProjectIds || [],
      status: body.status || 'ACTIVE',
      user: session.name
    });

    return NextResponse.json(
      { message: 'User created successfully.', data: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to create user.' },
      { status: 400 }
    );
  }
}
