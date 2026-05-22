import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { clearRedis } from '../../src/config/redis.js';

let mongoServer;

/**
 * Connect to the in-memory database before all tests
 */
export const connectTestDB = async () => {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
};

/**
 * Clear all test data after each test
 */
export const clearTestDB = async () => {
  // Clear Redis cache
  await clearRedis();
  
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

/**
 * Close database connection and stop server after all tests
 */
export const disconnectTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database disconnect failed:', error);
    throw error;
  }
};