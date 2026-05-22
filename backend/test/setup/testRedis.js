/**
 * Mock Redis client for testing
 * This creates an in-memory store that mimics Redis behavior
 */
class MockRedisClient {
  constructor() {
    this.store = new Map();
    this.expirations = new Map();
    this.isOpen = true;
  }

  async connect() {
    this.isOpen = true;
    return Promise.resolve();
  }

  async quit() {
    this.isOpen = false;
    this.store.clear();
    this.expirations.clear();
    return Promise.resolve();
  }

  async get(key) {
    this._checkExpiration(key);
    return this.store.get(key) || null;
  }

  async set(key, value) {
    this.store.set(key, value);
    return Promise.resolve('OK');
  }

  async setEx(key, seconds, value) {
    this.store.set(key, value);
    this.expirations.set(key, Date.now() + seconds * 1000);
    return Promise.resolve('OK');
  }

  async del(key) {
    const existed = this.store.has(key);
    this.store.delete(key);
    this.expirations.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key) {
    const current = parseInt(this.store.get(key) || '0');
    const newValue = current + 1;
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async decr(key) {
    const current = parseInt(this.store.get(key) || '0');
    const newValue = current - 1;
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async keys(pattern) {
    // Simple pattern matching for test purposes
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async flushAll() {
    this.store.clear();
    this.expirations.clear();
    return Promise.resolve('OK');
  }

  _checkExpiration(key) {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.store.delete(key);
      this.expirations.delete(key);
    }
  }

  // Event emitter mock
  on(event, callback) {
    // Mock implementation
  }
}

export const createMockRedis = () => new MockRedisClient();
export default MockRedisClient;