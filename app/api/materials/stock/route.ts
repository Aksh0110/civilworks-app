import { NextResponse } from 'next/server';
import { getStockOverview, getLowStockCount } from '@/lib/services/materialService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const category = searchParams.get('category') || undefined;
    const metricsOnly = searchParams.get('metricsOnly') === 'true';

    if (!projectId) {
      return NextResponse.json({ message: 'projectId parameter is required' }, { status: 400 });
    }

    if (metricsOnly) {
      const metrics = await getLowStockCount(projectId);
      return NextResponse.json({ data: metrics });
    }

    const items = await getStockOverview(projectId, search, status, category);
    const metrics = await getLowStockCount(projectId);

    return NextResponse.json({ data: items, metrics });
  } catch (error) {
    console.error('API GET /api/materials/stock error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch stock overview' },
      { status: 400 }
    );
  }
}
