/**
 * Player Manager
 * Handles player state in turn-based games
 */

/**
 * PlayerManager class for managing player state
 */
export class PlayerManager {
  constructor(players, totalTimeLimit) {
    this.players = players.map((p, index) => ({
      ...p,
      index,
      connected: true,
      timeRemaining: totalTimeLimit * 1000 || Infinity,
      disconnectedAt: null,
    }));
  }

  /**
   * Get player by ID
   * @param {string} playerId - Player ID
   * @returns {Object|null} Player or null
   */
  getById(playerId) {
    return this.players.find(p => p.id === playerId) || null;
  }

  /**
   * Get player by index
   * @param {number} index - Player index
   * @returns {Object} Player
   */
  getByIndex(index) {
    return this.players[index];
  }

  /**
   * Get all players
   * @returns {Array} Players array
   */
  getAll() {
    return this.players;
  }

  /**
   * Get player count
   * @returns {number} Number of players
   */
  count() {
    return this.players.length;
  }

  /**
   * Update player socket ID
   * @param {string} playerId - Player ID
   * @param {string} newSocketId - New socket ID
   */
  updateSocketId(playerId, newSocketId) {
    const player = this.getById(playerId);
    if (player) {
      player.socketId = newSocketId;
    }
  }

  /**
   * Mark player as disconnected
   * @param {string} playerId - Player ID
   */
  setDisconnected(playerId) {
    const player = this.getById(playerId);
    if (player) {
      player.connected = false;
      player.disconnectedAt = Date.now();
    }
  }

  /**
   * Mark player as reconnected
   * @param {string} playerId - Player ID
   * @param {string} newSocketId - New socket ID
   */
  setReconnected(playerId, newSocketId) {
    const player = this.getById(playerId);
    if (player) {
      player.connected = true;
      player.socketId = newSocketId;
      player.disconnectedAt = null;
    }
  }

  /**
   * Update player's remaining time
   * @param {string} playerId - Player ID
   * @param {number} timeSpent - Time spent in ms
   */
  deductTime(playerId, timeSpent) {
    const player = this.getById(playerId);
    if (player) {
      player.timeRemaining -= timeSpent;
    }
  }

  /**
   * Get opponent of a player
   * @param {string} playerId - Player ID
   * @returns {Object|null} Opponent player
   */
  getOpponent(playerId) {
    return this.players.find(p => p.id !== playerId) || null;
  }

  /**
   * Serialize players for state export
   * @returns {Array} Serialized players
   */
  serialize() {
    return this.players.map(p => ({
      id: p.id,
      username: p.username,
      socketId: p.socketId,
      index: p.index,
      connected: p.connected,
      timeRemaining: p.timeRemaining,
    }));
  }
}
