import { NextResponse } from 'next/server';
import { getWorkerById, updateWorker, deleteWorker } from '@/lib/services/workerService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const worker = await getWorkerById(id);
    if (!worker) {
      return NextResponse.json({ message: 'Worker not found' }, { status: 404 });
    }
    return NextResponse.json({ data: worker });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch worker' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateWorker(id, body);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update worker' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await deleteWorker(id, 'Site Supervisor');
    return NextResponse.json({ data: res });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete worker' },
      { status: 400 }
    );
  }
}

