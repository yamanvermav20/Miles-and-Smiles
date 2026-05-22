/**
 * Chess AI Handler
 * Handles chess games vs AI opponent
 * 
 * @module socket/handlers/chess/aiHandler
 */

import { ChessGame } from "../../game/chessGame.js";
import { ChessAI } from "../../game/chessAI.js";

// ─────────────────────────────────────────
// AI GAMES STATE
// Store AI games separately from multiplayer
// ─────────────────────────────────────────
export const aiGames = new Map();

/**
 * Start a chess game vs AI
 * @param {Socket} socket - Socket instance
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @param {string} difficulty - AI difficulty (easy/medium/hard)
 * @returns {string} Room ID for the AI game
 */
export function startChessAIGame(socket, userId, username, difficulty = "medium") {
  const roomId = `ai-${userId}-${Date.now()}`;
  
  // Player is always white, AI is black
  const players = [
    { id: userId, userId, socketId: socket.id, username },
    { id: "AI", userId: "AI", socketId: "AI", username: `AI (${difficulty})` },
  ];
  
  const game = new ChessGame(players);
  const ai = new ChessAI("black", difficulty);
  
  aiGames.set(roomId, { game, ai, userId, username });
  
  // Join the socket to the room
  socket.join(roomId);
  
  socket.emit("chess:ai-game-start", {
    roomId,
    gameState: game.getState(),
    playerColor: "white",
    difficulty,
  });
  
  return roomId;
}

/**
 * Set up AI-specific socket handlers
 * @param {Socket} socket - Socket instance
 */
export function setupAIHandlers(socket) {
  // Start AI game
  socket.on("chess:start-ai-game", ({ difficulty }) => {
    const roomId = startChessAIGame(
      socket, 
      socket.userId, 
      socket.username, 
      difficulty || "medium"
    );
    console.log(`AI game started: ${roomId} for ${socket.username}`);
  });
  
  // AI game move
  socket.on("chess:ai-move", async ({ roomId, move }) => {
    const aiGame = aiGames.get(roomId);
    if (!aiGame) {
      socket.emit("chess:error", { message: "AI game not found" });
      return;
    }
    
    const { game, ai, userId } = aiGame;
    
    // Make player's move
    const result = game.makeMove(userId, move);
    
    if (!result.success) {
      socket.emit("chess:error", { message: result.error });
      return;
    }
    
    // Send player's move result
    socket.emit("chess:move-made", {
      move: result.move,
      gameState: game.getState(),
      moveBy: userId,
    });
    
    // Check if game over after player move
    if (isGameOver(game)) {
      emitGameOver(socket, game, userId);
      aiGames.delete(roomId);
      return;
    }
    
    // AI makes a move after a small delay
    await handleAIMove(socket, roomId, game, ai, userId);
  });
  
  // Get legal moves for AI game
  socket.on("chess:ai-get-legal-moves", ({ roomId, position }) => {
    const aiGame = aiGames.get(roomId);
    if (!aiGame) {
      socket.emit("chess:error", { message: "AI game not found" });
      return;
    }
    
    const { game } = aiGame;
    const { row, col } = position;
    const legalMoves = game.getLegalMovesAt(row, col);
    socket.emit("chess:legal-moves", { position, moves: legalMoves });
  });
  
  // Resign AI game
  socket.on("chess:ai-resign", ({ roomId }) => {
    const aiGame = aiGames.get(roomId);
    if (aiGame) {
      socket.emit("chess:game-over", {
        winner: "AI",
        reason: "resignation",
        finalState: aiGame.game.getFullState(),
      });
      aiGames.delete(roomId);
    }
  });
  
  // Leave AI game
  socket.on("chess:ai-leave", ({ roomId }) => {
    if (aiGames.has(roomId)) {
      aiGames.delete(roomId);
      socket.leave(roomId);
    }
  });
}

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

/**
 * Check if game is over
 */
function isGameOver(game) {
  return ["checkmate", "stalemate", "draw"].includes(game.status);
}

/**
 * Emit game over event
 */
function emitGameOver(socket, game, userId) {
  socket.emit("chess:game-over", {
    winner: game.winner === "white" ? userId : "AI",
    reason: game.drawReason || game.status,
    finalState: game.getFullState(),
  });
}

/**
 * Handle AI making a move
 */
async function handleAIMove(socket, roomId, game, ai, userId) {
  // 500ms delay for AI "thinking"
  setTimeout(async () => {
    try {
      const aiMove = await ai.getBestMoveAsync(game);
      
      if (!aiMove) {
        socket.emit("chess:error", { message: "AI could not find a move" });
        return;
      }
      
      const aiResult = game.makeMove("AI", aiMove);
      
      if (aiResult.success) {
        socket.emit("chess:move-made", {
          move: aiResult.move,
          gameState: game.getState(),
          moveBy: "AI",
        });
        
        // Check if game over after AI move
        if (isGameOver(game)) {
          socket.emit("chess:game-over", {
            winner: game.winner === "black" ? "AI" : userId,
            reason: game.drawReason || game.status,
            finalState: game.getFullState(),
          });
          aiGames.delete(roomId);
        }
      }
    } catch (error) {
      console.error("AI move error:", error);
      socket.emit("chess:error", { message: "AI error" });
    }
  }, 500);
}
