import { NextResponse } from 'next/server';
import { getDocumentsList, addDocumentRecord } from '@/lib/services/documentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const vendorId = searchParams.get('vendorId') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    const docs = await getDocumentsList({ projectId, vendorId, type, search });
    return NextResponse.json({ data: docs });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.documentName || !body?.fileUrl) {
      return NextResponse.json(
        { message: 'documentName and fileUrl are required' },
        { status: 400 }
      );
    }

    const doc = await addDocumentRecord({
      ...body,
      user: body.user || 'Site Supervisor'
    });
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to create document' },
      { status: 400 }
    );
  }
}
