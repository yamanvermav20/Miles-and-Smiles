/**
 * Auth - Login Controller
 * Handles user authentication and session creation
 */

import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { createSession } from "../../services/tokenService.js";
import { authLogger } from "../../config/logger.js";

/**
 * Authenticate user and create session
 * @route POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required." });
    }

    // Find user (case-insensitive)
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, "i") }
    });
    
    if (!user) {
      authLogger.loginFailed({ username, reason: "user not found", ip: req.ip });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Check ban status
    if (user.isBanned) {
      const banExpired = user.banExpiresAt && new Date() > user.banExpiresAt;
      if (!banExpired) {
        authLogger.loginFailed({
          userId: user._id,
          username,
          reason: "banned",
          ip: req.ip,
        });
        return res.status(403).json({ 
          message: "Account is banned.",
          reason: user.banReason,
          expiresAt: user.banExpiresAt,
        });
      }
      // Ban expired, clear ban
      user.isBanned = false;
      user.banReason = null;
      user.banExpiresAt = null;
      await user.save();
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      authLogger.loginFailed({
        userId: user._id,
        username,
        reason: "invalid password",
        ip: req.ip,
      });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Create session
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection?.remoteAddress,
    };
    const tokens = await createSession(user, deviceInfo);

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Remove password from response
    const { password: _, ...safeUser } = user.toObject();

    authLogger.login({
      userId: user._id,
      username: user.username,
      ip: deviceInfo.ip,
      device: tokens.session.device,
    });

    return res.status(200).json({
      message: "Login successful",
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      sessionId: tokens.session.id,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
