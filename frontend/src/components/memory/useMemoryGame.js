/**
 * Custom Hook for Memory Card Matching Game State and Socket Logic
 * Manages all game state and socket event handling with flip animations
 */

import { useState, useEffect, useCallback } from "react";

// Animation delay constants (ms)
const FLIP_ANIMATION_DELAY = 400;  // Time for card flip animation
const MATCH_CELEBRATION_DELAY = 600; // Time to show matched cards
const NO_MATCH_VIEW_DELAY = 1000;  // Time to view non-matching cards before hide

/**
 * Custom hook for Memory card game
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} roomId - Room ID
 * @returns {Object} Game state and handlers
 */
export function useMemoryGame(socket, roomId) {
  // Card grid state
  const [cards, setCards] = useState([]);
  const [gridSize, setGridSize] = useState(4);
  
  // Game state
  const [currentTurn, setCurrentTurn] = useState(1);
  const [myPlayerNumber, setMyPlayerNumber] = useState(null);
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [error, setError] = useState("");
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Scores
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  
  // Currently flipped cards (for animation)
  const [flippedCards, setFlippedCards] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Last flip for animation
  const [lastFlip, setLastFlip] = useState(null);
  const [showingMatch, setShowingMatch] = useState(false);
  
  // Player info (usernames)
  const [playerInfo, setPlayerInfo] = useState({
    1: { username: "Player 1" },
    2: { username: "Player 2" },
  });

  // Computed values - disable turn during animation
  const isMyTurn = !isReconnecting && !isProcessing && gameStarted && currentTurn === myPlayerNumber && !winner;

  // Handle card flip
  const flipCard = useCallback((cardIndex) => {
    if (!socket || !isMyTurn || isProcessing) return;
    
    const card = cards[cardIndex];
    if (!card || card.isFlipped || card.isMatched) return;
    
    // Optimistically flip the card locally
    setCards(prev => prev.map((c, i) => 
      i === cardIndex ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardIndex]);
    
    // Emit to server
    socket.emit("memory:flip", { roomId, cardIndex });
  }, [socket, roomId, isMyTurn, isProcessing, cards]);

  // Handle reset / play again
  const handleReset = useCallback(() => {
    if (!socket) return;
    socket.emit("memory:reset", { roomId });
  }, [socket, roomId]);

  // Handle leaving room
  const handleLeaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit("leave-room", { roomId });
    window.location.href = "/";
  }, [socket, roomId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Game started
    const handleGameStart = (data) => {
      console.log("Memory game started:", data);
      setCards(data.cards || []);
      setGridSize(data.gridSize || 4);
      setScores(data.scores || { 1: 0, 2: 0 });
      setCurrentTurn(data.currentTurn || 1);
      setFlippedCards(data.flippedCards || []);
      setWinner(null);
      setGameStarted(true);
      setOpponentLeft(false);
      setIsProcessing(false);
      setLastFlip(null);
      setShowingMatch(false);
      
      if (data.playerInfo) {
        setPlayerInfo(data.playerInfo);
      }
      
      // Determine my player number from socket ID
      const mySocketId = socket.id;
      for (const [num, socketId] of Object.entries(data.players)) {
        if (socketId === mySocketId) {
          setMyPlayerNumber(parseInt(num));
          break;
        }
      }
    };

    // Game update (card flip)
    const handleGameUpdate = (data) => {
      console.log("Memory update:", data);
      
      const flip = data.lastFlip;
      setLastFlip(flip);
      
      if (flip?.isMatch) {
        // Match found - celebration animation
        setShowingMatch(true);
        setTimeout(() => {
          setShowingMatch(false);
          setCards(data.cards || []);
          setScores(data.scores || { 1: 0, 2: 0 });
          setFlippedCards(data.flippedCards || []);
          setIsProcessing(false);
        }, MATCH_CELEBRATION_DELAY);
      } else if (flip && !flip.isFirstCard) {
        // No match - show cards briefly before hiding
        setCards(data.cards || []);
        setFlippedCards(data.flippedCards || []);
        setIsProcessing(true); // Lock while showing non-match
      } else {
        // First card of turn
        setCards(data.cards || []);
        setFlippedCards(data.flippedCards || []);
      }
      
      setScores(data.scores || scores);
      
      if (data.playerInfo) {
        setPlayerInfo(data.playerInfo);
      }
    };

    // Cards hidden after no match
    const handleHideCards = (data) => {
      console.log("Memory hide cards:", data);
      setCards(data.cards || []);
      setFlippedCards(data.flippedCards || []);
      setCurrentTurn(data.currentTurn);
      setIsProcessing(false);
      setLastFlip(null);
      
      if (data.playerInfo) {
        setPlayerInfo(data.playerInfo);
      }
    };

    // Game over
    const handleGameOver = (data) => {
      console.log("Memory game over:", data);
      setCards(data.cards || []);
      setScores(data.scores || { 1: 0, 2: 0 });
      setWinner(data.winner);
      setIsProcessing(false);
      
      if (data.playerInfo) {
        setPlayerInfo(data.playerInfo);
      }
    };

    // Error handling
    const handleError = (data) => {
      console.error("Memory game error:", data.message);
      setError(data.message);
      setIsProcessing(false);
      setTimeout(() => setError(""), 3000);
    };

    // Opponent left
    const handleOpponentLeft = () => {
      setOpponentLeft(true);
      setGameStarted(false);
    };

    // Register event listeners
    socket.on("memory:start", handleGameStart);
    socket.on("memory:update", handleGameUpdate);
    socket.on("memory:hide", handleHideCards);
    socket.on("memory:gameover", handleGameOver);
    socket.on("game:error", handleError);
    socket.on("opponent-left", handleOpponentLeft);
    socket.on("player-left", handleOpponentLeft);

    // Cleanup
    return () => {
      socket.off("memory:start", handleGameStart);
      socket.off("memory:update", handleGameUpdate);
      socket.off("memory:hide", handleHideCards);
      socket.off("memory:gameover", handleGameOver);
      socket.off("game:error", handleError);
      socket.off("opponent-left", handleOpponentLeft);
      socket.off("player-left", handleOpponentLeft);
    };
  }, [socket, scores]);

  return {
    // Card state
    cards,
    gridSize,
    flippedCards,
    
    // Game state
    currentTurn,
    myPlayerNumber,
    winner,
    gameStarted,
    opponentLeft,
    error,
    isReconnecting,
    
    // Score state
    scores,
    
    // Animation state
    isProcessing,
    lastFlip,
    showingMatch,
    
    // Player info
    playerInfo,
    
    // Computed
    isMyTurn,
    
    // Actions
    flipCard,
    handleReset,
    handleLeaveRoom,
  };
}

export default useMemoryGame;
