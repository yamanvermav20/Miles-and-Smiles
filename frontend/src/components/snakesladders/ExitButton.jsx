/**
 * Exit Button Component for Snakes and Ladders
 * Updated with new design system
 */

import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";

function ExitButton({ socket, roomId }) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleExit = () => {
    if (socket && roomId) {
      socket.emit("leave-room", { roomId });
    }
    navigate("/");
  };

  return (
    <>
      {/* Exit Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-xl bg-surface/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-all hover:scale-105 active:scale-95"
        title="Exit Game"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fadeIn">
          <div className="card max-w-sm w-full p-6 animate-hero">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent-soft flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <h3 className="font-display text-xl font-semibold text-center text-text mb-2">
              Leave Game?
            </h3>
            <p className="text-center text-text-secondary text-sm mb-6">
              Are you sure you want to leave? Your opponent will win by forfeit.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Stay
              </button>
              <button
                onClick={handleExit}
                className="btn-primary flex-1"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(ExitButton);
