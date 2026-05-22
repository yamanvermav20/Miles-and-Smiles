/**
 * Custom Hook for Dots and Boxes Game State and Socket Logic
 * Manages all game state and socket event handling
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for Dots and Boxes game
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} roomId - Room ID
 * @returns {Object} Game state and handlers
 */
export function useDotsAndBoxesGame(socket, roomId) {
  // Game dimensions
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);

  // Game board state
  const [horizontalLines, setHorizontalLines] = useState([]);
  const [verticalLines, setVerticalLines] = useState([]);
  const [boxes, setBoxes] = useState([]);

  // Game state
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [currentTurn, setCurrentTurn] = useState(1);
  const [myPlayerNumber, setMyPlayerNumber] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [error, setError] = useState("");
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [lastCompletedBoxes, setLastCompletedBoxes] = useState([]);
  const [playerInfo, setPlayerInfo] = useState({ 1: { username: "Player 1" }, 2: { username: "Player 2" } });

  // Determine if it's the current player's turn
  const isMyTurn = !isReconnecting && gameStarted && currentTurn === myPlayerNumber && !gameOver;

  // Calculate total and remaining boxes
  const totalBoxes = rows * cols;
  const completedBoxes = scores[1] + scores[2];
  const remainingBoxes = totalBoxes - completedBoxes;

  // Initialize empty board
  const initializeBoard = useCallback((r, c) => {
    setHorizontalLines(
      Array(r + 1)
        .fill(null)
        .map(() => Array(c).fill(0))
    );
    setVerticalLines(
      Array(r)
        .fill(null)
        .map(() => Array(c + 1).fill(0))
    );
    setBoxes(
      Array(r)
        .fill(null)
        .map(() => Array(c).fill(0))
    );
  }, []);

  // Set up Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle room joined
    const handleRoomJoined = (data) => {
      console.log("✅ Room joined:", data);
      if (data.players && data.players.length === 2) {
        console.log("Two players in room, waiting for game:start...");
      }
    };

    // Handle player joined
    const handlePlayerJoined = (data) => {
      console.log("👤 Player joined:", data);
      if (data.players && data.players.length === 2) {
        console.log("Two players in room, waiting for game:start...");
      }
    };

    // Handle game start
    const handleGameStart = (data) => {
      console.log("🎮 Dots and Boxes game started:", data);
      setRows(data.rows);
      setCols(data.cols);
      setHorizontalLines(data.horizontalLines);
      setVerticalLines(data.verticalLines);
      setBoxes(data.boxes);
      setScores(data.scores);
      setCurrentTurn(data.currentTurn);
      setGameOver(false);
      setWinner(null);
      setGameStarted(true);
      setOpponentLeft(false);
      setError("");
      setLastMove(null);
      setLastCompletedBoxes([]);

      // Store player info with usernames
      if (data.playerInfo) {
        setPlayerInfo(data.playerInfo);
      }

      // Determine which player number this player is
      if (data.players[1] === socket.id) {
        setMyPlayerNumber(1);
      } else if (data.players[2] === socket.id) {
        setMyPlayerNumber(2);
      }
    };

    // Handle game update (after a move)
    const handleGameUpdate = (data) => {
      console.log("🔄 Game update:", data);
      setHorizontalLines(data.horizontalLines);
      setVerticalLines(data.verticalLines);
      setBoxes(data.boxes);
      setScores(data.scores);
      setCurrentTurn(data.currentTurn);
      setLastMove(data.lastMove);
      setLastCompletedBoxes(data.boxesCompleted || []);
      setError("");
    };

    // Handle game over
    const handleGameOver = (data) => {
      console.log("🏆 Game over:", data);
      setHorizontalLines(data.horizontalLines);
      setVerticalLines(data.verticalLines);
      setBoxes(data.boxes);
      setScores(data.scores);
      setGameOver(true);
      setWinner(data.winner);
      setLastMove(data.lastMove);
      setLastCompletedBoxes(data.boxesCompleted || []);
    };

    // Handle opponent leaving
    const handleOpponentLeft = (data) => {
      console.log("⚠️ Opponent left:", data);
      setOpponentLeft(true);
      setGameStarted(false);
      setError(data.message || "Your opponent has left the game");
    };

    // Handle player offline
    const handlePlayerOffline = (data) => {
      console.log("⚠️ Player offline:", data);
      setError("Opponent temporarily offline — reconnecting...");
      setIsReconnecting(true);
    };

    // Handle player rejoined
    const handlePlayerRejoined = (data) => {
      console.log("✅ Player rejoined:", data);
      setError("");
      setIsReconnecting(false);
    };

    // Handle game sync (for reconnection)
    const handleGameSync = (data) => {
      console.log("🔁 Game sync received:", data);
      if (data.rows) setRows(data.rows);
      if (data.cols) setCols(data.cols);
      if (data.horizontalLines) setHorizontalLines(data.horizontalLines);
      if (data.verticalLines) setVerticalLines(data.verticalLines);
      if (data.boxes) setBoxes(data.boxes);
      if (data.scores) setScores(data.scores);
      if (data.currentTurn) setCurrentTurn(data.currentTurn);
      if (data.playerInfo) setPlayerInfo(data.playerInfo);
      setGameOver(data.gameOver || false);
      setWinner(data.winner || null);
      setGameStarted(true);
      setOpponentLeft(false);

      // Determine player number after sync
      if (data.players && data.players[1] === socket.id) setMyPlayerNumber(1);
      else if (data.players && data.players[2] === socket.id) setMyPlayerNumber(2);
    };

    // Handle game errors
    const handleGameError = (data) => {
      console.error("❌ Game error:", data);
      setError(data.message || "An error occurred");
    };

    // Register event listeners
    socket.on("room-joined", handleRoomJoined);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("dotsandboxes:start", handleGameStart);
    socket.on("dotsandboxes:update", handleGameUpdate);
    socket.on("dotsandboxes:gameover", handleGameOver);
    socket.on("game:opponent_left", handleOpponentLeft);
    socket.on("player-offline", handlePlayerOffline);
    socket.on("player-rejoined", handlePlayerRejoined);
    socket.on("dotsandboxes:sync", handleGameSync);
    socket.on("game:error", handleGameError);

    // Initialize empty board
    initializeBoard(4, 4);

    // Cleanup on unmount
    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("dotsandboxes:start", handleGameStart);
      socket.off("dotsandboxes:update", handleGameUpdate);
      socket.off("dotsandboxes:gameover", handleGameOver);
      socket.off("game:opponent_left", handleOpponentLeft);
      socket.off("player-offline", handlePlayerOffline);
      socket.off("player-rejoined", handlePlayerRejoined);
      socket.off("dotsandboxes:sync", handleGameSync);
      socket.off("game:error", handleGameError);
    };
  }, [socket, initializeBoard]);

  // Handle line click
  const handleLineClick = useCallback(
    (type, row, col) => {
      if (!socket || !isMyTurn) return;

      console.log(`📍 Clicking ${type} line at (${row}, ${col})`);
      socket.emit("dotsandboxes:move", { roomId, type, row, col });
    },
    [socket, roomId, isMyTurn]
  );

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    if (!socket) return;
    console.log("🔄 Requesting game reset");
    socket.emit("dotsandboxes:reset", { roomId });
  }, [socket, roomId]);

  return {
    // Board state
    rows,
    cols,
    horizontalLines,
    verticalLines,
    boxes,
    // Game state
    scores,
    currentTurn,
    myPlayerNumber,
    gameOver,
    winner,
    gameStarted,
    opponentLeft,
    error,
    isMyTurn,
    isReconnecting,
    lastMove,
    lastCompletedBoxes,
    playerInfo,
    totalBoxes,
    completedBoxes,
    remainingBoxes,
    // Handlers
    handleLineClick,
    handlePlayAgain,
  };
}
