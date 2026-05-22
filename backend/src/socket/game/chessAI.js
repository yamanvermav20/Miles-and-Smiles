/**
 * Chess AI Bot - Minimax with Alpha-Beta Pruning
 * Provides AI opponent for single-player practice mode
 */

import { ChessGame, PIECES, COLORS } from "./chessGame.js";

// Piece values for evaluation
const PIECE_VALUES = {
  [PIECES.PAWN]: 100,
  [PIECES.KNIGHT]: 320,
  [PIECES.BISHOP]: 330,
  [PIECES.ROOK]: 500,
  [PIECES.QUEEN]: 900,
  [PIECES.KING]: 20000,
};

// Position tables for piece-square evaluation
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0],
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const KING_MIDDLE_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20],
];

const PIECE_TABLES = {
  [PIECES.PAWN]: PAWN_TABLE,
  [PIECES.KNIGHT]: KNIGHT_TABLE,
  [PIECES.BISHOP]: BISHOP_TABLE,
  [PIECES.ROOK]: ROOK_TABLE,
  [PIECES.QUEEN]: QUEEN_TABLE,
  [PIECES.KING]: KING_MIDDLE_TABLE,
};

/**
 * Get position value from piece-square table
 */
function getPositionValue(piece, row, col) {
  const table = PIECE_TABLES[piece.type];
  if (!table) return 0;
  
  // Flip for black pieces
  const r = piece.color === COLORS.WHITE ? row : 7 - row;
  return table[r][col];
}

/**
 * Evaluate board position
 * @param {ChessGame} game - Game instance
 * @param {string} color - Color to evaluate for
 * @returns {number} Evaluation score
 */
function evaluateBoard(game, color) {
  let score = 0;
  const board = game.board;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      const pieceValue = PIECE_VALUES[piece.type] + getPositionValue(piece, row, col);
      
      if (piece.color === color) {
        score += pieceValue;
      } else {
        score -= pieceValue;
      }
    }
  }
  
  // Bonus for castling rights
  if (!game.gameState.kingMoved[color]) {
    score += 30;
  }
  
  // Check/checkmate bonuses
  if (game.status === "checkmate") {
    score = game.winner === color ? 100000 : -100000;
  } else if (game.status === "check") {
    const inCheck = isInCheck(board, color);
    score += inCheck ? -50 : 50;
  }
  
  return score;
}

/**
 * Simple check detection for evaluation
 */
function isInCheck(board, color) {
  // Find king
  let kingPos = null;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece?.type === PIECES.KING && piece.color === color) {
        kingPos = { row, col };
        break;
      }
    }
    if (kingPos) break;
  }
  
  if (!kingPos) return false;
  
  // Check if any enemy piece can attack the king
  const enemyColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === enemyColor) {
        // Simplified attack detection
        if (canAttack(board, row, col, kingPos.row, kingPos.col)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Simplified attack check
 */
function canAttack(board, fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  
  switch (piece.type) {
    case PIECES.PAWN:
      const direction = piece.color === COLORS.WHITE ? -1 : 1;
      return dr === direction && absDc === 1;
      
    case PIECES.KNIGHT:
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
      
    case PIECES.BISHOP:
      return absDr === absDc && isPathClear(board, fromRow, fromCol, toRow, toCol);
      
    case PIECES.ROOK:
      return (dr === 0 || dc === 0) && isPathClear(board, fromRow, fromCol, toRow, toCol);
      
    case PIECES.QUEEN:
      return (absDr === absDc || dr === 0 || dc === 0) && isPathClear(board, fromRow, fromCol, toRow, toCol);
      
    case PIECES.KING:
      return absDr <= 1 && absDc <= 1;
      
    default:
      return false;
  }
}

/**
 * Check if path is clear between two squares
 */
function isPathClear(board, fromRow, fromCol, toRow, toCol) {
  const dr = Math.sign(toRow - fromRow);
  const dc = Math.sign(toCol - fromCol);
  
  let row = fromRow + dr;
  let col = fromCol + dc;
  
  while (row !== toRow || col !== toCol) {
    if (board[row][col]) return false;
    row += dr;
    col += dc;
  }
  
  return true;
}

/**
 * Get all legal moves for a color
 */
function getAllMoves(game, color) {
  const moves = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = game.board[row][col];
      if (piece && piece.color === color) {
        const legalMoves = game.getLegalMovesAt(row, col);
        for (const move of legalMoves) {
          moves.push({
            fromRow: row,
            fromCol: col,
            toRow: move.toRow,
            toCol: move.toCol,
            ...move,
          });
        }
      }
    }
  }
  
  return moves;
}

