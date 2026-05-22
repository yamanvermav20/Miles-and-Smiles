/**
 * XP and Leveling Service
 * Handles experience points calculation and level progression
 */

// XP required for each level (exponential curve)
// Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 300 XP, etc.
const BASE_XP = 100;
const XP_MULTIPLIER = 1.5;

/**
 * Calculate total XP required for a specific level
 * @param {number} level - Target level
 * @returns {number} Total XP required
 */
export function getXpForLevel(level) {
  if (level <= 1) return 0;
  
  let totalXp = 0;
  for (let i = 2; i <= level; i++) {
    totalXp += Math.floor(BASE_XP * Math.pow(XP_MULTIPLIER, i - 2));
  }
  return totalXp;
}

/**
 * Calculate XP needed for the next level
 * @param {number} currentLevel - Current level
 * @returns {number} XP needed for next level
 */
export function getXpForNextLevel(currentLevel) {
  return Math.floor(BASE_XP * Math.pow(XP_MULTIPLIER, currentLevel - 1));
}

/**
 * Calculate level from total XP
 * @param {number} totalXp - Total XP accumulated
 * @returns {Object} Level info { level, currentLevelXp, xpForNextLevel, progress }
 */
export function getLevelFromXp(totalXp) {
  let level = 1;
  let remainingXp = totalXp;
  
  while (true) {
    const xpNeeded = getXpForNextLevel(level);
    if (remainingXp < xpNeeded) {
      break;
    }
    remainingXp -= xpNeeded;
    level++;
    
    // Safety cap at level 100
    if (level >= 100) break;
  }
  
  const xpForNextLevel = getXpForNextLevel(level);
  
  return {
    level,
    currentLevelXp: remainingXp,
    xpForNextLevel,
    progress: Math.round((remainingXp / xpForNextLevel) * 100),
  };
}

/**
 * XP rewards for different actions
 */
export const XP_REWARDS = {
  // Game results
  GAME_WIN: 50,
  GAME_LOSS: 15,
  GAME_DRAW: 30,
  
  // Ranked bonuses
  RANKED_WIN_BONUS: 25,
  RANKED_LOSS_BONUS: 10,
  
  // Streak bonuses
  WIN_STREAK_3: 20,
  WIN_STREAK_5: 50,
  WIN_STREAK_10: 100,
  
  // First time bonuses
  FIRST_GAME: 100,
  FIRST_WIN: 50,
  
  // Social bonuses
  ADD_FRIEND: 10,
  PLAY_WITH_FRIEND: 15,
  
  // Achievement bonuses (base, multiplied by tier)
  ACHIEVEMENT_BRONZE: 25,
  ACHIEVEMENT_SILVER: 50,
  ACHIEVEMENT_GOLD: 100,
  ACHIEVEMENT_PLATINUM: 200,
  ACHIEVEMENT_DIAMOND: 500,
  
  // Daily bonuses
  DAILY_LOGIN: 25,
  DAILY_FIRST_GAME: 30,
};

/**
 * Calculate XP earned from a game result
 * @param {Object} options - Game result options
 * @returns {Object} XP breakdown and total
 */
