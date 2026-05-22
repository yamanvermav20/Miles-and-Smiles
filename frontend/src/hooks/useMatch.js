/**
 * useMatch Hook
 * Manages matchmaking state and game room logic
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "./useSocket";

/**
 * Match states
 */
export const MATCH_STATES = {
  IDLE: "idle",
  SEARCHING: "searching",
  FOUND: "found",
  JOINING: "joining",
  IN_GAME: "in-game",
  RECONNECTING: "reconnecting",
  ERROR: "error",
};

/**
 * useMatch hook for matchmaking and room management
 * @param {Object} options - Hook options
 * @returns {Object} Match state and methods
 */
export function useMatch(options = {}) {
  const { game, onMatchFound, onGameStart, onGameEnd, onError } = options;
  
  const [state, setState] = useState(MATCH_STATES.IDLE);
  const [roomId, setRoomId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [queueTime, setQueueTime] = useState(0);
  const [error, setError] = useState(null);
  const [matchType, setMatchType] = useState("casual");
  const [privateCode, setPrivateCode] = useState(null);
  
  const queueTimerRef = useRef(null);
  const { socket, isConnected, emit, on, off } = useSocket();

  // Start matchmaking
  const findMatch = useCallback((type = "casual") => {
    if (!isConnected) {
      setError("Not connected to server");
      setState(MATCH_STATES.ERROR);
      return;
    }

    setMatchType(type);
    setState(MATCH_STATES.SEARCHING);
    setQueueTime(0);
    setError(null);

    // Start queue timer
    queueTimerRef.current = setInterval(() => {
      setQueueTime((prev) => prev + 1);
    }, 1000);

    emit("matchmaking:join", { game, queueType: type });
  }, [isConnected, emit, game]);

  // Cancel matchmaking
  const cancelSearch = useCallback(() => {
    if (queueTimerRef.current) {
      clearInterval(queueTimerRef.current);
      queueTimerRef.current = null;
    }

    emit("matchmaking:leave", { game });
    setState(MATCH_STATES.IDLE);
    setQueueTime(0);
  }, [emit, game]);

  // Create private room
  const createPrivateRoom = useCallback((settings = {}) => {
    if (!isConnected) {
      setError("Not connected to server");
      return;
    }

    emit("room:create-private", { game, settings });
    setState(MATCH_STATES.SEARCHING);
    setMatchType("private");
  }, [isConnected, emit, game]);

  // Join private room by code
  const joinPrivateRoom = useCallback((code) => {
    if (!isConnected) {
      setError("Not connected to server");
      return;
    }

    emit("room:join-private", { code });
    setState(MATCH_STATES.JOINING);
  }, [isConnected, emit]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (roomId) {
      emit("leave-room", { roomId });
    }
    
    if (queueTimerRef.current) {
      clearInterval(queueTimerRef.current);
      queueTimerRef.current = null;
    }

    setState(MATCH_STATES.IDLE);
    setRoomId(null);
    setPlayers([]);
    setPrivateCode(null);
  }, [emit, roomId]);

  // Set ready status
  const setReady = useCallback((ready = true) => {
    if (roomId) {
      emit("room:set-ready", { roomId, ready });
    }
  }, [emit, roomId]);

  // Request rematch
  const requestRematch = useCallback(() => {
    if (roomId) {
      emit("room:request-rematch", { roomId });
    }
  }, [emit, roomId]);

  // Accept rematch
  const acceptRematch = useCallback(() => {
    if (roomId) {
      emit("room:accept-rematch", { roomId });
    }
  }, [emit, roomId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Match found
    const handleMatchFound = (data) => {
      if (queueTimerRef.current) {
        clearInterval(queueTimerRef.current);
        queueTimerRef.current = null;
      }

      setState(MATCH_STATES.FOUND);
      setRoomId(data.roomId);
      setPlayers(data.players);
      
      onMatchFound?.(data);
    };

    // Room created (private)
    const handleRoomCreated = (data) => {
      setState(MATCH_STATES.FOUND);
      setRoomId(data.roomId);
      setPrivateCode(data.code);
      setPlayers(data.players || []);
    };

    // Player joined room
    const handlePlayerJoined = (data) => {
      setPlayers((prev) => [...prev, data.player]);
    };

    // Player left room
    const handlePlayerLeft = (data) => {
      setPlayers((prev) => prev.filter((p) => p.oderId !== data.oderId));
    };

    // Game starting
    const handleGameStart = (data) => {
      setState(MATCH_STATES.IN_GAME);
      onGameStart?.(data);
    };

    // Game ended
    const handleGameEnd = (data) => {
      setState(MATCH_STATES.IDLE);
      onGameEnd?.(data);
    };

    // Error
    const handleError = (data) => {
      setError(data.message);
      setState(MATCH_STATES.ERROR);
      
      if (queueTimerRef.current) {
        clearInterval(queueTimerRef.current);
        queueTimerRef.current = null;
      }
      
      onError?.(data);
    };

    // Reconnect support
    const handleReconnectAvailable = (data) => {
      setState(MATCH_STATES.RECONNECTING);
      setRoomId(data.roomId);
      setPlayers(data.players);
    };

    // Register handlers
    on("matchmaking:found", handleMatchFound);
    on("room:created", handleRoomCreated);
    on("room:player-joined", handlePlayerJoined);
    on("room:player-left", handlePlayerLeft);
    on("game:start", handleGameStart);
    on("game:end", handleGameEnd);
    on("matchmaking:error", handleError);
    on("room:error", handleError);
    on("reconnect:available", handleReconnectAvailable);

    return () => {
      off("matchmaking:found", handleMatchFound);
      off("room:created", handleRoomCreated);
      off("room:player-joined", handlePlayerJoined);
      off("room:player-left", handlePlayerLeft);
      off("game:start", handleGameStart);
      off("game:end", handleGameEnd);
      off("matchmaking:error", handleError);
      off("room:error", handleError);
      off("reconnect:available", handleReconnectAvailable);
    };
  }, [socket, on, off, onMatchFound, onGameStart, onGameEnd, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueTimerRef.current) {
        clearInterval(queueTimerRef.current);
      }
    };
  }, []);

  // Format queue time
  const formatQueueTime = useCallback(() => {
    const minutes = Math.floor(queueTime / 60);
    const seconds = queueTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [queueTime]);

  return {
    // State
    state,
    roomId,
    players,
    queueTime,
    formattedQueueTime: formatQueueTime(),
    error,
    matchType,
    privateCode,
    isSearching: state === MATCH_STATES.SEARCHING,
    isInGame: state === MATCH_STATES.IN_GAME,
    isReconnecting: state === MATCH_STATES.RECONNECTING,
    
    // Methods
    findMatch,
    cancelSearch,
    createPrivateRoom,
    joinPrivateRoom,
    leaveRoom,
    setReady,
    requestRematch,
    acceptRematch,
    clearError: () => setError(null),
  };
}

export default useMatch;
