/**
 * Snakes and Ladders Game State Class
 * Manages game state, board, dice rolls, and snake/ladder mechanics
 */

// Classic Snakes and Ladders board layout (10x10 = 100 squares)
// Snakes: head -> tail (move down)
const SNAKES = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 78,
};

// Ladders: bottom -> top (move up)
const LADDERS = {
  1: 38,
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100,
};

/**
 * Snakes and Ladders Game Class
 * Manages game state and logic for 2 players
 */
export class SnakesAndLaddersGame {
  constructor() {
    // Player positions (1-100, 0 = not started)
    this.positions = { 1: 0, 2: 0 };
    
    // Player socket IDs and user IDs
    this.players = { 1: null, 2: null };
    this.userIds = { 1: null, 2: null };
    
    // Game state
    this.currentTurn = 1; // Player 1 starts
    this.winner = null;
    this.lastDiceRoll = null;
    this.lastMove = null;
    this.gameStarted = false;
    
    // Track consecutive sixes for extra turns
    this.consecutiveSixes = 0;
    
    // Board data
    this.snakes = { ...SNAKES };
    this.ladders = { ...LADDERS };
  }

  /**
   * Add a player to the game
   * @param {string} socketId - Socket ID
   * @param {string} userId - User ID
   * @returns {number|null} Player number (1 or 2) or null if game is full
   */
  addPlayer(socketId, userId) {
    if (!this.players[1]) {
      this.players[1] = socketId;
      this.userIds[1] = userId;
      return 1;
    } else if (!this.players[2]) {
      this.players[2] = socketId;
      this.userIds[2] = userId;
      this.gameStarted = true;
      return 2;
    }
    return null;
  }

  /**
   * Get player number from socket ID
   * @param {string} socketId - Socket ID
   * @returns {number|null} Player number (1 or 2) or null
   */
  getPlayerNumber(socketId) {
    if (this.players[1] === socketId) return 1;
    if (this.players[2] === socketId) return 2;
    return null;
  }

  /**
   * Roll the dice and move
   * @param {string} socketId - Socket ID of the player rolling
   * @returns {Object} Result of the roll
   */
  rollDice(socketId) {
    const playerNumber = this.getPlayerNumber(socketId);
    
    if (!playerNumber) {
      return { success: false, error: "You are not a player in this game" };
    }
    
    if (this.winner) {
      return { success: false, error: "Game is already over" };
    }
    
    if (this.currentTurn !== playerNumber) {
      return { success: false, error: "It's not your turn" };
    }
    
    // Roll dice (1-6)
    const diceValue = Math.floor(Math.random() * 6) + 1;
    this.lastDiceRoll = diceValue;
    
    const oldPosition = this.positions[playerNumber];
    let newPosition = oldPosition + diceValue;
    
    // Check if move exceeds 100 - player must land exactly on 100
    if (newPosition > 100) {
      // Can't move, turn passes (unless rolled 6)
      this.lastMove = {
        player: playerNumber,
        dice: diceValue,
        from: oldPosition,
        to: oldPosition,
        snake: null,
        ladder: null,
        bounce: true,
      };
      
      // Handle turn logic for 6
      if (diceValue === 6) {
        this.consecutiveSixes++;
        if (this.consecutiveSixes >= 3) {
          // Three sixes in a row - lose turn
          this.consecutiveSixes = 0;
          this.currentTurn = this.currentTurn === 1 ? 2 : 1;
        }
        // Otherwise keep turn (rolled 6)
      } else {
        this.consecutiveSixes = 0;
        this.currentTurn = this.currentTurn === 1 ? 2 : 1;
      }
      
      return {
        success: true,
        dice: diceValue,
        move: this.lastMove,
        gameOver: false,
        winner: null,
        extraTurn: diceValue === 6 && this.consecutiveSixes < 3,
      };
    }
    
    // Check for snake or ladder
    let snake = null;
    let ladder = null;
    let finalPosition = newPosition;
    
    if (this.snakes[newPosition]) {
      snake = { head: newPosition, tail: this.snakes[newPosition] };
      finalPosition = this.snakes[newPosition];
    } else if (this.ladders[newPosition]) {
      ladder = { bottom: newPosition, top: this.ladders[newPosition] };
      finalPosition = this.ladders[newPosition];
    }
    
    // Update position
    this.positions[playerNumber] = finalPosition;
    
    this.lastMove = {
      player: playerNumber,
      dice: diceValue,
      from: oldPosition,
      to: newPosition,
      finalPosition,
      snake,
      ladder,
      bounce: false,
    };
    
    // Check for win
    if (finalPosition === 100) {
      this.winner = playerNumber;
      return {
        success: true,
        dice: diceValue,
        move: this.lastMove,
        gameOver: true,
        winner: playerNumber,
        extraTurn: false,
      };
    }
    
    // Handle turn logic
    if (diceValue === 6) {
      this.consecutiveSixes++;
      if (this.consecutiveSixes >= 3) {
        // Three sixes in a row - lose turn
        this.consecutiveSixes = 0;
        this.currentTurn = this.currentTurn === 1 ? 2 : 1;
      }
      // Otherwise keep turn (rolled 6)
    } else {
      this.consecutiveSixes = 0;
      this.currentTurn = this.currentTurn === 1 ? 2 : 1;
    }
    
    return {
      success: true,
      dice: diceValue,
      move: this.lastMove,
      gameOver: false,
      winner: null,
      extraTurn: diceValue === 6 && this.consecutiveSixes < 3,
    };
  }

  /**
   * Reset the game
   */
  reset() {
    this.positions = { 1: 0, 2: 0 };
    this.winner = null;
    this.lastDiceRoll = null;
    this.lastMove = null;
    this.consecutiveSixes = 0;
    
    // Alternate who starts
    this.currentTurn = this.currentTurn === 1 ? 2 : 1;
  }

  /**
   * Update player socket ID (for reconnection)
   * @param {string} oldSocketId - Old socket ID
   * @param {string} newSocketId - New socket ID
   */
  updatePlayerSocket(oldSocketId, newSocketId) {
    if (this.players[1] === oldSocketId) {
      this.players[1] = newSocketId;
    } else if (this.players[2] === oldSocketId) {
      this.players[2] = newSocketId;
    }
  }

  /**
   * Get the current game state
   * @returns {Object} Game state
   */
  getState() {
    return {
      positions: { ...this.positions },
      players: { ...this.players },
      currentTurn: this.currentTurn,
      winner: this.winner,
      lastDiceRoll: this.lastDiceRoll,
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      snakes: { ...this.snakes },
      ladders: { ...this.ladders },
      gameStarted: this.gameStarted,
    };
  }
}
