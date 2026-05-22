/**
 * Turn Engine Configuration
 * Default settings and type definitions for turn-based games
 */

/**
 * @typedef {Object} TurnEngineConfig
 * @property {number} turnTimeLimit - Time limit per turn in seconds (0 = no limit)
 * @property {number} totalTimeLimit - Total time per player in seconds (0 = no limit)
 * @property {boolean} autoForfeitOnTimeout - Auto forfeit when time runs out
 * @property {number} gracePeriod - Extra seconds after timeout before forfeit
 * @property {boolean} pauseOnDisconnect - Pause timer when player disconnects
 * @property {number} reconnectTimeout - Seconds to wait for reconnect before forfeit
 */

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  turnTimeLimit: 60,           // 60 seconds per turn
  totalTimeLimit: 0,           // No total limit
  autoForfeitOnTimeout: true,  // Auto forfeit on timeout
  gracePeriod: 5,              // 5 second grace period
  pauseOnDisconnect: true,     // Pause when player disconnects
  reconnectTimeout: 30,        // 30 seconds to reconnect
};

/**
 * Create a player object from raw player data
 * @param {Object} player - Raw player data
 * @param {number} index - Player index
 * @param {number} totalTimeLimit - Total time limit in seconds
 * @returns {Object} Formatted player object
 */
export function createPlayer(player, index, totalTimeLimit) {
  return {
    ...player,
    index,
    connected: true,
    timeRemaining: totalTimeLimit * 1000 || Infinity,
    disconnectedAt: null,
  };
}
