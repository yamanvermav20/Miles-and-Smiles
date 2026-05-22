/**
 * Direct Message (DM) Handler
 * Handles private chat between friends
 */

// In-memory store for DM history (could be moved to database)
const dmHistory = new Map(); // roomId -> messages[]

// Maximum messages to store per conversation
const MAX_MESSAGES = 100;

/**
 * Set up DM event handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
export function setupDMHandler(socket, io) {
  // Join a DM room
  socket.on("dm:join", ({ friendId, roomId }) => {
    try {
      if (!roomId || !friendId) {
        socket.emit("dm:error", { message: "Invalid room or friend ID" });
        return;
      }

      // Join the DM room
      socket.join(roomId);
      console.log(`💬 ${socket.username} joined DM room: ${roomId}`);

      // Send chat history
      const history = dmHistory.get(roomId) || [];
      socket.emit("dm:history", history);

    } catch (error) {
      console.error("Error joining DM room:", error);
      socket.emit("dm:error", { message: "Failed to join chat" });
    }
  });

  // Leave a DM room
  socket.on("dm:leave", ({ roomId }) => {
    try {
      if (roomId) {
        socket.leave(roomId);
        console.log(`💬 ${socket.username} left DM room: ${roomId}`);
      }
    } catch (error) {
      console.error("Error leaving DM room:", error);
    }
  });

  // Handle DM messages
  socket.on("dm:message", ({ roomId, friendId, message }) => {
    try {
      if (!roomId) {
        socket.emit("dm:error", { message: "Invalid room ID" });
        return;
      }

      // Validate message
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        socket.emit("dm:error", { message: "Message cannot be empty" });
        return;
      }

      // Limit message length
      if (message.length > 500) {
        socket.emit("dm:error", { message: "Message too long (max 500 characters)" });
        return;
      }

      const chatData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        roomId,
        userId: socket.userId,
        username: socket.username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };

      // Store message in history
      if (!dmHistory.has(roomId)) {
        dmHistory.set(roomId, []);
      }
      const history = dmHistory.get(roomId);
      history.push(chatData);
      
      // Trim history if too long
      if (history.length > MAX_MESSAGES) {
        history.splice(0, history.length - MAX_MESSAGES);
      }

      console.log(`💬 DM in ${roomId} from ${socket.username}: ${message.substring(0, 50)}...`);

      // Broadcast to the DM room
      io.to(roomId).emit("dm:message", chatData);

      // Also send to friend's personal notification room if they're not in the DM room
      if (friendId) {
        io.to(friendId).emit("dm:notification", {
          from: {
            userId: socket.userId,
            username: socket.username,
          },
          message: message.trim().substring(0, 100),
          roomId,
          timestamp: chatData.timestamp,
        });
      }

    } catch (error) {
      console.error("Error handling DM:", error);
      socket.emit("dm:error", { message: "Failed to send message" });
    }
  });
}
