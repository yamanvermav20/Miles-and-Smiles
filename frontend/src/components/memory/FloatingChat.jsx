/**
 * Floating Chat Component for Memory Game
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
          bg-violet text-white
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
        <div className="fixed bottom-4 right-4 z-50 w-80 h-96 card backdrop-blur-xl border-violet/20 flex flex-col overflow-hidden animate-hero">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-violet text-white rounded-t-2xl">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Game Chat
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-bg">
            {messages.length === 0 && (
              <p className="text-center text-text-muted text-sm py-8">
                No messages yet. Say hello!
              </p>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`
                  max-w-[80%] px-3 py-2 rounded-xl text-sm
                  ${msg.isSystem
                    ? "mx-auto bg-surface text-text-muted text-center text-xs"
                    : msg.isSelf
                      ? "ml-auto bg-violet text-white rounded-br-sm"
                      : "mr-auto bg-surface text-text rounded-bl-sm"
                  }
                `}
              >
                {!msg.isSystem && !msg.isSelf && (
                  <p className="text-xs font-medium text-violet mb-1">{msg.username}</p>
                )}
                <p>{msg.message}</p>
              </div>
            ))}
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
                className="w-10 h-10 rounded-xl bg-violet text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow active:scale-95 transition-all"
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
