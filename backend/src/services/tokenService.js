/**
 * Token Service - Handles JWT access and refresh tokens with rotation
 */

import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import Session from "../models/Session.js";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const ACCESS_TOKEN_EXPIRY = "15m"; // Short-lived access token
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // Long-lived refresh token

/**
 * Parse user agent to extract device info
 * @param {string} userAgent - User agent string
 * @returns {Object} Device info
 */
export function parseUserAgent(userAgent) {
  const device = {
    userAgent: userAgent || "Unknown",
    browser: "Unknown",
    os: "Unknown",
    deviceType: "unknown",
  };
  
  if (!userAgent) return device;
  
  // Detect browser
  if (userAgent.includes("Firefox")) device.browser = "Firefox";
  else if (userAgent.includes("Chrome")) device.browser = "Chrome";
  else if (userAgent.includes("Safari")) device.browser = "Safari";
  else if (userAgent.includes("Edge")) device.browser = "Edge";
  else if (userAgent.includes("Opera")) device.browser = "Opera";
  
  // Detect OS
  if (userAgent.includes("Windows")) device.os = "Windows";
  else if (userAgent.includes("Mac")) device.os = "macOS";
  else if (userAgent.includes("Linux")) device.os = "Linux";
  else if (userAgent.includes("Android")) device.os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) device.os = "iOS";
  
  // Detect device type
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
    device.deviceType = "mobile";
  } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
    device.deviceType = "tablet";
  } else {
    device.deviceType = "desktop";
  }
  
  return device;
}

/**
 * Generate access token
 * @param {Object} payload - Token payload
 * @returns {string} Access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate refresh token
 * @returns {string} Refresh token
 */
export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Generate token family ID (for rotation tracking)
 * @returns {string} Token family ID
 */
export function generateTokenFamily() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Create a new session with tokens
 * @param {Object} user - User object
 * @param {Object} deviceInfo - Device information
 * @returns {Object} Tokens and session info
 */
export async function createSession(user, deviceInfo) {
  const { userAgent, ip } = deviceInfo;
  
  // Generate tokens
  const accessToken = generateAccessToken({
    id: user._id,
    username: user.username,
    role: user.role || "user",
  });
  
  const refreshToken = generateRefreshToken();
  const tokenFamily = generateTokenFamily();
  
  // Hash refresh token for storage
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  
  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  
  // Parse device info
  const device = parseUserAgent(userAgent);
  device.ip = ip || "Unknown";
  
  // Create session
  const session = new Session({
    userId: user._id,
    refreshToken: hashedRefreshToken,
    tokenFamily,
    device,
    expiresAt,
  });
  
  await session.save();
  
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY,
    session: {
      id: session._id,
      device: session.device,
      createdAt: session.createdAt,
    },
  };
}

/**
 * Refresh tokens with rotation
 * @param {string} refreshToken - Current refresh token
 * @param {Object} deviceInfo - Device information
 * @returns {Object} New tokens or error
 */
export async function refreshTokens(refreshToken, deviceInfo) {
  // Find all sessions and check which one matches
  const sessions = await Session.find({ isValid: true });
  
  let matchedSession = null;
  for (const session of sessions) {
    const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
    if (isMatch) {
      matchedSession = session;
      break;
    }
  }
  
  if (!matchedSession) {
    // Token not found - might be reuse attack or expired
    return { error: "Invalid refresh token" };
  }
  
  // Check if session is still valid
  if (!matchedSession.isValid) {
    return { error: "Session has been invalidated" };
  }
  
  // Check expiry
  if (new Date() > matchedSession.expiresAt) {
    matchedSession.isValid = false;
    await matchedSession.save();
    return { error: "Refresh token expired" };
  }
  
  // Token reuse detection - if this token was already used, invalidate all sessions
  // in this token family (potential attack)
  const sessionsInFamily = await Session.find({
    tokenFamily: matchedSession.tokenFamily,
    _id: { $ne: matchedSession._id },
    isValid: true,
  });
  
  // Generate new tokens (rotation)
  const newRefreshToken = generateRefreshToken();
  const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
  
  // Get user info for access token
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(matchedSession.userId);
  
  if (!user) {
    matchedSession.isValid = false;
    await matchedSession.save();
    return { error: "User not found" };
  }
  
  const accessToken = generateAccessToken({
    id: user._id,
    username: user.username,
    role: user.role || "user",
  });
  
  // Update session with new refresh token
  matchedSession.refreshToken = hashedNewRefreshToken;
  matchedSession.lastUsed = new Date();
  
  // Update device info if changed
  const device = parseUserAgent(deviceInfo.userAgent);
  device.ip = deviceInfo.ip || matchedSession.device.ip;
  matchedSession.device = device;
  
  await matchedSession.save();
  
  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY,
    session: {
      id: matchedSession._id,
      device: matchedSession.device,
    },
  };
}

/**
 * Invalidate a specific session (logout device)
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID (for authorization)
 * @returns {boolean} Success
 */
export async function invalidateSession(sessionId, userId) {
  const result = await Session.findOneAndUpdate(
    { _id: sessionId, userId },
    { isValid: false }
  );
  return !!result;
}

/**
 * Invalidate all sessions for a user (logout all devices)
 * @param {string} userId - User ID
 * @returns {number} Number of sessions invalidated
 */
export async function invalidateAllSessions(userId) {
  const result = await Session.updateMany(
    { userId, isValid: true },
    { isValid: false }
  );
  return result.modifiedCount;
}

/**
 * Invalidate all sessions except current
 * @param {string} userId - User ID
 * @param {string} currentSessionId - Current session to keep
 * @returns {number} Number of sessions invalidated
 */
export async function invalidateOtherSessions(userId, currentSessionId) {
  const result = await Session.updateMany(
    { userId, isValid: true, _id: { $ne: currentSessionId } },
    { isValid: false }
  );
  return result.modifiedCount;
}

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} Active sessions
 */
export async function getUserSessions(userId) {
  const sessions = await Session.find({
    userId,
    isValid: true,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastUsed: -1 })
    .select("-refreshToken -tokenFamily");
  
  return sessions;
}

/**
 * Verify access token
 * @param {string} token - Access token
 * @returns {Object} Decoded payload or error
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { valid: false, error: "Token expired" };
    }
    return { valid: false, error: "Invalid token" };
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions() {
  const result = await Session.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isValid: false, updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    ],
  });
  return result.deletedCount;
}

export default {
  generateAccessToken,
  generateRefreshToken,
  createSession,
  refreshTokens,
  invalidateSession,
  invalidateAllSessions,
  invalidateOtherSessions,
  getUserSessions,
  verifyAccessToken,
  cleanupExpiredSessions,
  parseUserAgent,
};
