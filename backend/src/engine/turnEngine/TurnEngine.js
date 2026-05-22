/**
 * Turn Engine - Main Class
 * Generic turn-based game manager with timers and state management
 */

import EventEmitter from "events";
import { DEFAULT_CONFIG } from "./config.js";
import { TimerManager } from "./timerManager.js";
import { PlayerManager } from "./playerManager.js";

/**
 * TurnEngine class - manages turn-based game flow
 */
export class TurnEngine extends EventEmitter {
  constructor(options) {
    super();
    
    const { players, config = {}, onTurnChange, onTimeout, onForfeit } = options;
    
    // Configuration
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Managers
    this.playerManager = new PlayerManager(players, this.config.totalTimeLimit);
    this.timerManager = new TimerManager();
    
    // Turn state
    this.currentTurnIndex = 0;
    this.turnNumber = 1;
    this.turnStartTime = null;
    
    // Game state
    this.isPaused = false;
    this.isGameOver = false;
    this.winner = null;
    this.pausedAt = null;
    this.pausedTimeRemaining = null;
    
    // Move history
    this.moveHistory = [];
    
    // Callbacks
    this.onTurnChange = onTurnChange;
    this.onTimeout = onTimeout;
    this.onForfeit = onForfeit;
  }

  // Getter for players (backward compatibility)
  get players() {
    return this.playerManager.getAll();
  }

  /**
   * Start the game
   */
  start() {
    if (this.isGameOver) return;
    
    this.turnStartTime = Date.now();
    this._startTurnTimer();
    
    this.emit("gameStart", {
      players: this.players,
      currentTurn: this.getCurrentPlayer(),
      config: this.config,
    });
    
    this.emit("turnStart", {
      player: this.getCurrentPlayer(),
      turnNumber: this.turnNumber,
      timeLimit: this.config.turnTimeLimit,
    });
  }

  /**
   * Get current player
   */
  getCurrentPlayer() {
    return this.playerManager.getByIndex(this.currentTurnIndex);
  }

  /**
   * Get player by ID
   */
  getPlayerById(playerId) {
    return this.playerManager.getById(playerId);
  }

  /**
   * Check if it's a player's turn
   */
  isPlayerTurn(playerId) {
    return this.getCurrentPlayer().id === playerId;
  }

  /**
   * Process a move
   */
  makeMove(playerId, moveData) {
    if (this.isGameOver) return { success: false, error: "Game is over" };
    if (this.isPaused) return { success: false, error: "Game is paused" };
    if (!this.isPlayerTurn(playerId)) return { success: false, error: "Not your turn" };
    
    const move = {
      playerId,
      moveData,
      turnNumber: this.turnNumber,
      timestamp: Date.now(),
      timeSpent: Date.now() - this.turnStartTime,
    };
    
    this.moveHistory.push(move);
    this.emit("move", move);
    
    return { success: true };
  }

  /**
   * End current turn and advance
   */
  endTurn() {
    if (this.isGameOver) return;
    
    this.timerManager.clearAll();
    
    const previousPlayer = this.getCurrentPlayer();
    const timeSpent = Date.now() - this.turnStartTime;
    
    // Update time if tracking total
    if (this.config.totalTimeLimit > 0) {
      this.playerManager.deductTime(previousPlayer.id, timeSpent);
      if (previousPlayer.timeRemaining <= 0) {
        this._handleTimeout(previousPlayer.id);
        return;
      }
    }
    
    // Advance turn
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    this.turnNumber++;
    this.turnStartTime = Date.now();
    
    const currentPlayer = this.getCurrentPlayer();
    
    this.emit("turnChange", { previousPlayer, currentPlayer, turnNumber: this.turnNumber, timeSpent });
    if (this.onTurnChange) this.onTurnChange({ previousPlayer, currentPlayer, turnNumber: this.turnNumber });
    
    this._startTurnTimer();
    
    this.emit("turnStart", {
      player: currentPlayer,
      turnNumber: this.turnNumber,
      timeLimit: this.config.turnTimeLimit,
      timeRemaining: currentPlayer.timeRemaining,
    });
  }

  /**
   * Start turn timer (internal)
   */
  _startTurnTimer() {
    if (this.config.turnTimeLimit <= 0 || this.isPaused) return;
    
    const timeLimit = this.config.turnTimeLimit * 1000;
    
    this.timerManager.startTurnTimer(
      timeLimit,
      () => this._handleTurnTimeout(),
      (seconds) => {
        if (!this.isGameOver && !this.isPaused) {
          this.emit("turnWarning", { player: this.getCurrentPlayer(), secondsRemaining: seconds });
        }
      }
    );
  }

  /**
   * Handle turn timeout (internal)
   */
  _handleTurnTimeout() {
    const player = this.getCurrentPlayer();
    
    this.emit("turnTimeout", { player });
    if (this.onTimeout) this.onTimeout({ player });
    
    if (this.config.autoForfeitOnTimeout) {
      this.timerManager.startGracePeriod(
        this.config.gracePeriod * 1000,
        () => this._handleTimeout(player.id)
      );
      this.emit("gracePeriodStart", { player, seconds: this.config.gracePeriod });
    }
  }

  /**
   * Handle timeout forfeit (internal)
   */
  _handleTimeout(playerId) {
    const player = this.playerManager.getById(playerId);
    if (!player) return;
    
    this.timerManager.clearAll();
    this.isGameOver = true;
    
    const winner = this.playerManager.getOpponent(playerId);
    this.winner = winner;
    
    this.emit("forfeit", { loser: player, winner, reason: "timeout" });
    if (this.onForfeit) this.onForfeit({ loser: player, winner, reason: "timeout" });
    this.emit("gameEnd", { winner, reason: "timeout", loser: player });
  }

  // Additional methods continue in turnActions.js
}

export default TurnEngine;
