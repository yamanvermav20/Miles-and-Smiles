/**
 * Game Router
 * Routes game events to appropriate handlers based on game type
 */

// Import game handlers
import {
  startTicTacToeGame,
  handleTicTacToePlayerLeave,
} from "./handlers/ticTacToeHandler.js";
import {
  startDotsAndBoxesGame,
  handleDotsAndBoxesPlayerLeave,
} from "./handlers/dotsAndBoxesHandler.js";
import {
  startSnakesAndLaddersGame,
  handleSnakesAndLaddersPlayerLeave,
} from "./handlers/snakesAndLaddersHandler.js";
import {
  startMemoryGame,
  handleMemoryPlayerLeave,
} from "./handlers/memoryHandler.js";
import {
  startChessGame,
  handleChessPlayerLeave,
} from "./handlers/chessHandler.js";

// ============================================
// Game Type Registry
// Maps game names to their handlers
// ============================================
const gameHandlers = {
  "Dots and Boxes": {
    start: startDotsAndBoxesGame,
    onLeave: handleDotsAndBoxesPlayerLeave,
  },
  "Snakes and Ladders": {
    start: startSnakesAndLaddersGame,
    onLeave: handleSnakesAndLaddersPlayerLeave,
  },
  "Memory": {
    start: startMemoryGame,
    onLeave: handleMemoryPlayerLeave,
  },
  "Chess": {
    start: startChessGame,
    onLeave: handleChessPlayerLeave,
  },
  // Default: TicTacToe (for backward compatibility)
  "default": {
    start: startTicTacToeGame,
    onLeave: handleTicTacToePlayerLeave,
  },
};

/**
 * Get handler for a game type
 * @param {string} gameName - Name of the game
 * @returns {Object} Handler object with start and onLeave functions
 */
function getHandler(gameName) {
  return gameHandlers[gameName] || gameHandlers["default"];
}

/**
 * Start a game based on room's game type
 * @param {Server} io - Socket.IO server
 * @param {string} roomId - Room ID
 * @param {Object} room - Room data
 * @param {Map} games - Games storage map
 */
export function startGame(io, roomId, room, games) {
  const handler = getHandler(room.gameName);
  handler.start(io, roomId, room, games);
}

/**
 * Handle player leaving based on game type
 * @param {Socket} socket - Player's socket
 * @param {string} roomId - Room ID
 * @param {Map} games - Games storage map
 * @param {Map} rooms - Rooms storage map
 * @param {Server} io - Socket.IO server
 */
export function handlePlayerLeave(socket, roomId, games, rooms, io) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const handler = getHandler(room.gameName);
  handler.onLeave(socket, roomId, games, rooms, io);
}
