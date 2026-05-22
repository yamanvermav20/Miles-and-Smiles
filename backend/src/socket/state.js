/**
 * Socket State Management
 * In-memory storage for rooms, games, and connected users
 * 
 * NOTE: In production, consider Redis for horizontal scaling
 */

// ============================================
// Room Storage
// roomId -> { gameName, players: [], maxPlayers: 2, createdAt }
// ============================================
export const rooms = new Map();

// ============================================
// Game Storage
// roomId -> Game instance (TicTacToe, Chess, etc.)
// ============================================
export const games = new Map();

// ============================================
// Connected Users Tracking
// userId -> { socketId, roomId, role, online, lastSeen }
// ============================================
export const connectedUsers = new Map();

// ============================================
// Socket.IO Instance (for worker access)
// ============================================
let ioInstance = null;

/**
 * Set the Socket.IO instance
 * @param {Server} io - Socket.IO server instance
 */
export function setIO(io) {
  ioInstance = io;
}

/**
 * Get the Socket.IO instance
 * @returns {Server} Socket.IO server instance
 * @throws {Error} If not initialized
 */
export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialized. Call setupSocket() first.");
  }
  return ioInstance;
}

/**
 * Update connected user state
 * @param {string} userId - User ID
 * @param {Object} state - State to update
 */
export function updateUserState(userId, state) {
  const current = connectedUsers.get(userId) || {};
  connectedUsers.set(userId, { ...current, ...state, lastSeen: Date.now() });
}

/**
 * Mark user as online
 * @param {string} userId - User ID
 * @param {string} socketId - Socket ID
 */
export function setUserOnline(userId, socketId) {
  updateUserState(userId, {
    socketId,
    online: true,
  });
}

/**
 * Mark user as offline
 * @param {string} userId - User ID
 */
export function setUserOffline(userId) {
  updateUserState(userId, {
    socketId: null,
    online: false,
  });
}

/**
 * Clean up idle room after all players disconnect
 * @param {string} roomId - Room ID
 * @param {number} delay - Cleanup delay in ms (default: 10 minutes)
 */
export function scheduleRoomCleanup(roomId, delay = 10 * 60 * 1000) {
  setTimeout(() => {
    const room = rooms.get(roomId);
    if (room && room.players.every(p => p.offline)) {
      console.log(`🧹 Cleaning up idle room: ${roomId}`);
      rooms.delete(roomId);
      games.delete(roomId);
    }
  }, delay);
}
