/**
 * Chess Game Engine
 * Full chess implementation with move validation, check/checkmate detection
 */

// Piece definitions
const PIECES = {
  KING: 'K',
  QUEEN: 'Q',
  ROOK: 'R',
  BISHOP: 'B',
  KNIGHT: 'N',
  PAWN: 'P',
};

const COLORS = {
  WHITE: 'white',
  BLACK: 'black',
};

/**
 * Initialize the chess board
 * @returns {Array} 8x8 board array
 */
function createInitialBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Setup black pieces (top)
  board[0] = [
    { type: PIECES.ROOK, color: COLORS.BLACK },
    { type: PIECES.KNIGHT, color: COLORS.BLACK },
    { type: PIECES.BISHOP, color: COLORS.BLACK },
    { type: PIECES.QUEEN, color: COLORS.BLACK },
    { type: PIECES.KING, color: COLORS.BLACK },
    { type: PIECES.BISHOP, color: COLORS.BLACK },
    { type: PIECES.KNIGHT, color: COLORS.BLACK },
    { type: PIECES.ROOK, color: COLORS.BLACK },
  ];
  board[1] = Array(8).fill(null).map(() => ({ type: PIECES.PAWN, color: COLORS.BLACK }));
  
  // Setup white pieces (bottom)
  board[6] = Array(8).fill(null).map(() => ({ type: PIECES.PAWN, color: COLORS.WHITE }));
  board[7] = [
    { type: PIECES.ROOK, color: COLORS.WHITE },
    { type: PIECES.KNIGHT, color: COLORS.WHITE },
    { type: PIECES.BISHOP, color: COLORS.WHITE },
    { type: PIECES.QUEEN, color: COLORS.WHITE },
    { type: PIECES.KING, color: COLORS.WHITE },
    { type: PIECES.BISHOP, color: COLORS.WHITE },
    { type: PIECES.KNIGHT, color: COLORS.WHITE },
    { type: PIECES.ROOK, color: COLORS.WHITE },
  ];
  
  return board;
}

/**
 * Deep clone the board
 */
function cloneBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

/**
 * Check if position is within board bounds
 */
