import { useState, useEffect, useRef, memo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const FloatingChat = memo(function FloatingChat({ socket, roomId }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?._id) setCurrentUserId(user._id.toString());
    else if (user?.id) setCurrentUserId(user.id.toString());
    else setCurrentUserId("");
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (chatData) => {
      setMessages((prev) => [...prev, chatData]);
      if (!isOpen) setUnreadCount((prev) => prev + 1);
    };

    const handlePlayerJoined = (data) => {
      const systemMessage = {
        id: Date.now().toString(),
        roomId,
        userId: "system",
        username: "System",
        message: `${data.player.username} joined`,
        timestamp: new Date().toISOString(),
        isSystem: true,
      };
      setMessages((prev) => [...prev, systemMessage]);
    };

    const handlePlayerLeft = (data) => {
      const systemMessage = {
        id: Date.now().toString(),
        roomId,
        userId: "system",
        username: "System",
        message: `${data.player.username} left`,
        timestamp: new Date().toISOString(),
        isSystem: true,
      };
      setMessages((prev) => [...prev, systemMessage]);
    };

    socket.on("chat-message", handleChatMessage);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-left", handlePlayerLeft);

    return () => {
      socket.off("chat-message", handleChatMessage);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-left", handlePlayerLeft);
    };
  }, [socket, roomId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket?.connected) return;

    socket.emit("chat-message", { roomId, message: inputMessage.trim() });
    setInputMessage("");
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!socket) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-xl 
          bg-violet text-white
          shadow-glow
          flex items-center justify-center transition-all duration-200
          hover:scale-105 active:scale-95 ${isOpen ? "hidden" : ""}`}
        aria-label="Open chat"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Panel */}
          <div className="card relative w-full sm:w-96 max-h-[85vh] sm:max-h-[70vh] m-0 sm:m-4 
            rounded-t-3xl sm:rounded-2xl
            flex flex-col overflow-hidden
            animate-hero">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-violet text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                <h3 className="font-display font-semibold">Game Chat</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/20 
                  flex items-center justify-center
                  hover:bg-white/30 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] bg-bg">
              {messages.length === 0 && (
                <p className="text-center text-sm text-text-muted py-8">
                  No messages yet. Say hello! 👋
                </p>
              )}
              {messages.map((msg) => {
                const isOwnMessage = msg.userId?.toString() === currentUserId;
                const isSystem = msg.isSystem || msg.userId === "system";

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSystem ? "justify-center" : isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 ${
                        isSystem
                          ? "text-xs text-text-muted italic"
                          : isOwnMessage
                          ? "bg-violet text-white rounded-xl rounded-br-sm"
                          : "bg-surface text-text rounded-xl rounded-bl-sm"
                      }`}
                    >
                      {!isSystem && !isOwnMessage && (
                        <div className="text-xs font-medium text-violet mb-1">
                          {msg.username}
                        </div>
                      )}
                      <p className="text-sm break-words">{msg.message}</p>
                      {!isSystem && (
                        <p className={`text-[10px] mt-1 ${isOwnMessage ? "text-white/60" : "text-text-muted"}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-surface">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1 py-3"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-12 h-12 rounded-xl bg-violet text-white
                    flex items-center justify-center
                    hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all active:scale-95"
                  aria-label="Send message"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

export default FloatingChat;
