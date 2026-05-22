/**
 * Chess Game Starter
 * Initializes multiplayer chess games
 * 
 * @module socket/handlers/chess/gameStarter
 */

import { ChessGame } from "../../game/chessGame.js";
import { TurnEngine } from "../../../engine/turnEngine/index.js";
import { gameLogger } from "../../../config/logger.js";
import { processChessGameEnd } from "./gameEndProcessor.js";

/**
 * Start a new multiplayer chess game
 * @param {Server} io - Socket.IO server instance
 * @param {string} roomId - Room ID
 * @param {Object} room - Room object with players
 * @param {Map} games - Games map
 */
export function startChessGame(io, roomId, room, games) {
  const players = room.players.map(p => ({
    id: p.userId || p.id,
    socketId: p.socketId,
    username: p.username,
  }));
  
  // Create the chess game
  const game = new ChessGame(players);
  
  // Create turn engine with chess-specific config
  const turnEngine = new TurnEngine({
    players,
    config: {
      turnTimeLimit: room.settings?.timePerTurn || 300, // 5 min default
      totalTimeLimit: room.settings?.totalTime || 0,
      autoForfeitOnTimeout: true,
      gracePeriod: 10,
      pauseOnDisconnect: true,
      reconnectTimeout: 60,
    },
  });
  
  // Set up turn engine event handlers
  setupTurnEngineEvents(io, roomId, room, game, turnEngine, games);
  
  // Store game and engine
  games.set(roomId, { game, turnEngine });
  
  // Start the game
  turnEngine.start();
  
  // Notify players
  io.to(roomId).emit("chess:game-start", {
    gameState: game.getState(),
    players: game.players,
    timeControl: turnEngine.config,
  });
  
  gameLogger.matchStart({
    roomId,
    game: "Chess",
    players: players.map(p => p.id),
  });
}

/**
 * Set up turn engine event handlers
 */
function setupTurnEngineEvents(io, roomId, room, game, turnEngine, games) {
  // Handle turn timeout warning
  turnEngine.on("turnTimeout", ({ player }) => {
    io.to(roomId).emit("chess:turn-warning", {
      playerId: player.id,
      message: "Time is running out!",
    });
  });
  
  // Handle forfeit (timeout or explicit)
  turnEngine.on("forfeit", async ({ loser, winner, reason }) => {
    game.status = "checkmate";
    game.winner = game.getPlayerColor(winner.id);
    
    io.to(roomId).emit("chess:game-over", {
      winner: winner.id,
      winnerUsername: winner.username,
      reason: reason === "timeout" ? "timeout" : "forfeit",
      finalState: game.getState(),
    });
    
    // Process game end
    await processChessGameEnd(game, room, winner.id, reason);
    
    gameLogger.matchEnd({
      roomId,
      game: "Chess",
      winner: winner.id,
      reason,
    });
  });
  
  // Handle turn change
  turnEngine.on("turnChange", ({ currentPlayer }) => {
    io.to(roomId).emit("chess:turn-change", {
      currentTurn: currentPlayer.id,
      turnNumber: game.moveCount + 1,
      timeRemaining: turnEngine.getTurnTimeRemaining(),
    });
  });
}

/**
 * Handle chess player leaving
 * @param {Socket} socket - Socket instance
 * @param {string} roomId - Room ID
 * @param {Map} games - Games map
 * @param {Map} rooms - Rooms map
 * @param {Server} io - Socket.IO server instance
 */
export function handleChessPlayerLeave(socket, roomId, games, rooms, io) {
  const gameData = games.get(roomId);
  if (!gameData) return;
  
  const { game, turnEngine } = gameData;
  
  // Handle as disconnect
  turnEngine.handleDisconnect(socket.userId);
  
  io.to(roomId).emit("chess:player-disconnected", {
    playerId: socket.userId,
    reconnectTimeout: turnEngine.config.reconnectTimeout,
  });
  
  gameLogger.playerLeave({
    roomId,
    game: "Chess",
    playerId: socket.userId,
  });
}
