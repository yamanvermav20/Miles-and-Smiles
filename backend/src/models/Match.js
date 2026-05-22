import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Match Model - Stores complete game match data for history, replay, and analytics
 */
const matchSchema = new Schema(
  {
    // Game type
    game: { 
      type: String, 
      required: true,
      enum: ["Tic Tac Toe", "Dots and Boxes", "Snakes and Ladders", "Memory", "Chess"],
      index: true 
    },
    
    // Match type
    matchType: {
      type: String,
      enum: ["casual", "ranked", "private", "tournament"],
      default: "casual"
    },
    
    // Room ID this match was played in
    roomId: { type: String, required: true, index: true },
    
    // Players in this match
    players: [{
      oderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      username: { type: String, required: true },
      symbol: { type: String }, // X/O for tictactoe, etc.
      eloAtStart: { type: Number, default: 1000 },
      eloChange: { type: Number, default: 0 },
      result: { type: String, enum: ["win", "loss", "draw", "abandoned"] },
      score: { type: Number, default: 0 },
    }],
    
    // Winner info
    winner: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      username: { type: String },
    },
    
    // Match status
    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned", "timeout"],
      default: "in-progress"
    },
    
    // How the match ended
    endReason: {
      type: String,
      enum: ["normal", "forfeit", "timeout", "disconnect", "draw-agreement", null],
      default: null
    },
    
    // Move history for replay
    moves: [{
      playerId: { type: Schema.Types.ObjectId, ref: "User" },
      moveData: { type: Schema.Types.Mixed }, // Game-specific move data
      timestamp: { type: Date, default: Date.now },
      moveNumber: { type: Number },
    }],
    
    // Game state snapshots (for resume/replay)
    stateHistory: [{
      state: { type: Schema.Types.Mixed },
      moveNumber: { type: Number },
      timestamp: { type: Date, default: Date.now },
    }],
    
    // Final game state
    finalState: { type: Schema.Types.Mixed },
    
    // Timing information
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number }, // Duration in seconds
    
    // Turn timing (for games with timers)
    turnTimeLimit: { type: Number, default: null }, // seconds per turn
    
    // Spectator count
    peakSpectators: { type: Number, default: 0 },
    
    // Chat log (last N messages)
    chatLog: [{
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      username: { type: String },
      message: { type: String },
      timestamp: { type: Date, default: Date.now },
    }],
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// Indexes for common queries
matchSchema.index({ "players.userId": 1, createdAt: -1 });
matchSchema.index({ game: 1, matchType: 1, createdAt: -1 });
matchSchema.index({ status: 1 });
matchSchema.index({ createdAt: -1 });

// TTL index to automatically delete old matches after 90 days (optional)
// matchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Match = model("Match", matchSchema);

export default Match;
