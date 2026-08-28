import { NextResponse } from 'next/server';
import { updateExpenseCategory, deleteExpenseCategory } from '@/lib/services/expenseService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateExpenseCategory(id, body, body.user || 'Site Supervisor');
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update category' },
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
    const res = await deleteExpenseCategory(id, 'Site Supervisor');
    return NextResponse.json({ data: res });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete category' },
      { status: 400 }
    );
  }
}
