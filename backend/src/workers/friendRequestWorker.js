// workers/friendRequestWorker.js
import { friendRequestQueue, notificationQueue } from '../config/queue.js';
import User from '../models/User.js';

// 🔧 Process friend request jobs
friendRequestQueue.process(async (job) => {
  const { senderId, receiverUsername, timestamp } = job.data;

  console.log(`📨 Processing friend request: ${senderId} -> ${receiverUsername}`);

  try {
    // 1. Find sender and receiver
    const sender = await User.findById(senderId);
    const receiver = await User.findOne({ username: receiverUsername });

    // Validation
    if (!sender) {
      throw new Error(`Sender not found: ${senderId}`);
    }

    if (!receiver) {
      throw new Error(`Receiver not found: ${receiverUsername}`);
    }

    // Check if already friends
    if (sender.friends.includes(receiver._id)) {
      throw new Error('Users are already friends');
    }

    // Check if request already sent
    if (sender.outgoingRequests.includes(receiver._id)) {
      throw new Error('Friend request already sent');
    }

    // Check if receiver already sent a request (auto-accept case)
    if (receiver.outgoingRequests.includes(sender._id)) {
      // Auto-accept: they both want to be friends!
      sender.friends.push(receiver._id);
      receiver.friends.push(sender._id);
      
      // Remove from requests
      sender.incomingRequests = sender.incomingRequests.filter(
        id => !id.equals(receiver._id)
      );
      receiver.outgoingRequests = receiver.outgoingRequests.filter(
        id => !id.equals(sender._id)
      );

      await sender.save();
      await receiver.save();

      console.log(`✅ Auto-accepted! ${sender.username} and ${receiver.username} are now friends`);

      // 🔔 Publish notification for both users
      await notificationQueue.add({
        type: 'friend_request_accepted',
        userId: sender._id.toString(),
        friendId: receiver._id.toString(),
        friendUsername: receiver.username,
        message: `You and ${receiver.username} are now friends!`,
      });

      await notificationQueue.add({
        type: 'friend_request_accepted',
        userId: receiver._id.toString(),
        friendId: sender._id.toString(),
        friendUsername: sender.username,
        message: `You and ${sender.username} are now friends!`,
      });

      return { status: 'auto_accepted', sender: sender.username, receiver: receiver.username };
    }

    // 2. Update sender's outgoing requests
    sender.outgoingRequests.push(receiver._id);
    await sender.save();

    // 3. Update receiver's incoming requests
    receiver.incomingRequests.push(sender._id);
    await receiver.save();

    console.log(`✅ Friend request saved: ${sender.username} -> ${receiver.username}`);

    // 4. 🔔 Publish notification event
    await notificationQueue.add({
      type: 'friend_request_received',
      receiverId: receiver._id.toString(),
      senderId: sender._id.toString(),
      senderUsername: sender.username,
      message: `${sender.username} sent you a friend request`,
      timestamp: timestamp,
    });

    return { 
      status: 'success', 
      sender: sender.username, 
      receiver: receiver.username 
    };

  } catch (error) {
    console.error('❌ Friend request worker error:', error.message);
    throw error; // Bull will retry based on our config
  }
});

console.log('🚀 Friend Request Worker started and listening...');

export default friendRequestQueue;

