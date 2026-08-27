import { NextResponse } from 'next/server';
import { adjustStock } from '@/lib/services/materialService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.materialId || !body?.adjustmentType || body.quantity === undefined || !body?.reason) {
      return NextResponse.json(
        { message: 'projectId, materialId, adjustmentType, quantity, and reason are required' },
        { status: 400 }
      );
    }

    const result = await adjustStock(body, body.user);
    return NextResponse.json({ ok: true, data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to process stock adjustment' },
      { status: 400 }
    );
  }
}
