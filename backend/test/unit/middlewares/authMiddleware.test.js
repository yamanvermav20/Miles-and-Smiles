import { verifyToken } from '../../../src/middlewares/authMiddleware.js';
import { jest } from '@jest/globals';
import User from '../../../src/models/User.js';
import jwt from 'jsonwebtoken';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../setup/testDb.js';
import { createMockUser, generateTestToken } from '../../fixtures/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Auth Middleware Unit Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('verifyToken middleware', () => {
    let mockReq, mockRes, mockNext, testUser;

    beforeEach(async () => {
      // Create test user
      const userData = await createMockUser({ username: 'testuser' });
      testUser = await new User(userData).save();

      // Mock request, response, and next
      mockReq = {
        headers: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it('should pass valid token and attach user to request', async () => {
      const token = generateTestToken(testUser._id, testUser.username);
      mockReq.headers.authorization = `Bearer ${token}`;

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(testUser._id.toString());
      expect(mockReq.user.username).toBe('testuser');
    });

    it('should reject request without authorization header', async () => {
      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', async () => {
      mockReq.headers.authorization = 'InvalidFormat token123';

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id, username: testUser.username },
        JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const token = generateTestToken(fakeUserId, 'fakeuser');
      mockReq.headers.authorization = `Bearer ${token}`;

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid token user.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject token signed with wrong secret', async () => {
      const wrongToken = jwt.sign(
        { id: testUser._id, username: testUser.username },
        'wrong-secret',
        { expiresIn: '7d' }
      );
      mockReq.headers.authorization = `Bearer ${wrongToken}`;

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing Bearer prefix', async () => {
      const token = generateTestToken(testUser._id, testUser.username);
      mockReq.headers.authorization = token; // No "Bearer " prefix

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive Bearer keyword', async () => {
      const token = generateTestToken(testUser._id, testUser.username);
      mockReq.headers.authorization = `bearer ${token}`; // lowercase

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach full user object to request', async () => {
      const token = generateTestToken(testUser._id, testUser.username);
      mockReq.headers.authorization = `Bearer ${token}`;

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toMatchObject({
        username: 'testuser',
        pfp_url: '/guestpfp.png',
        friends: [],
        favouriteGames: [],
      });
    });
  });
});