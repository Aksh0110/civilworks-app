import { NextResponse } from 'next/server';
import { updateMaterial } from '@/lib/services/materialService';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateMaterial(id, body);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update material' },
      { status: 400 }
    );
  }
}
