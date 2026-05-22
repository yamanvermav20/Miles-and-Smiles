/**
 * Achievement Service
 * Handles achievement checking, unlocking, and progress tracking
 */

import { AchievementDefinition, UserAchievement } from "../models/Achievement.js";
import { notificationQueue } from "../config/queue.js";

/**
 * Default achievement definitions
 * These will be seeded into the database
 */
export const DEFAULT_ACHIEVEMENTS = [
  // ====== GAMES PLAYED ======
  {
    code: "FIRST_GAME",
    name: "First Steps",
    description: "Play your first game",
    category: "milestone",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "count", stat: "totalGamesPlayed", target: 1 },
    order: 1,
  },
  {
    code: "GAMES_10",
    name: "Getting Started",
    description: "Play 10 games",
    category: "milestone",
    tier: "bronze",
    xpReward: 100,
    criteria: { type: "count", stat: "totalGamesPlayed", target: 10 },
    order: 2,
  },
  {
    code: "GAMES_50",
    name: "Regular Player",
    description: "Play 50 games",
    category: "milestone",
    tier: "silver",
    xpReward: 200,
    criteria: { type: "count", stat: "totalGamesPlayed", target: 50 },
    order: 3,
  },
  {
    code: "GAMES_100",
    name: "Dedicated Gamer",
    description: "Play 100 games",
    category: "milestone",
    tier: "gold",
    xpReward: 500,
    criteria: { type: "count", stat: "totalGamesPlayed", target: 100 },
    order: 4,
  },
  {
    code: "GAMES_500",
    name: "Veteran",
    description: "Play 500 games",
    category: "milestone",
    tier: "platinum",
    xpReward: 1000,
    criteria: { type: "count", stat: "totalGamesPlayed", target: 500 },
    order: 5,
  },
  
  // ====== WINS ======
  {
    code: "FIRST_WIN",
    name: "First Victory",
    description: "Win your first game",
    category: "milestone",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "count", stat: "totalWins", target: 1 },
    order: 10,
  },
  {
    code: "WINS_10",
    name: "On a Roll",
    description: "Win 10 games",
    category: "milestone",
    tier: "bronze",
    xpReward: 150,
    criteria: { type: "count", stat: "totalWins", target: 10 },
    order: 11,
  },
  {
    code: "WINS_50",
    name: "Winner",
    description: "Win 50 games",
    category: "milestone",
    tier: "silver",
    xpReward: 300,
    criteria: { type: "count", stat: "totalWins", target: 50 },
    order: 12,
  },
  {
    code: "WINS_100",
    name: "Champion",
    description: "Win 100 games",
    category: "milestone",
    tier: "gold",
    xpReward: 750,
    criteria: { type: "count", stat: "totalWins", target: 100 },
    order: 13,
  },
  
  // ====== STREAKS ======
  {
    code: "STREAK_3",
    name: "Hot Streak",
    description: "Win 3 games in a row",
    category: "streak",
    tier: "bronze",
    xpReward: 75,
    criteria: { type: "streak", stat: "currentStreak", target: 3 },
    order: 20,
  },
  {
    code: "STREAK_5",
    name: "On Fire",
    description: "Win 5 games in a row",
    category: "streak",
    tier: "silver",
    xpReward: 150,
    criteria: { type: "streak", stat: "currentStreak", target: 5 },
    order: 21,
  },
  {
    code: "STREAK_10",
    name: "Unstoppable",
    description: "Win 10 games in a row",
    category: "streak",
    tier: "gold",
    xpReward: 400,
    criteria: { type: "streak", stat: "currentStreak", target: 10 },
    order: 22,
  },
  {
    code: "STREAK_20",
    name: "Legendary",
    description: "Win 20 games in a row",
    category: "streak",
    tier: "diamond",
    xpReward: 1000,
    criteria: { type: "streak", stat: "currentStreak", target: 20 },
    hidden: true,
    order: 23,
  },
  
  // ====== SOCIAL ======
  {
    code: "FIRST_FRIEND",
    name: "Friendly",
    description: "Add your first friend",
    category: "social",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "count", stat: "friendsCount", target: 1 },
    order: 30,
  },
  {
    code: "FRIENDS_10",
    name: "Social Butterfly",
    description: "Add 10 friends",
    category: "social",
    tier: "silver",
    xpReward: 200,
    criteria: { type: "count", stat: "friendsCount", target: 10 },
    order: 31,
  },
  {
    code: "FRIENDS_50",
    name: "Popular",
    description: "Add 50 friends",
    category: "social",
    tier: "gold",
    xpReward: 500,
    criteria: { type: "count", stat: "friendsCount", target: 50 },
    order: 32,
  },
  
  // ====== ELO/RANK ======
  {
    code: "ELO_1200",
    name: "Rising Star",
    description: "Reach 1200 ELO in any game",
    category: "games",
    tier: "bronze",
    xpReward: 100,
    criteria: { type: "threshold", stat: "maxElo", target: 1200 },
    order: 40,
  },
  {
    code: "ELO_1500",
    name: "Skilled Player",
    description: "Reach 1500 ELO in any game",
    category: "games",
    tier: "silver",
    xpReward: 250,
    criteria: { type: "threshold", stat: "maxElo", target: 1500 },
    order: 41,
  },
  {
    code: "ELO_1800",
    name: "Expert",
    description: "Reach 1800 ELO in any game",
    category: "games",
    tier: "gold",
    xpReward: 500,
    criteria: { type: "threshold", stat: "maxElo", target: 1800 },
    order: 42,
  },
  {
    code: "ELO_2000",
    name: "Master",
    description: "Reach 2000 ELO in any game",
    category: "games",
    tier: "platinum",
    xpReward: 1000,
    criteria: { type: "threshold", stat: "maxElo", target: 2000 },
    order: 43,
  },
  
  // ====== GAME-SPECIFIC: TIC TAC TOE ======
  {
    code: "TTT_FIRST_WIN",
    name: "X Marks the Spot",
    description: "Win your first Tic Tac Toe game",
    category: "game-specific",
    game: "Tic Tac Toe",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "count", stat: "wins", target: 1, game: "Tic Tac Toe" },
    order: 100,
  },
  {
    code: "TTT_WINS_25",
    name: "Tic Tac Pro",
    description: "Win 25 Tic Tac Toe games",
    category: "game-specific",
    game: "Tic Tac Toe",
    tier: "silver",
    xpReward: 200,
    criteria: { type: "count", stat: "wins", target: 25, game: "Tic Tac Toe" },
    order: 101,
  },
  
  // ====== GAME-SPECIFIC: MEMORY ======
  {
    code: "MEM_FIRST_WIN",
    name: "Good Memory",
    description: "Win your first Memory game",
    category: "game-specific",
    game: "Memory",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "count", stat: "wins", target: 1, game: "Memory" },
    order: 110,
  },
  {
    code: "MEM_WINS_25",
    name: "Elephant Memory",
    description: "Win 25 Memory games",
    category: "game-specific",
    game: "Memory",
    tier: "silver",
    xpReward: 200,
    criteria: { type: "count", stat: "wins", target: 25, game: "Memory" },
    order: 111,
  },
  
  // ====== GAME-SPECIFIC: DOTS AND BOXES ======
  {
    code: "DAB_FIRST_WIN",
    name: "Box Collector",
    description: "Win your first Dots and Boxes game",
    category: "game-specific",
    game: "Dots and Boxes",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "count", stat: "wins", target: 1, game: "Dots and Boxes" },
    order: 120,
  },
  {
    code: "DAB_WINS_25",
    name: "Box Master",
    description: "Win 25 Dots and Boxes games",
    category: "game-specific",
    game: "Dots and Boxes",
    tier: "silver",
    xpReward: 200,
    criteria: { type: "count", stat: "wins", target: 25, game: "Dots and Boxes" },
    order: 121,
  },
  
  // ====== GAME-SPECIFIC: SNAKES AND LADDERS ======
  {
    code: "SNL_FIRST_WIN",
    name: "Lucky Climber",
    description: "Win your first Snakes and Ladders game",
    category: "game-specific",
    game: "Snakes and Ladders",
    tier: "bronze",
    xpReward: 50,
    criteria: { type: "count", stat: "wins", target: 1, game: "Snakes and Ladders" },
    order: 130,
  },
  {
    code: "SNL_WINS_25",
    name: "Ladder Expert",
    description: "Win 25 Snakes and Ladders games",
    category: "game-specific",
    game: "Snakes and Ladders",
    tier: "silver",
    xpReward: 200,
    criteria: { type: "count", stat: "wins", target: 25, game: "Snakes and Ladders" },
    order: 131,
  },
  
  // ====== LEVEL ======
  {
    code: "LEVEL_5",
    name: "Level 5",
    description: "Reach level 5",
    category: "milestone",
    tier: "bronze",
    xpReward: 100,
    criteria: { type: "threshold", stat: "level", target: 5 },
    order: 50,
  },
  {
    code: "LEVEL_10",
    name: "Level 10",
    description: "Reach level 10",
    category: "milestone",
    tier: "silver",
    xpReward: 200,
    criteria: { type: "threshold", stat: "level", target: 10 },
    order: 51,
  },
  {
    code: "LEVEL_25",
    name: "Level 25",
    description: "Reach level 25",
    category: "milestone",
    tier: "gold",
    xpReward: 500,
    criteria: { type: "threshold", stat: "level", target: 25 },
    order: 52,
  },
  {
    code: "LEVEL_50",
    name: "Level 50",
    description: "Reach level 50",
    category: "milestone",
    tier: "platinum",
    xpReward: 1000,
    criteria: { type: "threshold", stat: "level", target: 50 },
    order: 53,
  },
];

