import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";

const ExitButton = memo(function ExitButton({ socket, roomId }) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleExit = () => {
    if (socket) {
      socket.emit("leave-room", { roomId });
    }
    navigate("/");
  };

  return (
    <>
      {/* Exit Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-xl
          bg-surface/90 backdrop-blur-sm
          border border-border shadow-md
          flex items-center justify-center
          hover:bg-accent-soft hover:border-accent/30
          group transition-all duration-200"
        aria-label="Leave game"
      >
        <svg 
          className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal */}
          <div className="card relative w-full max-w-sm p-6 animate-hero">
            
            {/* Icon */}
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl 
              bg-accent-soft
              flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            <h3 className="font-display text-lg font-semibold text-center text-text mb-2">
              Leave Game?
            </h3>
            <p className="text-sm text-center text-text-secondary mb-6">
              Your progress will be lost and your opponent will win by forfeit.
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
});

export default ExitButton;
