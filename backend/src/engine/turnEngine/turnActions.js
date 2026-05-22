/**
 * Turn Engine Actions
 * Extended actions for TurnEngine: disconnect, pause, forfeit, etc.
 */

import { TurnEngine as BaseTurnEngine } from "./TurnEngine.js";

/**
 * Extended TurnEngine with all game actions
 */
export class TurnEngine extends BaseTurnEngine {
  /**
   * Handle player disconnect
   */
  handleDisconnect(playerId) {
    const player = this.playerManager.getById(playerId);
    if (!player) return;
    
    this.playerManager.setDisconnected(playerId);
    this.emit("playerDisconnect", { player });
    
    if (this.config.pauseOnDisconnect && this.isPlayerTurn(playerId)) {
      this.pause();
    }
    
    this.timerManager.startReconnectTimer(
      this.config.reconnectTimeout * 1000,
      () => {
        if (!player.connected) this._handleTimeout(playerId);
      }
    );
  }

  /**
   * Handle player reconnect
   */
  handleReconnect(playerId, newSocketId) {
    const player = this.playerManager.getById(playerId);
    if (!player) return;
    
    this.playerManager.setReconnected(playerId, newSocketId);
    this.timerManager.clearReconnectTimer();
    this.emit("playerReconnect", { player });
    
    if (this.isPaused && this.isPlayerTurn(playerId)) {
      this.resume();
    }
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.isPaused || this.isGameOver) return;
    
    this.isPaused = true;
    this.pausedAt = Date.now();
    this.pausedTimeRemaining = this.config.turnTimeLimit * 1000 - (Date.now() - this.turnStartTime);
    
    this.timerManager.clearAll();
    this.emit("gamePause", { pausedAt: this.pausedAt, currentPlayer: this.getCurrentPlayer() });
  }

  /**
   * Resume the game
   */
  resume() {
    if (!this.isPaused || this.isGameOver) return;
    
    this.isPaused = false;
    this.turnStartTime = Date.now() - (this.config.turnTimeLimit * 1000 - this.pausedTimeRemaining);
    this.pausedAt = null;
    this.pausedTimeRemaining = null;
    
    this._startTurnTimer();
    this.emit("gameResume", { currentPlayer: this.getCurrentPlayer(), turnNumber: this.turnNumber });
  }

  /**
   * End the game with a winner
   */
  endGame(winnerId, reason = "normal") {
    this.timerManager.clearAll();
    this.isGameOver = true;
    
    if (winnerId) {
      this.winner = this.playerManager.getById(winnerId);
    }
    
    this.emit("gameEnd", {
      winner: this.winner,
      reason,
      turnCount: this.turnNumber,
      moveHistory: this.moveHistory,
    });
  }

  /**
   * Player forfeits (quits)
   */
  forfeit(playerId) {
    const player = this.playerManager.getById(playerId);
    if (!player) return;
    
    this.timerManager.clearAll();
    this.isGameOver = true;
    
    const winner = this.playerManager.getOpponent(playerId);
    this.winner = winner;
    
    this.emit("forfeit", { loser: player, winner, reason: "quit" });
    if (this.onForfeit) this.onForfeit({ loser: player, winner, reason: "quit" });
    this.emit("gameEnd", { winner, reason: "forfeit", loser: player });
  }

  /**
   * Get remaining time for current turn
   */
  getTurnTimeRemaining() {
    if (this.isPaused) return this.pausedTimeRemaining;
    if (this.config.turnTimeLimit <= 0) return Infinity;
    
    const elapsed = Date.now() - this.turnStartTime;
    return Math.max(0, this.config.turnTimeLimit * 1000 - elapsed);
  }

  /**
   * Get current game state
   */
  getState() {
    return {
      players: this.playerManager.serialize(),
      currentTurnIndex: this.currentTurnIndex,
      currentPlayer: this.getCurrentPlayer(),
      turnNumber: this.turnNumber,
      turnTimeRemaining: this.getTurnTimeRemaining(),
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      winner: this.winner,
      config: this.config,
      moveCount: this.moveHistory.length,
    };
  }

  /**
   * Get full state with move history (for replay)
   */
  getFullState() {
    return { ...this.getState(), moveHistory: this.moveHistory };
  }

  /**
   * Update socket ID for a user (for reconnection)
   */
  updateSocketIdForUser(userId, newSocketId) {
    this.playerManager.updateSocketId(userId, newSocketId);
  }

  /**
   * Destroy and clean up
   */
  destroy() {
    this.timerManager.clearAll();
    this.removeAllListeners();
  }
}

export default TurnEngine;
