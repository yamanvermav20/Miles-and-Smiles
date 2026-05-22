/**
 * Chess Game End Processor
 * Handles end-of-game stat updates, ELO, XP
 * 
 * @module socket/handlers/chess/gameEndProcessor
 */

import User from "../../../models/User.js";
import { calculateMatchEloChanges } from "../../../services/eloService.js";
import { calculateGameXp } from "../../../services/xpService.js";
import { checkAchievements } from "../../../services/achievementService.js";

/**
 * Process game end - update stats, ELO, XP
 * @param {Object} game - Chess game instance
 * @param {Object} room - Room object
 * @param {string|null} winnerId - Winner's user ID (null for draw)
 * @param {string} reason - End reason (checkmate/stalemate/draw/etc)
 */
export async function processChessGameEnd(game, room, winnerId, reason) {
  const isRanked = room?.matchType === "ranked";
  const isDraw = !winnerId;
  
  const whitePlayer = game.players.white;
  const blackPlayer = game.players.black;
  
  try {
    // Get both users from database
    const [whiteUser, blackUser] = await Promise.all([
      User.findById(whitePlayer.userId),
      User.findById(blackPlayer.userId),
    ]);
    
    if (!whiteUser || !blackUser) return;
    
    // Get or create game stats for both players
    const whiteStats = getOrCreateStats(whiteUser);
    const blackStats = getOrCreateStats(blackUser);
    
    // Determine game results
    const whiteResult = getResult(isDraw, winnerId, whitePlayer.userId);
    const blackResult = getResult(isDraw, winnerId, blackPlayer.userId);
    
    // Calculate and apply ELO changes for ranked games
    if (isRanked) {
      applyEloChanges(whiteStats, blackStats, isDraw, winnerId, whitePlayer);
    }
    
    // Update game statistics
    updateStats(whiteStats, whiteResult);
    updateStats(blackStats, blackResult);
    
    // Update overall user statistics
    updateOverallStats(whiteUser, whiteResult);
    updateOverallStats(blackUser, blackResult);
    
    // Calculate and apply XP
    const whiteXp = calculateXpReward(whiteStats, whiteResult, isRanked);
    const blackXp = calculateXpReward(blackStats, blackResult, isRanked);
    
    whiteUser.xp += whiteXp.total;
    blackUser.xp += blackXp.total;
    
    // Add match history
    addMatchHistory(whiteUser, blackUser, whiteResult, whiteStats.lastEloChange, room);
    addMatchHistory(blackUser, whiteUser, blackResult, blackStats.lastEloChange, room);
    
    // Save users
    await Promise.all([whiteUser.save(), blackUser.save()]);
    
    // Check achievements asynchronously
    await Promise.all([
      checkAchievements(whiteUser._id, whiteUser),
      checkAchievements(blackUser._id, blackUser),
    ]);
    
  } catch (error) {
    console.error("Error processing chess game end:", error);
  }
}

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

/**
 * Get or create Chess stats for a user
 */
function getOrCreateStats(user) {
  let stats = user.gameStats.find(s => s.gameName === "Chess");
  if (!stats) {
    stats = { 
      gameName: "Chess", 
      gamesPlayed: 0, 
      wins: 0, 
      losses: 0, 
      draws: 0, 
      elo: 1000, 
      peakElo: 1000,
      rankedGamesPlayed: 0,
      currentWinStreak: 0,
      longestWinStreak: 0,
    };
    user.gameStats.push(stats);
  }
  return stats;
}

/**
 * Determine result string from game outcome
 */
function getResult(isDraw, winnerId, playerId) {
  if (isDraw) return "draw";
  return winnerId === playerId ? "win" : "loss";
}

/**
 * Apply ELO changes for ranked games
 */
function applyEloChanges(whiteStats, blackStats, isDraw, winnerId, whitePlayer) {
  const eloResult = isDraw ? "draw" : (winnerId === whitePlayer.userId ? "player1" : "player2");
  const eloChanges = calculateMatchEloChanges(
    { elo: whiteStats.elo, gamesPlayed: whiteStats.rankedGamesPlayed },
    { elo: blackStats.elo, gamesPlayed: blackStats.rankedGamesPlayed },
    eloResult
  );
  
  // Store ELO changes for match history
  whiteStats.lastEloChange = eloChanges.player1.change;
  blackStats.lastEloChange = eloChanges.player2.change;
  
  // Apply new ELO ratings
  whiteStats.elo = eloChanges.player1.newElo;
  blackStats.elo = eloChanges.player2.newElo;
  whiteStats.peakElo = Math.max(whiteStats.peakElo, whiteStats.elo);
  blackStats.peakElo = Math.max(blackStats.peakElo, blackStats.elo);
  whiteStats.rankedGamesPlayed++;
  blackStats.rankedGamesPlayed++;
}

/**
 * Update game statistics
 */
function updateStats(stats, result) {
  stats.gamesPlayed++;
  
  if (result === "win") {
    stats.wins++;
    stats.currentWinStreak++;
  } else if (result === "loss") {
    stats.losses++;
    stats.currentWinStreak = 0;
  } else {
    stats.draws++;
  }
  
  stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentWinStreak);
  stats.lastPlayed = new Date();
}

/**
 * Update overall user statistics
 */
function updateOverallStats(user, result) {
  user.totalGamesPlayed++;
  
  if (result === "win") user.totalWins++;
  else if (result === "loss") user.totalLosses++;
  else user.totalDraws++;
}

/**
 * Calculate XP reward for game result
 */
function calculateXpReward(stats, result, isRanked) {
  return calculateGameXp({
    result,
    isRanked,
    winStreak: stats.currentWinStreak,
    isFirstGame: stats.gamesPlayed === 1,
    isFirstWin: stats.wins === 1 && result === "win",
  });
}

/**
 * Add match to user's history
 */
function addMatchHistory(user, opponent, result, eloChange, room) {
  user.matchHistory.unshift({
    gameName: "Chess",
    opponent: opponent.username,
    opponentId: opponent._id,
    result,
    matchType: room?.matchType || "casual",
    eloChange: eloChange || 0,
    playedAt: new Date(),
  });
  
  // Keep only last 50 matches
  if (user.matchHistory.length > 50) {
    user.matchHistory = user.matchHistory.slice(0, 50);
  }
}
