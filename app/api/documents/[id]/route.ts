import { NextResponse } from 'next/server';
import { deleteDocumentRecord } from '@/lib/services/documentService';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await deleteDocumentRecord(id);
    return NextResponse.json({ data: res });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete document' },
      { status: 400 }
    );
  }
}
