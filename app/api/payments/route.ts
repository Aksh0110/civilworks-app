import { NextResponse } from 'next/server';
import {
  createLabourPayment,
  createLabourAdvance,
  createVendorPayment,
  createVendorAdvance,
  getPaymentHistory
} from '@/lib/services/paymentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const type = searchParams.get('type') || undefined;
    const recipientId = searchParams.get('recipientId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const history = await getPaymentHistory({
      projectId,
      type,
      recipientId,
      status,
      search,
      startDate,
      endDate,
      page,
      limit
    });

    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ message: 'Valid positive amount is required' }, { status: 400 });
    }
    if (!body.paymentType) {
      return NextResponse.json({ message: 'paymentType is required' }, { status: 400 });
    }

    let result;
    switch (body.paymentType) {
      case 'LABOUR_PAYMENT':
        if (!body.workerId) return NextResponse.json({ message: 'workerId is required' }, { status: 400 });
        result = await createLabourPayment(body);
        break;
      case 'LABOUR_ADVANCE':
        if (!body.workerId) return NextResponse.json({ message: 'workerId is required' }, { status: 400 });
        result = await createLabourAdvance(body);
        break;
      case 'VENDOR_PAYMENT':
        if (!body.vendorId) return NextResponse.json({ message: 'vendorId is required' }, { status: 400 });
        result = await createVendorPayment(body);
        break;
      case 'VENDOR_ADVANCE':
        if (!body.vendorId) return NextResponse.json({ message: 'vendorId is required' }, { status: 400 });
        result = await createVendorAdvance(body);
        break;
      default:
        return NextResponse.json({ message: 'Invalid paymentType' }, { status: 400 });
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to process payment' },
      { status: 400 }
    );
  }
}
