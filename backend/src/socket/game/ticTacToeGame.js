/**
 * TicTacToe Game State Class
 * Manages game state, board, moves, and win/draw detection
 */

/**
 * Initialize an empty 3x3 Tic Tac Toe board
 * @returns {Array<Array<null>>} Empty 3x3 board
 */
function createEmptyBoard() {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

/**
 * Check if a player has won the game
 * @param {Array<Array<string|null>>} board - The game board
 * @returns {string|null} "X", "O", or null if no winner
 */
function checkWinner(board) {
  // Check rows
  for (let row = 0; row < 3; row++) {
    if (
      board[row][0] &&
      board[row][0] === board[row][1] &&
      board[row][1] === board[row][2]
    ) {
      return board[row][0];
    }
  }

  // Check columns
  for (let col = 0; col < 3; col++) {
    if (
      board[0][col] &&
      board[0][col] === board[1][col] &&
      board[1][col] === board[2][col]
    ) {
      return board[0][col];
    }
  }

  // Check diagonals
  if (
    board[0][0] &&
    board[0][0] === board[1][1] &&
    board[1][1] === board[2][2]
  ) {
    return board[0][0];
  }

  if (
    board[0][2] &&
    board[0][2] === board[1][1] &&
    board[1][1] === board[2][0]
  ) {
    return board[0][2];
  }

  return null;
}

/**
 * Check if the board is full (draw condition)
 * @param {Array<Array<string|null>>} board - The game board
 * @returns {boolean} True if board is full
 */
function isBoardFull(board) {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === null) {
        return false;
      }
    }
  }
  return true;
}

/**
 * TicTacToe Game Class
 * Manages game state and logic
 */
export class TicTacToeGame {
  constructor(players) {
    this.board = createEmptyBoard();
    // Store both userId and socketId for each symbol to support reconnects
    this.players = {
      X: { userId: players[0].id, socketId: players[0].socketId },
      O: { userId: players[1].id, socketId: players[1].socketId },
    };
    this.turn = "X"; // First player (X) goes first
    this.winner = null; // null, "X", "O", or "draw"
  }

  /**
   * Reset the game to initial state
   * Alternates who goes first by swapping X and O
   */
  reset() {
    this.board = createEmptyBoard();
    this.turn = "X";
    this.winner = null;

    // Alternate who goes first (swap X and O)
    // This gives both players a chance to go first
    const temp = this.players.X;
    this.players.X = this.players.O;
    this.players.O = temp;
  }

  /**
   * Make a move on the board
   * @param {string} playerSymbol - "X" or "O"
   * @param {number} row - Row index (0-2)
   * @param {number} col - Column index (0-2)
   * @returns {Object} Result object with success, winner, isDraw, and error
   */
  makeMove(playerSymbol, row, col) {
    // Validate coordinates
    if (row < 0 || row > 2 || col < 0 || col > 2) {
      return {
        success: false,
        error: "Invalid move coordinates",
      };
    }

    // Check if game is already over
    if (this.winner !== null) {
      return {
        success: false,
        error: "Game is already over",
      };
    }

    // Check if it's this player's turn
    if (this.turn !== playerSymbol) {
      return {
        success: false,
        error: "It's not your turn",
      };
    }

    // Check if cell is empty
    if (this.board[row][col] !== null) {
      return {
        success: false,
        error: "Cell is already occupied",
      };
    }

    // Make the move
    this.board[row][col] = playerSymbol;

    // Check for winner
    const winner = checkWinner(this.board);
    if (winner) {
      this.winner = winner;
      this.turn = null; // Game is over, no more turns
      return {
        success: true,
        winner,
        isDraw: false,
      };
    }

    // Check for draw
    if (isBoardFull(this.board)) {
      this.winner = "draw";
      this.turn = null; // Game is over, no more turns
      return {
        success: true,
        winner: "draw",
        isDraw: true,
      };
    }

    // Switch turn
    this.turn = this.turn === "X" ? "O" : "X";

    return {
      success: true,
      winner: null,
      isDraw: false,
    };
  }

  /**
   * Get the current game state
   * @returns {Object} Game state object
   */
  getState() {
    // Return a compact players mapping (symbol -> socketId) for compatibility with frontend
    return {
      board: this.board,
      players: {
        X: this.players.X?.socketId || null,
        O: this.players.O?.socketId || null,
      },
      turn: this.turn,
      winner: this.winner,
    };
  }

  /**
   * Check if a socket ID is a player in this game
   * @param {string} socketId - Socket ID to check
   * @returns {string|null} "X", "O", or null
   */
  getPlayerSymbol(socketId) {
    if (this.players.X && this.players.X.socketId === socketId) return "X";
    if (this.players.O && this.players.O.socketId === socketId) return "O";
    return null;
  }

  /**
   * Update the socketId for a given userId (used during reconnect)
   * @param {string} userId
   * @param {string} socketId
   */
  updateSocketIdForUser(userId, socketId) {
    if (this.players.X && this.players.X.userId === userId) {
      this.players.X.socketId = socketId;
    }
    if (this.players.O && this.players.O.userId === userId) {
      this.players.O.socketId = socketId;
    }
  }

  /**
   * Get player symbol by userId
   * @param {string} userId
   * @returns {string|null}
   */
  getPlayerSymbolByUserId(userId) {
    if (this.players.X && this.players.X.userId === userId) return "X";
    if (this.players.O && this.players.O.userId === userId) return "O";
    return null;
  }
}

