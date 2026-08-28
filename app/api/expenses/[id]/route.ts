import { NextResponse } from 'next/server';
import { getExpenseById, voidExpense, updateExpense } from '@/lib/services/expenseService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const expense = await getExpenseById(id, projectId);
    if (!expense) {
      return NextResponse.json({ message: 'Expense record not found' }, { status: 404 });
    }

    return NextResponse.json({ data: expense });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch expense detail' },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { projectId, ...payload } = body || {};

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const updated = await updateExpense(id, projectId, payload, body.user || 'Site Supervisor');
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update expense' },
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
    const body = await request.json();
    const { projectId, reason, user } = body || {};

    if (!projectId || !reason) {
      return NextResponse.json({ message: 'projectId and reason are required to void an expense' }, { status: 400 });
    }

    const voided = await voidExpense(id, projectId, reason, user);
    return NextResponse.json({ ok: true, data: voided });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to void expense' },
      { status: 400 }
    );
  }
}

