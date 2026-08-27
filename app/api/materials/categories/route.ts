import { NextResponse } from 'next/server';
import { getMaterialCategories, getUnits } from '@/lib/services/materialService';

export async function GET() {
  try {
    const categories = await getMaterialCategories();
    const units = await getUnits();
    return NextResponse.json({ data: { categories, units } });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
