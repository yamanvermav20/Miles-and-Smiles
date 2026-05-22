/**
 * Memory Card Component
 * Clean card with flip animation
 */

import { memo } from "react";

// Hardcoded colors for reliable rendering
const COLORS = {
  violet: "#8B7CF6",
  emerald: "#2DD4A7",
  surface: "#FFFFFF",
  border: "#E8E4DC",
};

/**
 * Card component with 3D flip animation
 * @param {Object} props - Component props
 * @param {Object} props.card - Card data {index, symbol, isFlipped, isMatched}
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether card is clickable
 * @param {boolean} props.showingMatch - Whether showing match celebration
 */
function Card({ card, onClick, disabled, showingMatch }) {
  const { index, symbol, isFlipped, isMatched } = card;
  
  const handleClick = () => {
    if (!disabled && !isFlipped && !isMatched) {
      onClick(index);
    }
  };
  
  // Determine card state
  const isRevealed = isFlipped || isMatched;
  const isClickable = !disabled && !isFlipped && !isMatched;
  
  // Get card back style
  const getBackStyle = () => ({
    backgroundColor: isClickable ? COLORS.violet : "rgba(139, 124, 246, 0.7)",
    border: `2px solid rgba(139, 124, 246, 0.3)`,
    backfaceVisibility: "hidden",
  });

  // Get card front style
  const getFrontStyle = () => ({
    backgroundColor: isMatched ? "rgba(45, 212, 167, 0.1)" : COLORS.surface,
    border: isMatched ? `2px solid rgba(45, 212, 167, 0.4)` : `2px solid ${COLORS.border}`,
    backfaceVisibility: "hidden",
    transform: "rotateY(180deg)",
  });
  
  return (
    <div
      className={`
        relative aspect-square cursor-pointer
        transition-transform duration-200
        ${isClickable ? "hover:scale-[1.03]" : ""}
      `}
      onClick={handleClick}
    >
      {/* Card inner (handles 3D flip) */}
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Card Back (face down) */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl flex items-center justify-center transition-all duration-200"
          style={getBackStyle()}
        >
          {/* Decorative pattern on card back */}
          <div className="absolute inset-1.5 rounded-lg border border-white/10" />
          <span className="text-2xl md:text-3xl text-white/30 font-display font-bold">?</span>
        </div>
        
        {/* Card Front (face up) */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl flex items-center justify-center transition-all duration-200"
          style={getFrontStyle()}
        >
          {/* Card symbol */}
          <span className={`text-3xl md:text-4xl select-none ${isRevealed ? "animate-scale-in" : ""}`}>
            {symbol || "?"}
          </span>
          
          {/* Match indicator */}
          {isMatched && (
            <div 
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS.emerald }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(Card);
