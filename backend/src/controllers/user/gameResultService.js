/**
 * Game Result Service
 * Internal service for recording game results
 */

import User from "../../models/User.js";

/**
 * Record a game result (called internally by game handlers)
 * @param {string} userId - User ID
 * @param {Object} gameData - Game result data
 * @returns {Object|null} Updated user or null on error
 */
export async function recordGameResult(userId, gameData) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const { gameName, result, myScore, opponentScore, opponent, opponentId } = gameData;

    // Update overall stats
    user.totalGamesPlayed = (user.totalGamesPlayed || 0) + 1;
    user.lastGamePlayed = new Date();

    // Update win/loss/draw counts and streak
    if (result === "win") {
      user.totalWins = (user.totalWins || 0) + 1;
      user.currentStreak = (user.currentStreak || 0) + 1;
      if (user.currentStreak > (user.longestStreak || 0)) {
        user.longestStreak = user.currentStreak;
      }
    } else if (result === "loss") {
      user.totalLosses = (user.totalLosses || 0) + 1;
      user.currentStreak = 0;
    } else {
      user.totalDraws = (user.totalDraws || 0) + 1;
    }

    // Update per-game stats
    let gameStatsIndex = user.gameStats.findIndex(g => g.gameName === gameName);
    if (gameStatsIndex === -1) {
      user.gameStats.push({
        gameName,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        highestScore: 0,
        totalScore: 0,
        lastPlayed: null,
      });
      gameStatsIndex = user.gameStats.length - 1;
    }

    const gameStats = user.gameStats[gameStatsIndex];
    gameStats.gamesPlayed += 1;
    gameStats.lastPlayed = new Date();
    
    if (result === "win") gameStats.wins += 1;
    else if (result === "loss") gameStats.losses += 1;
    else gameStats.draws += 1;

    if (myScore > gameStats.highestScore) {
      gameStats.highestScore = myScore;
    }
    gameStats.totalScore += myScore;

    // Add to match history (keep last 50)
    user.matchHistory.unshift({
      gameName,
      opponent: opponent || "Unknown",
      opponentId: opponentId || null,
      result,
      myScore,
      opponentScore,
      playedAt: new Date(),
    });

    if (user.matchHistory.length > 50) {
      user.matchHistory = user.matchHistory.slice(0, 50);
    }

    await user.save();
    return user;
  } catch (err) {
    console.error("recordGameResult error:", err);
    return null;
  }
}
