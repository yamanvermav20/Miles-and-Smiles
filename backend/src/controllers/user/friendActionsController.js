/**
 * Friend Actions Controller
 * Handles cancel request and remove friend operations
 */

import User from "../../models/User.js";

/**
 * Cancel outgoing friend request
 * @route POST /api/user/friends/cancel
 */
export async function cancelFriendRequest(req, res) {
  try {
    const userId = req.user.id;
    const { userId: targetId } = req.body;

    if (!targetId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const [user, target] = await Promise.all([
      User.findById(userId),
      User.findById(targetId),
    ]);

    if (!user || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify outgoing request exists
    const hasOutgoingRequest = user.outgoingRequests.some(
      (id) => id.toString() === targetId.toString()
    );
    if (!hasOutgoingRequest) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    // Remove from both lists
    user.outgoingRequests = user.outgoingRequests.filter(
      (id) => id.toString() !== targetId.toString()
    );
    target.incomingRequests = target.incomingRequests.filter(
      (id) => id.toString() !== userId.toString()
    );

    await Promise.all([user.save(), target.save()]);
    return res.json({ message: "Friend request cancelled" });
  } catch (err) {
    console.error("cancelFriendRequest error:", err);
    return res.status(500).json({ message: "Server error while cancelling request" });
  }
}

/**
 * Remove a friend
 * @route POST /api/user/friends/remove
 */
export async function removeFriend(req, res) {
  try {
    const userId = req.user.id;
    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify they are friends
    const isFriend = user.friends.some(
      (id) => id.toString() === friendId.toString()
    );
    if (!isFriend) {
      return res.status(400).json({ message: "User is not your friend" });
    }

    // Remove from both friend lists
    user.friends = user.friends.filter(
      (id) => id.toString() !== friendId.toString()
    );
    friend.friends = friend.friends.filter(
      (id) => id.toString() !== userId.toString()
    );

    await Promise.all([user.save(), friend.save()]);
    return res.json({ message: "Friend removed" });
  } catch (err) {
    console.error("removeFriend error:", err);
    return res.status(500).json({ message: "Server error while removing friend" });
  }
}
