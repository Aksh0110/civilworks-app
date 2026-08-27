import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectMongoDB();
    return NextResponse.json({
      ok: true,
      service: 'civilworks-app',
      status: 'healthy',
      database: 'mongodb',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        ok: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed'
      },
      { status: 503 }
    );
  }
}
