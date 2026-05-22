/**
 * Chess Socket Handler
 * Main handler that sets up all chess game socket events
 * 
 * @module socket/handlers/chess/chessHandler
 */

import { gameLogger } from "../../../config/logger.js";
import { setupAIHandlers } from "./aiHandler.js";
import { processChessGameEnd } from "./gameEndProcessor.js";

/**
 * Set up chess game socket handlers
 * @param {Socket} socket - Socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Map} games - Games map
 * @param {Map} rooms - Rooms map
 * @param {Map} connectedUsers - Connected users map
 */
export function setupChessHandler(socket, io, games, rooms, connectedUsers) {
  // Set up AI game handlers
  setupAIHandlers(socket);
  
  // Set up multiplayer handlers
  setupMoveHandler(socket, io, games, rooms);
  setupLegalMovesHandler(socket, games);
  setupResignHandler(socket, io, games, rooms);
  setupDrawHandlers(socket, io, games, rooms);
  setupStateHandler(socket, games);
}

// ─────────────────────────────────────────
// MOVE HANDLER
// ─────────────────────────────────────────

function setupMoveHandler(socket, io, games, rooms) {
  socket.on("chess:move", async ({ roomId, move }) => {
    const gameData = games.get(roomId);
    if (!gameData) {
      socket.emit("chess:error", { message: "Game not found" });
      return;
    }
    
    const { game, turnEngine } = gameData;
    
    // Make the move
    const result = game.makeMove(socket.userId, move);
    
    if (!result.success) {
      socket.emit("chess:error", { message: result.error });
      return;
    }
    
    // Record move in turn engine
    turnEngine.makeMove(socket.userId, move);
    
    // Broadcast move to room
    io.to(roomId).emit("chess:move-made", {
      move: result.move,
      gameState: game.getState(),
      moveBy: socket.userId,
    });
    
    gameLogger.move({
      roomId,
      game: "Chess",
      playerId: socket.userId,
      move: result.move.notation,
    });
    
    // Check if game is over
    if (isGameOver(game)) {
      await handleGameEnd(io, roomId, game, turnEngine, rooms, games);
    } else {
      turnEngine.endTurn();
    }
  });
}

// ─────────────────────────────────────────
// LEGAL MOVES HANDLER
// ─────────────────────────────────────────

function setupLegalMovesHandler(socket, games) {
  socket.on("chess:get-legal-moves", ({ roomId, position }) => {
    const gameData = games.get(roomId);
    if (!gameData) {
      socket.emit("chess:error", { message: "Game not found" });
      return;
    }
    
    const { game } = gameData;
    const { row, col } = position;
    const legalMoves = game.getLegalMovesAt(row, col);
    socket.emit("chess:legal-moves", { position, moves: legalMoves });
  });
}

// ─────────────────────────────────────────
// RESIGN HANDLER
// ─────────────────────────────────────────

function setupResignHandler(socket, io, games, rooms) {
  socket.on("chess:resign", async ({ roomId }) => {
    const gameData = games.get(roomId);
    if (!gameData) {
      socket.emit("chess:error", { message: "Game not found" });
      return;
    }
    
    const { game, turnEngine } = gameData;
    const result = game.resign(socket.userId);
    
    if (!result.success) {
      socket.emit("chess:error", { message: result.error });
      return;
    }
    
    const winnerId = result.winner === "white" 
      ? game.players.white.userId 
      : game.players.black.userId;
    const winnerUsername = result.winner === "white"
      ? game.players.white.username
      : game.players.black.username;
    
    turnEngine.forfeit(socket.userId);
    
    io.to(roomId).emit("chess:game-over", {
      winner: winnerId,
      winnerUsername,
      reason: "resignation",
      finalState: game.getFullState(),
    });
    
    const room = rooms.get(roomId);
    await processChessGameEnd(game, room, winnerId, "resignation");
    
    gameLogger.matchEnd({
      roomId,
      game: "Chess",
      winner: winnerId,
      reason: "resignation",
    });
  });
}

// ─────────────────────────────────────────
// DRAW HANDLERS
// ─────────────────────────────────────────

function setupDrawHandlers(socket, io, games, rooms) {
  // Offer draw
  socket.on("chess:offer-draw", ({ roomId }) => {
    const gameData = games.get(roomId);
    if (!gameData) {
      socket.emit("chess:error", { message: "Game not found" });
      return;
    }
    
    const { game } = gameData;
    const result = game.offerDraw(socket.userId);
    
    if (!result.success) {
      socket.emit("chess:error", { message: result.error });
      return;
    }
    
    io.to(roomId).emit("chess:draw-offered", {
      offeredBy: socket.userId,
      offeredByColor: result.offeredBy,
    });
  });
  
  // Accept draw
  socket.on("chess:accept-draw", async ({ roomId }) => {
    const gameData = games.get(roomId);
    if (!gameData) {
      socket.emit("chess:error", { message: "Game not found" });
      return;
    }
    
    const { game, turnEngine } = gameData;
    const result = game.acceptDraw(socket.userId);
    
    if (!result.success) {
      socket.emit("chess:error", { message: result.error });
      return;
    }
    
    turnEngine.endGame(null, "draw");
    
    io.to(roomId).emit("chess:game-over", {
      winner: null,
      reason: "draw by agreement",
      finalState: game.getFullState(),
    });
    
    const room = rooms.get(roomId);
    await processChessGameEnd(game, room, null, "draw");
    
    gameLogger.matchEnd({
      roomId,
      game: "Chess",
      winner: null,
      reason: "draw by agreement",
    });
  });
  
  // Decline draw
  socket.on("chess:decline-draw", ({ roomId }) => {
    const gameData = games.get(roomId);
    if (!gameData) {
      socket.emit("chess:error", { message: "Game not found" });
      return;
    }
    
    const { game } = gameData;
    game.declineDraw(socket.userId);
    
    io.to(roomId).emit("chess:draw-declined", {
      declinedBy: socket.userId,
    });
  });
}

// ─────────────────────────────────────────
// STATE HANDLER
// ─────────────────────────────────────────

function setupStateHandler(socket, games) {
  socket.on("chess:get-state", ({ roomId }) => {
    const gameData = games.get(roomId);
    if (!gameData) {
      socket.emit("chess:error", { message: "Game not found" });
      return;
    }
    
    const { game, turnEngine } = gameData;
    socket.emit("chess:state", {
      gameState: game.getState(),
      turnState: turnEngine.getState(),
    });
  });
}

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

function isGameOver(game) {
  return ["checkmate", "stalemate", "draw"].includes(game.status);
}

async function handleGameEnd(io, roomId, game, turnEngine, rooms, games) {
  const winnerId = game.winner ? game.players[game.winner].userId : null;
  const winnerUsername = game.winner ? game.players[game.winner].username : null;
  
  turnEngine.endGame(winnerId, game.status);
  
  io.to(roomId).emit("chess:game-over", {
    winner: winnerId,
    winnerUsername,
    reason: game.drawReason || game.status,
    finalState: game.getFullState(),
  });
  
  const room = rooms.get(roomId);
  await processChessGameEnd(game, room, winnerId, game.drawReason || game.status);
  
  gameLogger.matchEnd({
    roomId,
    game: "Chess",
    winner: winnerId,
    reason: game.status,
    moves: game.moveCount,
  });
}

export default { setupChessHandler };
