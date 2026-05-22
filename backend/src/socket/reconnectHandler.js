/**
 * Reconnection Handler
 * Handles player reconnection to rooms and games
 */

import { rooms, games, connectedUsers } from "./state.js";

/**
 * Handle rejoin-room event
 * Restores player state when reconnecting to a game
 * 
 * @param {Socket} socket - Socket instance
 * @param {Object} data - Event data with roomId
 */
export function handleRejoinRoom(socket, data) {
  const { roomId } = data;
  
  try {
    // ─────────────────────────────────────────────
    // VALIDATION
    // Use socket's authenticated userId, not client data
    // ─────────────────────────────────────────────
    const userId = socket.userId;
    if (!userId) {
      socket.emit("rejoin-failed", { message: "Unauthenticated socket" });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("room-not-found");
      return;
    }

    // ─────────────────────────────────────────────
    // VERIFY PLAYER WAS IN ROOM
    // ─────────────────────────────────────────────
    const player = room.players.find((p) => p.id === userId);
    if (!player) {
      socket.emit("rejoin-failed", {
        message: "You are not a player in this room",
      });
      return;
    }

    // ─────────────────────────────────────────────
    // RESTORE PLAYER STATE
    // ─────────────────────────────────────────────
    player.socketId = socket.id;
    if (player.offline) delete player.offline;

    // Update connected users map
    connectedUsers.set(userId, {
      socketId: socket.id,
      roomId,
      role: null,
      online: true,
      lastSeen: Date.now(),
    });

    // Join socket to room
    socket.join(roomId);
    socket.currentRoom = roomId;

    // ─────────────────────────────────────────────
    // SYNC GAME STATE
    // If game is in progress, send current state
    // ─────────────────────────────────────────────
    const game = games.get(roomId);
    if (game) {
      // Update socket mapping in game instance
      if (typeof game.updateSocketIdForUser === "function") {
        game.updateSocketIdForUser(userId, socket.id);
      }

      // Send full game state to rejoined player
      const gameState = game.getState();
      socket.emit("game:sync", {
        board: gameState.board,
        turn: gameState.turn,
        players: gameState.players,
        winner: gameState.winner,
      });
    }

    // ─────────────────────────────────────────────
    // NOTIFY OTHER PLAYERS
    // ─────────────────────────────────────────────
    socket.to(roomId).emit("player-rejoined", {
      player: { id: userId, username: socket.username },
      players: room.players,
    });

  } catch (err) {
    console.error("Error during rejoin-room:", err);
    socket.emit("rejoin-failed", { message: "Failed to rejoin room" });
  }
}
