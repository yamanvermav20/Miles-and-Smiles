/**
 * Floating Chat Component for Snakes and Ladders
 * Updated with new design system
 */

import { useState, useEffect, useRef, memo } from "react";

function FloatingChat({ socket, roomId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("chat:message", handleMessage);
    return () => socket.off("chat:message", handleMessage);
  }, [socket, isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear unread when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;

    socket.emit("chat:message", {
      roomId,
      message: inputValue.trim(),
    });
    setInputValue("");
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-4 right-4 z-40
          w-14 h-14 rounded-xl
          bg-emerald text-white
          shadow-glow
          flex items-center justify-center
          hover:scale-105 active:scale-95 transition-all
          ${isOpen ? "hidden" : ""}
        `}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-full flex flex-col card rounded-none shadow-2xl animate-hero">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald text-white">
            <h3 className="font-display font-semibold">Game Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-bg">
            {messages.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-8">
                No messages yet. Say hi! 👋
              </p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      msg.isOwn
                        ? "bg-emerald text-white rounded-br-sm"
                        : "bg-surface text-text rounded-bl-sm"
                    }`}
                  >
                    {!msg.isOwn && (
                      <p className="text-[10px] font-medium text-emerald mb-0.5">
                        {msg.username}
                      </p>
                    )}
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-border bg-surface">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="input flex-1 py-2"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-4 py-2 rounded-xl bg-emerald text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default memo(FloatingChat);
