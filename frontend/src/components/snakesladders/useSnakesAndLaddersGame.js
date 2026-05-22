/**
 * Custom Hook for Snakes and Ladders Game State and Socket Logic
 * Manages all game state and socket event handling with animation delays
 */

import { useState, useEffect, useCallback, useRef } from "react";

// Snakes positions (head -> tail)
const SNAKES = {
  16: 6, 47: 26, 49: 11, 56: 53, 62: 19,
  64: 60, 87: 24, 93: 73, 95: 75, 98: 78,
};

// Ladders positions (bottom -> top)
const LADDERS = {
  1: 38, 4: 14, 9: 31, 21: 42, 28: 84,
  36: 44, 51: 67, 71: 91, 80: 100,
};

// Animation delay constants (ms)
const ROLL_ANIMATION_DELAY = 1500;  // Time for dice roll animation
const MOVE_ANIMATION_DELAY = 800;   // Time between position updates
const SNAKE_LADDER_DELAY = 1200;    // Extra delay for snake/ladder animation

/**
 * Custom hook for Snakes and Ladders game
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} roomId - Room ID
 * @returns {Object} Game state and handlers
 */
export function useSnakesAndLaddersGame(socket, roomId) {
  // Player positions (1-100, 0 = not started)
  const [positions, setPositions] = useState({ 1: 0, 2: 0 });
  
  // Game state
  const [currentTurn, setCurrentTurn] = useState(1);
  const [myPlayerNumber, setMyPlayerNumber] = useState(null);
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [error, setError] = useState("");
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Dice state
  const [lastDiceRoll, setLastDiceRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [extraTurn, setExtraTurn] = useState(false);
  
  // Last move for animation
  const [lastMove, setLastMove] = useState(null);
  
  // Animation state
  const [animatingPlayer, setAnimatingPlayer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Player info (usernames)
  const [playerInfo, setPlayerInfo] = useState({
    1: { username: "Player 1" },
    2: { username: "Player 2" },
  });
  
  // Pending update queue for animations
  const pendingUpdateRef = useRef(null);

  // Computed values - disable turn during animation
  const isMyTurn = !isReconnecting && !isAnimating && gameStarted && currentTurn === myPlayerNumber && !winner;

  // Process pending update with animation delays
  const processMoveWithAnimation = useCallback((data, isGameOver = false) => {
    const move = data.move;
    if (!move) {
      // No move data, apply immediately
      setPositions(data.positions);
      setCurrentTurn(data.currentTurn);
      setLastDiceRoll(data.dice);
      setLastMove(data.move);
      setExtraTurn(data.extraTurn || false);
      setIsRolling(false);
      setIsAnimating(false);
      if (isGameOver) {
        setWinner(data.winner);
        if (data.playerInfo) setPlayerInfo(data.playerInfo);
      }
      return;
    }
    
    setIsAnimating(true);
    setAnimatingPlayer(move.player);
    
    // Step 1: Show dice result
    setLastDiceRoll(data.dice);
    
    // Step 2: Move to initial position (after dice animation)
    setTimeout(() => {
      // Update to the landed position (before snake/ladder)
      setPositions(prev => ({
        ...prev,
        [move.player]: move.to
      }));
      setLastMove({ ...move, showingIntermediate: true });
      
      // Step 3: If snake or ladder, show final position after delay
      if (move.snake || move.ladder) {
        setTimeout(() => {
          setPositions(data.positions);
          setLastMove(move);
          setAnimatingPlayer(null);
          
          // Final state update
          setTimeout(() => {
            setCurrentTurn(data.currentTurn);
            setExtraTurn(data.extraTurn || false);
            setIsRolling(false);
            setIsAnimating(false);
            
            if (isGameOver) {
              setWinner(data.winner);
              if (data.playerInfo) setPlayerInfo(data.playerInfo);
            }
          }, 300);
        }, SNAKE_LADDER_DELAY);
      } else {
        // No snake/ladder, finalize immediately
        setPositions(data.positions);
        setLastMove(move);
        setAnimatingPlayer(null);
        
        setTimeout(() => {
          setCurrentTurn(data.currentTurn);
          setExtraTurn(data.extraTurn || false);
          setIsRolling(false);
          setIsAnimating(false);
          
          if (isGameOver) {
            setWinner(data.winner);
            if (data.playerInfo) setPlayerInfo(data.playerInfo);
          }
        }, 300);
      }
    }, ROLL_ANIMATION_DELAY);
  }, []);

  // Set up Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle room joined
    const handleRoomJoined = (data) => {
      console.log("✅ Snakes and Ladders room joined:", data);
    };

    // Handle player joined
    const handlePlayerJoined = (data) => {
      console.log("👤 Player joined Snakes and Ladders:", data);
    };

    // Handle game start
    const handleGameStart = (data) => {
      console.log("🎮 Snakes and Ladders game started:", data);
      setPositions(data.positions);
      setCurrentTurn(data.currentTurn);
      setWinner(null);
      setGameStarted(true);
      setOpponentLeft(false);
      setError("");
      setLastDiceRoll(null);
      setLastMove(null);
      setExtraTurn(false);
      setIsAnimating(false);
      setAnimatingPlayer(null);

      // Determine which player we are
      if (data.players) {
        const myNumber = Object.entries(data.players).find(
          ([num, socketId]) => socketId === socket.id
        )?.[0];
        if (myNumber) {
          setMyPlayerNumber(parseInt(myNumber));
        }
      }

      // Set player info
      if (data.playerInfo) {
        setPlayerInfo(data.playerInfo);
      }
    };

    // Handle game update (after dice roll) - with animation
    const handleGameUpdate = (data) => {
      console.log("🎲 Snakes and Ladders update:", data);
      processMoveWithAnimation(data, false);
    };

    // Handle game over - with animation
    const handleGameOver = (data) => {
      console.log("🏆 Snakes and Ladders game over:", data);
      processMoveWithAnimation(data, true);
    };

    // Handle opponent left
    const handleOpponentLeft = (data) => {
      console.log("👋 Opponent left:", data);
      setOpponentLeft(true);
      setError(data?.message || "Opponent has left the game");
      setIsRolling(false);
      setIsAnimating(false);
    };

    // Handle errors
    const handleError = (data) => {
      console.error("❌ Game error:", data);
      setError(data?.message || "An error occurred");
      setIsRolling(false);
      setIsAnimating(false);
    };

    // Handle reconnection states
    const handlePlayerReconnecting = () => {
      setIsReconnecting(true);
    };

    const handlePlayerReconnected = () => {
      setIsReconnecting(false);
    };

    // Register event listeners
    socket.on("room-joined", handleRoomJoined);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("snakesladders:start", handleGameStart);
    socket.on("snakesladders:update", handleGameUpdate);
    socket.on("snakesladders:gameover", handleGameOver);
    socket.on("game:opponent_left", handleOpponentLeft);
    socket.on("game:error", handleError);
    socket.on("player:reconnecting", handlePlayerReconnecting);
    socket.on("player:reconnected", handlePlayerReconnected);

    // Cleanup
    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("snakesladders:start", handleGameStart);
      socket.off("snakesladders:update", handleGameUpdate);
      socket.off("snakesladders:gameover", handleGameOver);
      socket.off("game:opponent_left", handleOpponentLeft);
      socket.off("game:error", handleError);
      socket.off("player:reconnecting", handlePlayerReconnecting);
      socket.off("player:reconnected", handlePlayerReconnected);
    };
  }, [socket, processMoveWithAnimation]);

  // Handle dice roll
  const handleRollDice = useCallback(() => {
    if (!socket || !roomId || !isMyTurn || isRolling || isAnimating) return;

    setIsRolling(true);
    setError("");
    socket.emit("snakesladders:roll", { roomId });
  }, [socket, roomId, isMyTurn, isRolling, isAnimating]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    if (!socket || !roomId) return;

    setError("");
    setIsAnimating(false);
    setAnimatingPlayer(null);
    socket.emit("snakesladders:reset", { roomId });
  }, [socket, roomId]);

  return {
    // Game state
    positions,
    currentTurn,
    myPlayerNumber,
    winner,
    gameStarted,
    opponentLeft,
    error,
    isReconnecting,
    
    // Dice state
    lastDiceRoll,
    isRolling,
    extraTurn,
    lastMove,
    
    // Animation state
    animatingPlayer,
    isAnimating,
    
    // Player info
    playerInfo,
    
    // Computed
    isMyTurn,
    
    // Board data
    snakes: SNAKES,
    ladders: LADDERS,
    
    // Handlers
    handleRollDice,
    handlePlayAgain,
  };
}
