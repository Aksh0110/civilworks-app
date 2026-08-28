import { NextResponse } from 'next/server';
import { updateMaterial, deleteMaterialMaster } from '@/lib/services/materialService';

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await deleteMaterialMaster(id, 'Site Supervisor');
    return NextResponse.json({ data: res });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete material' },
      { status: 400 }
    );
  }
}