function isValidPosition(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Find king position
 */
function findKing(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece?.type === PIECES.KING && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Get all possible moves for a piece (without check validation)
 */
function getRawMoves(board, row, col, piece, gameState = {}) {
  const moves = [];
  const { color, type } = piece;
  const direction = color === COLORS.WHITE ? -1 : 1;
  
  switch (type) {
    case PIECES.PAWN:
      // Forward move
      const newRow = row + direction;
      if (isValidPosition(newRow, col) && !board[newRow][col]) {
        moves.push({ toRow: newRow, toCol: col });
        
        // Double move from starting position
        const startRow = color === COLORS.WHITE ? 6 : 1;
        const doubleRow = row + direction * 2;
        if (row === startRow && isValidPosition(doubleRow, col) && !board[doubleRow][col]) {
          moves.push({ toRow: doubleRow, toCol: col, isDoublePush: true });
        }
      }
      
      // Captures
      for (const dc of [-1, 1]) {
        const captureCol = col + dc;
        if (isValidPosition(newRow, captureCol)) {
          const target = board[newRow][captureCol];
          if (target && target.color !== color) {
            moves.push({ toRow: newRow, toCol: captureCol, isCapture: true });
          }
          
          // En passant
          if (gameState.enPassant?.row === newRow && gameState.enPassant?.col === captureCol) {
            moves.push({ toRow: newRow, toCol: captureCol, isEnPassant: true });
          }
        }
      }
      break;
      
    case PIECES.KNIGHT:
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightMoves) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidPosition(newRow, newCol)) {
          const target = board[newRow][newCol];
          if (!target || target.color !== color) {
            moves.push({ toRow: newRow, toCol: newCol, isCapture: !!target });
          }
        }
      }
      break;
      
    case PIECES.BISHOP:
      for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          if (!isValidPosition(newRow, newCol)) break;
          
          const target = board[newRow][newCol];
          if (!target) {
            moves.push({ toRow: newRow, toCol: newCol });
          } else {
            if (target.color !== color) {
              moves.push({ toRow: newRow, toCol: newCol, isCapture: true });
            }
            break;
          }
        }
      }
      break;
      
    case PIECES.ROOK:
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          if (!isValidPosition(newRow, newCol)) break;
          
          const target = board[newRow][newCol];
          if (!target) {
            moves.push({ toRow: newRow, toCol: newCol });
          } else {
            if (target.color !== color) {
              moves.push({ toRow: newRow, toCol: newCol, isCapture: true });
            }
            break;
          }
        }
      }
      break;
      
    case PIECES.QUEEN:
      // Combine bishop and rook moves
      for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          if (!isValidPosition(newRow, newCol)) break;
          
          const target = board[newRow][newCol];
          if (!target) {
            moves.push({ toRow: newRow, toCol: newCol });
          } else {
            if (target.color !== color) {
              moves.push({ toRow: newRow, toCol: newCol, isCapture: true });
            }
            break;
          }
        }
      }
      break;
      
    case PIECES.KING:
      for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidPosition(newRow, newCol)) {
          const target = board[newRow][newCol];
          if (!target || target.color !== color) {
            moves.push({ toRow: newRow, toCol: newCol, isCapture: !!target });
          }
        }
      }
      
      // Castling
      const castleRow = color === COLORS.WHITE ? 7 : 0;
      if (row === castleRow && col === 4 && !gameState.kingMoved?.[color]) {
        // Kingside castling
        if (!gameState.rookMoved?.[color]?.kingside &&
            !board[castleRow][5] && !board[castleRow][6] &&
            board[castleRow][7]?.type === PIECES.ROOK) {
          moves.push({ toRow: castleRow, toCol: 6, isCastleKingside: true });
        }
        
        // Queenside castling
        if (!gameState.rookMoved?.[color]?.queenside &&
            !board[castleRow][1] && !board[castleRow][2] && !board[castleRow][3] &&
            board[castleRow][0]?.type === PIECES.ROOK) {
          moves.push({ toRow: castleRow, toCol: 2, isCastleQueenside: true });
        }
      }
      break;
  }
  
  return moves;
}

/**
 * Check if a color is in check
 */
