import { NextResponse } from 'next/server';
import { getWorkTypes, createWorkType } from '@/lib/services/progressService';
import { WORK_UNITS } from '@/lib/models/WorkType';

export async function GET() {
  try {
    const workTypes = await getWorkTypes();
    return NextResponse.json({ data: { workTypes, units: WORK_UNITS } });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch work types' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || !body?.defaultUnit) {
      return NextResponse.json({ message: 'Work type name and default unit are required' }, { status: 400 });
    }

    const wt = await createWorkType(body, body.user);
    return NextResponse.json({ data: wt }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create work type' },
      { status: 400 }
    );
  }
}
