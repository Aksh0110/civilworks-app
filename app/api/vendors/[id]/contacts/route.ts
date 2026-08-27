import { NextResponse } from 'next/server';
import { addVendorContact, deleteVendorContact } from '@/lib/services/vendorService';
import { VendorContact } from '@/lib/models/VendorContact';
import { connectMongoDB } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectMongoDB();
    const contacts = await (VendorContact as any).find({ vendorId: id }).lean();
    return NextResponse.json({ data: contacts });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch vendor contacts' },
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ message: 'Contact name is required' }, { status: 400 });
    }

    const contact = await addVendorContact(id, body);
    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to add contact' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ message: 'contactId is required' }, { status: 400 });
    }

    const res = await deleteVendorContact(contactId);
    return NextResponse.json({ data: res });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete contact' },
      { status: 400 }
    );
  }
}
