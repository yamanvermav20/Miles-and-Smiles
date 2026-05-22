import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/testDb.js';
import { createMockUser } from '../fixtures/index.js';
import bcrypt from 'bcryptjs';

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully create a new user', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'newuser',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'newuser');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user exists in database
      const user = await User.findOne({ username: 'newuser' });
      expect(user).toBeDefined();
      expect(user.username).toBe('newuser');
    });

    it('should hash the password before saving', async () => {
      const plainPassword = 'mySecurePassword';
      
      await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'hashtest',
          password: plainPassword,
        })
        .expect(201);

      const user = await User.findOne({ username: 'hashtest' });
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash format
      
      // Verify password can be compared
      const isValid = await bcrypt.compare(plainPassword, user.password);
      expect(isValid).toBe(true);
    });

    it('should fail without username', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Username and password required.');
    });

    it('should fail without password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Username and password required.');
    });

    it('should fail with duplicate username', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'duplicate',
          password: 'password123',
        })
        .expect(201);

      // Try to create second user with same username
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'duplicate',
          password: 'password456',
        })
        .expect(409);

      expect(response.body).toHaveProperty('message', 'Username already exists.');
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Username and password required.');
    });

    it('should trim whitespace from username', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: '  trimtest  ',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.user.username).toBe('trimtest');
      
      const user = await User.findOne({ username: 'trimtest' });
      expect(user.username).toBe('trimtest');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'loginuser',
          password: 'password123',
        });
    });

    it('should successfully login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'loginuser');
      expect(response.body.user).not.toHaveProperty('password');
      expect(typeof response.body.token).toBe('string');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials.');
      expect(response.body).not.toHaveProperty('token');
    });

    it('should fail with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials.');
      expect(response.body).not.toHaveProperty('token');
    });

    it('should fail without username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Username and password required.');
    });

    it('should fail without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Username and password required.');
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123',
        })
        .expect(200);

      const token = response.body.token;
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should be case-sensitive for username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'LOGINUSER', // uppercase
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials.');
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Username and password required.');
    });
  });

  describe('Auth Flow Integration', () => {
    it('should complete full signup and login flow', async () => {
      // Signup
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'flowtest',
          password: 'testpass123',
        })
        .expect(201);

      expect(signupResponse.body.user.username).toBe('flowtest');

      // Login with same credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'flowtest',
          password: 'testpass123',
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user.username).toBe('flowtest');
      expect(loginResponse.body.user._id).toBe(signupResponse.body.user._id);
    });
  });
});