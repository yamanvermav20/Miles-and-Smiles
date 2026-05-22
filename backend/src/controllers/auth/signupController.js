/**
 * Auth - Signup Controller
 * Handles user registration with validation
 */

import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { createSession } from "../../services/tokenService.js";
import { authLogger } from "../../config/logger.js";

/**
 * Register a new user
 * @route POST /api/auth/signup
 */
export async function signup(req, res) {
  try {
    const { username, password, email } = req.body || {};
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required." });
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: "Username must be 3-20 characters." });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        message: "Username can only contain letters, numbers, and underscores." 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Check for existing user
    const existing = await User.findOne({ 
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, "i") } },
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ]
    });
    
    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({ message: "Username already exists." });
      }
      if (email && existing.email === email.toLowerCase()) {
        return res.status(409).json({ message: "Email already registered." });
      }
    }

    console.log(`${username} wants to sign up`);

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 12);
    const user = new User({ 
      username, 
      password: hashed,
      email: email?.toLowerCase(),
    });
    await user.save();

    // Create session
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection?.remoteAddress,
    };
    const tokens = await createSession(user, deviceInfo);

    // Remove password from response
    const { password: _, ...safeUser } = user.toObject();

    authLogger.signup({
      userId: user._id,
      username: user.username,
      ip: deviceInfo.ip,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
