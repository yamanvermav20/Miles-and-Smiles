/**
 * Memory Card Game Handler
 * Handles all Memory game-related Socket.IO events
 */

import { MemoryGame } from "../game/memoryGame.js";
import { recordGameResult } from "../../controllers/userController.js";

// Delay before hiding non-matching cards (ms)
const HIDE_CARDS_DELAY = 1200;

/**
 * Set up Memory game event handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Map} games - Games map (roomId -> game instance)
 * @param {Map} rooms - Rooms map (roomId -> room data)
 * @param {Map} connectedUsers - Connected users map
 */
export function setupMemoryHandler(socket, io, games, rooms, connectedUsers) {
  // Handle card flip
  socket.on("memory:flip", ({ roomId, cardIndex }) => {
    try {
      // Verify user is in the room
      if (socket.currentRoom !== roomId) {
        socket.emit("game:error", { message: "You are not in this room" });
        return;
      }

      // Check if game exists
      const game = games.get(roomId);
      if (!game || !(game instanceof MemoryGame)) {
        socket.emit("game:error", { message: "No active Memory game in this room" });
        return;
      }

      // Flip card
      const result = game.flipCard(socket.id, cardIndex);

      if (!result.success) {
        socket.emit("game:error", { message: result.error });
        return;
      }

      console.log(`🃏 Memory card flip in room ${roomId}: Card ${cardIndex}`);

      // Get full game state
      const gameState = game.getState();
      const room = rooms.get(roomId);
      const playerInfo = buildPlayerInfo(gameState, room);

      // Handle game over
      if (result.gameOver) {
        // Record game results
        if (room && room.players) {
          const scores = gameState.scores;
          const winner = result.winner;
          
          for (const player of room.players) {
            const playerNum = game.getPlayerNumber(player.socketId);
            const opponent = room.players.find(p => p.id !== player.id);
            const myScore = scores[playerNum] || 0;
            const oppScore = scores[playerNum === 1 ? 2 : 1] || 0;
            
            let gameResult = "draw";
            if (winner === playerNum) gameResult = "win";
            else if (winner !== "tie" && winner !== playerNum) gameResult = "loss";
            
            if (player.id) {
              recordGameResult(player.id, {
                gameName: "Memory",
                result: gameResult,
                myScore,
                opponentScore: oppScore,
                opponent: opponent?.username || "Unknown",
                opponentId: opponent?.id || null,
              });
            }
          }
        }
        
        io.to(roomId).emit("memory:gameover", {
          ...gameState,
          playerInfo,
          lastFlip: result,
        });
        console.log(`🏆 Memory game over in room ${roomId}. Winner: ${result.winner}`);
        return;
      }

      // Emit flip update to all players
      io.to(roomId).emit("memory:update", {
        ...gameState,
        playerInfo,
        lastFlip: result,
      });

      // If two cards flipped and no match, schedule hide
      if (!result.isFirstCard && !result.isMatch) {
        setTimeout(() => {
          const hideResult = game.hideCards();
          const newState = game.getState();
          
          io.to(roomId).emit("memory:hide", {
            ...newState,
            playerInfo: buildPlayerInfo(newState, room),
          });
          
          console.log(`🔄 Memory cards hidden in room ${roomId}, turn: Player ${hideResult.currentTurn}`);
        }, HIDE_CARDS_DELAY);
      }

    } catch (error) {
      console.error("Error handling Memory flip:", error);
      socket.emit("game:error", { message: "Failed to process card flip" });
    }
  });

  // Handle game reset (Play Again)
  socket.on("memory:reset", ({ roomId }) => {
    try {
      // Verify user is in the room
      if (socket.currentRoom !== roomId) {
        socket.emit("game:error", { message: "You are not in this room" });
        return;
      }

      // Check if game exists
      const game = games.get(roomId);
      if (!game || !(game instanceof MemoryGame)) {
        socket.emit("game:error", { message: "No active Memory game in this room" });
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

      console.log(`🔄 Memory game reset in room ${roomId}`);

      // Emit game start event to all players in the room
      const gameState = game.getState();
      const playerInfo = buildPlayerInfo(gameState, room);
      
      io.to(roomId).emit("memory:start", {
        ...gameState,
        playerInfo,
      });
    } catch (error) {
      console.error("Error handling Memory reset:", error);
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
 * Start a Memory game when room is full
 * @param {Server} io - Socket.IO server instance
 * @param {string} roomId - Room ID
 * @param {Object} room - Room data
 * @param {Map} games - Games map
 */
export function startMemoryGame(io, roomId, room, games) {
  try {
    // Create new game instance (4x4 grid = 16 cards = 8 pairs)
    const game = new MemoryGame(4);
    
    // Add players
    room.players.forEach(player => {
      game.addPlayer(player.socketId, player.id);
    });
    
    // Store game
    games.set(roomId, game);
    
    // Get initial state
    const gameState = game.getState();
    const playerInfo = buildPlayerInfo(gameState, room);
    
    // Emit game start event
    io.to(roomId).emit("memory:start", {
      ...gameState,
      playerInfo,
    });
    
    console.log(`🎴 Memory game started in room ${roomId}`);
  } catch (error) {
    console.error("Error starting Memory game:", error);
    io.to(roomId).emit("game:error", { message: "Failed to start Memory game" });
  }
}

export default setupMemoryHandler;

/**
 * Handle player leaving Memory game
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} roomId - Room ID
 * @param {Map} games - Games map
 * @param {Map} rooms - Rooms map
 * @param {Server} io - Socket.IO server instance
 */
export function handleMemoryPlayerLeave(socket, roomId, games, rooms, io) {
  const game = games.get(roomId);
  if (game && game instanceof MemoryGame && !game.gameOver) {
    const playerNumber = game.getPlayerNumber(socket.id);
    
    if (playerNumber) {
      console.log(`🚪 Player left Memory game in room ${roomId}`);

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
          gameName: "Memory",
          result: "loss",
          myScore,
          opponentScore: oppScore,
          opponent: remainingPlayer?.username || "Unknown",
          opponentId: remainingPlayer?.id || null,
        });
      }
      
      if (remainingPlayer?.id) {
        recordGameResult(remainingPlayer.id, {
          gameName: "Memory",
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
