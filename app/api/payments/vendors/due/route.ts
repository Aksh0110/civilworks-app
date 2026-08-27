import { NextResponse } from 'next/server';
import { getVendorsWithOutstanding, getVendorDetail } from '@/lib/services/paymentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const vendorId = searchParams.get('vendorId');

    if (!projectId) {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    if (vendorId) {
      const detail = await getVendorDetail(projectId, vendorId);
      return NextResponse.json({ data: detail });
    }

    const vendors = await getVendorsWithOutstanding(projectId);
    return NextResponse.json({ data: vendors });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch vendor outstanding' },
      { status: 500 }
    );
  }
}
