import Game from '../../../src/models/Game.js';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../setup/testDb.js';
import { createMockGame } from '../../fixtures/index.js';

describe('Game Model Unit Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('Game Creation', () => {
    it('should create a game with valid data', async () => {
      const gameData = createMockGame({ title: 'Tic Tac Toe' });
      const game = new Game(gameData);
      const savedGame = await game.save();

      expect(savedGame._id).toBeDefined();
      expect(savedGame.title).toBe('Tic Tac Toe');
      expect(savedGame.image).toBe('https://example.com/game.jpg');
    });

    it('should fail to create game without title', async () => {
      const game = new Game({ image: 'https://example.com/game.jpg' });
      await expect(game.save()).rejects.toThrow();
    });

    it('should fail to create game without image', async () => {
      const game = new Game({ title: 'Test Game' });
      await expect(game.save()).rejects.toThrow();
    });

    it('should trim whitespace from title', async () => {
      const gameData = createMockGame({ title: '  Spaced Game  ' });
      const game = await new Game(gameData).save();
      expect(game.title).toBe('Spaced Game');
    });
  });

  describe('Game Query Operations', () => {
    beforeEach(async () => {
      // Create multiple games for testing
      const games = [
        createMockGame({ title: 'Chess', image: 'chess.jpg' }),
        createMockGame({ title: 'Checkers', image: 'checkers.jpg' }),
        createMockGame({ title: 'Backgammon', image: 'backgammon.jpg' }),
      ];

      await Game.insertMany(games);
    });

    it('should find all games', async () => {
      const games = await Game.find();
      expect(games).toHaveLength(3);
    });

    it('should find game by title', async () => {
      const game = await Game.findOne({ title: 'Chess' });
      expect(game).toBeDefined();
      expect(game.title).toBe('Chess');
    });

    it('should find game by partial title match', async () => {
      const games = await Game.find({ title: /Check/i });
      expect(games).toHaveLength(1);
      expect(games[0].title).toBe('Checkers');
    });

    it('should return null for non-existent game', async () => {
      const game = await Game.findOne({ title: 'NonExistent' });
      expect(game).toBeNull();
    });
  });

  describe('Game Update Operations', () => {
    it('should update game title', async () => {
      const gameData = createMockGame({ title: 'Old Title' });
      const game = await new Game(gameData).save();

      game.title = 'New Title';
      const updatedGame = await game.save();

      expect(updatedGame.title).toBe('New Title');
    });

    it('should update game image', async () => {
      const gameData = createMockGame();
      const game = await new Game(gameData).save();

      game.image = 'https://example.com/new-image.jpg';
      const updatedGame = await game.save();

      expect(updatedGame.image).toBe('https://example.com/new-image.jpg');
    });
  });

  describe('Game Delete Operations', () => {
    it('should delete a game', async () => {
      const gameData = createMockGame();
      const game = await new Game(gameData).save();
      const gameId = game._id;

      await Game.findByIdAndDelete(gameId);
      const deletedGame = await Game.findById(gameId);

      expect(deletedGame).toBeNull();
    });

    it('should delete multiple games', async () => {
      const games = [
        createMockGame({ title: 'Game 1' }),
        createMockGame({ title: 'Game 2' }),
        createMockGame({ title: 'Game 3' }),
      ];

      await Game.insertMany(games);
      await Game.deleteMany({ title: /Game/i });

      const remainingGames = await Game.find();
      expect(remainingGames).toHaveLength(0);
    });
  });

  describe('Game Schema Validation', () => {
    it('should not have versionKey', async () => {
      const gameData = createMockGame();
      const game = await new Game(gameData).save();
      expect(game.__v).toBeUndefined();
    });

    it('should not have timestamps', async () => {
      const gameData = createMockGame();
      const game = await new Game(gameData).save();
      expect(game.createdAt).toBeUndefined();
      expect(game.updatedAt).toBeUndefined();
    });
  });
});