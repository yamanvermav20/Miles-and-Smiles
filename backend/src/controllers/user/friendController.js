/**
 * Friends Controller
 * Handles friend request operations: send, accept, reject, cancel, remove
 */

import User from "../../models/User.js";
import { friendRequestQueue } from "../../config/queue.js";

/**
 * Send friend request (async via Bull Queue)
 * @route POST /api/user/friends
 */
export async function sendFriendRequest(req, res) {
  try {
    const { username } = req.body;
    const senderId = req.user.id;
    const senderUsername = req.user.username;

    // Validate input
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (username === senderUsername) {
      return res.status(400).json({ 
        message: "You cannot send a request to yourself" 
      });
    }

    // Add job to queue (fast, returns immediately)
    await friendRequestQueue.add({
      type: 'friend_request_sent',
      senderId,
      senderUsername,
      receiverUsername: username,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ message: "Friend request sent!" });
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    return res.status(500).json({ message: "Server error while sending request" });
  }
}

/**
 * Accept friend request
 * @route POST /api/user/friends/accept
 */
export async function acceptFriendRequest(req, res) {
  try {
    const userId = req.user.id;
    const { userId: requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find both users
    const [user, requester] = await Promise.all([
      User.findById(userId),
      User.findById(requesterId),
    ]);

    if (!user || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for incoming request
    const hasIncomingRequest = user.incomingRequests.some(
      (id) => id.toString() === requesterId.toString()
    );
    if (!hasIncomingRequest) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    // Check if already friends
    const alreadyFriends = user.friends.some(
      (id) => id.toString() === requesterId.toString()
    );
    if (alreadyFriends) {
      return res.status(400).json({ message: "You are already friends" });
    }

    // Add each other as friends
    user.friends.push(requesterId);
    requester.friends.push(userId);

    // Remove from request lists
    user.incomingRequests = user.incomingRequests.filter(
      (id) => id.toString() !== requesterId.toString()
    );
    requester.outgoingRequests = requester.outgoingRequests.filter(
      (id) => id.toString() !== userId.toString()
    );

    await Promise.all([user.save(), requester.save()]);
    return res.json({ message: "Friend request accepted!" });
  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    return res.status(500).json({ message: "Server error while accepting request" });
  }
}

/**
 * Reject friend request
 * @route POST /api/user/friends/reject
 */
export async function rejectFriendRequest(req, res) {
  try {
    const userId = req.user.id;
    const { userId: requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const [user, requester] = await Promise.all([
      User.findById(userId),
      User.findById(requesterId),
    ]);

    if (!user || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify request exists
    const hasIncomingRequest = user.incomingRequests.some(
      (id) => id.toString() === requesterId.toString()
    );
    if (!hasIncomingRequest) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    // Remove from request lists
    user.incomingRequests = user.incomingRequests.filter(
      (id) => id.toString() !== requesterId.toString()
    );
    requester.outgoingRequests = requester.outgoingRequests.filter(
      (id) => id.toString() !== userId.toString()
    );

    await Promise.all([user.save(), requester.save()]);
    return res.json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("rejectFriendRequest error:", err);
    return res.status(500).json({ message: "Server error while rejecting request" });
  }
}
