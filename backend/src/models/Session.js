import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Session Model - Tracks user sessions for device management and refresh token rotation
 */
const sessionSchema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    
    // Refresh token (hashed)
    refreshToken: { 
      type: String, 
      required: true 
    },
    
    // Token family for rotation tracking (detects token reuse attacks)
    tokenFamily: { 
      type: String, 
      required: true,
      index: true 
    },
    
    // Device information
    device: {
      userAgent: { type: String, default: "Unknown" },
      browser: { type: String, default: "Unknown" },
      os: { type: String, default: "Unknown" },
      deviceType: { type: String, enum: ["desktop", "mobile", "tablet", "unknown"], default: "unknown" },
      ip: { type: String, default: "Unknown" },
    },
    
    // Session status
    isValid: { type: Boolean, default: true },
    lastUsed: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    
    // Location (optional, from IP geolocation)
    location: {
      country: { type: String, default: null },
      city: { type: String, default: null },
    },
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// Index for cleanup of expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding user sessions
sessionSchema.index({ userId: 1, isValid: 1 });

const Session = model("Session", sessionSchema);

export default Session;
