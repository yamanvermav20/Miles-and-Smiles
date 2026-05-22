/**
 * useSocket Hook
 * Centralized socket management with auto-reconnect and event handling
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Singleton socket instance
let socketInstance = null;

/**
 * Get or create socket instance
 * @param {string} token - Auth token
 * @returns {Socket} Socket instance
 */
function getSocket(token) {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
}

/**
 * useSocket hook for socket.io connection management
 * @param {Object} options - Hook options
 * @returns {Object} Socket state and methods
 */
export function useSocket(options = {}) {
  const { autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const eventHandlersRef = useRef(new Map());

  // Get token from localStorage
  const getToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  // Connect to socket
  const connect = useCallback(() => {
    const token = getToken();
    if (!token) {
      setConnectionError("No authentication token");
      return null;
    }

    const socket = getSocket(token);
    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
      
      if (reason === "io server disconnect") {
        // Server disconnected, need to manually reconnect
        socket.connect();
      }
    });

    socket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log("🔌 Reconnecting... Attempt:", attempt);
      setIsReconnecting(true);
    });

    socket.on("reconnect", (attempt) => {
      console.log("🔌 Reconnected after", attempt, "attempts");
      setIsReconnecting(false);
      setIsConnected(true);
    });

    socket.on("reconnect_failed", () => {
      console.error("🔌 Reconnection failed");
      setIsReconnecting(false);
      setConnectionError("Reconnection failed");
    });

    // Re-register existing event handlers
    eventHandlersRef.current.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        socket.on(event, handler);
      });
    });

    return socket;
  }, [getToken]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Emit event
  const emit = useCallback((event, data, callback) => {
    if (socketRef.current?.connected) {
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
    } else {
      console.warn("Socket not connected, cannot emit:", event);
    }
  }, []);

  // Subscribe to event
  const on = useCallback((event, handler) => {
    // Store handler for re-registration on reconnect
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event).add(handler);

    // Register with socket if connected
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }

    // Return cleanup function
    return () => {
      eventHandlersRef.current.get(event)?.delete(handler);
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  // Unsubscribe from event
  const off = useCallback((event, handler) => {
    if (handler) {
      eventHandlersRef.current.get(event)?.delete(handler);
      socketRef.current?.off(event, handler);
    } else {
      eventHandlersRef.current.delete(event);
      socketRef.current?.off(event);
    }
  }, []);

  // Subscribe to event once
  const once = useCallback((event, handler) => {
    const wrappedHandler = (...args) => {
      handler(...args);
      eventHandlersRef.current.get(event)?.delete(wrappedHandler);
    };
    
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event).add(wrappedHandler);
    
    socketRef.current?.once(event, wrappedHandler);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // Cleanup event handlers on unmount
      eventHandlersRef.current.clear();
    };
  }, [autoConnect, connect]);

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    connectionError,
    connect,
    disconnect,
    emit,
    on,
    off,
    once,
  };
}

/**
 * useSocketEvent hook for subscribing to specific events
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Array} deps - Dependencies for handler
 */
export function useSocketEvent(event, handler, deps = []) {
  const { on } = useSocket({ autoConnect: false });

  useEffect(() => {
    const cleanup = on(event, handler);
    return cleanup;
  }, [event, on, ...deps]);
}

export default useSocket;
