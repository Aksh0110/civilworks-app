import { NextResponse } from 'next/server';
import { getExpenseCategories, createExpenseCategory } from '@/lib/services/expenseService';
import { PAYMENT_METHODS } from '@/lib/models/ExpenseCategory';

export async function GET() {
  try {
    const categories = await getExpenseCategories();
    return NextResponse.json({ data: { categories, paymentMethods: PAYMENT_METHODS } });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    const category = await createExpenseCategory(body, body.user);
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create category' },
      { status: 400 }
    );
  }
}
