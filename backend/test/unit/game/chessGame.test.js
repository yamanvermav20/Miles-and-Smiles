/**
 * Unit tests for Chess Game Logic
 */

import { ChessGame, PIECES, COLORS } from "../../../src/socket/game/chessGame.js";

describe("Chess Game", () => {
  let game;
  const player1 = { id: "user1", socketId: "socket1", username: "White" };
  const player2 = { id: "user2", socketId: "socket2", username: "Black" };

  beforeEach(() => {
    game = new ChessGame([player1, player2]);
  });

  describe("initialization", () => {
    it("should create initial board correctly", () => {
      const board = game.board;
      
      // Check white pieces
      expect(board[7][0]).toEqual({ type: PIECES.ROOK, color: COLORS.WHITE });
      expect(board[7][4]).toEqual({ type: PIECES.KING, color: COLORS.WHITE });
      expect(board[6][0]).toEqual({ type: PIECES.PAWN, color: COLORS.WHITE });

      // Check black pieces
      expect(board[0][0]).toEqual({ type: PIECES.ROOK, color: COLORS.BLACK });
      expect(board[0][4]).toEqual({ type: PIECES.KING, color: COLORS.BLACK });
      expect(board[1][0]).toEqual({ type: PIECES.PAWN, color: COLORS.BLACK });

      // Check empty squares
      expect(board[4][4]).toBeNull();
    });

    it("should start with white's turn", () => {
      expect(game.turn).toBe(COLORS.WHITE);
    });

    it("should assign players correctly", () => {
      expect(game.players.white.userId).toBe(player1.id);
      expect(game.players.black.userId).toBe(player2.id);
    });
  });

  describe("pawn moves", () => {
    it("should allow pawn to move one square forward", () => {
      const moves = game.getLegalMovesAt(6, 4); // e2 pawn
      const oneStep = moves.find(m => m.toRow === 5 && m.toCol === 4);
      expect(oneStep).toBeDefined();
    });

    it("should allow pawn to move two squares from starting position", () => {
      const moves = game.getLegalMovesAt(6, 4); // e2 pawn
      const twoStep = moves.find(m => m.toRow === 4 && m.toCol === 4);
      expect(twoStep).toBeDefined();
    });

    it("should not allow pawn to move backward", () => {
      // First move e2-e4
      game.makeMove(player1.id, { fromRow: 6, fromCol: 4, toRow: 4, toCol: 4 });
      // Black moves
      game.makeMove(player2.id, { fromRow: 1, fromCol: 4, toRow: 3, toCol: 4 });
      
      // Try to move pawn backward
      const moves = game.getLegalMovesAt(4, 4);
      const backward = moves.find(m => m.toRow === 5 || m.toRow === 6);
      expect(backward).toBeUndefined();
    });

    it("should allow pawn diagonal capture", () => {
      // Set up capture scenario
      game.makeMove(player1.id, { fromRow: 6, fromCol: 4, toRow: 4, toCol: 4 }); // e4
      game.makeMove(player2.id, { fromRow: 1, fromCol: 3, toRow: 3, toCol: 3 }); // d5
      
      // e4 pawn should be able to capture d5
      const moves = game.getLegalMovesAt(4, 4);
      const capture = moves.find(m => m.toRow === 3 && m.toCol === 3);
      expect(capture).toBeDefined();
    });
  });

  describe("knight moves", () => {
    it("should move in L-shape", () => {
      const moves = game.getLegalMovesAt(7, 1); // b1 knight
      
      // Knight on b1 can go to a3 or c3
      expect(moves).toContainEqual(expect.objectContaining({ toRow: 5, toCol: 0 }));
      expect(moves).toContainEqual(expect.objectContaining({ toRow: 5, toCol: 2 }));
    });

    it("should be able to jump over pieces", () => {
      // Knight starts surrounded by pieces but can still move
      const moves = game.getLegalMovesAt(7, 1);
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe("bishop moves", () => {
    it("should move diagonally", () => {
      // Move pawn to free bishop
      game.makeMove(player1.id, { fromRow: 6, fromCol: 4, toRow: 4, toCol: 4 }); // e4
      game.makeMove(player2.id, { fromRow: 1, fromCol: 4, toRow: 3, toCol: 4 }); // e5
      
      // Bishop on f1 should have diagonal moves
      const moves = game.getLegalMovesAt(7, 5);
      expect(moves.some(m => m.toRow === 6 && m.toCol === 4)).toBe(true); // e2
      expect(moves.some(m => m.toRow === 5 && m.toCol === 3)).toBe(true); // d3
    });

    it("should not move through pieces", () => {
      // Bishop on c1 is blocked by pawns
      const moves = game.getLegalMovesAt(7, 2);
      expect(moves.length).toBe(0);
    });
  });

  describe("rook moves", () => {
    it("should move horizontally and vertically", () => {
      // Clear path for rook
      game.board[7][1] = null; // Remove knight
      game.board[6][0] = null; // Remove pawn
      
      const moves = game.getLegalMovesAt(7, 0);
      // Should be able to move up and right
      expect(moves.some(m => m.toCol === 0 && m.toRow < 7)).toBe(true);
      expect(moves.some(m => m.toRow === 7 && m.toCol > 0)).toBe(true);
    });
  });

  describe("queen moves", () => {
    it("should combine bishop and rook moves", () => {
      // Clear path for queen
      game.board[6][3] = null; // Remove d pawn
      
      const moves = game.getLegalMovesAt(7, 3);
      // Vertical
      expect(moves.some(m => m.toCol === 3 && m.toRow < 7)).toBe(true);
      // Diagonal
      expect(moves.some(m => m.toRow === 6 && m.toCol === 4)).toBe(true);
    });
  });

  describe("king moves", () => {
    it("should move one square in any direction", () => {
      // Clear around king
      game.board[6][4] = null;
      game.board[6][3] = null;
      game.board[6][5] = null;
      
      const moves = game.getLegalMovesAt(7, 4);
      // Should be able to move to e2, d2, f2
      expect(moves.some(m => m.toRow === 6 && m.toCol === 4)).toBe(true);
    });

    it("should not move into check", () => {
      // Set up scenario where king would walk into check
      game.board[5][4] = null;
      game.board[4][4] = { type: PIECES.ROOK, color: COLORS.BLACK }; // Black rook on e4
      game.board[6][4] = null;
      
      const moves = game.getLegalMovesAt(7, 4);
      // King should not be able to move to e2 (in line with rook)
      expect(moves.find(m => m.toRow === 6 && m.toCol === 4)).toBeUndefined();
    });
  });

  describe("castling", () => {
    it("should allow kingside castling when valid", () => {
      // Clear between king and h-rook
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      const moves = game.getLegalMovesAt(7, 4);
      const castleKingside = moves.find(m => m.isCastle && m.toCol === 6);
      expect(castleKingside).toBeDefined();
    });

    it("should not allow castling if king has moved", () => {
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Move king
      game.makeMove(player1.id, { fromRow: 7, fromCol: 4, toRow: 7, toCol: 5 });
      game.makeMove(player2.id, { fromRow: 1, fromCol: 0, toRow: 2, toCol: 0 });
      // Move king back
      game.makeMove(player1.id, { fromRow: 7, fromCol: 5, toRow: 7, toCol: 4 });
      game.makeMove(player2.id, { fromRow: 2, fromCol: 0, toRow: 1, toCol: 0 });
      
      const moves = game.getLegalMovesAt(7, 4);
      const castle = moves.find(m => m.isCastle);
      expect(castle).toBeUndefined();
    });

    it("should not allow castling through check", () => {
      game.board[7][5] = null;
      game.board[7][6] = null;
      // Put black rook attacking f1
      game.board[0][5] = { type: PIECES.ROOK, color: COLORS.BLACK };
      
      const moves = game.getLegalMovesAt(7, 4);
      const castleKingside = moves.find(m => m.isCastle && m.toCol === 6);
      expect(castleKingside).toBeUndefined();
    });
  });

  describe("check detection", () => {
    it("should detect when king is in check", () => {
      // Set up check
      game.board[4][4] = { type: PIECES.QUEEN, color: COLORS.BLACK };
      game.board[6][4] = null;
      
      expect(game.isInCheck(COLORS.WHITE)).toBe(true);
    });

    it("should require moving out of check", () => {
      // Put white in check
      game.board[5][4] = { type: PIECES.QUEEN, color: COLORS.BLACK };
      game.board[6][4] = null;
      
      // All legal moves should resolve the check
      const allMoves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = game.board[r][c];
          if (piece?.color === COLORS.WHITE) {
            allMoves.push(...game.getLegalMovesAt(r, c));
          }
        }
      }
      
      // At least one move exists
      expect(allMoves.length).toBeGreaterThan(0);
    });
  });

  describe("checkmate detection", () => {
    it("should detect checkmate", () => {
      // Set up fool's mate position
      game.makeMove(player1.id, { fromRow: 6, fromCol: 5, toRow: 5, toCol: 5 }); // f3
      game.makeMove(player2.id, { fromRow: 1, fromCol: 4, toRow: 3, toCol: 4 }); // e5
      game.makeMove(player1.id, { fromRow: 6, fromCol: 6, toRow: 4, toCol: 6 }); // g4
      game.makeMove(player2.id, { fromRow: 0, fromCol: 3, toRow: 4, toCol: 7 }); // Qh4#
      
      expect(game.status).toBe("checkmate");
      expect(game.winner).toBe(COLORS.BLACK);
    });
  });

  describe("stalemate detection", () => {
    it("should detect stalemate", () => {
      // Clear board
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          game.board[r][c] = null;
        }
      }
      
      // Stalemate position: Black king trapped but not in check
      game.board[0][0] = { type: PIECES.KING, color: COLORS.BLACK };
      game.board[7][7] = { type: PIECES.KING, color: COLORS.WHITE };
      game.board[1][2] = { type: PIECES.QUEEN, color: COLORS.WHITE };
      
      game.turn = COLORS.BLACK;
      game.checkGameEnd();
      
      expect(game.status).toBe("stalemate");
    });
  });

  describe("en passant", () => {
    it("should allow en passant capture", () => {
      // e2-e4
      game.makeMove(player1.id, { fromRow: 6, fromCol: 4, toRow: 4, toCol: 4 });
      // a7-a6
      game.makeMove(player2.id, { fromRow: 1, fromCol: 0, toRow: 2, toCol: 0 });
      // e4-e5
      game.makeMove(player1.id, { fromRow: 4, fromCol: 4, toRow: 3, toCol: 4 });
      // d7-d5 (enables en passant)
      game.makeMove(player2.id, { fromRow: 1, fromCol: 3, toRow: 3, toCol: 3 });
      
      // e5 pawn should be able to capture d5 en passant
      const moves = game.getLegalMovesAt(3, 4);
      const enPassant = moves.find(m => m.toRow === 2 && m.toCol === 3 && m.isEnPassant);
      expect(enPassant).toBeDefined();
    });
  });

  describe("pawn promotion", () => {
    it("should flag moves that result in promotion", () => {
      // Set up pawn about to promote
      game.board[1][0] = { type: PIECES.PAWN, color: COLORS.WHITE };
      
      const moves = game.getLegalMovesAt(1, 0);
      const promotion = moves.find(m => m.toRow === 0);
      expect(promotion?.isPromotion).toBe(true);
    });
  });
});
