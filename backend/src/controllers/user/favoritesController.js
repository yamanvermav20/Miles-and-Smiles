/**
 * Favorites Controller
 * Handles user game favorites: get and toggle
 */

import User from "../../models/User.js";
import redisClient from "../../config/redis.js";

// Cache TTL - 5 seconds for favorites
const CACHE_TTL = 5;

/**
 * Get user's favorite games
 * @route GET /api/user/favorites
 */
export async function getFavorites(req, res) {
  try {
    const userId = req.user.id;
    const cacheKey = `user:${userId}:favorites`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('fetched favorites from Redis cache');
      return res.status(200).json({ 
        favouriteGames: JSON.parse(cached),
        cached: true 
      });
    }

    // Fetch from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const favouriteGames = user.favouriteGames || [];

    // Store in cache
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(favouriteGames));
    console.log('fetched favorites from MongoDB and cached');

    return res.status(200).json({ favouriteGames });
  } catch (err) {
    console.error("getFavorites error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Toggle a game in favorites (add or remove)
 * @route POST /api/user/favorites
 */
export async function toggleFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { gameTitle } = req.body;

    if (!gameTitle) {
      return res.status(400).json({ message: "Game title is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const favouriteGames = user.favouriteGames || [];
    const gameIndex = favouriteGames.indexOf(gameTitle);

    // Toggle: add if not exists, remove if exists
    let action;
    if (gameIndex > -1) {
      favouriteGames.splice(gameIndex, 1);
      action = "removed";
    } else {
      favouriteGames.push(gameTitle);
      action = "added";
    }

    user.favouriteGames = favouriteGames;
    await user.save();

    // Update cache
    const cacheKey = `user:${userId}:favorites`;
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(favouriteGames));

    // Update game favorite count in Redis
    const gameCountKey = `game:${gameTitle}:favorite_count`;
    if (action === "added") {
      await redisClient.incr(gameCountKey);
    } else {
      await redisClient.decr(gameCountKey);
    }

    return res.status(200).json({
      message: action === "removed" 
        ? "Game removed from favorites"
        : "Game added to favorites",
      favouriteGames: user.favouriteGames,
    });
  } catch (err) {
    console.error("toggleFavorite error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
