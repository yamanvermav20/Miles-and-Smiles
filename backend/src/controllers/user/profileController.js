/**
 * Profile Controller
 * Handles user profile operations: get profile, update fields, update picture
 */

import User from "../../models/User.js";
import redisClient from "../../config/redis.js";

// Cache TTL - 1 hour for king data
const KING_CACHE_TTL = 3600;

/**
 * Get the king (admin/featured user)
 * @route GET /api/user/king
 */
export async function getKing(req, res) {
  try {
    // Try cache first
    const cached = await redisClient.get("king-data");
    if (cached) {
      return res.status(200).json({ data: JSON.parse(cached), cached: true });
    }

    // Fetch from database
    const king = await User.findOne({ role: "king" });
    if (king) {
      await redisClient.setEx("king-data", KING_CACHE_TTL, JSON.stringify(king));
    }

    return res.status(200).json({ data: king, cached: false });
  } catch (err) {
    console.error("getKing error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get current user profile with friends populated
 * @route GET /api/user/me
 */
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .populate("friends", "username pfp_url")
      .populate("incomingRequests", "username pfp_url")
      .populate("outgoingRequests", "username pfp_url")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove sensitive data
    const { password, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Update profile picture
 * @route POST /api/user/profile-picture
 */
export async function updateProfilePicture(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const imageUrl = req.file.path;
    const user = await User.findByIdAndUpdate(
      userId,
      { pfp_url: imageUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Profile picture updated successfully",
      pfp_url: user.pfp_url,
    });
  } catch (err) {
    console.error("updateProfilePicture error:", err);
    return res.status(500).json({ message: "Image upload failed" });
  }
}

/**
 * Update user fields (username, bio, etc.)
 * @route PUT /api/user/updateField
 */
export async function updateField(req, res) {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Validate request
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields provided." });
    }

    // Prevent updating restricted fields
    const disallowed = ["_id", "password", "emailVerified"];
    for (let key of Object.keys(updates)) {
      if (disallowed.includes(key)) {
        return res.status(400).json({ message: `Cannot update ${key}.` });
      }
    }

    // Check username availability
    if (updates.username) {
      if (updates.username === req.user.username) {
        return res.status(200).json({ message: "", user: req.user });
      }

      const existingUser = await User.findOne({ username: updates.username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "Username already taken." });
      }
    }

    // Perform update
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    return res.status(200).json({ message: "Updated successfully", user });
  } catch (err) {
    console.error("updateField error:", err);
    return res.status(500).json({ message: "Failed to update user" });
  }
}