/**
 * Order moves for better alpha-beta pruning
 */
function orderMoves(moves, board) {
  return moves.sort((a, b) => {
    // Prioritize captures
    const aCapture = board[a.toRow][a.toCol] ? 1 : 0;
    const bCapture = board[b.toRow][b.toCol] ? 1 : 0;
    
    if (aCapture !== bCapture) return bCapture - aCapture;
    
    // Prioritize center moves
    const centerDist = (r, c) => Math.abs(r - 3.5) + Math.abs(c - 3.5);
    return centerDist(a.toRow, a.toCol) - centerDist(b.toRow, b.toCol);
  });
}

/**
 * Minimax with alpha-beta pruning
 */
function minimax(game, depth, alpha, beta, maximizingPlayer, aiColor) {
  if (depth === 0 || game.status === "checkmate" || game.status === "stalemate" || game.status === "draw") {
    return { score: evaluateBoard(game, aiColor), move: null };
  }
  
  const currentColor = maximizingPlayer ? aiColor : (aiColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE);
  let moves = getAllMoves(game, currentColor);
  moves = orderMoves(moves, game.board);
  
  if (moves.length === 0) {
    return { score: evaluateBoard(game, aiColor), move: null };
  }
  
  let bestMove = moves[0];
  
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    
    for (const move of moves) {
      // Clone game and make move
      const gameCopy = cloneGame(game);
      const botId = gameCopy.players[currentColor].userId;
      gameCopy.makeMove(botId, move);
      
      const { score } = minimax(gameCopy, depth - 1, alpha, beta, false, aiColor);
      
      if (score > maxEval) {
        maxEval = score;
        bestMove = move;
      }
      
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    
    for (const move of moves) {
      const gameCopy = cloneGame(game);
      const botId = gameCopy.players[currentColor].userId;
      gameCopy.makeMove(botId, move);
      
      const { score } = minimax(gameCopy, depth - 1, alpha, beta, true, aiColor);
      
      if (score < minEval) {
        minEval = score;
        bestMove = move;
      }
      
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    
    return { score: minEval, move: bestMove };
  }
}

/**
 * Deep clone a game instance
 */
function cloneGame(game) {
  const clone = new ChessGame([
    { id: game.players.white.userId, socketId: "clone", username: "white" },
    { id: game.players.black.userId, socketId: "clone", username: "black" },
  ]);
  
  clone.board = game.board.map(row => row.map(cell => cell ? { ...cell } : null));
  clone.turn = game.turn;
  clone.moveCount = game.moveCount;
  clone.status = game.status;
  clone.winner = game.winner;
  clone.gameState = JSON.parse(JSON.stringify(game.gameState));
  
  return clone;
}

/**
 * Chess AI Class
 */
export class ChessAI {
  constructor(color = COLORS.BLACK, difficulty = "medium") {
    this.color = color;
    this.difficulty = difficulty;
    this.depths = {
      easy: 2,
      medium: 3,
      hard: 4,
      expert: 5,
    };
  }
  
  /**
   * Get the best move for the current position
   * @param {ChessGame} game - Game instance
   * @returns {Object} Best move
   */
  getBestMove(game) {
    const depth = this.depths[this.difficulty] || 3;
    
    // Add some randomness for easy difficulty
    if (this.difficulty === "easy" && Math.random() < 0.3) {
      const moves = getAllMoves(game, this.color);
      if (moves.length > 0) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
    }
    
    const { move } = minimax(game, depth, -Infinity, Infinity, true, this.color);
    return move;
  }
  
  /**
   * Get move with async for non-blocking UI
   */
  async getBestMoveAsync(game) {
    return new Promise((resolve) => {
      // Use setTimeout to not block the main thread
      setTimeout(() => {
        const move = this.getBestMove(game);
        resolve(move);
      }, 100);
    });
  }
}

export default ChessAI;
