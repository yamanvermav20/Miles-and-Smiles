/**
 * Express Application Setup
 * Main entry point for HTTP server configuration
 */

import express from "express";
import cors from "cors";
import morgan from "morgan";

// Route imports
import authRoute from "./routes/authRoute.js";
import gameRoute from "./routes/gameRoute.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// ============================================
// Logging Configuration
// ============================================

// Custom morgan format: METHOD URL STATUS TIME - SIZE
const logFormat = ':method :url :status :response-time ms - :res[content-length] bytes';

// ============================================
// Middleware Setup
// ============================================

// Enable CORS for all origins
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request logging (skip health checks)
app.use(morgan(logFormat, {
  skip: (req, res) => req.url === '/health'
}));

// Debug: Log request body for write operations
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    console.log(`📦 Request Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Miles and Smiles backend is working");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoute);
app.use("/api/games", gameRoute);
app.use("/api/user", userRoutes);

export default app;

