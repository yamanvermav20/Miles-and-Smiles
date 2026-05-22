/**
 * Chat Handler
 * Handles all chat-related Socket.IO events
 */

/**
 * Set up chat event handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
export function setupChatHandler(socket, io) {
  // Handle chat messages
  socket.on("chat-message", ({ roomId, message }) => {
    try {
      // Verify user is in the room
      if (socket.currentRoom !== roomId) {
        socket.emit("chat-error", { message: "You are not in this room" });
        return;
      }

      // Validate message
      if (
        !message ||
        typeof message !== "string" ||
        message.trim().length === 0
      ) {
        socket.emit("chat-error", { message: "Message cannot be empty" });
        return;
      }

      // Limit message length
      if (message.length > 500) {
        socket.emit("chat-error", {
          message: "Message too long (max 500 characters)",
        });
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

      console.log(
        `💬 Chat message in room ${roomId} from ${socket.username}: ${message}`
      );

      // Broadcast to all players in the room
      io.to(roomId).emit("chat-message", chatData);
    } catch (error) {
      console.error("Error handling chat message:", error);
      socket.emit("chat-error", { message: "Failed to send message" });
    }
  });
}


