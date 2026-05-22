/**
 * Cell Component
 * Individual square in the TicTacToe board with clean styling
 */

import { memo, useState } from "react";

// Hardcoded colors for reliable rendering
const COLORS = {
  violet: "#8B7CF6",
  accent: "#FF6B4A",
  bgDeep: "#F5F0E8",
  surface: "#FFFFFF",
  border: "#E8E4DC",
  textMuted: "#9C9488",
};

/**
 * @param {Object} props
 * @param {string|null} props.value - Cell value ("X", "O", or null)
 * @param {number} props.index - Cell index (0-8)
 * @param {boolean} props.isClickable - Whether the cell can be clicked
 * @param {Function} props.onClick - Click handler function
 * @param {boolean} props.isWinningCell - Whether this cell is part of winning line
 */
function Cell({ value, index, isClickable, onClick, isWinningCell }) {
  const [isHovered, setIsHovered] = useState(false);

  // Get cell style based on state
  const getCellStyle = () => {
    if (value === "X") {
      return {
        backgroundColor: "rgba(139, 124, 246, 0.1)",
        borderColor: "rgba(139, 124, 246, 0.3)",
        boxShadow: isWinningCell ? `0 0 0 2px ${COLORS.violet}, 0 8px 24px rgba(139, 124, 246, 0.25)` : "none",
      };
    }
    if (value === "O") {
      return {
        backgroundColor: "rgba(255, 107, 74, 0.1)",
        borderColor: "rgba(255, 107, 74, 0.3)",
        boxShadow: isWinningCell ? `0 0 0 2px ${COLORS.accent}, 0 8px 24px rgba(255, 107, 74, 0.25)` : "none",
      };
    }
    if (!isClickable) {
      return {
        backgroundColor: "rgba(245, 240, 232, 0.5)",
        borderColor: "transparent",
      };
    }
    // Empty clickable cell
    return {
      backgroundColor: isHovered ? COLORS.surface : COLORS.bgDeep,
      borderColor: isHovered ? COLORS.textMuted : COLORS.border,
    };
  };

  return (
    <button
      onClick={() => onClick(index)}
      disabled={!isClickable}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-20 h-20 sm:w-24 sm:h-24
        rounded-xl border
        text-4xl sm:text-5xl font-bold
        transition-all duration-200
        flex items-center justify-center
        touch-manipulation
        ${isClickable ? "cursor-pointer active:scale-95" : "cursor-not-allowed"}
        ${value ? "animate-scale-in" : ""}
      `}
      style={getCellStyle()}
    >
      {value === "X" && (
        <span className="font-display" style={{ color: COLORS.violet }}>✕</span>
      )}
      {value === "O" && (
        <span className="font-display" style={{ color: COLORS.accent }}>○</span>
      )}
    </button>
  );
}

export default memo(Cell);
