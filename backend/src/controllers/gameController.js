/**
 * Game Controller
 * Handles game-related operations with Redis caching
 */

import Game from "../models/Game.js";
import redisClient from "../config/redis.js";

// Cache configuration
const GAMES_CACHE_KEY = "games:all";
const CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Get all available games
 * Uses Redis cache for performance
 * @route GET /api/games
 */
export const getAllGames = async (req, res) => {
  try {
    // Try Redis cache first
    const cached = await redisClient.get(GAMES_CACHE_KEY);
    if (cached) {
      console.log('✅ Games from Redis cache');
      return res.status(200).json(JSON.parse(cached));
    }

    // Fetch from database
    const games = await Game.find();
    if (!games || games.length === 0) {
      return res.status(404).json({ message: "No games found" });
    }

    // Store in cache for next request
    await redisClient.setEx(GAMES_CACHE_KEY, CACHE_TTL, JSON.stringify(games));
    return res.status(200).json(games);
  } catch (error) {
    console.error("❌ Error fetching games:", error);
    return res.status(500).json({ message: "Error while fetching games" });
  }
};

/**
 * Get most favorited games (for stats/leaderboard)
 * @route GET /api/games/popular
 */
export const getMostFavoritedGames = async (req, res) => {
  try {
    // Get favorite counts from Redis
    const keys = await redisClient.keys('game:*:favorite_count');
    
    const gamesWithCounts = await Promise.all(
      keys.map(async (key) => {
        const count = await redisClient.get(key);
        const gameTitle = key.split(':')[1];
        return { gameTitle, count: parseInt(count) || 0 };
      })
    );

    // Sort by count descending, return top 10
    gamesWithCounts.sort((a, b) => b.count - a.count);
    return res.status(200).json({ mostFavorited: gamesWithCounts.slice(0, 10) });
  } catch (error) {
    console.error("❌ Error fetching popular games:", error);
    return res.status(500).json({ message: "Error fetching statistics" });
  }
};

