/**
 * Matchmaking Socket Handler
 * Main handler that sets up all matchmaking socket events
 * 
 * @module socket/handlers/matchmaking/matchmakingHandler
 */

import User from "../../../models/User.js";
import { logger } from "../../../config/logger.js";
import {
  joinQueue,
  leaveQueue,
  findMatch,
  getQueuePosition,
} from "../../../services/matchmakingService.js";
import { 
  activeSearches, 
  addActiveSearch, 
  removeActiveSearch,
  getActiveSearch 
} from "./state.js";
import { handleMatchFound, calculateEstimatedWait } from "./matchHandler.js";
import { setupPrivateRoomHandlers } from "./privateRoomHandler.js";

const matchmakingLogger = logger.child({ component: "matchmaking" });

/**
 * Set up matchmaking socket handlers
 * @param {Socket} socket - Socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Map} rooms - Rooms map
 * @param {Map} games - Games map
 * @param {Map} connectedUsers - Connected users map
 */
export function setupMatchmakingHandler(socket, io, rooms, games, connectedUsers) {
  // Set up queue handlers
  setupQueueHandlers(socket, io, rooms, games, connectedUsers);
  
  // Set up private room handlers
  setupPrivateRoomHandlers(socket, io, rooms, connectedUsers);
  
  // Set up status handler
  setupStatusHandler(socket);
  
  // Set up disconnect cleanup
  setupDisconnectHandler(socket);
}

// ─────────────────────────────────────────
// QUEUE HANDLERS
// ─────────────────────────────────────────

function setupQueueHandlers(socket, io, rooms, games, connectedUsers) {
  // Join matchmaking queue
  socket.on("matchmaking:join", async ({ game, mode = "ranked" }) => {
    await handleJoinQueue(socket, io, rooms, games, connectedUsers, game, mode);
  });
  
  // Leave matchmaking queue
  socket.on("matchmaking:leave", async () => {
    await handleLeaveQueue(socket);
  });
}

async function handleJoinQueue(socket, io, rooms, games, connectedUsers, game, mode) {
  try {
    matchmakingLogger.info("Player joining queue", {
      userId: socket.userId,
      game,
      mode,
    });
    
    // Get user's ELO for this game
    const user = await User.findById(socket.userId).lean();
    if (!user) {
      socket.emit("matchmaking:error", { message: "User not found" });
      return;
    }
    
    const gameKey = game.toLowerCase().replace(/\s+/g, "");
    const elo = user.gameStats?.[gameKey]?.elo || 1000;
    
    // Join the queue
    const queueEntry = await joinQueue({
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id,
      game,
      mode,
      elo,
    });
    
    // Track active search
    addActiveSearch(socket.id, {
      game,
      mode,
      queueEntryId: queueEntry._id,
    });
    
    socket.emit("matchmaking:joined", {
      position: await getQueuePosition(socket.userId, game, mode),
      estimatedWait: calculateEstimatedWait(elo, game),
    });
    
    // Try to find a match immediately
    const match = await findMatch(socket.userId, game, mode);
    
    if (match) {
      await handleMatchFound(io, socket, match, rooms, games, connectedUsers);
    }
  } catch (error) {
    matchmakingLogger.error("Error joining matchmaking", {
      userId: socket.userId,
      error: error.message,
    });
    socket.emit("matchmaking:error", { message: "Failed to join queue" });
  }
}

async function handleLeaveQueue(socket) {
  try {
    const search = getActiveSearch(socket.id);
    if (search) {
      await leaveQueue(socket.userId, search.game, search.mode);
      removeActiveSearch(socket.id);
      
      matchmakingLogger.info("Player left queue", {
        userId: socket.userId,
        game: search.game,
      });
    }
    
    socket.emit("matchmaking:left");
  } catch (error) {
    matchmakingLogger.error("Error leaving matchmaking", {
      userId: socket.userId,
      error: error.message,
    });
  }
}

// ─────────────────────────────────────────
// STATUS HANDLER
// ─────────────────────────────────────────

function setupStatusHandler(socket) {
  socket.on("matchmaking:status", async () => {
    const search = getActiveSearch(socket.id);
    
    if (!search) {
      socket.emit("matchmaking:status", { inQueue: false });
      return;
    }
    
    const position = await getQueuePosition(socket.userId, search.game, search.mode);
    const waitTime = Math.floor((Date.now() - search.startedAt) / 1000);
    
    socket.emit("matchmaking:status", {
      inQueue: true,
      game: search.game,
      mode: search.mode,
      position,
      waitTime,
    });
  });
}

// ─────────────────────────────────────────
// DISCONNECT HANDLER
// ─────────────────────────────────────────

function setupDisconnectHandler(socket) {
  socket.on("disconnect", async () => {
    const search = getActiveSearch(socket.id);
    if (search) {
      await leaveQueue(socket.userId, search.game, search.mode);
      removeActiveSearch(socket.id);
    }
  });
}

export default setupMatchmakingHandler;
