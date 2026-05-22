/**
 * Friend Chat Component
 * Private chat between friends
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Send, Loader2, MessageCircle, Minimize2, Maximize2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const FriendChat = ({ friend, onClose }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);

  const friendId = friend?._id || friend?.userId || friend;
  const friendName = friend?.username || "Friend";
  const friendPfp = friend?.pfp_url;

  // Generate a consistent room ID for both users
  const getChatRoomId = useCallback(() => {
    if (!user?._id || !friendId) return null;
    const ids = [user._id, friendId].sort();
    return `dm_${ids[0]}_${ids[1]}`;
  }, [user?._id, friendId]);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !friendId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Friend chat connected");
      setIsConnected(true);
      
      // Join the DM room
      const roomId = getChatRoomId();
      if (roomId) {
        socket.emit("dm:join", { friendId, roomId });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Friend chat disconnected");
      setIsConnected(false);
    });

    socket.on("dm:message", (chatData) => {
      setMessages((prev) => [...prev, chatData]);
      if (isMinimized) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on("dm:history", (history) => {
      setMessages(history || []);
    });

    socket.on("dm:error", (error) => {
      console.error("DM error:", error.message);
    });

    return () => {
      const roomId = getChatRoomId();
      if (roomId) {
        socket.emit("dm:leave", { roomId });
      }
      socket.disconnect();
    };
  }, [token, friendId, getChatRoomId, isMinimized]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // Reset unread count when opening
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !socketRef.current || !isConnected) return;

    const roomId = getChatRoomId();
    if (!roomId) return;

    socketRef.current.emit("dm:message", {
      roomId,
      friendId,
      message: inputMessage.trim(),
    });

    setInputMessage("");
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!friend) return null;

  return createPortal(
    <div 
      className={`fixed bottom-4 right-4 z-[200] transition-all duration-300 ${
        isMinimized ? "w-72" : "w-80 sm:w-96"
      }`}
    >
      <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-soft to-emerald-soft border-b border-border cursor-pointer"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-3">
            {friendPfp ? (
              <img
                src={friendPfp}
                alt={friendName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-violet flex items-center justify-center ring-2 ring-white">
                <span className="text-white font-display font-semibold text-sm">
                  {friendName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-display font-semibold text-text text-sm">{friendName}</h3>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald" : "bg-text-muted"}`} />
                {isConnected ? "Online" : "Connecting..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isMinimized && unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-accent text-white rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="p-1.5 rounded-lg hover:bg-white/50 text-text-muted transition-colors"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-accent-soft hover:text-accent text-text-muted transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 min-h-[200px] bg-bg">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-violet-soft flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6 text-violet" />
                  </div>
                  <p className="text-sm text-text-muted">
                    Start a conversation with {friendName}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.userId === user?._id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? "bg-violet text-white rounded-br-md"
                            : "bg-surface border border-border text-text rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          isOwnMessage ? "text-white/70" : "text-text-muted"
                        }`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-bg-deep border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-colors"
                  maxLength={500}
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || !isConnected}
                  className="px-4 py-2.5 bg-violet text-white rounded-xl hover:bg-violet/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {!isConnected ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FriendChat;