export function calculateGameXp({
  result, // "win", "loss", "draw"
  isRanked = false,
  winStreak = 0,
  playedWithFriend = false,
  isFirstGame = false,
  isFirstWin = false,
}) {
  const breakdown = [];
  let total = 0;
  
  // Base XP for result
  switch (result) {
    case "win":
      total += XP_REWARDS.GAME_WIN;
      breakdown.push({ reason: "Victory", xp: XP_REWARDS.GAME_WIN });
      break;
    case "loss":
      total += XP_REWARDS.GAME_LOSS;
      breakdown.push({ reason: "Participation", xp: XP_REWARDS.GAME_LOSS });
      break;
    case "draw":
      total += XP_REWARDS.GAME_DRAW;
      breakdown.push({ reason: "Draw", xp: XP_REWARDS.GAME_DRAW });
      break;
  }
  
  // Ranked bonus
  if (isRanked) {
    const bonus = result === "win" ? XP_REWARDS.RANKED_WIN_BONUS : XP_REWARDS.RANKED_LOSS_BONUS;
    total += bonus;
    breakdown.push({ reason: "Ranked Match", xp: bonus });
  }
  
  // Win streak bonus
  if (result === "win") {
    if (winStreak >= 10) {
      total += XP_REWARDS.WIN_STREAK_10;
      breakdown.push({ reason: "10 Win Streak!", xp: XP_REWARDS.WIN_STREAK_10 });
    } else if (winStreak >= 5) {
      total += XP_REWARDS.WIN_STREAK_5;
      breakdown.push({ reason: "5 Win Streak!", xp: XP_REWARDS.WIN_STREAK_5 });
    } else if (winStreak >= 3) {
      total += XP_REWARDS.WIN_STREAK_3;
      breakdown.push({ reason: "3 Win Streak!", xp: XP_REWARDS.WIN_STREAK_3 });
    }
  }
  
  // First time bonuses
  if (isFirstGame) {
    total += XP_REWARDS.FIRST_GAME;
    breakdown.push({ reason: "First Game!", xp: XP_REWARDS.FIRST_GAME });
  }
  
  if (isFirstWin && result === "win") {
    total += XP_REWARDS.FIRST_WIN;
    breakdown.push({ reason: "First Win!", xp: XP_REWARDS.FIRST_WIN });
  }
  
  // Friend bonus
  if (playedWithFriend) {
    total += XP_REWARDS.PLAY_WITH_FRIEND;
    breakdown.push({ reason: "Played with Friend", xp: XP_REWARDS.PLAY_WITH_FRIEND });
  }
  
  return { breakdown, total };
}

/**
 * Get achievement XP by tier
 * @param {string} tier - Achievement tier
 * @returns {number} XP reward
 */
export function getAchievementXp(tier) {
  const tierMap = {
    bronze: XP_REWARDS.ACHIEVEMENT_BRONZE,
    silver: XP_REWARDS.ACHIEVEMENT_SILVER,
    gold: XP_REWARDS.ACHIEVEMENT_GOLD,
    platinum: XP_REWARDS.ACHIEVEMENT_PLATINUM,
    diamond: XP_REWARDS.ACHIEVEMENT_DIAMOND,
  };
  
  return tierMap[tier.toLowerCase()] || XP_REWARDS.ACHIEVEMENT_BRONZE;
}

/**
 * Get level title/rank name
 * @param {number} level - Player level
 * @returns {Object} Title info
 */
export function getLevelTitle(level) {
  const titles = [
    { minLevel: 1, name: "Newcomer", color: "#A0A0A0" },
    { minLevel: 5, name: "Beginner", color: "#8BC34A" },
    { minLevel: 10, name: "Amateur", color: "#4CAF50" },
    { minLevel: 15, name: "Competitor", color: "#2196F3" },
    { minLevel: 20, name: "Skilled", color: "#3F51B5" },
    { minLevel: 30, name: "Expert", color: "#9C27B0" },
    { minLevel: 40, name: "Veteran", color: "#E91E63" },
    { minLevel: 50, name: "Master", color: "#FF9800" },
    { minLevel: 60, name: "Grandmaster", color: "#FF5722" },
    { minLevel: 75, name: "Champion", color: "#F44336" },
    { minLevel: 90, name: "Legend", color: "#FFD700" },
    { minLevel: 100, name: "Mythic", color: "#00BCD4" },
  ];
  
  for (let i = titles.length - 1; i >= 0; i--) {
    if (level >= titles[i].minLevel) {
      return titles[i];
    }
  }
  
  return titles[0];
}

export default {
  getXpForLevel,
  getXpForNextLevel,
  getLevelFromXp,
  calculateGameXp,
  getAchievementXp,
  getLevelTitle,
  XP_REWARDS,
};
