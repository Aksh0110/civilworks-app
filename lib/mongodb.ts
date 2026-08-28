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
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const maskedUri = maskMongoUri(MONGODB_URI);
    console.log(`[MongoDB] Initializing connection to ${maskedUri}...`);

    const opts = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout for quick failure logging
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        const conn = mongooseInstance.connection;
        console.log(`[MongoDB] ✅ Successfully connected to database "${conn.name}" on host "${conn.host}"`);
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null; // Clear cached promise on failure so retries can occur
        console.error(`[MongoDB Error] ❌ Database connection failed:`, error.message || error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.conn = null;
    throw error;
  }
}

