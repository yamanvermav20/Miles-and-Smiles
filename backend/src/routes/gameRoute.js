/**
 * Game Routes
 * Handles game-related API endpoints
 */

import express from "express";
import { getAllGames } from "../controllers/gameController.js";

const router = express.Router();

// GET /api/games - Get all available games
router.get("/", getAllGames);

export default router;

