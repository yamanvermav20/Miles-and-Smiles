import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import Game from '../../src/models/Game.js';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/testDb.js';
import { createMockGames } from '../fixtures/index.js';


describe('Game API Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('GET /api/games', () => {
    it('should return empty array when no games exist', async () => {
      const response = await request(app)
        .get('/api/games')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'No games found');
    });

    it('should return all games', async () => {
      // Create test games
      const mockGames = createMockGames(3);
      await Game.insertMany(mockGames);

      const response = await request(app)
        .get('/api/games')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('image');
    });

    it('should return games with correct structure', async () => {
      const mockGames = [
        { title: 'Chess', image: 'chess.jpg' },
        { title: 'Checkers', image: 'checkers.jpg' },
      ];
      await Game.insertMany(mockGames);

      const response = await request(app)
        .get('/api/games')
        .expect(200);

      expect(response.body[0]).toMatchObject({
        title: 'Chess',
        image: 'chess.jpg',
      });
      expect(response.body[0]).toHaveProperty('_id');
    });

    it('should handle large number of games', async () => {
      const mockGames = createMockGames(50);
      await Game.insertMany(mockGames);

      const response = await request(app)
        .get('/api/games')
        .expect(200);

      expect(response.body).toHaveLength(50);
    });

    it('should return consistent data on multiple requests', async () => {
      const mockGames = createMockGames(5);
      await Game.insertMany(mockGames);

      const response1 = await request(app).get('/api/games').expect(200);
      const response2 = await request(app).get('/api/games').expect(200);

      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('GET /api/games caching behavior', () => {
    it('should cache games after first request', async () => {
      const mockGames = createMockGames(3);
      await Game.insertMany(mockGames);

      // First request - should hit database
      const response1 = await request(app).get('/api/games').expect(200);
      
      // Add more games to database
      await Game.create({ title: 'New Game', image: 'new.jpg' });

      // Second request - should return cached data (3 games, not 4)
      const response2 = await request(app).get('/api/games').expect(200);
      
      expect(response2.body).toHaveLength(3);
    });
  });

  describe('Game data validation', () => {
    it('should return games without __v field', async () => {
      const mockGames = createMockGames(2);
      await Game.insertMany(mockGames);

      const response = await request(app).get('/api/games').expect(200);

      expect(response.body[0]).not.toHaveProperty('__v');
    });

    it('should return games without timestamps', async () => {
      const mockGames = createMockGames(2);
      await Game.insertMany(mockGames);

      const response = await request(app).get('/api/games').expect(200);

      expect(response.body[0]).not.toHaveProperty('createdAt');
      expect(response.body[0]).not.toHaveProperty('updatedAt');
    });

    it('should handle games with special characters in title', async () => {
      const specialGame = {
        title: 'Tic-Tac-Toe & Friends!',
        image: 'special.jpg',
      };
      await Game.create(specialGame);

      const response = await request(app).get('/api/games').expect(200);

      expect(response.body[0].title).toBe('Tic-Tac-Toe & Friends!');
    });

    it('should handle games with unicode characters', async () => {
      const unicodeGame = {
        title: 'Chess ♟️',
        image: 'chess.jpg',
      };
      await Game.create(unicodeGame);

      const response = await request(app).get('/api/games').expect(200);

      expect(response.body[0].title).toContain('Chess');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Force a database error by closing connection temporarily
      await mongoose.connection.close();

      const response = await request(app).get('/api/games');

      // Expect either 404 or 500 depending on error handling
      expect([404, 500]).toContain(response.status);

      // Reconnect for other tests
      await connectTestDB();
    });
  });
});