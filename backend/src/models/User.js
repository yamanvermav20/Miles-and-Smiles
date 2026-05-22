import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Schema for individual game statistics with ELO
const gameStatsSchema = new Schema({
  gameName: { type: String, required: true },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  lastPlayed: { type: Date, default: null },
  // ELO/MMR per game
  elo: { type: Number, default: 1000 },
  peakElo: { type: Number, default: 1000 },
  eloHistory: [{
    elo: Number,
    change: Number,
    date: { type: Date, default: Date.now },
  }],
  // Ranked stats
  rankedGamesPlayed: { type: Number, default: 0 },
  rankedWins: { type: Number, default: 0 },
  rankedLosses: { type: Number, default: 0 },
  // Streaks per game
  currentWinStreak: { type: Number, default: 0 },
  longestWinStreak: { type: Number, default: 0 },
}, { _id: false });

// Schema for match history entry
const matchHistorySchema = new Schema({
  gameName: { type: String, required: true },
  matchId: { type: Schema.Types.ObjectId, ref: "Match" },
  opponent: { type: String, default: "Unknown" },
  opponentId: { type: Schema.Types.ObjectId, ref: "User" },
  result: { type: String, enum: ["win", "loss", "draw"], required: true },
  myScore: { type: Number, default: 0 },
  opponentScore: { type: Number, default: 0 },
  playedAt: { type: Date, default: Date.now },
  matchType: { type: String, enum: ["casual", "ranked", "private"], default: "casual" },
  eloChange: { type: Number, default: 0 },
}, { _id: true });

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    pfp_url: { type: String, default: "/guestpfp.png" },

    // Role-based access control
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    birthday: { type: Date, default: null },

    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],

    incomingRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    outgoingRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // Blocked users
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    favouriteGames: {
      type: [String],
      default: [],
    },

    // Game statistics per game (includes ELO)
    gameStats: {
      type: [gameStatsSchema],
      default: [],
    },

    // Match history (last 50 games)
    matchHistory: {
      type: [matchHistorySchema],
      default: [],
    },

    // Overall stats
    totalGamesPlayed: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    totalDraws: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastGamePlayed: { type: Date, default: null },

    // ======= PROGRESSION SYSTEM =======
    // Global XP and Level
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    
    // Global ELO (average across all games)
    globalElo: { type: Number, default: 1000 },

    // Achievements (references to UserAchievement collection)
    achievementCount: { type: Number, default: 0 },

    // Title/Badge display
    displayTitle: { type: String, default: null },
    displayBadge: { type: String, default: null },

    // ======= ONLINE STATUS =======
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    currentGame: { type: String, default: null }, // Which game they're currently in
    currentRoomId: { type: String, default: null },

    // ======= SETTINGS & PREFERENCES =======
    settings: {
      notifications: { type: Boolean, default: true },
      soundEffects: { type: Boolean, default: true },
      friendRequestsFrom: { type: String, enum: ["everyone", "friends-of-friends", "nobody"], default: "everyone" },
      showOnlineStatus: { type: Boolean, default: true },
    },

    // ======= MODERATION =======
    warnings: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    banExpiresAt: { type: Date, default: null },
    mutedUntil: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

const User = model("User", userSchema);

export default User;

