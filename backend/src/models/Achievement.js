import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Achievement Definition Model - Defines all possible achievements
 */
const achievementDefinitionSchema = new Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true 
    },
    
    name: { type: String, required: true },
    description: { type: String, required: true },
    
    // Achievement category
    category: { 
      type: String, 
      enum: ["games", "social", "streak", "milestone", "special", "game-specific"],
      required: true 
    },
    
    // Which game this achievement is for (null = global)
    game: { type: String, default: null },
    
    // Achievement tier
    tier: { 
      type: String, 
      enum: ["bronze", "silver", "gold", "platinum", "diamond"],
      default: "bronze" 
    },
    
    // Icon/badge URL
    icon: { type: String, default: "/badges/default.png" },
    
    // XP reward for unlocking
    xpReward: { type: Number, default: 50 },
    
    // Criteria for unlocking (used by achievement engine)
    criteria: {
      type: { 
        type: String, 
        enum: ["count", "streak", "threshold", "special"],
        required: true 
      },
      stat: { type: String }, // Which stat to track
      target: { type: Number }, // Target value
      game: { type: String }, // Specific game (optional)
    },
    
    // Is this achievement hidden until unlocked?
    hidden: { type: Boolean, default: false },
    
    // Is this achievement active?
    active: { type: Boolean, default: true },
    
    // Sort order for display
    order: { type: Number, default: 0 },
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

achievementDefinitionSchema.index({ category: 1, active: 1 });
achievementDefinitionSchema.index({ game: 1 });

/**
 * User Achievement Model - Tracks which achievements a user has unlocked
 */
const userAchievementSchema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    
    achievementCode: { 
      type: String, 
      required: true,
      uppercase: true 
    },
    
    // When it was unlocked
    unlockedAt: { type: Date, default: Date.now },
    
    // Progress towards achievement (for progressive achievements)
    progress: { type: Number, default: 0 },
    
    // Is it complete?
    completed: { type: Boolean, default: true },
    
    // Has the user seen/acknowledged this achievement?
    seen: { type: Boolean, default: false },
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// Compound index to prevent duplicate achievements
userAchievementSchema.index({ userId: 1, achievementCode: 1 }, { unique: true });

const AchievementDefinition = model("AchievementDefinition", achievementDefinitionSchema);
const UserAchievement = model("UserAchievement", userAchievementSchema);

export { AchievementDefinition, UserAchievement };
export default AchievementDefinition;
