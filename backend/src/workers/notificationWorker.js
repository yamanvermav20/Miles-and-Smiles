// workers/notificationWorker.js
import { notificationQueue } from '../config/queue.js';
import { getIO } from '../socket/socket.js';
import { emitNotification } from '../socket/handlers/notificationHandler.js';

// 🔔 Process notification jobs
notificationQueue.process(async (job) => {
  const { 
    type, 
    receiverId, 
    userId, 
    senderId, 
    senderUsername, 
    friendUsername, 
    friendId,
    message, 
    timestamp 
  } = job.data;

  // Determine which user ID to use
  const targetUserId = receiverId || userId;

  console.log(`🔔 Processing notification: ${type} for user ${targetUserId}`);

  try {
    // Log notification details
    console.log(`   📩 Message: ${message}`);
    console.log(`   📝 Type: ${type}`);
    console.log(`   ⏰ Timestamp: ${timestamp || new Date().toISOString()}`);
    
    if (senderUsername) {
      console.log(`   👤 From: ${senderUsername}`);
    }
    if (friendUsername) {
      console.log(`   👥 Friend: ${friendUsername}`);
    }

    // ✨ Real-time notification via Socket.IO
    // The Socket.IO instance is initialized in your main server (server.js)
    try {
      const io = getIO();
      
      // Prepare notification payload
      const notificationPayload = {
        id: job.id,
        type,
        message,
        senderId,
        senderUsername,
        friendId,
        friendUsername,
        timestamp: timestamp || new Date().toISOString(),
        read: false,
      };

      // Emit to user's personal room
      emitNotification(io, targetUserId, notificationPayload);
      console.log(`   ✅ Real-time notification sent to user ${targetUserId}`);
    } catch (socketError) {
      // If Socket.IO is not initialized yet (main server not running), just log
      console.warn(
        `   ⚠️  Socket.IO not available (main server may not be running yet)`
      );
      console.log(`   ℹ️  Notification logged, will be sent when user connects`);
    }



    return { 
      status: 'success', 
      notificationType: type,
      recipient: targetUserId,
      processedAt: new Date().toISOString(),
      realTimeSent: true,
    };

  } catch (error) {
    console.error('❌ Notification worker error:', error.message);
    throw error; // Bull will retry based on queue config (3 attempts)
  }
});

// Success event
notificationQueue.on('completed', (job, result) => {
  console.log(`✅ Notification job ${job.id} completed:`, result.notificationType);
});

// Error event
notificationQueue.on('failed', (job, err) => {
  console.error(`❌ Notification job ${job.id} failed after all retries:`, err.message);
});

console.log('🔔 Notification Worker started and listening...');

export default notificationQueue;

