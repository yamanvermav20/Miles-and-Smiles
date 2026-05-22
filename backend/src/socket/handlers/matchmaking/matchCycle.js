/**
 * Match Cycle
 * Background task for periodic match finding
 * 
 * @module socket/handlers/matchmaking/matchCycle
 */

import { findMatch } from "../../../services/matchmakingService.js";
import { activeSearches } from "./state.js";
import { handleMatchFound } from "./matchHandler.js";

/**
 * Background task to periodically find matches
 * Should be called at regular intervals (e.g., every 5 seconds)
 * 
 * @param {Server} io - Socket.IO server instance
 * @param {Map} rooms - Rooms map
 * @param {Map} games - Games map
 * @param {Map} connectedUsers - Connected users map
 */
export async function runMatchmakingCycle(io, rooms, games, connectedUsers) {
  const searchesByGame = new Map();
  
  // Group active searches by game
  for (const [socketId, search] of activeSearches) {
    const key = `${search.game}:${search.mode}`;
    if (!searchesByGame.has(key)) {
      searchesByGame.set(key, []);
    }
    searchesByGame.get(key).push({ socketId, ...search });
  }
  
  // Try to find matches for each game/mode combo
  for (const [key, searches] of searchesByGame) {
    // Need at least 2 players to make a match
    if (searches.length < 2) continue;
    
    const [game, mode] = key.split(":");
    
    // Try to find matches for each player in queue
    for (const search of searches) {
      const socket = io.sockets.sockets.get(search.socketId);
      if (!socket) continue;
      
      const match = await findMatch(socket.userId, game, mode);
      if (match) {
        await handleMatchFound(io, socket, match, rooms, games, connectedUsers);
      }
    }
  }
}

/**
 * Start the matchmaking cycle
 * @param {Server} io - Socket.IO server
 * @param {Map} rooms - Rooms map
 * @param {Map} games - Games map
 * @param {Map} connectedUsers - Connected users map
 * @param {number} interval - Cycle interval in ms (default 5000)
 * @returns {NodeJS.Timer} Timer ID for cleanup
 */
export function startMatchmakingCycle(io, rooms, games, connectedUsers, interval = 5000) {
  return setInterval(() => {
    runMatchmakingCycle(io, rooms, games, connectedUsers).catch(err => {
      console.error("Matchmaking cycle error:", err);
    });
  }, interval);
}
