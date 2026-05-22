/**
 * useTurn Hook
 * Manages turn-based game state with timers and turn tracking
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "./useSocket";

/**
 * useTurn hook for turn-based game management
 * @param {Object} options - Hook options
 * @returns {Object} Turn state and methods
 */
export function useTurn(options = {}) {
  const {
    roomId,
    userId,
    turnTimeLimit = 60,
    onTurnStart,
    onTurnEnd,
    onTimeout,
    onMyTurn,
  } = options;

  const [currentTurn, setCurrentTurn] = useState(null);
  const [turnNumber, setTurnNumber] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(turnTimeLimit);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [turnHistory, setTurnHistory] = useState([]);
  
  const timerRef = useRef(null);
  const { on, off, emit } = useSocket();

  // Start turn timer
  const startTimer = useCallback((initialTime = turnTimeLimit) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimeRemaining(initialTime);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [turnTimeLimit, onTimeout]);

  // Stop turn timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Pause timer
  const pauseTimer = useCallback(() => {
    stopTimer();
    setIsPaused(true);
  }, [stopTimer]);

  // Resume timer
  const resumeTimer = useCallback(() => {
    setIsPaused(false);
    startTimer(timeRemaining);
  }, [startTimer, timeRemaining]);

  // End my turn (called after making a move)
  const endTurn = useCallback(() => {
    if (!isMyTurn) return;

    stopTimer();
    
    setTurnHistory((prev) => [
      ...prev,
      {
        player: userId,
        turnNumber,
        timestamp: Date.now(),
      },
    ]);

    emit("game:end-turn", { roomId });
    onTurnEnd?.();
  }, [isMyTurn, stopTimer, userId, turnNumber, emit, roomId, onTurnEnd]);

  // Socket event handlers
  useEffect(() => {
    if (!roomId) return;

    // Turn changed
    const handleTurnChange = (data) => {
      const { currentPlayer, turnNumber: newTurnNumber, timeLimit } = data;
      
      setCurrentTurn(currentPlayer?.id || currentPlayer);
      setTurnNumber(newTurnNumber);
      
      const myTurn = (currentPlayer?.id || currentPlayer) === userId;
      setIsMyTurn(myTurn);
      
      if (myTurn) {
        startTimer(timeLimit || turnTimeLimit);
        onMyTurn?.();
      } else {
        stopTimer();
      }
      
      onTurnStart?.(data);
    };

    // Turn warning (time running low)
    const handleTurnWarning = (data) => {
      if (data.playerId === userId) {
        console.warn(`⏰ Time warning: ${data.secondsRemaining}s remaining`);
      }
    };

    // Turn timeout
    const handleTurnTimeout = (data) => {
      if (data.player?.id === userId || data.playerId === userId) {
        stopTimer();
        onTimeout?.();
      }
    };

    // Game paused
    const handleGamePause = () => {
      pauseTimer();
    };

    // Game resumed
    const handleGameResume = (data) => {
      if (data.currentPlayer?.id === userId) {
        resumeTimer();
      }
    };

    // Timer sync (for reconnection)
    const handleTimerSync = (data) => {
      setTimeRemaining(Math.ceil(data.timeRemaining / 1000));
      if (isMyTurn && !isPaused) {
        startTimer(Math.ceil(data.timeRemaining / 1000));
      }
    };

    // Register handlers
    on("turn-change", handleTurnChange);
    on("game:turn-change", handleTurnChange);
    on("turn-warning", handleTurnWarning);
    on("turn-timeout", handleTurnTimeout);
    on("game:pause", handleGamePause);
    on("game:resume", handleGameResume);
    on("timer-sync", handleTimerSync);

    return () => {
      off("turn-change", handleTurnChange);
      off("game:turn-change", handleTurnChange);
      off("turn-warning", handleTurnWarning);
      off("turn-timeout", handleTurnTimeout);
      off("game:pause", handleGamePause);
      off("game:resume", handleGameResume);
      off("timer-sync", handleTimerSync);
      stopTimer();
    };
  }, [
    roomId,
    userId,
    turnTimeLimit,
    isMyTurn,
    isPaused,
    on,
    off,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    onTurnStart,
    onTimeout,
    onMyTurn,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // Format time remaining
  const formatTime = useCallback((seconds = timeRemaining) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, [timeRemaining]);

  // Get time percentage (for progress bars)
  const getTimePercentage = useCallback(() => {
    return (timeRemaining / turnTimeLimit) * 100;
  }, [timeRemaining, turnTimeLimit]);

  // Check if time is low (for visual warnings)
  const isTimeLow = useCallback((threshold = 10) => {
    return timeRemaining <= threshold;
  }, [timeRemaining]);

  return {
    // State
    currentTurn,
    turnNumber,
    timeRemaining,
    formattedTime: formatTime(),
    timePercentage: getTimePercentage(),
    isMyTurn,
    isPaused,
    isTimeLow: isTimeLow(),
    turnHistory,
    
    // Methods
    endTurn,
    pauseTimer,
    resumeTimer,
    formatTime,
    getTimePercentage,
    isTimeLow,
  };
}

export default useTurn;
