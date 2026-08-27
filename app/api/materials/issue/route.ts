import { NextResponse } from 'next/server';
import { issueMaterial } from '@/lib/services/materialService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.date || !Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json(
        { message: 'projectId, date, and at least one material item are required' },
        { status: 400 }
      );
    }

    const result = await issueMaterial(body, body.user);
    return NextResponse.json({ ok: true, data: result.issue, updatedStockList: result.updatedStockList }, { status: 201 });
  } catch (error) {
    console.error('API POST /api/materials/issue error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to issue material' },
      { status: 400 }
    );
  }
}
