/**
 * Auth - Session Controller
 * Handles token refresh and session management
 */

import User from "../../models/User.js";
import {
  refreshTokens,
  invalidateSession,
  invalidateAllSessions,
  invalidateOtherSessions,
  getUserSessions,
} from "../../services/tokenService.js";
import { authLogger } from "../../config/logger.js";

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 */
export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required." });
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection?.remoteAddress,
    };

    const result = await refreshTokens(refreshToken, deviceInfo);
    if (result.error) {
      return res.status(401).json({ message: result.error });
    }

    authLogger.tokenRefresh({ sessionId: result.session.id, ip: deviceInfo.ip });

    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    console.error("refresh error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Logout current session
 * @route POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    const sessionId = req.body.sessionId || req.headers["x-session-id"];
    
    if (sessionId && req.user) {
      await invalidateSession(sessionId, req.user.id);
      
      // Update online status if no sessions remain
      const sessions = await getUserSessions(req.user.id);
      if (sessions.length === 0) {
        await User.findByIdAndUpdate(req.user.id, {
          isOnline: false,
          lastSeen: new Date(),
        });
      }

      authLogger.logout({ userId: req.user.id, sessionId });
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Logout all sessions (all devices)
 * @route POST /api/auth/logout-all
 */
export async function logoutAll(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const count = await invalidateAllSessions(req.user.id);
    
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    authLogger.sessionInvalidated({ userId: req.user.id, type: "all", count });

    return res.status(200).json({ 
      message: "Logged out from all devices",
      sessionsInvalidated: count,
    });
  } catch (err) {
    console.error("logout-all error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Logout all other sessions
 * @route POST /api/auth/logout-others
 */
export async function logoutOthers(req, res) {
  try {
    const sessionId = req.body.sessionId || req.headers["x-session-id"];
    
    if (!req.user || !sessionId) {
      return res.status(400).json({ message: "Session ID required" });
    }

    const count = await invalidateOtherSessions(req.user.id, sessionId);

    authLogger.sessionInvalidated({
      userId: req.user.id,
      type: "others",
      count,
      keptSession: sessionId,
    });

    return res.status(200).json({ 
      message: "Logged out from other devices",
      sessionsInvalidated: count,
    });
  } catch (err) {
    console.error("logout-others error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get all active sessions
 * @route GET /api/auth/sessions
 */
export async function getSessions(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const sessions = await getUserSessions(req.user.id);

    return res.status(200).json({
      sessions: sessions.map(s => ({
        id: s._id,
        device: s.device,
        location: s.location,
        lastUsed: s.lastUsed,
        createdAt: s.createdAt,
        isCurrent: s._id.toString() === req.headers["x-session-id"],
      })),
    });
  } catch (err) {
    console.error("get-sessions error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Revoke a specific session
 * @route DELETE /api/auth/sessions/:sessionId
 */
export async function revokeSession(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { sessionId } = req.params;
    const success = await invalidateSession(sessionId, req.user.id);

    if (!success) {
      return res.status(404).json({ message: "Session not found" });
    }

    authLogger.sessionInvalidated({ userId: req.user.id, type: "single", sessionId });

    return res.status(200).json({ message: "Session revoked" });
  } catch (err) {
    console.error("revoke-session error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
