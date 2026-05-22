/**
 * ELO Rating Service
 * Handles ELO calculations for skill-based matchmaking and ranking
 */

// K-factor determines how much ratings change after each game
const K_FACTORS = {
  provisional: 40,  // Players with < 30 games
  established: 20,  // Players with >= 30 games
  master: 10,       // Players with ELO > 2000
};

/**
 * Calculate expected score based on ELO difference
 * @param {number} playerElo - Current player's ELO
 * @param {number} opponentElo - Opponent's ELO
 * @returns {number} Expected score (0-1)
 */
export function calculateExpectedScore(playerElo, opponentElo) {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Get K-factor based on player stats
 * @param {number} elo - Player's current ELO
 * @param {number} gamesPlayed - Number of ranked games played
 * @returns {number} K-factor
 */
export function getKFactor(elo, gamesPlayed) {
  if (gamesPlayed < 30) return K_FACTORS.provisional;
  if (elo > 2000) return K_FACTORS.master;
  return K_FACTORS.established;
}

/**
 * Calculate new ELO rating after a match
 * @param {number} playerElo - Current player's ELO
 * @param {number} opponentElo - Opponent's ELO
 * @param {number} actualScore - Actual result (1 = win, 0.5 = draw, 0 = loss)
 * @param {number} gamesPlayed - Player's total ranked games
 * @returns {Object} New ELO and change amount
 */
export function calculateNewElo(playerElo, opponentElo, actualScore, gamesPlayed = 30) {
  const expectedScore = calculateExpectedScore(playerElo, opponentElo);
  const kFactor = getKFactor(playerElo, gamesPlayed);
  
  const change = Math.round(kFactor * (actualScore - expectedScore));
  const newElo = Math.max(100, playerElo + change); // Minimum ELO of 100
  
  return {
    newElo,
    change,
    expectedScore: Math.round(expectedScore * 100) / 100,
  };
}

/**
 * Calculate ELO changes for both players after a match
 * @param {Object} player1 - { elo, gamesPlayed }
 * @param {Object} player2 - { elo, gamesPlayed }
 * @param {string} result - "player1", "player2", or "draw"
 * @returns {Object} ELO changes for both players
 */
export function calculateMatchEloChanges(player1, player2, result) {
  let p1Score, p2Score;
  
  switch (result) {
    case "player1":
      p1Score = 1;
      p2Score = 0;
      break;
    case "player2":
      p1Score = 0;
      p2Score = 1;
      break;
    case "draw":
      p1Score = 0.5;
      p2Score = 0.5;
      break;
    default:
      throw new Error(`Invalid result: ${result}`);
  }
  
  const p1Result = calculateNewElo(player1.elo, player2.elo, p1Score, player1.gamesPlayed);
  const p2Result = calculateNewElo(player2.elo, player1.elo, p2Score, player2.gamesPlayed);
  
  return {
    player1: p1Result,
    player2: p2Result,
  };
}

/**
 * Get rank tier from ELO
 * @param {number} elo - Player's ELO
 * @returns {Object} Rank tier info
 */
export function getRankTier(elo) {
  const tiers = [
    { name: "Grandmaster", minElo: 2200, icon: "👑", color: "#FF6B6B" },
    { name: "Master", minElo: 2000, icon: "💎", color: "#9B59B6" },
    { name: "Diamond", minElo: 1800, icon: "💠", color: "#3498DB" },
    { name: "Platinum", minElo: 1600, icon: "🔷", color: "#1ABC9C" },
    { name: "Gold", minElo: 1400, icon: "🥇", color: "#F1C40F" },
    { name: "Silver", minElo: 1200, icon: "🥈", color: "#BDC3C7" },
    { name: "Bronze", minElo: 1000, icon: "🥉", color: "#CD7F32" },
    { name: "Iron", minElo: 0, icon: "⚙️", color: "#7F8C8D" },
  ];
  
  for (const tier of tiers) {
    if (elo >= tier.minElo) {
      return tier;
    }
  }
  
  return tiers[tiers.length - 1];
}

/**
 * Check if two players are within matchmaking ELO range
 * @param {number} elo1 - First player's ELO
 * @param {number} elo2 - Second player's ELO
 * @param {number} maxDifference - Maximum allowed ELO difference
 * @returns {boolean} Whether players can be matched
 */
export function isWithinMatchmakingRange(elo1, elo2, maxDifference = 200) {
  return Math.abs(elo1 - elo2) <= maxDifference;
}

/**
 * Calculate matchmaking score (lower = better match)
 * @param {Object} player1 - First player's queue entry
 * @param {Object} player2 - Second player's queue entry
 * @returns {number} Match quality score
 */
export function calculateMatchScore(player1, player2) {
  const eloDiff = Math.abs(player1.elo - player2.elo);
  const waitTime1 = Date.now() - new Date(player1.joinedAt).getTime();
  const waitTime2 = Date.now() - new Date(player2.joinedAt).getTime();
  const avgWaitTime = (waitTime1 + waitTime2) / 2;
  
  // Lower score = better match
  // ELO difference matters most, but wait time also factors in
  const eloScore = eloDiff;
  const waitBonus = Math.min(avgWaitTime / 1000, 100); // Up to 100 point bonus for waiting
  
  return eloScore - waitBonus;
}

export default {
  calculateExpectedScore,
  getKFactor,
  calculateNewElo,
  calculateMatchEloChanges,
  getRankTier,
  isWithinMatchmakingRange,
  calculateMatchScore,
};
