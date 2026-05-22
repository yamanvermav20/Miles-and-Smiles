/**
 * Matchmaking Service
 * Handles player queuing, skill-based matching, and private rooms
 */

import crypto from "crypto";
import MatchmakingQueue from "../models/MatchmakingQueue.js";
import User from "../models/User.js";
import { calculateMatchScore, isWithinMatchmakingRange } from "./eloService.js";

// UUID v4 generator using Node's built-in crypto
const uuidv4 = () => crypto.randomUUID();

/**
 * Matchmaking configuration
 */
const MATCHMAKING_CONFIG = {
  // ELO range expansion over time
  initialEloRange: 100,
  maxEloRange: 500,
  eloRangeExpansionRate: 50, // Expand by 50 ELO every interval
  eloRangeExpansionInterval: 10000, // 10 seconds
  
  // Queue settings
  maxQueueTime: 300000, // 5 minutes
  matchCheckInterval: 2000, // Check for matches every 2 seconds
  
  // Private rooms
  privateRoomCodeLength: 6,
  privateRoomExpiry: 600000, // 10 minutes
};

// In-memory store for private room codes (use Redis in production)
const privateRooms = new Map();

/**
 * Generate a unique private room code
 * @returns {string} Room code
 */
export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded confusing chars
  let code = "";
  for (let i = 0; i < MATCHMAKING_CONFIG.privateRoomCodeLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a private room
 * @param {Object} options - Room options
 * @returns {Object} Private room info
 */
export function createPrivateRoom({ game, hostId, hostUsername, maxPlayers = 2, settings = {} }) {
  let code;
  let attempts = 0;
  
  // Generate unique code
  do {
    code = generateRoomCode();
    attempts++;
  } while (privateRooms.has(code) && attempts < 10);
  
  const roomId = `private-${uuidv4().slice(0, 8)}`;
  
  const room = {
    code,
    roomId,
    game,
    hostId,
    hostUsername,
    maxPlayers,
    settings,
    players: [{
      userId: hostId,
      username: hostUsername,
      ready: false,
    }],
    status: "waiting",
    createdAt: Date.now(),
    expiresAt: Date.now() + MATCHMAKING_CONFIG.privateRoomExpiry,
  };
  
  privateRooms.set(code, room);
  
  // Auto-cleanup expired rooms
  setTimeout(() => {
    if (privateRooms.get(code)?.status === "waiting") {
      privateRooms.delete(code);
    }
  }, MATCHMAKING_CONFIG.privateRoomExpiry);
  
  return room;
}

/**
 * Join a private room by code
 * @param {string} code - Room code
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @returns {Object} Result { success, room, error }
 */
export function joinPrivateRoom(code, userId, username) {
  const room = privateRooms.get(code.toUpperCase());
  
  if (!room) {
    return { success: false, error: "Room not found or expired" };
  }
  
  if (room.status !== "waiting") {
    return { success: false, error: "Room is no longer accepting players" };
  }
  
  if (room.players.length >= room.maxPlayers) {
    return { success: false, error: "Room is full" };
  }
  
  if (room.players.some(p => p.userId === userId)) {
    return { success: false, error: "Already in this room" };
  }
  
  room.players.push({
    userId,
    username,
    ready: false,
  });
  
  return { success: true, room };
}

/**
 * Get private room by code
 * @param {string} code - Room code
 * @returns {Object|null} Room or null
 */
export function getPrivateRoom(code) {
  return privateRooms.get(code.toUpperCase()) || null;
}

/**
 * Delete private room
 * @param {string} code - Room code
 */
export function deletePrivateRoom(code) {
  privateRooms.delete(code.toUpperCase());
}

/**
 * Mark private room as started
 * @param {string} code - Room code
 */
export function startPrivateRoom(code) {
  const room = privateRooms.get(code.toUpperCase());
  if (room) {
    room.status = "started";
  }
}

/**
 * Add player to matchmaking queue
 * @param {Object} options - Queue options
 * @returns {Object} Queue entry
 */
export async function joinQueue({
  userId,
  username,
  socketId,
  game,
  queueType = "casual",
}) {
  // Get user's ELO for this game
  const user = await User.findById(userId);
  let elo = 1000;
  
  if (user) {
    const gameStats = user.gameStats?.find(g => g.gameName === game);
    elo = gameStats?.elo || 1000;
  }
  
  // Remove any existing queue entry for this user
  await MatchmakingQueue.deleteMany({ userId });
  
  // Get recent opponents to avoid
  const recentOpponents = user?.matchHistory
    ?.slice(-10)
    .map(m => m.opponentId)
    .filter(Boolean) || [];
  
  // Create queue entry
  const queueEntry = new MatchmakingQueue({
    userId,
    username,
    socketId,
    game,
    queueType,
    elo,
    eloRangeMin: MATCHMAKING_CONFIG.initialEloRange,
    eloRangeMax: MATCHMAKING_CONFIG.initialEloRange,
    preferences: {
      avoidRecent: true,
      recentOpponents,
    },
  });
  
  await queueEntry.save();
  
  return queueEntry;
}

/**
 * Remove player from queue
 * @param {string} userId - User ID
 */
export async function leaveQueue(userId) {
  await MatchmakingQueue.deleteMany({ userId });
}

/**
 * Find a match for players in queue
 * @param {string} game - Game to match for
 * @param {string} queueType - Queue type
 * @returns {Object|null} Match result or null
 */
export async function findMatch(game, queueType = "casual") {
  // Get all waiting players for this game/queue
  const waitingPlayers = await MatchmakingQueue.find({
    game,
    queueType,
    status: "waiting",
  }).sort({ joinedAt: 1 }); // Oldest first
  
  if (waitingPlayers.length < 2) return null;
  
  // Expand ELO ranges for players who have been waiting
  for (const player of waitingPlayers) {
    const waitTime = Date.now() - new Date(player.joinedAt).getTime();
    const expansions = Math.floor(waitTime / MATCHMAKING_CONFIG.eloRangeExpansionInterval);
    
    player.eloRangeMin = Math.min(
      MATCHMAKING_CONFIG.maxEloRange,
      MATCHMAKING_CONFIG.initialEloRange + expansions * MATCHMAKING_CONFIG.eloRangeExpansionRate
    );
    player.eloRangeMax = player.eloRangeMin;
  }
  
  // Find best match
  let bestMatch = null;
  let bestScore = Infinity;
  
  for (let i = 0; i < waitingPlayers.length; i++) {
    for (let j = i + 1; j < waitingPlayers.length; j++) {
      const player1 = waitingPlayers[i];
      const player2 = waitingPlayers[j];
      
      // Check if within each other's ELO range
      const eloDiff = Math.abs(player1.elo - player2.elo);
      const maxAllowedDiff = Math.max(player1.eloRangeMax, player2.eloRangeMax);
      
      if (eloDiff > maxAllowedDiff) continue;
      
      // Check if they recently played each other
      if (
        player1.preferences?.avoidRecent &&
        player1.preferences?.recentOpponents?.some(
          id => id.toString() === player2.userId.toString()
        )
      ) {
        // Add penalty but don't exclude
        continue;
      }
      
      // Calculate match score
      const score = calculateMatchScore(player1, player2);
      
      if (score < bestScore) {
        bestScore = score;
        bestMatch = { player1, player2 };
      }
    }
  }
  
  if (!bestMatch) return null;
  
  // Mark both as matching
  await MatchmakingQueue.updateMany(
    { _id: { $in: [bestMatch.player1._id, bestMatch.player2._id] } },
    { status: "matching" }
  );
  
  // Generate room ID
  const roomId = `${game.toLowerCase().replace(/\s+/g, "-")}-${uuidv4().slice(0, 8)}`;
  
  // Update with match info
  await MatchmakingQueue.updateMany(
    { _id: { $in: [bestMatch.player1._id, bestMatch.player2._id] } },
    {
      status: "matched",
      matchedRoomId: roomId,
    }
  );
  
  // Update player1 matchedWith
  await MatchmakingQueue.findByIdAndUpdate(bestMatch.player1._id, {
    matchedWith: bestMatch.player2.userId,
  });
  
  // Update player2 matchedWith  
  await MatchmakingQueue.findByIdAndUpdate(bestMatch.player2._id, {
    matchedWith: bestMatch.player1.userId,
  });
  
  return {
    roomId,
    game,
    queueType,
    players: [
      {
        oderId: bestMatch.player1.userId,
        username: bestMatch.player1.username,
        socketId: bestMatch.player1.socketId,
        elo: bestMatch.player1.elo,
      },
      {
        oderId: bestMatch.player2.userId,
        username: bestMatch.player2.username,
        socketId: bestMatch.player2.socketId,
        elo: bestMatch.player2.elo,
      },
    ],
    eloDifference: Math.abs(bestMatch.player1.elo - bestMatch.player2.elo),
  };
}

/**
 * Get queue statistics
 * @param {string} game - Game to get stats for
 * @returns {Object} Queue stats
 */
export async function getQueueStats(game = null) {
  const query = { status: "waiting" };
  if (game) query.game = game;
  
  const stats = await MatchmakingQueue.aggregate([
    { $match: query },
    {
      $group: {
        _id: { game: "$game", queueType: "$queueType" },
        count: { $sum: 1 },
        avgElo: { $avg: "$elo" },
        avgWaitTime: {
          $avg: {
            $subtract: [new Date(), "$joinedAt"],
          },
        },
      },
    },
  ]);
  
  return stats.reduce((acc, s) => {
    const key = `${s._id.game}-${s._id.queueType}`;
    acc[key] = {
      game: s._id.game,
      queueType: s._id.queueType,
      playersWaiting: s.count,
      averageElo: Math.round(s.avgElo),
      averageWaitTime: Math.round(s.avgWaitTime / 1000), // seconds
    };
    return acc;
  }, {});
}

/**
 * Cleanup stale queue entries
 */
export async function cleanupQueue() {
  const cutoff = new Date(Date.now() - MATCHMAKING_CONFIG.maxQueueTime);
  await MatchmakingQueue.deleteMany({
    joinedAt: { $lt: cutoff },
    status: "waiting",
  });
}

/**
 * Get player's position in queue
 * @param {string} userId - User ID
 * @param {string} game - Game name
 * @param {string} queueType - Queue type
 * @returns {number} Position in queue (1-indexed) or 0 if not in queue
 */
export async function getQueuePosition(userId, game, queueType = "casual") {
  // Get all waiting players for this game/queue, sorted by join time
  const waitingPlayers = await MatchmakingQueue.find({
    game,
    queueType,
    status: "waiting",
  })
    .sort({ joinedAt: 1 })
    .select("userId")
    .lean();
  
  const index = waitingPlayers.findIndex(
    p => p.userId.toString() === userId.toString()
  );
  
  return index === -1 ? 0 : index + 1;
}

export default {
  generateRoomCode,
  createPrivateRoom,
  joinPrivateRoom,
  getPrivateRoom,
  deletePrivateRoom,
  startPrivateRoom,
  joinQueue,
  leaveQueue,
  findMatch,
  getQueueStats,
  cleanupQueue,
  getQueuePosition,
  MATCHMAKING_CONFIG,
};
