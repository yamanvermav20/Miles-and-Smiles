/**
 * Private Room Handler
 * Handles private room creation and joining
 * 
 * @module socket/handlers/matchmaking/privateRoomHandler
 */

import { logger } from "../../../config/logger.js";
import { createPrivateRoom, joinPrivateRoom } from "../../../services/matchmakingService.js";
import { addPendingRoom, getPendingRoom, removePendingRoom } from "./state.js";

const matchmakingLogger = logger.child({ component: "matchmaking" });

/**
 * Set up private room socket handlers
 * @param {Socket} socket - Socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Map} rooms - Rooms map
 * @param {Map} connectedUsers - Connected users map
 */
export function setupPrivateRoomHandlers(socket, io, rooms, connectedUsers) {
  // Create private room
  socket.on("matchmaking:createPrivate", async ({ game }) => {
    await handleCreatePrivate(socket, io, rooms, game);
  });
  
  // Join private room with invite code
  socket.on("matchmaking:joinPrivate", async ({ inviteCode }) => {
    await handleJoinPrivate(socket, io, rooms, connectedUsers, inviteCode);
  });
}

/**
 * Handle creating a private room
 */
async function handleCreatePrivate(socket, io, rooms, game) {
  try {
    matchmakingLogger.info("Creating private room", {
      userId: socket.userId,
      game,
    });
    
    const room = await createPrivateRoom({
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id,
      game,
    });
    
    // Store in local map for quick lookup
    addPendingRoom(room.inviteCode, {
      roomId: room.roomId,
      hostId: socket.userId,
      hostUsername: socket.username,
      game,
    });
    
    // Add to rooms map
    rooms.set(room.roomId, {
      gameName: game,
      players: [{ id: socket.userId, socketId: socket.id, username: socket.username }],
      maxPlayers: 2,
      isPrivate: true,
      inviteCode: room.inviteCode,
    });
    
    // Join socket to room
    socket.join(room.roomId);
    socket.currentRoom = room.roomId;
    
    socket.emit("matchmaking:privateCreated", {
      roomId: room.roomId,
      inviteCode: room.inviteCode,
    });
    
    // Cleanup old pending rooms after 30 minutes
    scheduleRoomCleanup(room.inviteCode, 30 * 60 * 1000);
    
  } catch (error) {
    matchmakingLogger.error("Error creating private room", {
      userId: socket.userId,
      error: error.message,
    });
    socket.emit("matchmaking:error", { message: "Failed to create private room" });
  }
}

/**
 * Handle joining a private room
 */
async function handleJoinPrivate(socket, io, rooms, connectedUsers, inviteCode) {
  try {
    matchmakingLogger.info("Joining private room", {
      userId: socket.userId,
      inviteCode,
    });
    
    const pendingRoom = getPendingRoom(inviteCode);
    
    // Validate room exists
    if (!pendingRoom) {
      socket.emit("matchmaking:error", { message: "Invalid or expired invite code" });
      return;
    }
    
    const room = rooms.get(pendingRoom.roomId);
    
    if (!room) {
      socket.emit("matchmaking:error", { message: "Room no longer exists" });
      removePendingRoom(inviteCode);
      return;
    }
    
    // Validate room capacity
    if (room.players.length >= room.maxPlayers) {
      socket.emit("matchmaking:error", { message: "Room is full" });
      return;
    }
    
    // Prevent joining own room
    if (pendingRoom.hostId === socket.userId) {
      socket.emit("matchmaking:error", { message: "You cannot join your own room" });
      return;
    }
    
    // Join the room
    room.players.push({
      id: socket.userId,
      socketId: socket.id,
      username: socket.username,
    });
    
    socket.join(pendingRoom.roomId);
    socket.currentRoom = pendingRoom.roomId;
    
    // Clean up pending room entry
    removePendingRoom(inviteCode);
    
    // Update connected users
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      roomId: pendingRoom.roomId,
      role: null,
      online: true,
      lastSeen: Date.now(),
    });
    
    // Notify both players
    io.to(pendingRoom.roomId).emit("matchmaking:privateJoined", {
      roomId: pendingRoom.roomId,
      players: room.players.map(p => ({ id: p.id, username: p.username })),
      game: pendingRoom.game,
    });
    
    // Room is full, start the game
    if (room.players.length === room.maxPlayers) {
      io.to(pendingRoom.roomId).emit("matchmaking:matchFound", {
        roomId: pendingRoom.roomId,
        players: room.players.map(p => ({ id: p.id, username: p.username })),
        game: pendingRoom.game,
        isPrivate: true,
      });
    }
    
  } catch (error) {
    matchmakingLogger.error("Error joining private room", {
      userId: socket.userId,
      error: error.message,
    });
    socket.emit("matchmaking:error", { message: "Failed to join private room" });
  }
}

/**
 * Schedule cleanup of pending room
 */
function scheduleRoomCleanup(inviteCode, delay) {
  setTimeout(() => {
    if (getPendingRoom(inviteCode)) {
      removePendingRoom(inviteCode);
    }
  }, delay);
}
