/**
 * Unit tests for ELO Service
 */

import {
  calculateExpectedScore,
  calculateEloChange,
  calculateNewElo,
  getKFactor,
  getRankTier,
} from "../../../src/services/eloService.js";

describe("ELO Service", () => {
  describe("calculateExpectedScore", () => {
    it("should return 0.5 for equal ratings", () => {
      const expected = calculateExpectedScore(1500, 1500);
      expect(expected).toBeCloseTo(0.5, 2);
    });

    it("should return higher expected for higher rated player", () => {
      const expected = calculateExpectedScore(1700, 1500);
      expect(expected).toBeGreaterThan(0.5);
      expect(expected).toBeLessThan(1);
    });

    it("should return lower expected for lower rated player", () => {
      const expected = calculateExpectedScore(1300, 1500);
      expect(expected).toBeLessThan(0.5);
      expect(expected).toBeGreaterThan(0);
    });

    it("should follow ELO formula (400 point difference = ~91%)", () => {
      const expected = calculateExpectedScore(1900, 1500);
      expect(expected).toBeCloseTo(0.909, 2);
    });
  });

  describe("getKFactor", () => {
    it("should return higher K for provisional players", () => {
      const k = getKFactor(1200, 15);
      expect(k).toBe(40);
    });

    it("should return medium K for established players", () => {
      const k = getKFactor(1200, 50);
      expect(k).toBe(20);
    });

    it("should return lower K for high-rated players", () => {
      const k = getKFactor(2500, 100);
      expect(k).toBe(10);
    });

    it("should use games played to determine provisional status", () => {
      const provisionalK = getKFactor(1000, 29);
      const establishedK = getKFactor(1000, 30);
      expect(provisionalK).toBe(40);
      expect(establishedK).toBe(20);
    });
  });

  describe("calculateEloChange", () => {
    it("should give positive change for win", () => {
      const change = calculateEloChange(1500, 1500, 1, 20);
      expect(change).toBeGreaterThan(0);
    });

    it("should give negative change for loss", () => {
      const change = calculateEloChange(1500, 1500, 0, 20);
      expect(change).toBeLessThan(0);
    });

    it("should give zero change for draw against equal opponent", () => {
      const change = calculateEloChange(1500, 1500, 0.5, 20);
      expect(change).toBeCloseTo(0, 1);
    });

    it("should give larger gain for upset win", () => {
      const normalWin = calculateEloChange(1500, 1500, 1, 20);
      const upsetWin = calculateEloChange(1300, 1500, 1, 20);
      expect(upsetWin).toBeGreaterThan(normalWin);
    });

    it("should give smaller gain for expected win", () => {
      const normalWin = calculateEloChange(1500, 1500, 1, 20);
      const expectedWin = calculateEloChange(1700, 1500, 1, 20);
      expect(expectedWin).toBeLessThan(normalWin);
    });
  });

  describe("calculateNewElo", () => {
    it("should update both players ratings", () => {
      const result = calculateNewElo({
        winner: { odId: "1", elo: 1500, gamesPlayed: 50 },
        loser: { odId: "2", elo: 1500, gamesPlayed: 50 },
        isDraw: false,
      });

      expect(result.winner.newElo).toBeGreaterThan(1500);
      expect(result.loser.newElo).toBeLessThan(1500);
    });

    it("should handle draw correctly", () => {
      const result = calculateNewElo({
        winner: { odId: "1", elo: 1500, gamesPlayed: 50 },
        loser: { odId: "2", elo: 1500, gamesPlayed: 50 },
        isDraw: true,
      });

      // Equal players draw = no change
      expect(result.winner.change).toBeCloseTo(0, 1);
      expect(result.loser.change).toBeCloseTo(0, 1);
    });

    it("should not go below minimum ELO", () => {
      const result = calculateNewElo({
        winner: { odId: "1", elo: 1500, gamesPlayed: 50 },
        loser: { odId: "2", elo: 100, gamesPlayed: 50 },
        isDraw: false,
      });

      expect(result.loser.newElo).toBeGreaterThanOrEqual(100);
    });
  });

  describe("getRankTier", () => {
    it("should return Iron for low ELO", () => {
      expect(getRankTier(400)).toBe("Iron");
      expect(getRankTier(599)).toBe("Iron");
    });

    it("should return Bronze for 600-799", () => {
      expect(getRankTier(600)).toBe("Bronze");
      expect(getRankTier(799)).toBe("Bronze");
    });

    it("should return correct tier progression", () => {
      expect(getRankTier(800)).toBe("Silver");
      expect(getRankTier(1000)).toBe("Gold");
      expect(getRankTier(1200)).toBe("Platinum");
      expect(getRankTier(1400)).toBe("Diamond");
      expect(getRankTier(1600)).toBe("Master");
      expect(getRankTier(1900)).toBe("Grandmaster");
    });

    it("should return Grandmaster for very high ELO", () => {
      expect(getRankTier(2500)).toBe("Grandmaster");
      expect(getRankTier(3000)).toBe("Grandmaster");
    });
  });
});
