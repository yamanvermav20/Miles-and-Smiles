/**
 * Dots and Boxes Game Handler
 * Handles all Dots and Boxes game-related Socket.IO events
 */

import { DotsAndBoxesGame } from "../game/dotsAndBoxesGame.js";
import { recordGameResult } from "../../controllers/userController.js";

/**
 * Set up Dots and Boxes game event handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Map} games - Games map (roomId -> game instance)
 * @param {Map} rooms - Rooms map (roomId -> room data)
 * @param {Map} connectedUsers - Connected users map
 */
export function setupDotsAndBoxesHandler(socket, io, games, rooms, connectedUsers) {
  // Handle game moves (Dots and Boxes)
  socket.on("dotsandboxes:move", ({ roomId, type, row, col }) => {
    try {
      // Verify user is in the room
      if (socket.currentRoom !== roomId) {
        socket.emit("game:error", { message: "You are not in this room" });
        return;
      }

      // Check if game exists
      const game = games.get(roomId);
      if (!game || !(game instanceof DotsAndBoxesGame)) {
        socket.emit("game:error", { message: "No active Dots and Boxes game in this room" });
        return;
      }

      // Validate input
      if (!["horizontal", "vertical"].includes(type)) {
        socket.emit("game:error", { message: "Invalid line type" });
        return;
      }
      if (typeof row !== "number" || typeof col !== "number") {
        socket.emit("game:error", { message: "Invalid row or column" });
        return;
      }

      // Make the move
      const result = game.makeMove(socket.id, type, row, col);

      if (!result.success) {
        socket.emit("game:error", { message: result.error });
        return;
      }

      console.log(`🎯 Dots and Boxes move in room ${roomId}: ${type} line at (${row}, ${col})`);

      // Get full game state
      const gameState = game.getState();

      // Broadcast update to all players
      if (result.gameOver) {
        // Record game results for all players
        const room = rooms.get(roomId);
        if (room && room.players) {
          const scores = gameState.scores;
          
          for (const player of room.players) {
            const playerNum = game.getPlayerNumber(player.socketId);
            const opponent = room.players.find(p => p.id !== player.id);
            const myScore = scores[playerNum] || 0;
            const oppScore = scores[playerNum === 1 ? 2 : 1] || 0;
            
            let gameResult;
            if (result.winner === "draw") {
              gameResult = "draw";
            } else if (result.winner === playerNum) {
              gameResult = "win";
            } else {
              gameResult = "loss";
            }
            
            if (player.id) {
              recordGameResult(player.id, {
                gameName: "Dots and Boxes",
                result: gameResult,
                myScore,
                opponentScore: oppScore,
                opponent: opponent?.username || "Unknown",
                opponentId: opponent?.id || null,
              });
            }
          }
        }

        io.to(roomId).emit("dotsandboxes:gameover", {
          ...gameState,
          lastMove: { type, row, col, player: game.getPlayerNumber(socket.id) },
          boxesCompleted: result.boxesCompleted,
        });
        console.log(`🏆 Dots and Boxes game over in room ${roomId}. Winner: ${result.winner}`);
      } else {
        io.to(roomId).emit("dotsandboxes:update", {
          ...gameState,
          lastMove: { type, row, col, player: game.getPlayerNumber(socket.id) },
          boxesCompleted: result.boxesCompleted,
        });
      }
    } catch (error) {
      console.error("Error handling Dots and Boxes move:", error);
      socket.emit("game:error", { message: "Failed to process move" });
    }
  });

  // Handle game reset (Play Again)
  socket.on("dotsandboxes:reset", ({ roomId }) => {
    try {
      // Verify user is in the room
      if (socket.currentRoom !== roomId) {
        socket.emit("game:error", { message: "You are not in this room" });
        return;
      }

      // Check if game exists
      const game = games.get(roomId);
      if (!game || !(game instanceof DotsAndBoxesGame)) {
        socket.emit("game:error", { message: "No active Dots and Boxes game in this room" });
        return;
      }

      // Verify user is a player in the game
      const playerNumber = game.getPlayerNumber(socket.id);
      if (!playerNumber) {
        socket.emit("game:error", { message: "You are not a player in this game" });
        return;
      }

      // Get the room to access players
      const room = rooms.get(roomId);
      if (!room || room.players.length !== 2) {
        socket.emit("game:error", { message: "Cannot reset game: not enough players" });
        return;
      }

      // Reset game state
      game.reset();

      console.log(`🔄 Dots and Boxes game reset in room ${roomId}`);

      // Emit game start event to all players in the room
      const gameState = game.getState();
      io.to(roomId).emit("dotsandboxes:start", gameState);
    } catch (error) {
      console.error("Error handling Dots and Boxes reset:", error);
      socket.emit("game:error", { message: "Failed to reset game" });
    }
  });
}

