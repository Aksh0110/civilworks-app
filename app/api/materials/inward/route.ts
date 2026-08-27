import { NextResponse } from 'next/server';
import { receiveMaterialInward } from '@/lib/services/materialService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.date || !Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json(
        { message: 'projectId, date, and at least one material item are required' },
        { status: 400 }
      );
    }

    const result = await receiveMaterialInward(body, body.user);
    return NextResponse.json({ ok: true, data: result.inward, updatedStockList: result.updatedStockList }, { status: 201 });
  } catch (error) {
    console.error('API POST /api/materials/inward error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to process material inward' },
      { status: 400 }
    );
  }
}
