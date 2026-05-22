/**
 * Chess Handler Module
 * Re-exports all chess-related handlers for easy importing
 * 
 * @module socket/handlers/chess
 */

export { setupChessHandler } from "./chessHandler.js";
export { startChessGame, handleChessPlayerLeave } from "./gameStarter.js";
export { processChessGameEnd } from "./gameEndProcessor.js";
export { 
  startChessAIGame, 
  setupAIHandlers, 
  aiGames 
} from "./aiHandler.js";

// Default export for backward compatibility
export { default } from "./chessHandler.js";
