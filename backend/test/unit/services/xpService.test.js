/**
 * Unit tests for XP Service
 */

import {
  calculateLevel,
  calculateXpForLevel,
  calculateXpProgress,
  XP_REWARDS,
} from "../../../src/services/xpService.js";

describe("XP Service", () => {
  describe("calculateXpForLevel", () => {
    it("should return 0 XP for level 1", () => {
      expect(calculateXpForLevel(1)).toBe(0);
    });

    it("should return correct XP for level 2", () => {
      // Base XP * 2^1.5 = 100 * 2.83 ≈ 283
      expect(calculateXpForLevel(2)).toBeGreaterThan(200);
      expect(calculateXpForLevel(2)).toBeLessThan(400);
    });

    it("should increase exponentially with level", () => {
      const level5Xp = calculateXpForLevel(5);
      const level10Xp = calculateXpForLevel(10);
      const level20Xp = calculateXpForLevel(20);

      expect(level10Xp).toBeGreaterThan(level5Xp * 2);
      expect(level20Xp).toBeGreaterThan(level10Xp * 2);
    });

    it("should handle high levels", () => {
      const level50Xp = calculateXpForLevel(50);
      expect(level50Xp).toBeGreaterThan(0);
      expect(level50Xp).toBeLessThan(Infinity);
    });
  });

  describe("calculateLevel", () => {
    it("should return level 1 for 0 XP", () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it("should return level 1 for small XP amounts", () => {
      expect(calculateLevel(100)).toBe(1);
    });

    it("should return correct level for XP", () => {
      const level5Threshold = calculateXpForLevel(5);
      expect(calculateLevel(level5Threshold)).toBe(5);
      expect(calculateLevel(level5Threshold - 1)).toBe(4);
      expect(calculateLevel(level5Threshold + 1)).toBe(5);
    });

    it("should handle large XP values", () => {
      expect(calculateLevel(1000000)).toBeGreaterThan(10);
    });
  });

  describe("calculateXpProgress", () => {
    it("should return 0% progress at level start", () => {
      const level5Threshold = calculateXpForLevel(5);
      const progress = calculateXpProgress(level5Threshold);
      expect(progress.progressPercent).toBeCloseTo(0, 1);
    });

    it("should return correct progress info", () => {
      const progress = calculateXpProgress(500);
      
      expect(progress).toHaveProperty("level");
      expect(progress).toHaveProperty("currentXp");
      expect(progress).toHaveProperty("xpForCurrentLevel");
      expect(progress).toHaveProperty("xpForNextLevel");
      expect(progress).toHaveProperty("progressPercent");
    });

    it("should show progress towards next level", () => {
      const level5 = calculateXpForLevel(5);
      const level6 = calculateXpForLevel(6);
      const midpoint = Math.floor((level5 + level6) / 2);
      
      const progress = calculateXpProgress(midpoint);
      expect(progress.level).toBe(5);
      expect(progress.progressPercent).toBeGreaterThan(40);
      expect(progress.progressPercent).toBeLessThan(60);
    });
  });

  describe("XP_REWARDS", () => {
    it("should have all required reward types", () => {
      expect(XP_REWARDS.GAME_WIN).toBeDefined();
      expect(XP_REWARDS.GAME_LOSS).toBeDefined();
      expect(XP_REWARDS.GAME_DRAW).toBeDefined();
      expect(XP_REWARDS.ACHIEVEMENT_UNLOCKED).toBeDefined();
      expect(XP_REWARDS.DAILY_LOGIN).toBeDefined();
    });

    it("should have win > draw > loss", () => {
      expect(XP_REWARDS.GAME_WIN).toBeGreaterThan(XP_REWARDS.GAME_DRAW);
      expect(XP_REWARDS.GAME_DRAW).toBeGreaterThan(XP_REWARDS.GAME_LOSS);
    });

    it("should have positive values for participation", () => {
      expect(XP_REWARDS.GAME_LOSS).toBeGreaterThan(0);
    });
  });
});
