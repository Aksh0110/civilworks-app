import { NextResponse } from 'next/server';
import { getWorkerCategories } from '@/lib/services/workerService';

export async function GET() {
  try {
    const categories = await getWorkerCategories();
    return NextResponse.json({ data: categories });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch worker categories' },
      { status: 500 }
    );
  }
}
