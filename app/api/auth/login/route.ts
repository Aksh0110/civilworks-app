import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/services/userService';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);
    await setSessionCookie({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedProjectIds: user.assignedProjectIds
    });

    return NextResponse.json({
      message: 'Login successful.',
      user
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Invalid login credentials.' },
      { status: 401 }
    );
  }
}