/**
 * Seed achievements into database
 */
export async function seedAchievements() {
  try {
    for (const achievement of DEFAULT_ACHIEVEMENTS) {
      await AchievementDefinition.findOneAndUpdate(
        { code: achievement.code },
        achievement,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${DEFAULT_ACHIEVEMENTS.length} achievements`);
  } catch (error) {
    console.error("❌ Error seeding achievements:", error);
  }
}

/**
 * Check if a user qualifies for any new achievements
 * @param {string} userId - User ID
 * @param {Object} userStats - User's current stats
 * @returns {Array} Newly unlocked achievements
 */
export async function checkAchievements(userId, userStats) {
  const unlockedAchievements = [];
  
  try {
    // Get all active achievement definitions
    const achievements = await AchievementDefinition.find({ active: true });
    
    // Get user's existing achievements
    const existingAchievements = await UserAchievement.find({ 
      userId, 
      completed: true 
    }).select("achievementCode");
    
    const existingCodes = new Set(existingAchievements.map(a => a.achievementCode));
    
    for (const achievement of achievements) {
      // Skip if already unlocked
      if (existingCodes.has(achievement.code)) continue;
      
      // Check criteria
      const qualified = checkAchievementCriteria(achievement, userStats);
      
      if (qualified) {
        // Unlock the achievement
        const userAchievement = new UserAchievement({
          userId,
          achievementCode: achievement.code,
          completed: true,
          progress: achievement.criteria.target,
        });
        
        await userAchievement.save();
        
        unlockedAchievements.push({
          ...achievement.toObject(),
          unlockedAt: userAchievement.unlockedAt,
        });
        
        // Queue notification
        try {
          await notificationQueue.add({
            type: "achievement",
            userId,
            data: {
              achievementCode: achievement.code,
              achievementName: achievement.name,
              tier: achievement.tier,
              xpReward: achievement.xpReward,
            },
          });
        } catch (e) {
          console.warn("Failed to queue achievement notification:", e.message);
        }
      }
    }
    
    return unlockedAchievements;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
}

/**
 * Check if user meets achievement criteria
 * @param {Object} achievement - Achievement definition
 * @param {Object} userStats - User's stats
 * @returns {boolean} Whether criteria is met
 */
function checkAchievementCriteria(achievement, userStats) {
  const { criteria } = achievement;
  
  switch (criteria.type) {
    case "count":
    case "threshold":
      // Get the stat value
      let statValue;
      
      if (criteria.game) {
        // Game-specific stat
        const gameStats = userStats.gameStats?.find(g => g.gameName === criteria.game);
        statValue = gameStats?.[criteria.stat] || 0;
      } else if (criteria.stat === "friendsCount") {
        statValue = userStats.friends?.length || 0;
      } else if (criteria.stat === "maxElo") {
        // Find highest ELO across all games
        statValue = Math.max(
          ...(userStats.gameStats?.map(g => g.elo) || [1000]),
          1000
        );
      } else {
        statValue = userStats[criteria.stat] || 0;
      }
      
      return statValue >= criteria.target;
      
    case "streak":
      const streakValue = userStats[criteria.stat] || 0;
      return streakValue >= criteria.target;
      
    case "special":
      // Handle special achievements separately
      return false;
      
    default:
      return false;
  }
}

/**
 * Get user's achievements with progress
 * @param {string} userId - User ID
 * @returns {Object} Achievements data
 */
export async function getUserAchievements(userId) {
  const [definitions, userAchievements] = await Promise.all([
    AchievementDefinition.find({ active: true }).sort("order"),
    UserAchievement.find({ userId }),
  ]);
  
  const userAchievementMap = new Map(
    userAchievements.map(a => [a.achievementCode, a])
  );
  
  const achievements = definitions.map(def => {
    const userAchievement = userAchievementMap.get(def.code);
    
    return {
      ...def.toObject(),
      unlocked: userAchievement?.completed || false,
      unlockedAt: userAchievement?.unlockedAt || null,
      progress: userAchievement?.progress || 0,
      seen: userAchievement?.seen || false,
    };
  });
  
  // Group by category
  const grouped = {
    milestone: [],
    streak: [],
    social: [],
    games: [],
    "game-specific": {},
    special: [],
  };
  
  for (const achievement of achievements) {
    if (achievement.category === "game-specific") {
      const game = achievement.game || "Other";
      if (!grouped["game-specific"][game]) {
        grouped["game-specific"][game] = [];
      }
      grouped["game-specific"][game].push(achievement);
    } else {
      grouped[achievement.category]?.push(achievement);
    }
  }
  
  const stats = {
    total: definitions.length,
    unlocked: userAchievements.filter(a => a.completed).length,
    points: userAchievements
      .filter(a => a.completed)
      .reduce((sum, a) => {
        const def = definitions.find(d => d.code === a.achievementCode);
        return sum + (def?.xpReward || 0);
      }, 0),
  };
  
  return { achievements: grouped, stats };
}

/**
 * Mark achievements as seen
 * @param {string} userId - User ID
 * @param {Array} achievementCodes - Achievement codes to mark
 */
export async function markAchievementsSeen(userId, achievementCodes) {
  await UserAchievement.updateMany(
    { userId, achievementCode: { $in: achievementCodes } },
    { seen: true }
  );
}

export default {
  seedAchievements,
  checkAchievements,
  getUserAchievements,
  markAchievementsSeen,
  DEFAULT_ACHIEVEMENTS,
};
