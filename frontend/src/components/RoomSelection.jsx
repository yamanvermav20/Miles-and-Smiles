import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const VITE_BACKEND_SERVER = import.meta.env.VITE_BACKEND_SERVER;

const RoomSelection = ({ gameName, onRoomJoined }) => {
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [roomCode, setRoomCode] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState(null);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const roomJoinedRef = useRef(false);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const serverUrl = VITE_BACKEND_SERVER?.replace(/\/$/, "");
    console.log("Connecting to socket server:", serverUrl);

    const newSocket = io(serverUrl, {
      auth: {
        token: (() => {
          try {
            return token;
          } catch {
            return null;
          }
        })(),
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to server");
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      setError("Failed to connect to server. Please check your connection.");
      setLoading(false);
      if (error.message?.includes("Authentication error")) {
        setError("Authentication failed. Please log in again.");
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("⚠️ Disconnected:", reason);
      if (reason === "io server disconnect") {
        setError("Disconnected from server");
      }
    });

    newSocket.on("room-created", (data) => {
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
      console.log("✅ Room created:", data);
      setCreatedRoomCode(data.roomId);
      roomJoinedRef.current = true;
      setTimeout(() => {
        onRoomJoined({ roomId: data.roomId, gameName, socket: newSocket });
      }, 3000);
    });

    newSocket.on("room-joined", (data) => {
      setLoading(false);
      console.log("✅ Room joined:", data);
      roomJoinedRef.current = true;
      onRoomJoined({ roomId: data.roomId, gameName, socket: newSocket });
    });

    newSocket.on("room-error", (data) => {
      setLoading(false);
      console.error("❌ Room error:", data);
      setError(data.message || "An error occurred");
    });

    newSocket.on("room-not-found", () => {
      setLoading(false);
      setError("Room not found. Please check the room code.");
    });

    newSocket.on("room-full", () => {
      setLoading(false);
      setError("Room is full. Please try another room.");
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Remove all event listeners to prevent memory leaks
      newSocket.off("connect");
      newSocket.off("connect_error");
      newSocket.off("disconnect");
      newSocket.off("room-created");
      newSocket.off("room-joined");
      newSocket.off("room-error");
      newSocket.off("room-not-found");
      newSocket.off("room-full");

      if (!roomJoinedRef.current) {
        console.log("Disconnecting socket");
        newSocket.disconnect();
      }
    };
  }, [gameName, onRoomJoined, token]);

  const handleCreateRoom = () => {
    if (!socket || !socket.connected) {
      setError("Not connected to server. Please wait...");
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setError("");
    setLoading(true);
    console.log("Emitting create-room event with gameName:", gameName);

    // Emit with acknowledgment to verify server received it
    socket.emit("create-room", { gameName }, (response) => {
      if (response?.error) {
        console.error("Server error:", response.error);
        setError(response.error);
        setLoading(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        console.log("Server acknowledged create-room request");
      }
    });

    // Add timeout in case server doesn't respond
    timeoutRef.current = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          setError("Request timed out. Please try again.");
          console.error("Create room request timed out");
          return false;
        }
        return prevLoading;
      });
    }, 10000); // 10 second timeout
  };

  const handleJoinRoom = () => {
    if (!socket || !socket.connected) {
      setError("Not connected to server. Please wait...");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setError("");
    setLoading(true);
    socket.emit("join-room", { roomId: roomCode.trim(), gameName });
  };

  const handleBack = () => {
    navigate("/");
  };

  if (mode === null) {
    return (
      <div className="min-h-screen bg-bg font-body grain flex items-center justify-center p-6">
        {/* Background elements */}
        <div className="fixed inset-0 geo-pattern pointer-events-none opacity-60" />
        <div className="fixed top-20 left-[20%] w-40 h-40 rounded-full bg-accent/10 blur-3xl animate-float" />
        <div className="fixed bottom-20 right-[20%] w-48 h-48 rounded-full bg-violet/10 blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        
        <div className="relative card p-8 max-w-md w-full animate-hero">
          {/* Game icon */}
          <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎮</span>
          </div>
          
          <h1 className="font-display text-3xl font-semibold text-center text-text mb-2">{gameName}</h1>
          <p className="text-center text-text-secondary mb-8">
            Choose how you want to play
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Room
            </button>

            <button
              onClick={() => setMode("join")}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
              </svg>
              Join Room
            </button>

            <button
              onClick={handleBack}
              className="btn-ghost w-full"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-body grain flex items-center justify-center p-6">
      {/* Background elements */}
      <div className="fixed inset-0 geo-pattern pointer-events-none opacity-60" />
      <div className="fixed top-20 left-[20%] w-40 h-40 rounded-full bg-accent/10 blur-3xl animate-float" />
      <div className="fixed bottom-20 right-[20%] w-48 h-48 rounded-full bg-violet/10 blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      
      <div className="relative card p-8 max-w-md w-full animate-hero">
        <h1 className="font-display text-3xl font-semibold text-center text-text mb-2">{gameName}</h1>
        <p className="text-center text-text-secondary mb-8">
          {mode === "create" ? "Create a new room" : "Join an existing room"}
        </p>

        {mode === "create" ? (
          <div className="space-y-4">
            {createdRoomCode ? (
              <>
                <div className="p-6 bg-emerald-soft border border-emerald/20 rounded-2xl text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">Room created!</p>
                  <p className="font-display text-3xl font-bold text-emerald tracking-wider">
                    {createdRoomCode}
                  </p>
                  <p className="text-xs text-text-muted mt-3">
                    Share this code with your friend
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Waiting for opponent...
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleCreateRoom}
                  disabled={loading || !socket?.connected}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Creating Room..."
                    : socket?.connected
                    ? "Create Room"
                    : "Connecting..."}
                </button>

                <button
                  onClick={() => {
                    setMode(null);
                    setError("");
                    setCreatedRoomCode(null);
                  }}
                  className="btn-ghost w-full"
                >
                  Back
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="input text-center font-display text-2xl tracking-[0.3em] uppercase"
                maxLength={6}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={loading || !socket?.connected || !roomCode.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Joining Room..."
                : socket?.connected
                ? "Join Room"
                : "Connecting..."}
            </button>

            <button
              onClick={() => {
                setMode(null);
                setRoomCode("");
                setError("");
              }}
              className="btn-ghost w-full"
            >
              Back
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-accent-soft border border-accent/20 text-accent rounded-xl text-center text-sm animate-fadeIn">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSelection;
