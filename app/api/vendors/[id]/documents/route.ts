import { NextResponse } from 'next/server';
import { addVendorDocument } from '@/lib/services/vendorService';
import { VendorDocument } from '@/lib/models/VendorDocument';
import { connectMongoDB } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectMongoDB();
    const docs = await (VendorDocument as any).find({ vendorId: id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data: docs });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch vendor documents' },
      { status: 500 }
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

    if (!body.documentName || !body.fileUrl) {
      return NextResponse.json(
        { message: 'documentName and fileUrl are required' },
        { status: 400 }
      );
    }

    const doc = await addVendorDocument(id, body);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to add document' },
      { status: 400 }
    );
  }
}
