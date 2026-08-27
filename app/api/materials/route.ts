import { NextResponse } from 'next/server';
import { getMaterials, createMaterial } from '@/lib/services/materialService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;

    const materials = await getMaterials(projectId, { category, status });
    return NextResponse.json({ data: materials });
  } catch (error) {
    console.error('API GET /api/materials error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch materials' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || !body?.category || !body?.unit) {
      return NextResponse.json(
        { message: 'Material name, category, and unit are required' },
        { status: 400 }
      );
    }

    const material = await createMaterial(body);
    return NextResponse.json({ data: material }, { status: 201 });
  } catch (error) {
    console.error('API POST /api/materials error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create material' },
      { status: 400 }
    );
  }
}