function isInCheck(board, color) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  
  const enemyColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === enemyColor) {
        const moves = getRawMoves(board, row, col, piece);
        if (moves.some(m => m.toRow === kingPos.row && m.toCol === kingPos.col)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Get all legal moves for a piece
 */
function getLegalMoves(board, row, col, gameState = {}) {
  const piece = board[row][col];
  if (!piece) return [];
  
  const rawMoves = getRawMoves(board, row, col, piece, gameState);
  const legalMoves = [];
  
  for (const move of rawMoves) {
    // Simulate the move
    const newBoard = cloneBoard(board);
    newBoard[move.toRow][move.toCol] = newBoard[row][col];
    newBoard[row][col] = null;
    
    // Handle en passant capture
    if (move.isEnPassant) {
      const captureRow = piece.color === COLORS.WHITE ? move.toRow + 1 : move.toRow - 1;
      newBoard[captureRow][move.toCol] = null;
    }
    
    // Handle castling - move rook too
    if (move.isCastleKingside) {
      const castleRow = piece.color === COLORS.WHITE ? 7 : 0;
      newBoard[castleRow][5] = newBoard[castleRow][7];
      newBoard[castleRow][7] = null;
      
      // Check if squares king passes through are attacked
      if (isSquareAttacked(board, castleRow, 4, piece.color) ||
          isSquareAttacked(board, castleRow, 5, piece.color) ||
          isSquareAttacked(board, castleRow, 6, piece.color)) {
        continue;
      }
    }
    
    if (move.isCastleQueenside) {
      const castleRow = piece.color === COLORS.WHITE ? 7 : 0;
      newBoard[castleRow][3] = newBoard[castleRow][0];
      newBoard[castleRow][0] = null;
      
      // Check if squares king passes through are attacked
      if (isSquareAttacked(board, castleRow, 4, piece.color) ||
          isSquareAttacked(board, castleRow, 3, piece.color) ||
          isSquareAttacked(board, castleRow, 2, piece.color)) {
        continue;
      }
    }
    
    // Check if move leaves king in check
    if (!isInCheck(newBoard, piece.color)) {
      legalMoves.push(move);
    }
  }
  
  return legalMoves;
}

/**
 * Check if a square is attacked by enemy
 */
function isSquareAttacked(board, row, col, defendingColor) {
  const attackingColor = defendingColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === attackingColor) {
        const moves = getRawMoves(board, r, c, piece);
        if (moves.some(m => m.toRow === row && m.toCol === col)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Check if a color has any legal moves
 */
function hasLegalMoves(board, color, gameState) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, row, col, gameState);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

/**
 * Convert position to algebraic notation
 */
function toAlgebraic(row, col) {
  return String.fromCharCode(97 + col) + (8 - row);
}

/**
 * Convert algebraic notation to position
 */
function fromAlgebraic(notation) {
  const col = notation.charCodeAt(0) - 97;
  const row = 8 - parseInt(notation[1]);
  return { row, col };
}

/**
 * Chess Game Class
 */
export class ChessGame {
  constructor(players) {
    this.board = createInitialBoard();
    this.players = {
      white: { oderId: players[0].id, socketId: players[0].socketId, username: players[0].username },
      black: { oderId: players[1].id, socketId: players[1].socketId, username: players[1].username },
    };
    this.turn = COLORS.WHITE;
    this.moveCount = 0;
    this.halfMoveClock = 0; // For 50-move rule
    this.fullMoveNumber = 1;
    
    // Game state for special moves
    this.gameState = {
      kingMoved: { white: false, black: false },
      rookMoved: {
        white: { kingside: false, queenside: false },
        black: { kingside: false, queenside: false },
      },
      enPassant: null,
    };
    
    // Game status
    this.status = "playing"; // playing, check, checkmate, stalemate, draw
    this.winner = null;
    this.drawReason = null;
    
    // Move history
    this.moveHistory = [];
    this.positionHistory = [];
    
    // Time control (optional)
    this.timeControl = null;
    this.timeRemaining = { white: null, black: null };
  }
  
  /**
   * Get player color by user ID
   */
  getPlayerColor(userId) {
    if (this.players.white.userId === oderId) return COLORS.WHITE;
    if (this.players.black.userId === oderId) return COLORS.BLACK;
    return null;
  }
  
  /**
   * Validate and make a move
   * @param {string} userId - Player making the move
   * @param {Object} move - Move data { from: "e2", to: "e4" } or { fromRow, fromCol, toRow, toCol }
   * @returns {Object} Result
   */
  makeMove(userId, move) {
    // Validate it's the player's turn
    const playerColor = this.getPlayerColor(userId);
    if (!playerColor) {
      return { success: false, error: "Player not in this game" };
    }
    
    if (playerColor !== this.turn) {
      return { success: false, error: "Not your turn" };
    }
    
    if (this.status === "checkmate" || this.status === "stalemate" || this.status === "draw") {
      return { success: false, error: "Game is over" };
    }
    
    // Parse move
    let fromRow, fromCol, toRow, toCol, promotion;
    
    if (move.from && move.to) {
      const from = fromAlgebraic(move.from);
      const to = fromAlgebraic(move.to);
      fromRow = from.row;
      fromCol = from.col;
      toRow = to.row;
      toCol = to.col;
      promotion = move.promotion;
    } else {
      fromRow = move.fromRow;
      fromCol = move.fromCol;
      toRow = move.toRow;
      toCol = move.toCol;
      promotion = move.promotion;
    }
    
    // Validate piece exists and belongs to player
    const piece = this.board[fromRow][fromCol];
    if (!piece) {
      return { success: false, error: "No piece at that position" };
    }
    
    if (piece.color !== playerColor) {
      return { success: false, error: "That's not your piece" };
    }
    
    // Get legal moves and check if move is legal
    const legalMoves = getLegalMoves(this.board, fromRow, fromCol, this.gameState);
    const matchingMove = legalMoves.find(m => m.toRow === toRow && m.toCol === toCol);
    
    if (!matchingMove) {
      return { success: false, error: "Illegal move" };
    }
    
    // Store position for repetition detection
    const positionKey = this.getPositionKey();
    this.positionHistory.push(positionKey);
    
    // Make the move
    const capturedPiece = this.board[toRow][toCol];
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    
    // Handle special moves
    let specialMove = null;
    
    // Pawn promotion
    if (piece.type === PIECES.PAWN && (toRow === 0 || toRow === 7)) {
      this.board[toRow][toCol] = {
        type: promotion || PIECES.QUEEN,
        color: piece.color,
      };
      specialMove = "promotion";
    }
    
    // En passant capture
    if (matchingMove.isEnPassant) {
      const captureRow = piece.color === COLORS.WHITE ? toRow + 1 : toRow - 1;
      this.board[captureRow][toCol] = null;
      specialMove = "enPassant";
    }
    
    // Castling
    if (matchingMove.isCastleKingside) {
      const castleRow = piece.color === COLORS.WHITE ? 7 : 0;
      this.board[castleRow][5] = this.board[castleRow][7];
      this.board[castleRow][7] = null;
      specialMove = "castleKingside";
    }
    
    if (matchingMove.isCastleQueenside) {
      const castleRow = piece.color === COLORS.WHITE ? 7 : 0;
      this.board[castleRow][3] = this.board[castleRow][0];
      this.board[castleRow][0] = null;
      specialMove = "castleQueenside";
    }
    
    // Update game state
    if (piece.type === PIECES.KING) {
      this.gameState.kingMoved[piece.color] = true;
    }
    
    if (piece.type === PIECES.ROOK) {
      const rookStartRow = piece.color === COLORS.WHITE ? 7 : 0;
      if (fromRow === rookStartRow) {
        if (fromCol === 0) this.gameState.rookMoved[piece.color].queenside = true;
        if (fromCol === 7) this.gameState.rookMoved[piece.color].kingside = true;
      }
    }
    
    // Set en passant square
    if (piece.type === PIECES.PAWN && Math.abs(toRow - fromRow) === 2) {
      this.gameState.enPassant = {
        row: (fromRow + toRow) / 2,
        col: fromCol,
      };
    } else {
      this.gameState.enPassant = null;
    }
    
    // Update clocks
    if (piece.type === PIECES.PAWN || capturedPiece) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }
    
    if (this.turn === COLORS.BLACK) {
      this.fullMoveNumber++;
    }
    
    // Record move
    const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece, specialMove);
    this.moveHistory.push({
      from: toAlgebraic(fromRow, fromCol),
      to: toAlgebraic(toRow, toCol),
      piece: piece.type,
      color: piece.color,
      captured: capturedPiece?.type,
      notation: moveNotation,
      specialMove,
      timestamp: Date.now(),
    });
    
    // Switch turns
    this.turn = this.turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    this.moveCount++;
    
    // Check game status
    const inCheck = isInCheck(this.board, this.turn);
    const hasMovesLeft = hasLegalMoves(this.board, this.turn, this.gameState);
    
    if (!hasMovesLeft) {
      if (inCheck) {
        this.status = "checkmate";
        this.winner = this.turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
      } else {
        this.status = "stalemate";
        this.drawReason = "stalemate";
      }
    } else if (inCheck) {
      this.status = "check";
    } else {
      this.status = "playing";
    }
    
    // Check for draw conditions
    if (this.halfMoveClock >= 100) {
      this.status = "draw";
      this.drawReason = "50-move rule";
    }
    
    // Threefold repetition
    const currentPosition = this.getPositionKey();
    const repetitions = this.positionHistory.filter(p => p === currentPosition).length;
    if (repetitions >= 3) {
      this.status = "draw";
      this.drawReason = "threefold repetition";
    }
    
    // Insufficient material
    if (this.isInsufficientMaterial()) {
      this.status = "draw";
      this.drawReason = "insufficient material";
    }
    
    return {
      success: true,
      move: this.moveHistory[this.moveHistory.length - 1],
      status: this.status,
      winner: this.winner,
      inCheck,
    };
  }
  
  /**
   * Get position key for repetition detection
   */
  getPositionKey() {
    const parts = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          parts.push(`${row}${col}${piece.type}${piece.color[0]}`);
        }
      }
    }
    parts.push(this.turn[0]);
    return parts.join(",");
  }
  
  /**
   * Check for insufficient material draw
   */
  isInsufficientMaterial() {
    const pieces = { white: [], black: [] };
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          pieces[piece.color].push(piece.type);
        }
      }
    }
    
    // King vs King
    if (pieces.white.length === 1 && pieces.black.length === 1) return true;
    
    // King + Bishop vs King or King + Knight vs King
    if (pieces.white.length === 1 && pieces.black.length === 2) {
      if (pieces.black.includes(PIECES.BISHOP) || pieces.black.includes(PIECES.KNIGHT)) {
        return true;
      }
    }
    if (pieces.black.length === 1 && pieces.white.length === 2) {
      if (pieces.white.includes(PIECES.BISHOP) || pieces.white.includes(PIECES.KNIGHT)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get algebraic notation for a move
   */
  getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured, specialMove) {
    if (specialMove === "castleKingside") return "O-O";
    if (specialMove === "castleQueenside") return "O-O-O";
    
    let notation = "";
    
    if (piece.type !== PIECES.PAWN) {
      notation += piece.type;
    }
    
    // Add disambiguation if needed (simplified)
    if (piece.type !== PIECES.PAWN && piece.type !== PIECES.KING) {
      notation += toAlgebraic(fromRow, fromCol)[0]; // File
    }
    
    if (captured) {
      if (piece.type === PIECES.PAWN) {
        notation += toAlgebraic(fromRow, fromCol)[0];
      }
      notation += "x";
    }
    
    notation += toAlgebraic(toRow, toCol);
    
    if (specialMove === "promotion") {
      notation += "=Q";
    }
    
    return notation;
  }
  
  /**
   * Get legal moves for a position
   */
  getLegalMovesAt(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];
    
    return getLegalMoves(this.board, row, col, this.gameState).map(m => ({
      ...m,
      to: toAlgebraic(m.toRow, m.toCol),
    }));
  }
  
  /**
   * Resign the game
   */
  resign(userId) {
    const playerColor = this.getPlayerColor(userId);
    if (!playerColor) return { success: false, error: "Player not in this game" };
    
    this.status = "checkmate"; // Use checkmate status for resignation
    this.winner = playerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    this.drawReason = "resignation";
    
    return { success: true, winner: this.winner };
  }
  
  /**
   * Offer draw
   */
  offerDraw(userId) {
    const playerColor = this.getPlayerColor(userId);
    if (!playerColor) return { success: false, error: "Player not in this game" };
    
    this.drawOffer = playerColor;
    return { success: true, offeredBy: playerColor };
  }
  
  /**
   * Accept draw offer
   */
  acceptDraw(userId) {
    const playerColor = this.getPlayerColor(userId);
    if (!playerColor) return { success: false, error: "Player not in this game" };
    
    if (!this.drawOffer || this.drawOffer === playerColor) {
      return { success: false, error: "No draw offer to accept" };
    }
    
    this.status = "draw";
    this.drawReason = "agreement";
    this.drawOffer = null;
    
    return { success: true };
  }
  
  /**
   * Decline draw offer
   */
  declineDraw(userId) {
    const playerColor = this.getPlayerColor(userId);
    if (!playerColor) return { success: false, error: "Player not in this game" };
    
    this.drawOffer = null;
    return { success: true };
  }
  
  /**
   * Get current game state
   */
  getState() {
    return {
      board: this.board,
      players: this.players,
      turn: this.turn,
      status: this.status,
      winner: this.winner,
      drawReason: this.drawReason,
      moveCount: this.moveCount,
      lastMove: this.moveHistory[this.moveHistory.length - 1],
      inCheck: this.status === "check" || (this.status === "checkmate"),
      drawOffer: this.drawOffer,
      timeRemaining: this.timeRemaining,
    };
  }
  
  /**
   * Get full state including move history
   */
  getFullState() {
    return {
      ...this.getState(),
      moveHistory: this.moveHistory,
      gameState: this.gameState,
    };
  }
}

export default ChessGame;
export { PIECES, COLORS, toAlgebraic, fromAlgebraic };
