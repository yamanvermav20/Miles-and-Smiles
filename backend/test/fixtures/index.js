import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

/**
 * Create mock user data
 */
export const createMockUser = async (overrides = {}) => {
  const defaultUser = {
    username: 'testuser',
    password: await bcrypt.hash('password123', 10),
    pfp_url: '/guestpfp.png',
    gender: 'male',
    birthday: new Date('1990-01-01'),
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    favouriteGames: [],
  };

  return { ...defaultUser, ...overrides };
};

/**
 * Create multiple mock users
 */
export const createMockUsers = async (count = 3) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(
      await createMockUser({
        username: `testuser${i + 1}`,
        password: await bcrypt.hash(`password${i + 1}`, 10),
      })
    );
  }
  return users;
};

/**
 * Create mock game data
 */
export const createMockGame = (overrides = {}) => {
  const defaultGame = {
    title: 'Test Game',
    image: 'https://example.com/game.jpg',
  };

  return { ...defaultGame, ...overrides };
};

/**
 * Create multiple mock games
 */
export const createMockGames = (count = 5) => {
  const games = [];
  for (let i = 0; i < count; i++) {
    games.push(
      createMockGame({
        title: `Test Game ${i + 1}`,
        image: `https://example.com/game${i + 1}.jpg`,
      })
    );
  }
  return games;
};

/**
 * Generate JWT token for testing
 */
export const generateTestToken = (userId, username = 'testuser') => {
  return jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Create authenticated request headers
 */
export const createAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

/**
 * Create mock socket for testing
 */
export const createMockSocket = (userId, username = 'testuser') => {
  return {
    id: `socket_${Date.now()}`,
    user: { id: userId, username },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    broadcast: {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    },
    on: jest.fn(),
    off: jest.fn(),
  };
};

/**
 * Wait for a specified time (useful for testing async operations)
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));