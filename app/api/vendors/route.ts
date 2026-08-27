import { NextResponse } from 'next/server';
import { getVendors, createVendor } from '@/lib/services/materialService';

export async function GET() {
  try {
    const vendors = await getVendors();
    return NextResponse.json({ data: vendors });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json({ message: 'Vendor name is required' }, { status: 400 });
    }

    const vendor = await createVendor(body, body.user);
    return NextResponse.json({ data: vendor }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create vendor' },
      { status: 400 }
    );
  }
}
