import { NextResponse } from 'next/server';
import { updateVendorContact, deleteVendorContact } from '@/lib/services/vendorService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const body = await request.json();
    const updated = await updateVendorContact(contactId, body);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update contact' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const res = await deleteVendorContact(contactId);
    return NextResponse.json({ data: res });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to delete contact' },
      { status: 400 }
    );
  }
}
