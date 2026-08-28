export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { connectMongoDB } = await import('@/lib/mongodb');

    console.log('--------------------------------------------------');
    console.log(`[CivilWorks Server] 🚀 Application Server Started`);
    console.log(`[CivilWorks Server] Environment: ${process.env.NODE_ENV}`);
    console.log('--------------------------------------------------');

    try {
      await connectMongoDB();
    } catch (error: any) {
      console.error(`[CivilWorks Server] ⚠️ Initial DB connection attempt failed on startup: ${error.message || error}`);
    }
  }
}

