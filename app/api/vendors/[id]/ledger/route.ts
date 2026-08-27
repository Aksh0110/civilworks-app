import { NextResponse } from 'next/server';
import { getVendorLedger } from '@/lib/services/vendorService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;

    const ledger = await getVendorLedger(id, projectId);
    return NextResponse.json({ data: ledger });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch vendor ledger' },
      { status: 500 }
    );
  }
}
