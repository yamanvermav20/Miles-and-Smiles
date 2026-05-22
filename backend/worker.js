// worker.js
import "dotenv/config.js";
import { connectDB } from './src/config/db.js';
import { connectRedis } from './src/config/redis.js';

// Load environment variables

console.log('🚀 Starting Background Workers...');

// Debug: Check if env variables are loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  console.log('Please check your .env file in the backend folder');
  process.exit(1);
}

if (!process.env.REDIS_HOST) {
  console.warn('⚠️  REDIS_HOST not set, using default: localhost');
}

// Start worker
const startWorker = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected for workers');

    // 2. Connect to Redis
    await connectRedis();
    console.log('✅ Redis connected for workers');

    // 3. Import and start all workers
    console.log('📨 Starting Friend Request Worker...');
    await import('./src/workers/friendRequestWorker.js');

    console.log('🔔 Starting Notification Worker...');
    await import('./src/workers/notificationWorker.js');

    console.log('\n✅ All workers started successfully!');
    console.log('👂 Workers are now listening for jobs...');
    console.log('💡 Workers will use Socket.IO from your main server (port 3000)');
    console.log('Press Ctrl+C to stop workers\n');

  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
};

// Start the worker
startWorker();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down workers gracefully...');
  
  try {
    const { friendRequestQueue, notificationQueue } = await import('./src/config/queue.js');
    
    // Close queues
    await friendRequestQueue.close();
    await notificationQueue.close();
    console.log('✅ Queues closed');

    // Disconnect from databases
    const { disconnectRedis } = await import('./src/config/redis.js');
    await disconnectRedis();
    
    console.log('✅ Workers shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('⏹️  Received SIGTERM, shutting down...');
  process.exit(0);
});
