import { NextResponse } from 'next/server';
import { getPaymentReceipt } from '@/lib/services/paymentService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receipt = await getPaymentReceipt(id);
    return NextResponse.json({ data: receipt });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Receipt not found' },
      { status: 404 }
    );
  }
}
