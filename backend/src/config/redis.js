import { createClient } from 'redis';

// Detect test environment
const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

// Mock Redis client for tests
class MockRedisClient {
  constructor() {
    this.store = new Map();
    this.expirations = new Map();
    this.isOpen = true;
  }
  async connect() { this.isOpen = true; }
  async quit() { this.isOpen = false; this.store.clear(); this.expirations.clear(); }
  async get(key) { this._checkExpiration(key); return this.store.get(key) || null; }
  async set(key, value) { this.store.set(key, value); return 'OK'; }
  async setEx(key, seconds, value) { this.store.set(key, value); this.expirations.set(key, Date.now() + seconds * 1000); return 'OK'; }
  async del(key) { const existed = this.store.has(key); this.store.delete(key); this.expirations.delete(key); return existed ? 1 : 0; }
  async incr(key) { const cur = parseInt(this.store.get(key) || '0'); const nv = cur + 1; this.store.set(key, nv.toString()); return nv; }
  async decr(key) { const cur = parseInt(this.store.get(key) || '0'); const nv = cur - 1; this.store.set(key, nv.toString()); return nv; }
  async keys(pattern) { const regex = new RegExp(pattern.replace('*', '.*')); return Array.from(this.store.keys()).filter(k => regex.test(k)); }
  async flushAll() { this.store.clear(); this.expirations.clear(); return 'OK'; }
  _checkExpiration(key) { const exp = this.expirations.get(key); if (exp && Date.now() > exp) { this.store.delete(key); this.expirations.delete(key); } }
  on() {}
}

// Create the appropriate client based on environment
let redisClient;

if (isTest) {
  redisClient = new MockRedisClient();
} else {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD,
  });
  redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
  redisClient.on('connect', () => console.log('✅ Connected to Redis'));
}

// Connect function
export const connectRedis = async () => {
  if (isTest) {
    redisClient.isOpen = true;
    return;
  }
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
};

// Disconnect function
export const disconnectRedis = async () => {
  if (isTest) {
    redisClient.isOpen = false;
    return;
  }
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('✅ Redis disconnected');
    }
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error);
  }
};

// Clear Redis cache (useful for tests)
export const clearRedis = async () => {
  if (isTest && redisClient.store) {
    redisClient.store.clear();
    redisClient.expirations.clear();
  } else if (redisClient.isOpen) {
    await redisClient.flushAll();
  }
};

export default redisClient;

