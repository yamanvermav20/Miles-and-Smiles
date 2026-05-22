/**
 * Auth - Password Controller
 * Handles password change operations
 */

import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { invalidateOtherSessions } from "../../services/tokenService.js";

/**
 * Change user password
 * @route POST /api/auth/change-password
 */
export async function changePassword(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters" 
      });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Invalidate other sessions for security
    const sessionId = req.headers["x-session-id"];
    if (sessionId) {
      await invalidateOtherSessions(req.user.id, sessionId);
    }

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("change-password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
