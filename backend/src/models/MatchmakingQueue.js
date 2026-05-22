import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Matchmaking Queue Entry Model
 * Stores players waiting to be matched
 */
const matchmakingQueueSchema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    
    username: { type: String, required: true },
    
    socketId: { type: String, required: true },
    
    // Which game they want to play
    game: { 
      type: String, 
      required: true,
      enum: ["Tic Tac Toe", "Dots and Boxes", "Snakes and Ladders", "Memory", "Chess"],
      index: true 
    },
    
    // Queue type
    queueType: {
      type: String,
      enum: ["casual", "ranked"],
      default: "casual",
      index: true
    },
    
    // Player's ELO for this game (for skill-based matching)
    elo: { type: Number, default: 1000 },
    
    // ELO search range (expands over time)
    eloRangeMin: { type: Number, default: 100 },
    eloRangeMax: { type: Number, default: 100 },
    
    // When they joined the queue
    joinedAt: { type: Date, default: Date.now, index: true },
    
    // Status
    status: {
      type: String,
      enum: ["waiting", "matching", "matched", "cancelled"],
      default: "waiting"
    },
    
    // Matched with (filled when match is found)
    matchedWith: { type: Schema.Types.ObjectId, ref: "User" },
    matchedRoomId: { type: String },
    
    // Preferences
    preferences: {
      // Avoid recently played opponents
      avoidRecent: { type: Boolean, default: true },
      // Recently played opponent IDs
      recentOpponents: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// Compound indexes for efficient matchmaking queries
matchmakingQueueSchema.index({ game: 1, queueType: 1, status: 1, elo: 1 });
matchmakingQueueSchema.index({ game: 1, queueType: 1, status: 1, joinedAt: 1 });

// TTL index to auto-remove stale queue entries (5 minutes)
matchmakingQueueSchema.index({ joinedAt: 1 }, { expireAfterSeconds: 300 });

const MatchmakingQueue = model("MatchmakingQueue", matchmakingQueueSchema);

export default MatchmakingQueue;
