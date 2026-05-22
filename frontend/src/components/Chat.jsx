import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const Chat = ({ socket, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { user } = useAuth();

  useEffect(() => {
    // Handle both _id (MongoDB) and id formats
    if (user?._id) setCurrentUserId(user._id.toString());
    else if (user?.id) setCurrentUserId(user.id.toString());
    else setCurrentUserId("");
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (chatData) => {
      setMessages((prev) => [...prev, chatData]);
    };

    const handlePlayerJoined = (data) => {
      const systemMessage = {
        id: Date.now().toString(),
        roomId,
        userId: "system",
        username: "System",
        message: `${data.player.username} joined the room`,
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
        message: `${data.player.username} left the room`,
        timestamp: new Date().toISOString(),
        isSystem: true,
      };
      setMessages((prev) => [...prev, systemMessage]);
    };

    const handleChatError = (data) => {
      console.error("Chat error:", data.message);
      // You could show a toast notification here
    };

    socket.on("chat-message", handleChatMessage);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-left", handlePlayerLeft);
    socket.on("chat-error", handleChatError);

    // Welcome message
    const welcomeMessage = {
      id: Date.now().toString(),
      roomId,
      userId: "system",
      username: "System",
      message: "Welcome to the chat! Say hello to your opponent.",
      timestamp: new Date().toISOString(),
      isSystem: true,
    };
    setMessages([welcomeMessage]);

    return () => {
      socket.off("chat-message", handleChatMessage);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-left", handlePlayerLeft);
      socket.off("chat-error", handleChatError);
    };
  }, [socket, roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !socket || !socket.connected) {
      return;
    }

    socket.emit("chat-message", {
      roomId,
      message: inputMessage.trim(),
    });

    setInputMessage("");
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!socket) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] card flex flex-col z-50">
      {/* Chat Header */}
      <div
        className="flex items-center justify-between p-3 bg-surface border-b border-border rounded-t-2xl cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-display font-semibold text-text">Chat</h3>
        <button
          className="text-text-muted hover:text-text transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Chat Messages */}
      {isOpen && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-96 min-h-[200px] bg-bg">
            {messages.map((msg) => {
              // Compare user IDs as strings to handle ObjectId vs string comparisons
              const msgUserId = msg.userId?.toString();
              const isOwnMessage = msgUserId && msgUserId === currentUserId;
              const isSystem = msg.isSystem || msg.userId === "system";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isSystem
                      ? "items-center"
                      : isOwnMessage
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      isSystem
                        ? "bg-surface text-text-muted text-xs italic"
                        : isOwnMessage
                        ? "bg-violet text-white"
                        : "bg-surface text-text"
                    }`}
                  >
                    {!isSystem && (
                      <div className="text-xs font-semibold mb-1 opacity-75">
                        {msg.username}
                      </div>
                    )}
                    <div className="break-words">{msg.message}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isSystem
                          ? "text-text-muted"
                          : isOwnMessage
                          ? "text-white/60"
                          : "text-text-muted"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-border bg-surface"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="input flex-1 py-2"
                maxLength={500}
                disabled={!socket?.connected}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || !socket?.connected}
                className="btn-primary px-4 py-2"
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;
