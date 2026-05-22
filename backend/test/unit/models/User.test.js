import User from '../../../src/models/User.js';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../setup/testDb.js';
import { createMockUser } from '../../fixtures/index.js';

describe('User Model Unit Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = await createMockUser({ username: 'john_doe' });
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe('john_doe');
      expect(savedUser.pfp_url).toBe('/guestpfp.png');
      expect(savedUser.friends).toEqual([]);
      expect(savedUser.favouriteGames).toEqual([]);
    });

    it('should fail to create user without required username', async () => {
      const user = new User({ password: 'password123' });
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail to create user without required password', async () => {
      const user = new User({ username: 'testuser' });
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail to create duplicate username', async () => {
      const userData = await createMockUser({ username: 'duplicate' });
      await new User(userData).save();

      const duplicateUser = new User(userData);
      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should trim whitespace from username', async () => {
      const userData = await createMockUser({ username: '  spaced  ' });
      const user = await new User(userData).save();
      expect(user.username).toBe('spaced');
    });
  });

  describe('User Schema Defaults', () => {
    it('should set default pfp_url', async () => {
      const userData = await createMockUser();
      delete userData.pfp_url;
      const user = await new User(userData).save();
      expect(user.pfp_url).toBe('/guestpfp.png');
    });

    it('should set default gender to null', async () => {
      const userData = await createMockUser();
      delete userData.gender;
      const user = await new User(userData).save();
      expect(user.gender).toBe(null);
    });

    it('should set default birthday to null', async () => {
      const userData = await createMockUser();
      delete userData.birthday;
      const user = await new User(userData).save();
      expect(user.birthday).toBe(null);
    });

    it('should initialize empty arrays for friends and requests', async () => {
      const userData = await createMockUser();
      const user = await new User(userData).save();
      expect(user.friends).toEqual([]);
      expect(user.incomingRequests).toEqual([]);
      expect(user.outgoingRequests).toEqual([]);
      expect(user.favouriteGames).toEqual([]);
    });
  });

  describe('User Gender Validation', () => {
    it('should accept valid gender values', async () => {
      const genders = ['male', 'female', 'other', null];
      
      for (const gender of genders) {
        const userData = await createMockUser({ 
          username: `user_${gender}`, 
          gender 
        });
        const user = await new User(userData).save();
        expect(user.gender).toBe(gender);
      }
    });

    it('should reject invalid gender values', async () => {
      const userData = await createMockUser({ gender: 'invalid' });
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Relationships', () => {
    it('should handle friend relationships', async () => {
      const user1Data = await createMockUser({ username: 'user1' });
      const user2Data = await createMockUser({ username: 'user2' });
      
      const user1 = await new User(user1Data).save();
      const user2 = await new User(user2Data).save();

      user1.friends.push(user2._id);
      await user1.save();

      const updatedUser1 = await User.findById(user1._id).populate('friends');
      expect(updatedUser1.friends).toHaveLength(1);
      expect(updatedUser1.friends[0].username).toBe('user2');
    });

    it('should handle incoming friend requests', async () => {
      const user1Data = await createMockUser({ username: 'user1' });
      const user2Data = await createMockUser({ username: 'user2' });
      
      const user1 = await new User(user1Data).save();
      const user2 = await new User(user2Data).save();

      user1.incomingRequests.push(user2._id);
      await user1.save();

      const updatedUser1 = await User.findById(user1._id);
      expect(updatedUser1.incomingRequests).toHaveLength(1);
      expect(updatedUser1.incomingRequests[0].toString()).toBe(user2._id.toString());
    });
  });

  describe('User Timestamps', () => {
    it('should automatically add createdAt and updatedAt', async () => {
      const userData = await createMockUser();
      const user = await new User(userData).save();

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const userData = await createMockUser();
      const user = await new User(userData).save();
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      user.gender = 'female';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});