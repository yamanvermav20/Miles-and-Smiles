/**
 * Room Handler
 * Handles room creation, joining, and leaving
 */

import { generateRoomCode } from "../game/helpers.js";

/**
 * Set up room event handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Map} rooms - Rooms map (roomId -> room data)
 * @param {Function} onGameStart - Callback when game should start (roomId, room)
 * @param {Function} onPlayerLeave - Callback when player leaves (socket, roomId, games)
 */
export function setupRoomHandler(socket, io, rooms, onGameStart, onPlayerLeave, connectedUsers) {
  // Handle room creation
  socket.on("create-room", ({ gameName }, callback) => {
    try {
      console.log(
        `Create room request from ${socket.username} for game: ${gameName}`
      );

      if (!gameName) {
        console.error("No gameName provided");
        const errorMsg = "Game name is required";
        if (callback) callback({ error: errorMsg });
        socket.emit("room-error", { message: errorMsg });
        return;
      }

      // Generate unique room code
      let roomId;
      let attempts = 0;
      do {
        roomId = generateRoomCode();
        attempts++;
        if (attempts > 100) {
          throw new Error("Failed to generate unique room code");
        }
      } while (rooms.has(roomId));

      // Create room
      const room = {
        roomId,
        gameName,
        players: [
          {
            id: socket.userId,
            username: socket.username,
            socketId: socket.id,
          },
        ],
        maxPlayers: 2, // Default max players (can be customized per game)
        createdAt: new Date(),
      };

      rooms.set(roomId, room);
      // update connectedUsers map if provided
      if (connectedUsers) {
        connectedUsers.set(socket.userId, {
          socketId: socket.id,
          roomId,
          role: null,
          online: true,
          lastSeen: Date.now(),
        });
      }
      socket.join(roomId);
      socket.currentRoom = roomId;

      console.log(
        `✅ Room created: ${roomId} by ${socket.username} for game ${gameName}`
      );

      // Acknowledge receipt
      if (callback) callback({ success: true });

      // Emit room created event
      socket.emit("room-created", { roomId, gameName });
    } catch (error) {
      console.error("❌ Error creating room:", error);
      const errorMsg = error.message || "Failed to create room";
      if (callback) callback({ error: errorMsg });
      socket.emit("room-error", { message: errorMsg });
    }
  });

  // Handle room joining
  socket.on("join-room", ({ roomId, gameName }) => {
    try {
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit("room-not-found");
        return;
      }

      if (room.gameName !== gameName) {
        socket.emit("room-error", {
          message: "Room is for a different game",
        });
        return;
      }

      // Check if room is full
      if (room.players.length >= room.maxPlayers) {
        socket.emit("room-full");
        return;
      }

      // Check if user is already in the room
      const alreadyInRoom = room.players.some((p) => p.id === socket.userId);
      if (alreadyInRoom) {
        socket.emit("room-error", {
          message: "You are already in this room",
        });
        return;
      }

      // Add player to room
      room.players.push({
        id: socket.userId,
        username: socket.username,
        socketId: socket.id,
      });

      if (connectedUsers) {
        connectedUsers.set(socket.userId, {
          socketId: socket.id,
          roomId,
          role: null,
          online: true,
          lastSeen: Date.now(),
        });
      }

      socket.join(roomId);
      socket.currentRoom = roomId;

      console.log(`User ${socket.username} joined room ${roomId}`);

      // Notify the joining player
      socket.emit("room-joined", { roomId, gameName, players: room.players });

      // Notify other players in the room
      socket.to(roomId).emit("player-joined", {
        player: {
          id: socket.userId,
          username: socket.username,
        },
        players: room.players,
      });

      // If this is the second player joining, start the game
      // Use a small delay to ensure all event listeners are set up on the client
      if (room.players.length === 2) {
        setTimeout(() => {
          onGameStart(roomId, room);
        }, 100); // Small delay to ensure client listeners are ready
      }
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("room-error", { message: "Failed to join room" });
    }
  });

  // Handle leaving room
  socket.on("leave-room", ({ roomId }) => {
    try {
      if (!roomId) {
        socket.emit("room-error", { message: "Room ID is required" });
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("room-error", { message: "Room not found" });
        return;
      }

      // Verify user is actually in the room
      const playerInRoom = room.players.some((p) => p.socketId === socket.id);
      if (!playerInRoom) {
        socket.emit("room-error", { message: "You are not in this room" });
        return;
      }

      // Handle game cleanup if player is leaving during active game (intentional leave)
      if (onPlayerLeave) {
        onPlayerLeave(socket, roomId);
      }

      room.players = room.players.filter((p) => p.socketId !== socket.id);

      if (room.players.length === 0) {
        // Delete room if empty
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      } else {
        // Notify other players
        socket.to(roomId).emit("player-left", {
          player: {
            id: socket.userId,
            username: socket.username,
          },
          players: room.players,
        });
      }

      socket.leave(roomId);
      socket.currentRoom = null;
      // update connectedUsers
      if (connectedUsers) {
        connectedUsers.set(socket.userId, {
          socketId: null,
          roomId: null,
          role: null,
          online: false,
          lastSeen: Date.now(),
        });
      }
      console.log(`User ${socket.username} left room ${roomId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });
}

/**
 * Handle player leaving room (called before removing from room)
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} roomId - Room ID
 * @param {Map} games - Games map
 * @param {Function} onPlayerLeave - Callback for game-specific cleanup
 */
export function handleRoomLeave(socket, roomId, games, onPlayerLeave) {
  if (onPlayerLeave) {
    onPlayerLeave(socket, roomId, games);
  }
}

/**
 * Handle player disconnection from rooms
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Map} rooms - Rooms map
 * @param {Map} games - Games map
 * @param {Function} onPlayerLeave - Callback for game-specific cleanup
 */
export function handleRoomDisconnect(socket, rooms, games, onPlayerLeave) {
  // NOTE: disconnect should NOT remove players or delete game state immediately.
  // Brief network glitches should be tolerated. This function remains no-op
  // because disconnect handling is performed in socket.js to mark players offline.
  return;
}


