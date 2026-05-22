/**
 * Custom Hook for TicTacToe Game State and Socket Logic
 * Manages all game state and socket event handling
 */

import { useState, useEffect } from "react";
import { setupSocketHandlers } from "./socketHandlers.js";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Custom hook for TicTacToe game
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} roomId - Room ID
 * @returns {Object} Game state and handlers
 */
export function useTicTacToeGame(socket, roomId) {
  // Game state
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [turn, setTurn] = useState("X");
  const [mySymbol, setMySymbol] = useState(null); // "X" or "O" - which symbol this player is
  const [winner, setWinner] = useState(null); // "X", "O", "draw", or null
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [error, setError] = useState("");
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({
    X: { username: "Player X" },
    O: { username: "Player O" }
  });

  // Determine if it's the current player's turn
  const isMyTurn =
    !isReconnecting && gameStarted && turn === mySymbol && winner === null;
  const { user } = useAuth();

  // Set up Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle room joined - check if game should start
    const handleRoomJoined = (data) => {
      console.log("✅ Room joined:", data);
      // If there are already 2 players when we join, game should start soon
      if (data.players && data.players.length === 2) {
        // Game will start via game:start event
        console.log("Two players in room, waiting for game:start...");
      }
    };

    // Handle player joined - check if game should start
    const handlePlayerJoined = (data) => {
      console.log("👤 Player joined:", data);
      // If there are now 2 players, game should start soon
      if (data.players && data.players.length === 2) {
        // Game will start via game:start event
        console.log("Two players in room, waiting for game:start...");
      }
    };

    // Handle game start
    const handleGameStart = (data) => {
      console.log("🎮 Game started:", data);
      setBoard(data.board);
      setTurn(data.turn);
      setGameStarted(true);
      setWinner(null);
      setOpponentLeft(false);
      setError("");

      // Store player info with usernames
      if (data.playerInfo) {
        setPlayerInfo(data.playerInfo);
      }

      // Determine which symbol this player is
      if (data.players.X === socket.id) {
        setMySymbol("X");
      } else if (data.players.O === socket.id) {
        setMySymbol("O");
      }
    };

    // Handle game update (after a move)
    const handleGameUpdate = (data) => {
      console.log("🔄 Game update:", data);
      setBoard(data.board);
      setTurn(data.turn);
      setError("");
    };

    // Handle game over (winner)
    const handleGameOver = (data) => {
      console.log("🏆 Game over:", data);
      setBoard(data.board);
      setWinner(data.winner);
      setTurn(null);
    };

    // Handle game draw
    const handleGameDraw = (data) => {
      console.log("🤝 Game draw:", data);
      setBoard(data.board);
      setWinner("draw");
      setTurn(null);
    };

    // Handle opponent leaving
    const handleOpponentLeft = (data) => {
      console.log("⚠️ Opponent left:", data);
      setOpponentLeft(true);
      setGameStarted(false);
      setError(data.message || "Your opponent has left the game");
    };

    const handlePlayerOffline = (data) => {
      console.log("⚠️ Player offline:", data);
      setError("Opponent temporarily offline — reconnecting...");
      setIsReconnecting(true);
    };

    const handlePlayerRejoined = (data) => {
      console.log("✅ Player rejoined:", data);
      setError("");
      setIsReconnecting(false);
    };

    const handleGameSync = (data) => {
      console.log("🔁 Game sync received:", data);
      setBoard(data.board);
      setTurn(data.turn);
      setWinner(data.winner);
      setGameStarted(true);
      setOpponentLeft(false);

      // Determine which symbol this player is after sync
      if (data.players && data.players.X === socket.id) setMySymbol("X");
      else if (data.players && data.players.O === socket.id) setMySymbol("O");
    };

    // Handle game errors
    const handleGameError = (data) => {
      console.error("❌ Game error:", data);
      setError(data.message || "An error occurred");
    };

    // Set up all socket handlers
    const cleanup = setupSocketHandlers(socket, {
      onRoomJoined: handleRoomJoined,
      onPlayerJoined: handlePlayerJoined,
      onGameStart: handleGameStart,
      onGameUpdate: handleGameUpdate,
      onGameOver: handleGameOver,
      onGameDraw: handleGameDraw,
      onOpponentLeft: handleOpponentLeft,
      onPlayerOffline: handlePlayerOffline,
      onPlayerRejoined: handlePlayerRejoined,
      onGameSync: handleGameSync,
      onGameError: handleGameError,
    });

    // Listen to reconnection lifecycle to show indicator and rejoin room
    const onDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
      // Only show reconnecting if we were in a room
      if (roomId) setIsReconnecting(true);
    };

    const onConnect = () => {
      console.log("Socket connected (or reconnected)");
      if (roomId) {
        // Rejoin the same room on reconnect. We send only roomId; server derives userId.
        socket.emit("rejoin-room", { roomId });
      }
      setIsReconnecting(false);
    };

    const onReconnectAttempt = () => {
      console.log("Attempting to reconnect...");
      if (roomId) setIsReconnecting(true);
    };

    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);
    if (socket.io && socket.io.on)
      socket.io.on("reconnect_attempt", onReconnectAttempt);

    // Return combined cleanup
    return () => {
      try {
        socket.off("disconnect", onDisconnect);
        socket.off("connect", onConnect);
        if (socket.io && socket.io.off)
          socket.io.off("reconnect_attempt", onReconnectAttempt);
      } catch (e) {
        /* ignore */
      }
      if (typeof cleanup === "function") cleanup();
    };
  }, [socket]);

  /**
   * Handle cell click - emit move to server
   * @param {number} index - Cell index (0-8)
   */
  const handleCellClick = (index) => {
    // Validate move
    if (!socket || !roomId) {
      setError("Not connected to game");
      return;
    }

    if (!gameStarted) {
      setError("Game has not started yet");
      return;
    }

    if (winner !== null) {
      setError("Game is already over");
      return;
    }

    if (!isMyTurn) {
      setError("It's not your turn");
      return;
    }

    // Convert index to row/col to check if cell is empty
    const row = Math.floor(index / 3);
    const col = index % 3;

    if (board[row][col] !== null) {
      setError("Cell is already occupied");
      return;
    }

    // Clear any previous errors
    setError("");

    // Emit move to server
    socket.emit("game:move", { roomId, index });
  };

  /**
   * Handle Play Again button click - emit reset to server
   */
  const handlePlayAgain = () => {
    if (!socket || !roomId) {
      setError("Not connected to game");
      return;
    }

    if (!gameStarted) {
      setError("Game has not started yet");
      return;
    }

    // Clear any errors
    setError("");

    // Emit reset event to server
    socket.emit("game:reset", { roomId });
  };

  return {
    // State
    board,
    turn,
    mySymbol,
    winner,
    gameStarted,
    opponentLeft,
    error,
    isMyTurn,
    isReconnecting,
    playerInfo,
    // Handlers
    handleCellClick,
    handlePlayAgain,
  };
}
