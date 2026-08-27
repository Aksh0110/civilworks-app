import { NextResponse } from 'next/server';
import { getPaymentReceipt, voidPayment } from '@/lib/services/paymentService';

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
      { message: error.message || 'Payment not found' },
      { status: 404 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json(
        { message: 'Reason for voiding payment is required' },
        { status: 400 }
      );
    }

    const voided = await voidPayment(id, body.reason, body.user);
    return NextResponse.json({ data: voided });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to void payment' },
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
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'Voided via API request';

    const voided = await voidPayment(id, reason);
    return NextResponse.json({ data: voided });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to void payment' },
      { status: 400 }
    );
  }
}
