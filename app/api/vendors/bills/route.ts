import { NextResponse } from 'next/server';
import { createVendorBillService } from '@/lib/services/vendorService';
import { VendorBill } from '@/lib/models/VendorBill';
import { connectMongoDB } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const vendorId = searchParams.get('vendorId') || undefined;

    await connectMongoDB();
    const query: any = {};
    if (projectId) query.projectId = projectId;
    if (vendorId) query.vendorId = vendorId;

    const bills = await (VendorBill as any).find(query).sort({ billDate: -1 }).lean();
    return NextResponse.json({ data: bills });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch vendor bills' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.projectId || !body.vendorId || !body.billNumber || !body.totalAmount) {
      return NextResponse.json(
        { message: 'projectId, vendorId, billNumber, and totalAmount are required' },
        { status: 400 }
      );
    }

    const bill = await createVendorBillService(body);
    return NextResponse.json({ data: bill }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to create vendor bill' },
      { status: 400 }
    );
  }
}
