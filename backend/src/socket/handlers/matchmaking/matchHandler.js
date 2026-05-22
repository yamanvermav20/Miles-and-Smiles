/**
 * Match Handler
 * Handles match found events and room creation
 * 
 * @module socket/handlers/matchmaking/matchHandler
 */

import { logger } from "../../../config/logger.js";
import { activeSearches } from "./state.js";

const matchmakingLogger = logger.child({ component: "matchmaking" });

/**
 * Handle when a match is found between two players
 * @param {Server} io - Socket.IO server instance
 * @param {Socket} socket - Socket that triggered the match
 * @param {Object} match - Match data from matchmaking service
 * @param {Map} rooms - Rooms map
 * @param {Map} games - Games map
 * @param {Map} connectedUsers - Connected users map
 */
export async function handleMatchFound(io, socket, match, rooms, games, connectedUsers) {
  const { player1, player2, game, mode, roomId } = match;
  
  matchmakingLogger.info("Match found", {
    roomId,
    game,
    player1: player1.userId,
    player2: player2.userId,
  });
  
  // Create room
  rooms.set(roomId, {
    gameName: game,
    players: [
      { id: player1.userId, socketId: player1.socketId, username: player1.username },
      { id: player2.userId, socketId: player2.socketId, username: player2.username },
    ],
    maxPlayers: 2,
    isRanked: mode === "ranked",
  });
  
  // Get both sockets
  const socket1 = io.sockets.sockets.get(player1.socketId);
  const socket2 = io.sockets.sockets.get(player2.socketId);
  
  // Join both to room
  [socket1, socket2].forEach((s) => {
    if (s) {
      s.join(roomId);
      s.currentRoom = roomId;
      activeSearches.delete(s.id);
    }
  });
  
  // Update connected users
  [player1, player2].forEach((p) => {
    connectedUsers.set(p.userId, {
      socketId: p.socketId,
      roomId,
      role: null,
      online: true,
      lastSeen: Date.now(),
    });
  });
  
  // Notify both players
  io.to(roomId).emit("matchmaking:matchFound", {
    roomId,
    players: [
      { id: player1.userId, username: player1.username, elo: player1.elo },
      { id: player2.userId, username: player2.username, elo: player2.elo },
    ],
    game,
    mode,
    isRanked: mode === "ranked",
  });
}

/**
 * Calculate estimated wait time based on ELO and game population
 * @param {number} elo - Player's ELO rating
 * @param {string} game - Game name
 * @returns {number} Estimated wait time in seconds
 */
export function calculateEstimatedWait(elo, game) {
  // Base wait time in seconds
  let baseWait = 15;
  
  // Higher or lower ELO = longer wait (fewer players at extremes)
  const eloDeviation = Math.abs(elo - 1200);
  const eloMultiplier = 1 + (eloDeviation / 500);
  
  // Some games are more popular
  const gamePopularity = {
    "Tic Tac Toe": 0.8,
    "Chess": 1.0,
    "Memory": 1.2,
    "Dots and Boxes": 1.3,
    "Snakes and Ladders": 1.1,
  };
  
  const popularityMultiplier = gamePopularity[game] || 1.0;
  
  return Math.floor(baseWait * eloMultiplier * popularityMultiplier);
}
