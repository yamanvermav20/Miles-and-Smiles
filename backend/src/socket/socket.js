/**
 * Socket.IO Main Entry Point
 * Sets up Socket.IO server and registers all event handlers
 * 
 * This file orchestrates the socket connection lifecycle:
 * 1. Authentication via middleware
 * 2. Handler registration for each feature
 * 3. Reconnection support
 * 4. Graceful disconnection
 */

import { Server } from "socket.io";

// State management
import { 
  rooms, 
  games, 
  connectedUsers, 
  setIO, 
  getIO,
  setUserOnline 
} from "./state.js";

// Game routing
import { startGame, handlePlayerLeave } from "./gameRouter.js";

// Connection handlers
import { handleRejoinRoom } from "./reconnectHandler.js";
import { handleDisconnect } from "./disconnectHandler.js";

// Feature handlers
import { setupChatHandler } from "./handlers/chatHandler.js";
import { setupDMHandler } from "./handlers/dmHandler.js";
import { setupRoomHandler } from "./handlers/roomHandler.js";
import { setupTicTacToeHandler } from "./handlers/ticTacToeHandler.js";
import { setupDotsAndBoxesHandler } from "./handlers/dotsAndBoxesHandler.js";
import { setupSnakesAndLaddersHandler } from "./handlers/snakesAndLaddersHandler.js";
import { setupMemoryHandler } from "./handlers/memoryHandler.js";
import { setupChessHandler } from "./handlers/chessHandler.js";
import { setupNotificationHandler } from "./handlers/notificationHandler.js";
import { setupMatchmakingHandler } from "./handlers/matchmakingHandler.js";

// Middleware
import authenticateSocket from "../middlewares/socketMiddleware.js";

// ============================================
// Environment Validation
// ============================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is not set");
  process.exit(1);
}

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export default function setupSocket(server) {
  // ============================================
  // CREATE SOCKET.IO SERVER
  // ============================================
  const io = new Server(server, {
    cors: {
      origin: "*", // TODO: Restrict in production
      methods: ["GET", "POST"],
    },
  });

  // Store for worker access
  setIO(io);

  // ============================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================
  io.use(authenticateSocket);

  // ============================================
  // CONNECTION HANDLER
  // ============================================
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.username} (${socket.userId})`);

    // Join personal notification room
    socket.join(socket.userId);

    // Track user state
    setUserOnline(socket.userId, socket.id);
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      roomId: socket.currentRoom || null,
      role: null,
      online: true,
      lastSeen: Date.now(),
    });

    // ─────────────────────────────────────────
    // REGISTER FEATURE HANDLERS
    // ─────────────────────────────────────────
    
    // Room management (create, join, leave)
    setupRoomHandler(
      socket,
      io,
      rooms,
      // onGameStart callback
      (roomId, room) => startGame(io, roomId, room, games),
      // onPlayerLeave callback
      (socket, roomId) => handlePlayerLeave(socket, roomId, games, rooms, io),
      connectedUsers
    );

    // Chat (room-based)
    setupChatHandler(socket, io);

    // Direct messages
    setupDMHandler(socket, io);

    // Game handlers
    setupTicTacToeHandler(socket, io, games, rooms, connectedUsers);
    setupDotsAndBoxesHandler(socket, io, games, rooms, connectedUsers);
    setupSnakesAndLaddersHandler(socket, io, games, rooms, connectedUsers);
    setupMemoryHandler(socket, io, games, rooms, connectedUsers);
    setupChessHandler(socket, io, games, rooms, connectedUsers);

    // Matchmaking
    setupMatchmakingHandler(socket, io, rooms, games, connectedUsers);

    // Notifications
    setupNotificationHandler(socket, io);

    // ─────────────────────────────────────────
    // RECONNECTION HANDLER
    // ─────────────────────────────────────────
    socket.on("rejoin-room", (data) => handleRejoinRoom(socket, data));

    // ─────────────────────────────────────────
    // DISCONNECTION HANDLER
    // ─────────────────────────────────────────
    socket.on("disconnect", (reason) => handleDisconnect(socket, reason));
  });

  return io;
}

// Re-export getIO for worker access
export { getIO } from "./state.js";
