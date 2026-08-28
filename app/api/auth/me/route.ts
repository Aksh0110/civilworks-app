import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserById, ensureAdminUserExists } from '@/lib/services/userService';

export async function GET() {
  try {
    await ensureAdminUserExists();
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    const user = await getUserById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedProjectIds: user.assignedProjectIds || []
      },
      authenticated: true
    });
  } catch (error: any) {
    return NextResponse.json(
      { user: null, authenticated: false, message: error.message },
      { status: 500 }
    );
  }
}
