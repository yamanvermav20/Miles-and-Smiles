/**
 * Auth Routes
 * Handles user authentication, sessions, and password management
 */

import { Router } from "express";
import {
  signup,
  login,
  refresh,
  logout,
  logoutAll,
  logoutOthers,
  getSessions,
  revokeSession,
  changePassword,
} from "../controllers/auth/index.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// ============================================
// Public Routes (with rate limiting)
// ============================================
router.post("/signup", authRateLimiter("signup"), signup);
router.post("/login", authRateLimiter("login"), login);
router.post("/refresh", authRateLimiter("login"), refresh);

// ============================================
// Protected Routes (require authentication)
// ============================================
router.post("/logout", verifyToken, logout);
router.post("/logout-all", verifyToken, logoutAll);
router.post("/logout-others", verifyToken, logoutOthers);
router.get("/sessions", verifyToken, getSessions);
router.delete("/sessions/:sessionId", verifyToken, revokeSession);
router.post("/change-password", verifyToken, changePassword);

export default router;