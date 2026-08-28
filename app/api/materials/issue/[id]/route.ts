import { NextResponse } from 'next/server';
import { deleteMaterialIssue } from '@/lib/services/materialService';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await deleteMaterialIssue(id, 'Site Supervisor');
    return NextResponse.json({ data: res });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete material issue entry' },
      { status: 400 }
    );
  }
}
