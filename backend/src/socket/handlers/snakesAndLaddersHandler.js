/**
 * Snakes and Ladders Game Handler
 * Handles all Snakes and Ladders game-related Socket.IO events
 */

import { SnakesAndLaddersGame } from "../game/snakesAndLaddersGame.js";
import { recordGameResult } from "../../controllers/userController.js";

/**
 * Set up Snakes and Ladders game event handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Map} games - Games map (roomId -> game instance)
 * @param {Map} rooms - Rooms map (roomId -> room data)
 * @param {Map} connectedUsers - Connected users map
 */
export function setupSnakesAndLaddersHandler(socket, io, games, rooms, connectedUsers) {
  // Handle dice roll
  socket.on("snakesladders:roll", ({ roomId }) => {
    try {
      // Verify user is in the room
      if (socket.currentRoom !== roomId) {
        socket.emit("game:error", { message: "You are not in this room" });
        return;
      }

      // Check if game exists
      const game = games.get(roomId);
      if (!game || !(game instanceof SnakesAndLaddersGame)) {
        socket.emit("game:error", { message: "No active Snakes and Ladders game in this room" });
        return;
      }

      // Roll dice
      const result = game.rollDice(socket.id);

      if (!result.success) {
        socket.emit("game:error", { message: result.error });
        return;
      }

      console.log(`🎲 Snakes and Ladders roll in room ${roomId}: ${result.dice}`);

      // Get full game state
      const gameState = game.getState();

      // Broadcast update to all players
      if (result.gameOver) {
        // Build player info for winner display
        const room = rooms.get(roomId);
        const playerInfo = buildPlayerInfo(gameState, room);

        // Record game results
        if (room && room.players) {
          const winnerNum = result.winner;
          const positions = gameState.positions;
          
          for (const player of room.players) {
            const playerNum = game.getPlayerNumber(player.socketId);
            const opponent = room.players.find(p => p.id !== player.id);
            const myScore = positions[playerNum] || 0;
            const oppScore = positions[playerNum === 1 ? 2 : 1] || 0;
            
            const gameResult = playerNum === winnerNum ? "win" : "loss";
            
            if (player.id) {
              recordGameResult(player.id, {
                gameName: "Snakes and Ladders",
                result: gameResult,
                myScore,
                opponentScore: oppScore,
                opponent: opponent?.username || "Unknown",
                opponentId: opponent?.id || null,
              });
            }
          }
        }

        io.to(roomId).emit("snakesladders:gameover", {
          ...gameState,
          playerInfo,
          dice: result.dice,
          move: result.move,
        });
        console.log(`🏆 Snakes and Ladders game over in room ${roomId}. Winner: Player ${result.winner}`);
      } else {
        io.to(roomId).emit("snakesladders:update", {
          ...gameState,
          dice: result.dice,
          move: result.move,
          extraTurn: result.extraTurn,
        });
      }
    } catch (error) {
      console.error("Error handling Snakes and Ladders roll:", error);
      socket.emit("game:error", { message: "Failed to process roll" });
    }
  });

  // Handle game reset (Play Again)
  socket.on("snakesladders:reset", ({ roomId }) => {
    try {
      // Verify user is in the room
      if (socket.currentRoom !== roomId) {
        socket.emit("game:error", { message: "You are not in this room" });
        return;
      }

      // Check if game exists
      const game = games.get(roomId);
      if (!game || !(game instanceof SnakesAndLaddersGame)) {
        socket.emit("game:error", { message: "No active Snakes and Ladders game in this room" });
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

      console.log(`🔄 Snakes and Ladders game reset in room ${roomId}`);

      // Emit game start event to all players in the room
      const gameState = game.getState();
      const playerInfo = buildPlayerInfo(gameState, room);
      
      io.to(roomId).emit("snakesladders:start", {
        ...gameState,
        playerInfo,
      });
    } catch (error) {
      console.error("Error handling Snakes and Ladders reset:", error);
      socket.emit("game:error", { message: "Failed to reset game" });
    }
  });
}

/**
 * Build player info object with usernames
 * @param {Object} gameState - Game state
 * @param {Object} room - Room data
 * @returns {Object} Player info
 */
function buildPlayerInfo(gameState, room) {
  const playerInfo = {};
  for (const [playerNum, socketId] of Object.entries(gameState.players)) {
    const player = room?.players?.find(p => p.socketId === socketId);
    playerInfo[playerNum] = {
      socketId,
      username: player?.username || `Player ${playerNum}`,
    };
  }
  return playerInfo;
}

/**
 * Start a Snakes and Ladders game when room is full
 * @param {Server} io - Socket.IO server instance
 * @param {string} roomId - Room ID
 * @param {Object} room - Room data
 * @param {Map} games - Games map
 */
export function startSnakesAndLaddersGame(io, roomId, room, games) {
  try {
    // Create new game instance
    const game = new SnakesAndLaddersGame();

    // Add players to the game
    room.players.forEach((player) => {
      game.addPlayer(player.socketId, player.id);
    });

    // Store game instance
    games.set(roomId, game);

    console.log(`🎮 Snakes and Ladders game started in room ${roomId}`);

    // Get initial game state
    const gameState = game.getState();

    // Build player info with usernames
    const playerInfo = buildPlayerInfo(gameState, room);

    console.log(`📋 Player info for Snakes and Ladders room ${roomId}:`, playerInfo);

    // Emit game start to all players
    io.to(roomId).emit("snakesladders:start", {
      ...gameState,
      playerInfo,
    });
  } catch (error) {
    console.error("Error starting Snakes and Ladders game:", error);
  }
}

/**
 * Handle player leaving during an active game
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} roomId - Room ID
 * @param {Map} games - Games map
 * @param {Map} rooms - Rooms map
 * @param {Server} io - Socket.IO server instance
 */
export function handleSnakesAndLaddersPlayerLeave(socket, roomId, games, rooms, io) {
  const game = games.get(roomId);
  if (game && game instanceof SnakesAndLaddersGame && game.winner === null) {
    const playerNumber = game.getPlayerNumber(socket.id);

    if (playerNumber) {
      console.log(`⚠️ Player left during active Snakes and Ladders game in room ${roomId}`);

      // Find players
      const room = rooms?.get(roomId);
      const leavingPlayer = room?.players?.find(p => p.socketId === socket.id);
      const remainingPlayer = room?.players?.find(p => p.socketId !== socket.id);
      
      const gameState = game.getState();
      const positions = gameState.positions || {};
      const myScore = positions[playerNumber] || 0;
      const oppScore = positions[playerNumber === 1 ? 2 : 1] || 0;

      // Record game results
      if (leavingPlayer?.id) {
        recordGameResult(leavingPlayer.id, {
          gameName: "Snakes and Ladders",
          result: "loss",
          myScore,
          opponentScore: oppScore,
          opponent: remainingPlayer?.username || "Unknown",
          opponentId: remainingPlayer?.id || null,
        });
      }
      
      if (remainingPlayer?.id) {
        recordGameResult(remainingPlayer.id, {
          gameName: "Snakes and Ladders",
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
