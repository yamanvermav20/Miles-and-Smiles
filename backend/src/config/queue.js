// config/queue.js
import Bull from 'bull';

const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

// Create the appropriate queues based on environment
let friendRequestQueue;
let notificationQueue;

if (isTest) {
  // Provide lightweight mocked queues for tests
  friendRequestQueue = {
    add: async () => ({ id: 'job-123' }),
    on: () => {},
  };

  notificationQueue = {
    add: async () => ({ id: 'job-456' }),
    on: () => {},
  };
} else {
  // Create queues for different tasks
  // Bull will create its own Redis connection based on these settings
  friendRequestQueue = new Bull('friend-requests', {
    redis: {
      port: parseInt(process.env.REDIS_PORT) || 6379,
      host: process.env.REDIS_HOST || 'localhost',
      password: process.env.REDIS_PASSWORD || undefined,
    },
    defaultJobOptions: {
      attempts: 3, // Retry 3 times if job fails
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 second delay
      },
      removeOnComplete: true, // Clean up completed jobs
      removeOnFail: false, // Keep failed jobs for debugging
    },
  });

  notificationQueue = new Bull('notifications', {
    redis: {
      port: parseInt(process.env.REDIS_PORT) || 6379,
      host: process.env.REDIS_HOST || 'localhost',
      password: process.env.REDIS_PASSWORD || undefined,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  // Optional: Monitor queue events for debugging
  friendRequestQueue.on('completed', (job) => {
    console.log(`✅ Friend request job ${job.id} completed`);
  });

  friendRequestQueue.on('failed', (job, err) => {
    console.error(`❌ Friend request job ${job.id} failed:`, err.message);
  });

  notificationQueue.on('completed', (job) => {
    console.log(`✅ Notification job ${job.id} completed`);
  });

  notificationQueue.on('failed', (job, err) => {
    console.error(`❌ Notification job ${job.id} failed:`, err.message);
  });
}

export { friendRequestQueue, notificationQueue };

