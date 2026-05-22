/**
 * Disconnect Handler
 * Handles player disconnection gracefully
 */

import { rooms, games, connectedUsers, scheduleRoomCleanup } from "./state.js";

/**
 * Handle socket disconnect event
 * Marks player as offline but preserves game state for reconnection
 * 
 * @param {Socket} socket - Disconnected socket
 * @param {string} reason - Disconnect reason
 */
export function handleDisconnect(socket, reason) {
  try {
    console.log(
      `User disconnected: ${socket.username} (${socket.userId}) - ${reason}`
    );

    // Leave personal notification room
    socket.leave(socket.userId);

    // ─────────────────────────────────────────────
    // UPDATE CONNECTED USERS
    // Mark offline but keep room info for reconnect
    // ─────────────────────────────────────────────
    const existing = connectedUsers.get(socket.userId) || {};
    connectedUsers.set(socket.userId, {
      socketId: null,
      roomId: existing.roomId || socket.currentRoom || null,
      role: existing.role || null,
      online: false,
      lastSeen: Date.now(),
    });

    // ─────────────────────────────────────────────
    // UPDATE ROOM STATE
    // Mark player as offline but don't remove them
    // ─────────────────────────────────────────────
    if (socket.currentRoom) {
      const room = rooms.get(socket.currentRoom);
      
      if (room) {
        const player = room.players.find((p) => p.id === socket.userId);
        
        if (player) {
          player.offline = true;
          player.socketId = null;
          
          // Notify remaining players
          socket.to(socket.currentRoom).emit("player-offline", {
            player: { id: socket.userId, username: socket.username },
            players: room.players,
          });
        }

        // ─────────────────────────────────────────
        // SCHEDULE CLEANUP
        // If all players offline, clean up after delay
        // This allows time for reconnection
        // ─────────────────────────────────────────
        const allOffline = room.players.every((p) => p.offline);
        if (allOffline) {
          scheduleRoomCleanup(socket.currentRoom);
        }
      }
    }
  } catch (err) {
    console.error("Error handling disconnect:", err);
  }
}
