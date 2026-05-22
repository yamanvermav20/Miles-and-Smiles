import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/testDb.js';
import { createMockUser, generateTestToken, createAuthHeaders } from '../fixtures/index.js';

// Note: redis/queue modules use test-mode mocks based on NODE_ENV

describe('User API Integration Tests', () => {
  let testUser, authToken, authHeaders;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    // Create test user and token before each test
    const userData = await createMockUser({ username: 'testuser' });
    testUser = await new User(userData).save();
    authToken = generateTestToken(testUser._id, testUser.username);
    authHeaders = createAuthHeaders(authToken);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('GET /api/user/me', () => {
    it('should return current user data', async () => {
      const response = await request(app)
        .get('/api/user/me')
        .set(authHeaders)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('_id');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('friends');
      expect(response.body).toHaveProperty('favouriteGames');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/user/me')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'No token provided.');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/user/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Invalid or expired token.');
    });

    it('should populate friends list', async () => {
      // Create friend user
      const friendData = await createMockUser({ username: 'friend1' });
      const friend = await new User(friendData).save();

      // Add friend to test user
      testUser.friends.push(friend._id);
      await testUser.save();

      const response = await request(app)
        .get('/api/user/me')
        .set(authHeaders)
        .expect(200);

      expect(response.body.friends).toHaveLength(1);
      expect(response.body.friends[0]).toHaveProperty('username', 'friend1');
      expect(response.body.friends[0]).toHaveProperty('pfp_url');
    });
  });

  describe('GET /api/user/favorites', () => {
    it('should return empty favorites for new user', async () => {
      const response = await request(app)
        .get('/api/user/favorites')
        .set(authHeaders)
        .expect(200);

      expect(response.body).toHaveProperty('favouriteGames');
      expect(response.body.favouriteGames).toEqual([]);
    });

    it('should return user favorites', async () => {
      // Add favorite games
      testUser.favouriteGames = ['Chess', 'Checkers'];
      await testUser.save();

      const response = await request(app)
        .get('/api/user/favorites')
        .set(authHeaders)
        .expect(200);

      expect(response.body.favouriteGames).toEqual(['Chess', 'Checkers']);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/user/favorites')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'No token provided.');
    });
  });

  describe('POST /api/user/favorites', () => {
    it('should add game to favorites', async () => {
      const response = await request(app)
        .post('/api/user/favorites')
        .set(authHeaders)
        .send({ gameTitle: 'Chess' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Game added to favorites');
      expect(response.body.favouriteGames).toContain('Chess');

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.favouriteGames).toContain('Chess');
    });

    it('should remove game from favorites if already favorited', async () => {
      // Add game to favorites first
      testUser.favouriteGames = ['Chess'];
      await testUser.save();

      const response = await request(app)
        .post('/api/user/favorites')
        .set(authHeaders)
        .send({ gameTitle: 'Chess' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Game removed from favorites');
      expect(response.body.favouriteGames).not.toContain('Chess');

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.favouriteGames).not.toContain('Chess');
    });

    it('should fail without gameTitle', async () => {
      const response = await request(app)
        .post('/api/user/favorites')
        .set(authHeaders)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Game title is required.');
    });

    it('should handle multiple favorites', async () => {
      const games = ['Chess', 'Checkers', 'Backgammon'];

      for (const game of games) {
        await request(app)
          .post('/api/user/favorites')
          .set(authHeaders)
          .send({ gameTitle: game })
          .expect(200);
      }

      const user = await User.findById(testUser._id);
      expect(user.favouriteGames).toEqual(games);
    });
  });

  describe('PUT /api/user/updateField', () => {
    it('should update user gender', async () => {
      const response = await request(app)
        .put('/api/user/updateField')
        .set(authHeaders)
        .send({ gender: 'female' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Updated successfully');
      expect(response.body.user.gender).toBe('female');

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.gender).toBe('female');
    });

    it('should update user birthday', async () => {
      const birthday = new Date('1995-05-15');

      const response = await request(app)
        .put('/api/user/updateField')
        .set(authHeaders)
        .send({ birthday })
        .expect(200);

      expect(response.body.user.birthday).toBeDefined();
    });

    it('should update username if not taken', async () => {
      const response = await request(app)
        .put('/api/user/updateField')
        .set(authHeaders)
        .send({ username: 'newusername' })
        .expect(200);

      expect(response.body.user.username).toBe('newusername');
    });

    it('should fail to update to existing username', async () => {
      // Create another user
      const otherUserData = await createMockUser({ username: 'existinguser' });
      await new User(otherUserData).save();

      const response = await request(app)
        .put('/api/user/updateField')
        .set(authHeaders)
        .send({ username: 'existinguser' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Username already taken.');
    });

    it('should not update password field', async () => {
      const response = await request(app)
        .put('/api/user/updateField')
        .set(authHeaders)
        .send({ password: 'newpassword' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Cannot update password.');
    });

    it('should not update _id field', async () => {
      const response = await request(app)
        .put('/api/user/updateField')
        .set(authHeaders)
        .send({ _id: '507f1f77bcf86cd799439011' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Cannot update _id.');
    });

    it('should fail without any fields', async () => {
      const response = await request(app)
        .put('/api/user/updateField')
        .set(authHeaders)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'No fields provided.');
    });
  });

  describe('POST /api/user/friends', () => {
    it('should send friend request', async () => {
      // Create target user
      const targetUserData = await createMockUser({ username: 'targetuser' });
      await new User(targetUserData).save();

      const response = await request(app)
        .post('/api/user/friends')
        .set(authHeaders)
        .send({ username: 'targetuser' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Friend request sent!');
    });

    it('should fail to send request to self', async () => {
      const response = await request(app)
        .post('/api/user/friends')
        .set(authHeaders)
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'You cannot send a request to yourself');
    });

    it('should fail without username', async () => {
      const response = await request(app)
        .post('/api/user/friends')
        .set(authHeaders)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Username is required');
    });
  });

  describe('POST /api/user/friends/accept', () => {
    let requesterUser;

    beforeEach(async () => {
      // Create requester and add request
      const requesterData = await createMockUser({ username: 'requester' });
      requesterUser = await new User(requesterData).save();

      testUser.incomingRequests.push(requesterUser._id);
      requesterUser.outgoingRequests.push(testUser._id);
      await testUser.save();
      await requesterUser.save();
    });

    it('should accept friend request', async () => {
      const response = await request(app)
        .post('/api/user/friends/accept')
        .set(authHeaders)
        .send({ userId: requesterUser._id.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Friend request accepted!');

      // Verify both users are now friends
      const updatedUser = await User.findById(testUser._id);
      const updatedRequester = await User.findById(requesterUser._id);

      expect(updatedUser.friends.map(id => id.toString())).toContain(requesterUser._id.toString());
      expect(updatedRequester.friends.map(id => id.toString())).toContain(testUser._id.toString());
      expect(updatedUser.incomingRequests).toHaveLength(0);
      expect(updatedRequester.outgoingRequests).toHaveLength(0);
    });

    it('should fail without userId', async () => {
      const response = await request(app)
        .post('/api/user/friends/accept')
        .set(authHeaders)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'User ID is required');
    });

    it('should fail if request does not exist', async () => {
      // Create a user that exists but hasn't sent a friend request
      const otherUserData = await createMockUser({ username: 'otherusernofreq' });
      const otherUser = await new User(otherUserData).save();

      const response = await request(app)
        .post('/api/user/friends/accept')
        .set(authHeaders)
        .send({ userId: otherUser._id.toString() })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Friend request not found');
    });
  });

  describe('POST /api/user/friends/reject', () => {
    let requesterUser;

    beforeEach(async () => {
      const requesterData = await createMockUser({ username: 'requester' });
      requesterUser = await new User(requesterData).save();

      testUser.incomingRequests.push(requesterUser._id);
      requesterUser.outgoingRequests.push(testUser._id);
      await testUser.save();
      await requesterUser.save();
    });

    it('should reject friend request', async () => {
      const response = await request(app)
        .post('/api/user/friends/reject')
        .set(authHeaders)
        .send({ userId: requesterUser._id.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Friend request rejected');

      const updatedUser = await User.findById(testUser._id);
      const updatedRequester = await User.findById(requesterUser._id);

      expect(updatedUser.incomingRequests).toHaveLength(0);
      expect(updatedRequester.outgoingRequests).toHaveLength(0);
      expect(updatedUser.friends).toHaveLength(0);
    });
  });

  describe('POST /api/user/friends/remove', () => {
    let friendUser;

    beforeEach(async () => {
      const friendData = await createMockUser({ username: 'friend' });
      friendUser = await new User(friendData).save();

      testUser.friends.push(friendUser._id);
      friendUser.friends.push(testUser._id);
      await testUser.save();
      await friendUser.save();
    });

    it('should remove friend', async () => {
      const response = await request(app)
        .post('/api/user/friends/remove')
        .set(authHeaders)
        .send({ userId: friendUser._id.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Friend removed');

      const updatedUser = await User.findById(testUser._id);
      const updatedFriend = await User.findById(friendUser._id);

      expect(updatedUser.friends).toHaveLength(0);
      expect(updatedFriend.friends).toHaveLength(0);
    });

    it('should fail if not friends', async () => {
      const notFriendData = await createMockUser({ username: 'notfriend' });
      const notFriend = await new User(notFriendData).save();

      const response = await request(app)
        .post('/api/user/friends/remove')
        .set(authHeaders)
        .send({ userId: notFriend._id.toString() })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'User is not your friend');
    });
  });
});