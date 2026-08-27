import { NextResponse } from 'next/server';
import { getVendorProfile, updateVendor } from '@/lib/services/vendorService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;

    const profile = await getVendorProfile(id, projectId);
    return NextResponse.json({ data: profile });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Vendor profile not found' },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateVendor(id, body);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update vendor' },
      { status: 400 }
    );
  }
}
