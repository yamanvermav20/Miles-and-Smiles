/**
 * User Routes
 * Handles user profile, friends, favorites, and game stats
 */

import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

// Import from modular user controllers
import {
  getKing,
  getMe,
  updateProfilePicture,
  updateField,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFavorites,
  toggleFavorite,
  getGameStats,
  getGameHistory,
} from "../controllers/user/index.js";

const router = Router();

// ============================================
// Profile Routes
// ============================================
router.get("/me", verifyToken, getMe);           // Get current user
router.get("/king", getKing);                     // Get featured user
router.put("/updateField", verifyToken, updateField);
router.post("/profile-picture", verifyToken, upload.single("image"), updateProfilePicture);

// ============================================
// Friends Routes
// ============================================
router.post("/friends", verifyToken, sendFriendRequest);
router.post("/friends/accept", verifyToken, acceptFriendRequest);
router.post("/friends/reject", verifyToken, rejectFriendRequest);
router.post("/friends/cancel", verifyToken, cancelFriendRequest);
router.post("/friends/remove", verifyToken, removeFriend);

// ============================================
// Favorites & Stats Routes
// ============================================
router.get("/favorites", verifyToken, getFavorites);
router.post("/favorites", verifyToken, toggleFavorite);
router.get("/stats", verifyToken, getGameStats);
router.get("/history/:gameName", verifyToken, getGameHistory);

export default router;

