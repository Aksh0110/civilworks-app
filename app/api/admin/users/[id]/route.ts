import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { updateUser } from '@/lib/services/userService';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updatedUser = await updateUser(
      id,
      {
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
        assignedProjectIds: body.assignedProjectIds,
        status: body.status
      },
      session.name
    );

    return NextResponse.json({
      message: 'User updated successfully.',
      data: updatedUser
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update user.' },
      { status: 400 }
    );
  }
}
