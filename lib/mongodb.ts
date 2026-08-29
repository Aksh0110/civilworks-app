import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civilworks';

type GlobalMongoose = typeof globalThis & {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const globalWithMongoose = globalThis as GlobalMongoose;
const cached = globalWithMongoose.mongoose ?? { conn: null, promise: null };
globalWithMongoose.mongoose = cached;

function maskMongoUri(uri: string): string {
  try {
    return uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
  } catch {
    return '***';
  }
}

export async function connectMongoDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const maskedUri = maskMongoUri(MONGODB_URI);
    console.log(`[MongoDB] Initializing connection pool to ${maskedUri}...`);

    const opts = {
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts as any)
      .then((mongooseInstance) => {
        const conn = mongooseInstance.connection;
        console.log(`[MongoDB] ✅ Connected to database "${conn.name}" on host "${conn.host}"`);
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error(`[MongoDB Error] ❌ Connection failed:`, error.message || error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}
