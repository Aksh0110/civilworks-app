import { NextResponse } from 'next/server';
import { getExpenses, createExpense } from '@/lib/services/expenseService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const paymentMethod = (searchParams.get('paymentMethod') as any) || undefined;
    const timeframe = (searchParams.get('timeframe') as any) || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    const result = await getExpenses(projectId, {
      search,
      categoryId,
      paymentMethod,
      timeframe,
      status,
      page,
      limit
    });

    return NextResponse.json({ data: result.expenses, pagination: result.pagination });
  } catch (error) {
    console.error('API GET /api/expenses error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch expenses' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.categoryId || !body?.amount || !body?.paymentMethod || !body?.expenseDate) {
      return NextResponse.json(
        { message: 'projectId, categoryId, amount, paymentMethod, and expenseDate are required' },
        { status: 400 }
      );
    }

    const expense = await createExpense(body, body.user);
    return NextResponse.json({ ok: true, data: expense }, { status: 201 });
  } catch (error) {
    console.error('API POST /api/expenses error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to save expense' },
      { status: 400 }
    );
  }
}
