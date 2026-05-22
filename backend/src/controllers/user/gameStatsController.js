/**
 * Game Stats Controller
 * Handles user game statistics and match history
 */

import User from "../../models/User.js";

/**
 * Get overall game statistics
 * @route GET /api/user/stats
 */
export async function getGameStats(req, res) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate win percentage
    const winPercentage = user.totalGamesPlayed > 0 
      ? Math.round((user.totalWins / user.totalGamesPlayed) * 100) 
      : 0;

    return res.json({
      totalGamesPlayed: user.totalGamesPlayed || 0,
      totalWins: user.totalWins || 0,
      totalLosses: user.totalLosses || 0,
      totalDraws: user.totalDraws || 0,
      winPercentage,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastGamePlayed: user.lastGamePlayed,
      gameStats: user.gameStats || [],
      matchHistory: (user.matchHistory || []).slice(0, 20),
    });
  } catch (err) {
    console.error("getGameStats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get match history for a specific game
 * @route GET /api/user/history/:gameName
 */
export async function getGameHistory(req, res) {
  try {
    const { gameName } = req.params;
    const user = await User.findById(req.user.id).lean();
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter history by game name
    const gameHistory = (user.matchHistory || [])
      .filter(match => match.gameName === gameName)
      .slice(0, 20);

    // Get game-specific stats
    const gameStats = (user.gameStats || []).find(
      g => g.gameName === gameName
    ) || {
      gameName,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      highestScore: 0,
      totalScore: 0,
    };

    // Calculate win percentage
    const winPercentage = gameStats.gamesPlayed > 0 
      ? Math.round((gameStats.wins / gameStats.gamesPlayed) * 100) 
      : 0;

    return res.json({
      gameName,
      stats: { ...gameStats, winPercentage },
      history: gameHistory,
    });
  } catch (err) {
    console.error("getGameHistory error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
