/**
 * Dots and Boxes Game Logic
 * Handles all game state and rules for Dots and Boxes
 */

export class DotsAndBoxesGame {
  /**
   * Create a new Dots and Boxes game
   * @param {number} rows - Number of box rows (default 4)
   * @param {number} cols - Number of box columns (default 4)
   */
  constructor(rows = 4, cols = 4) {
    this.rows = rows;
    this.cols = cols;
    this.players = {}; // { 1: socketId, 2: socketId }
    this.userIdMap = {}; // { socketId: odal }
    this.reset();
  }

  /**
   * Reset the game to initial state
   */
  reset() {
    // Horizontal lines: (rows + 1) rows × cols columns
    // horizontalLines[row][col] = 0 (not drawn) or playerNumber (1 or 2)
    this.horizontalLines = Array(this.rows + 1)
      .fill(null)
      .map(() => Array(this.cols).fill(0));

    // Vertical lines: rows rows × (cols + 1) columns
    // verticalLines[row][col] = 0 (not drawn) or playerNumber (1 or 2)
    this.verticalLines = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols + 1).fill(0));

    // Boxes: rows × cols grid
    // boxes[row][col] = 0 (unclaimed) or playerNumber (1 or 2)
    this.boxes = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(0));

    // Scores
    this.scores = { 1: 0, 2: 0 };

    // Current turn (1 or 2)
    this.currentTurn = 1;

    // Game status
    this.gameOver = false;
    this.winner = null; // null, 1, 2, or 'draw'
  }

  /**
   * Add a player to the game
   * @param {string} socketId - Player's socket ID
   * @param {string} userId - Player's user ID
   * @returns {number|null} Player number (1 or 2) or null if game is full
   */
  addPlayer(socketId, userId) {
    if (!this.players[1]) {
      this.players[1] = socketId;
      this.userIdMap[socketId] = userId;
      return 1;
    } else if (!this.players[2]) {
      this.players[2] = socketId;
      this.userIdMap[socketId] = userId;
      return 2;
    }
    return null;
  }

  /**
   * Get player number from socket ID
   * @param {string} socketId - Player's socket ID
   * @returns {number|null} Player number (1 or 2) or null
   */
  getPlayerNumber(socketId) {
    if (this.players[1] === socketId) return 1;
    if (this.players[2] === socketId) return 2;
    return null;
  }

  /**
   * Update socket ID for a user (for reconnection)
   * @param {string} userId - User's user ID
   * @param {string} newSocketId - New socket ID
   */
  updateSocketIdForUser(userId, newSocketId) {
    for (const [playerNum, socketId] of Object.entries(this.players)) {
      if (this.userIdMap[socketId] === userId) {
        const oldSocketId = socketId;
        this.players[playerNum] = newSocketId;
        this.userIdMap[newSocketId] = userId;
        delete this.userIdMap[oldSocketId];
        return;
      }
    }
  }

  /**
   * Check if it's a valid line position
   * @param {string} type - 'horizontal' or 'vertical'
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {boolean}
   */
  isValidLinePosition(type, row, col) {
    if (type === "horizontal") {
      return row >= 0 && row <= this.rows && col >= 0 && col < this.cols;
    } else if (type === "vertical") {
      return row >= 0 && row < this.rows && col >= 0 && col <= this.cols;
    }
    return false;
  }

  /**
   * Check if a line is already drawn
   * @param {string} type - 'horizontal' or 'vertical'
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {boolean}
   */
  isLineDrawn(type, row, col) {
    if (type === "horizontal") {
      return this.horizontalLines[row][col] !== 0;
    } else if (type === "vertical") {
      return this.verticalLines[row][col] !== 0;
    }
    return true;
  }

  /**
   * Make a move (draw a line)
   * @param {string} socketId - Player's socket ID
   * @param {string} type - 'horizontal' or 'vertical'
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {Object} Move result with success, boxesCompleted, error
   */
  makeMove(socketId, type, row, col) {
    // Check if game is over
    if (this.gameOver) {
      return { success: false, error: "Game is already over" };
    }

    // Check if it's this player's turn
    const playerNumber = this.getPlayerNumber(socketId);
    if (playerNumber === null) {
      return { success: false, error: "You are not a player in this game" };
    }
    if (playerNumber !== this.currentTurn) {
      return { success: false, error: "It's not your turn" };
    }

    // Validate line position
    if (!this.isValidLinePosition(type, row, col)) {
      return { success: false, error: "Invalid line position" };
    }

    // Check if line is already drawn
    if (this.isLineDrawn(type, row, col)) {
      return { success: false, error: "This line is already drawn" };
    }

    // Draw the line
    if (type === "horizontal") {
      this.horizontalLines[row][col] = playerNumber;
    } else {
      this.verticalLines[row][col] = playerNumber;
    }

    // Check for completed boxes
    const boxesCompleted = this.checkCompletedBoxes(type, row, col, playerNumber);

    // If boxes were completed, player gets another turn
    // Otherwise, switch turns
    if (boxesCompleted.length === 0) {
      this.currentTurn = this.currentTurn === 1 ? 2 : 1;
    }

    // Check if game is over
    this.checkGameOver();

    return {
      success: true,
      boxesCompleted,
      nextTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner,
      scores: { ...this.scores },
    };
  }

  /**
   * Check for boxes completed by a line
   * @param {string} type - 'horizontal' or 'vertical'
   * @param {number} row - Row index of the line
   * @param {number} col - Column index of the line
   * @param {number} playerNumber - Player who drew the line
   * @returns {Array} Array of completed box positions [{row, col}]
   */
  checkCompletedBoxes(type, row, col, playerNumber) {
    const completed = [];

    if (type === "horizontal") {
      // Horizontal line can complete the box above (row-1, col) and below (row, col)
      // Box above
      if (row > 0 && this.isBoxComplete(row - 1, col)) {
        this.boxes[row - 1][col] = playerNumber;
        this.scores[playerNumber]++;
        completed.push({ row: row - 1, col });
      }
      // Box below
      if (row < this.rows && this.isBoxComplete(row, col)) {
        this.boxes[row][col] = playerNumber;
        this.scores[playerNumber]++;
        completed.push({ row, col });
      }
    } else {
      // Vertical line can complete the box to the left (row, col-1) and right (row, col)
      // Box to the left
      if (col > 0 && this.isBoxComplete(row, col - 1)) {
        this.boxes[row][col - 1] = playerNumber;
        this.scores[playerNumber]++;
        completed.push({ row, col: col - 1 });
      }
      // Box to the right
      if (col < this.cols && this.isBoxComplete(row, col)) {
        this.boxes[row][col] = playerNumber;
        this.scores[playerNumber]++;
        completed.push({ row, col });
      }
    }

    return completed;
  }

  /**
   * Check if a box is complete (all 4 sides drawn)
   * @param {number} row - Box row
   * @param {number} col - Box column
   * @returns {boolean}
   */
  isBoxComplete(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }
    // Check if box is already claimed
    if (this.boxes[row][col] !== 0) {
      return false;
    }
    // Check all 4 sides
    const topLine = this.horizontalLines[row][col] !== 0;
    const bottomLine = this.horizontalLines[row + 1][col] !== 0;
    const leftLine = this.verticalLines[row][col] !== 0;
    const rightLine = this.verticalLines[row][col + 1] !== 0;
    return topLine && bottomLine && leftLine && rightLine;
  }

  /**
   * Check if the game is over
   */
  checkGameOver() {
    const totalBoxes = this.rows * this.cols;
    const claimedBoxes = this.scores[1] + this.scores[2];

    if (claimedBoxes === totalBoxes) {
      this.gameOver = true;
      if (this.scores[1] > this.scores[2]) {
        this.winner = 1;
      } else if (this.scores[2] > this.scores[1]) {
        this.winner = 2;
      } else {
        this.winner = "draw";
      }
    }
  }

  /**
   * Get the complete game state
   * @returns {Object} Game state
   */
  getState() {
    return {
      rows: this.rows,
      cols: this.cols,
      horizontalLines: this.horizontalLines.map((row) => [...row]),
      verticalLines: this.verticalLines.map((row) => [...row]),
      boxes: this.boxes.map((row) => [...row]),
      scores: { ...this.scores },
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner,
      players: { ...this.players },
    };
  }

  /**
   * Get total number of lines that can be drawn
   * @returns {number}
   */
  getTotalLines() {
    return (this.rows + 1) * this.cols + this.rows * (this.cols + 1);
  }

  /**
   * Get number of lines already drawn
   * @returns {number}
   */
  getDrawnLinesCount() {
    let count = 0;
    for (const row of this.horizontalLines) {
      count += row.filter((line) => line !== 0).length;
    }
    for (const row of this.verticalLines) {
      count += row.filter((line) => line !== 0).length;
    }
    return count;
  }
}
