import { NextResponse } from 'next/server';
import { getVendorsList, createVendor } from '@/lib/services/vendorService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const statusTab = (searchParams.get('statusTab') as any) || undefined;

    const vendors = await getVendorsList({
      projectId,
      search,
      category,
      statusTab
    });

    return NextResponse.json({ data: vendors });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || !body.name.trim()) {
      return NextResponse.json({ message: 'Vendor name is required' }, { status: 400 });
    }

    const vendor = await createVendor(body);
    return NextResponse.json({ data: vendor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to create vendor' },
      { status: 400 }
    );
  }
}
