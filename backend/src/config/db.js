/**
 * MongoDB Database Configuration
 * Handles connection and disconnection to MongoDB
 */

import mongoose from "mongoose";

// Get URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Connect to MongoDB database
 * Exits process on failure
 */
export const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB connected`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

/**
 * Gracefully close MongoDB connection
 */
export const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log("🛑 MongoDB connection closed");
};