/**
 * Start a Dots and Boxes game when room is full
 * @param {Server} io - Socket.IO server instance
 * @param {string} roomId - Room ID
 * @param {Object} room - Room data
 * @param {Map} games - Games map
 */
export function startDotsAndBoxesGame(io, roomId, room, games) {
  try {
    // Create new game instance (4x4 grid)
    const game = new DotsAndBoxesGame(4, 4);

    // Add players to the game
    room.players.forEach((player) => {
      game.addPlayer(player.socketId, player.id);
    });

    // Store game instance
    games.set(roomId, game);

    console.log(`🎮 Dots and Boxes game started in room ${roomId}`);

    // Get initial game state
    const gameState = game.getState();

    // Build player info with usernames
    const playerInfo = {
      1: { socketId: gameState.players[1], username: room.players.find(p => p.socketId === gameState.players[1])?.username || "Player 1" },
      2: { socketId: gameState.players[2], username: room.players.find(p => p.socketId === gameState.players[2])?.username || "Player 2" },
    };

    // Emit game start to all players with usernames
    io.to(roomId).emit("dotsandboxes:start", {
      ...gameState,
      playerInfo,
    });
  } catch (error) {
    console.error("Error starting Dots and Boxes game:", error);
    io.to(roomId).emit("game:error", { message: "Failed to start game" });
  }
}

/**
 * Handle player leaving a Dots and Boxes game
 * @param {Socket} socket - Socket that's leaving
 * @param {string} roomId - Room ID
 * @param {Map} games - Games map
 * @param {Map} rooms - Rooms map
 * @param {Server} io - Socket.IO server instance
 */
export function handleDotsAndBoxesPlayerLeave(socket, roomId, games, rooms, io) {
  const game = games.get(roomId);
  if (game && game instanceof DotsAndBoxesGame && !game.gameOver) {
    const playerNumber = game.getPlayerNumber(socket.id);
    if (playerNumber) {
      console.log(`⚠️ Player ${playerNumber} left Dots and Boxes game in room ${roomId}`);

      // Find players
      const room = rooms?.get(roomId);
      const leavingPlayer = room?.players?.find(p => p.socketId === socket.id);
      const remainingPlayer = room?.players?.find(p => p.socketId !== socket.id);
      
      const gameState = game.getState();
      const scores = gameState.scores || {};
      const myScore = scores[playerNumber] || 0;
      const oppScore = scores[playerNumber === 1 ? 2 : 1] || 0;

      // Record game results
      if (leavingPlayer?.id) {
        recordGameResult(leavingPlayer.id, {
          gameName: "Dots and Boxes",
          result: "loss",
          myScore,
          opponentScore: oppScore,
          opponent: remainingPlayer?.username || "Unknown",
          opponentId: remainingPlayer?.id || null,
        });
      }
      
      if (remainingPlayer?.id) {
        recordGameResult(remainingPlayer.id, {
          gameName: "Dots and Boxes",
          result: "win",
          myScore: oppScore,
          opponentScore: myScore,
          opponent: leavingPlayer?.username || "Unknown",
          opponentId: leavingPlayer?.id || null,
        });
      }

      // Emit opponent left event with winner info
      if (io && remainingPlayer) {
        io.to(roomId).emit("game:opponent_left", {
          message: "Your opponent has left the game. You win!",
          winner: remainingPlayer.username,
          winnerId: remainingPlayer.id,
        });
      } else {
        socket.to(roomId).emit("game:opponent_left", {
          message: "Your opponent has left the game. You win!",
        });
      }

      // Clean up the game
      games.delete(roomId);
    }
  }
}
