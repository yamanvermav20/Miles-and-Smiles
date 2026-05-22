/**
 * Game Event Worker
 * Processes game-related background jobs:
 * - Match completion
 * - Achievement unlocks
 * - ELO updates
 * - Statistics updates
 */

import Bull from "bull";
import User from "../models/User.js";
import Match from "../models/Match.js";
import { calculateMatchEloChanges } from "../services/eloService.js";
import { calculateGameXp, getLevelFromXp } from "../services/xpService.js";
import { checkAchievements } from "../services/achievementService.js";
import { notificationQueue } from "../config/queue.js";

const isTest = process.env.NODE_ENV === "test" || !!process.env.JEST_WORKER_ID;

// Create queues
let gameEventQueue;
let matchmakingQueue;
let achievementQueue;

if (!isTest) {
  const redisConfig = {
    port: parseInt(process.env.REDIS_PORT) || 6379,
    host: process.env.REDIS_HOST || "localhost",
    password: process.env.REDIS_PASSWORD || undefined,
  };

  gameEventQueue = new Bull("game-events", {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  matchmakingQueue = new Bull("matchmaking", {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  achievementQueue = new Bull("achievements", {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  // Process game events
  gameEventQueue.process("match-complete", async (job) => {
    const { matchId, game, players, winnerId, matchType, duration } = job.data;
    console.log(`📊 Processing match completion: ${matchId}`);

    try {
      const isDraw = !winnerId;
      const isRanked = matchType === "ranked";

      for (const player of players) {
        const user = await User.findById(player.userId);
        if (!user) continue;

        const isWinner = player.userId === winnerId;
        const result = isDraw ? "draw" : (isWinner ? "win" : "loss");

        // Get or create game stats
        let gameStats = user.gameStats.find(s => s.gameName === game);
        if (!gameStats) {
          gameStats = {
            gameName: game,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            elo: 1000,
            peakElo: 1000,
            currentWinStreak: 0,
            longestWinStreak: 0,
          };
          user.gameStats.push(gameStats);
        }

        // Update stats
        gameStats.gamesPlayed++;
        if (result === "win") {
          gameStats.wins++;
          gameStats.currentWinStreak++;
        } else if (result === "loss") {
          gameStats.losses++;
          gameStats.currentWinStreak = 0;
        } else {
          gameStats.draws++;
        }
        gameStats.longestWinStreak = Math.max(gameStats.longestWinStreak, gameStats.currentWinStreak);
        gameStats.lastPlayed = new Date();

        // Update overall stats
        user.totalGamesPlayed++;
        if (result === "win") {
          user.totalWins++;
          user.currentStreak++;
        } else if (result === "loss") {
          user.totalLosses++;
          user.currentStreak = 0;
        } else {
          user.totalDraws++;
        }
        user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
        user.lastGamePlayed = new Date();

        // Calculate XP
        const xpResult = calculateGameXp({
          result,
          isRanked,
          winStreak: gameStats.currentWinStreak,
          isFirstGame: user.totalGamesPlayed === 1,
          isFirstWin: user.totalWins === 1 && result === "win",
        });

        user.xp += xpResult.total;

        // Update level
        const levelInfo = getLevelFromXp(user.xp);
        const leveledUp = levelInfo.level > user.level;
        user.level = levelInfo.level;

        await user.save();

        // Queue achievement check
        await achievementQueue.add("check", {
          userId: player.userId,
          trigger: "game-complete",
          game,
          result,
        });

        // Send XP notification
        await notificationQueue.add({
          type: "xp-gained",
          userId: player.userId,
          data: {
            xp: xpResult.total,
            breakdown: xpResult.breakdown,
            leveledUp,
            newLevel: levelInfo.level,
          },
        });
      }

      // Update match record
      await Match.findByIdAndUpdate(matchId, {
        status: "completed",
        endedAt: new Date(),
        duration,
      });

      console.log(`✅ Match ${matchId} processed successfully`);
    } catch (error) {
      console.error(`❌ Error processing match ${matchId}:`, error);
      throw error;
    }
  });

  // Process ELO updates for ranked matches
  gameEventQueue.process("elo-update", async (job) => {
    const { game, player1, player2, result } = job.data;
    console.log(`📊 Processing ELO update for ${game}`);

    try {
      const [user1, user2] = await Promise.all([
        User.findById(player1.userId),
        User.findById(player2.userId),
      ]);

      if (!user1 || !user2) {
        throw new Error("Users not found");
      }

      const getStats = (user) => {
        let stats = user.gameStats.find(s => s.gameName === game);
        if (!stats) {
          stats = { gameName: game, elo: 1000, peakElo: 1000, rankedGamesPlayed: 0 };
          user.gameStats.push(stats);
        }
        return stats;
      };

      const stats1 = getStats(user1);
      const stats2 = getStats(user2);

      const eloChanges = calculateMatchEloChanges(
        { elo: stats1.elo, gamesPlayed: stats1.rankedGamesPlayed },
        { elo: stats2.elo, gamesPlayed: stats2.rankedGamesPlayed },
        result
      );

      // Update ELO
      stats1.elo = eloChanges.player1.newElo;
      stats2.elo = eloChanges.player2.newElo;
      stats1.peakElo = Math.max(stats1.peakElo, stats1.elo);
      stats2.peakElo = Math.max(stats2.peakElo, stats2.elo);
      stats1.rankedGamesPlayed++;
      stats2.rankedGamesPlayed++;

      // Store ELO history
      stats1.eloHistory = stats1.eloHistory || [];
      stats2.eloHistory = stats2.eloHistory || [];
      stats1.eloHistory.push({ elo: stats1.elo, change: eloChanges.player1.change, date: new Date() });
      stats2.eloHistory.push({ elo: stats2.elo, change: eloChanges.player2.change, date: new Date() });

      // Keep only last 50 entries
      if (stats1.eloHistory.length > 50) stats1.eloHistory = stats1.eloHistory.slice(-50);
      if (stats2.eloHistory.length > 50) stats2.eloHistory = stats2.eloHistory.slice(-50);

      await Promise.all([user1.save(), user2.save()]);

      // Send ELO change notifications
      await Promise.all([
        notificationQueue.add({
          type: "elo-change",
          userId: player1.userId,
          data: {
            game,
            change: eloChanges.player1.change,
            newElo: eloChanges.player1.newElo,
          },
        }),
        notificationQueue.add({
          type: "elo-change",
          userId: player2.userId,
          data: {
            game,
            change: eloChanges.player2.change,
            newElo: eloChanges.player2.newElo,
          },
        }),
      ]);

      console.log(`✅ ELO updated: ${user1.username} (${eloChanges.player1.change}) | ${user2.username} (${eloChanges.player2.change})`);
    } catch (error) {
      console.error("❌ Error processing ELO update:", error);
      throw error;
    }
  });

  // Process achievement checks
  achievementQueue.process("check", async (job) => {
    const { userId, trigger, game, result } = job.data;
    console.log(`🏆 Checking achievements for user ${userId}`);

    try {
      const user = await User.findById(userId);
      if (!user) return;

      const unlockedAchievements = await checkAchievements(userId, user);

      if (unlockedAchievements.length > 0) {
        console.log(`🎉 User ${userId} unlocked ${unlockedAchievements.length} achievements`);

        // Update achievement count
        user.achievementCount += unlockedAchievements.length;
        await user.save();

        // Send notifications for each achievement
        for (const achievement of unlockedAchievements) {
          await notificationQueue.add({
            type: "achievement",
            userId,
            data: {
              achievementCode: achievement.code,
              achievementName: achievement.name,
              description: achievement.description,
              tier: achievement.tier,
              xpReward: achievement.xpReward,
              icon: achievement.icon,
            },
          });
        }
      }
    } catch (error) {
      console.error("❌ Error checking achievements:", error);
      throw error;
    }
  });

  // Log queue events
  gameEventQueue.on("completed", (job) => {
    console.log(`✅ Game event job ${job.id} completed`);
  });

  gameEventQueue.on("failed", (job, err) => {
    console.error(`❌ Game event job ${job.id} failed:`, err.message);
  });

  achievementQueue.on("completed", (job) => {
    console.log(`✅ Achievement job ${job.id} completed`);
  });

  achievementQueue.on("failed", (job, err) => {
    console.error(`❌ Achievement job ${job.id} failed:`, err.message);
  });
} else {
  // Mock queues for testing
  gameEventQueue = {
    add: async () => ({ id: "mock-job" }),
    process: () => {},
    on: () => {},
  };
  matchmakingQueue = {
    add: async () => ({ id: "mock-job" }),
    process: () => {},
    on: () => {},
  };
  achievementQueue = {
    add: async () => ({ id: "mock-job" }),
    process: () => {},
    on: () => {},
  };
}

export { gameEventQueue, matchmakingQueue, achievementQueue };
