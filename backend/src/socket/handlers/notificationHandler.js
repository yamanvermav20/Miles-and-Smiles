/**
 * Notification Handler
 * Handles real-time notification events via Socket.IO
 */

export function setupNotificationHandler(socket, io) {
  
  // Client can request their notification count
  socket.on('get-notification-count', async () => {
    try {
      // In a real app, you'd fetch from DB
      // For now, just acknowledge
      socket.emit('notification-count', { count: 0 });
    } catch (err) {
      console.error('Error getting notification count:', err);
      socket.emit('notification-error', { message: 'Failed to get notifications' });
    }
  });

  // Client can mark notifications as read
  socket.on('mark-notifications-read', async ({ notificationIds }) => {
    try {
      // In a real app, you'd update DB
      console.log(`User ${socket.userId} marked notifications as read:`, notificationIds);
      socket.emit('notifications-marked-read', { success: true });
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      socket.emit('notification-error', { message: 'Failed to mark as read' });
    }
  });

  console.log(`🔔 Notification handlers set up for ${socket.username}`);
}

/**
 * Emit notification to a specific user
 * Called by the notification worker
 */
export function emitNotification(io, userId, notificationData) {
  // Emit to user's personal room (userId)
  io.to(userId).emit('notification', notificationData);
  console.log(`🔔 Notification sent to user ${userId}:`, notificationData.type);
}

/**
 * Emit notification to multiple users
 */
export function emitNotificationToMultiple(io, userIds, notificationData) {
  userIds.forEach(userId => {
    io.to(userId).emit('notification', notificationData);
  });
  console.log(`🔔 Notification sent to ${userIds.length} users:`, notificationData.type);
}

