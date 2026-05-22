/**
 * Dice Component
 * Clean dice with roll animation
 */

import { memo, useState, useEffect } from "react";

// Hardcoded colors for reliable rendering
const COLORS = {
  amber: "#F5A623",
  emerald: "#2DD4A7",
  accent: "#FF6B4A",
  text: "#1A1714",
  textMuted: "#9C9488",
  surface: "#FFFFFF",
  bgDeep: "#F5F0E8",
  border: "#E8E4DC",
};

// Dice face patterns (dot positions for each face)
const DICE_FACES = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

/**
 * Single dice face
 */
const DiceFace = memo(function DiceFace({ value }) {
  const dots = DICE_FACES[value] || [];
  
  return (
    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 p-1.5 sm:p-2">
      {[0, 1, 2].map(row => 
        [0, 1, 2].map(col => {
          const hasDot = dots.some(([r, c]) => r === row && c === col);
          return (
            <div key={`${row}-${col}`} className="flex items-center justify-center">
              {hasDot && (
                <div 
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS.text }}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
});

/**
 * Dice component with animation
 */
function Dice({ value, isRolling, onRoll, disabled, extraTurn, moveInfo }) {
  const [displayValue, setDisplayValue] = useState(value || 1);
  const [animating, setAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // Animate dice during roll
  useEffect(() => {
    if (isRolling) {
      setAnimating(true);
      setShowResult(false);
      
      let speed = 50;
      let count = 0;
      const maxCount = 20;
      
      const animate = () => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        count++;
        
        if (count < maxCount) {
          speed = 50 + (count * 10);
          setTimeout(animate, speed);
        }
      };
      
      animate();
      
      return () => {};
    } else {
      if (value && animating) {
        setTimeout(() => {
          setDisplayValue(value);
          setAnimating(false);
          setShowResult(true);
        }, 200);
      } else if (value) {
        setDisplayValue(value);
        setShowResult(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRolling, value]);

  // Get dice button styles
  const getDiceStyle = () => {
    const base = {
      backgroundColor: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
    };
    
    if (showResult && value === 6 && !isRolling) {
      return {
        ...base,
        borderColor: COLORS.amber,
        boxShadow: `0 4px 16px rgba(245, 166, 35, 0.3)`,
      };
    }
    
    if (disabled && !isRolling) {
      return { ...base, opacity: 0.4 };
    }
    
    return base;
  };

  // Get roll button styles
  const getRollButtonStyle = () => {
    if (isRolling) {
      return { backgroundColor: COLORS.amber, color: "white" };
    }
    if (disabled) {
      return { backgroundColor: COLORS.bgDeep, color: COLORS.textMuted };
    }
    return { backgroundColor: COLORS.emerald, color: "white" };
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dice container */}
      <div className="relative">
        {/* Dice */}
        <button
          onClick={onRoll}
          disabled={disabled || isRolling}
          className={`
            relative w-14 h-14 sm:w-16 sm:h-16
            rounded-xl transition-all duration-200
            ${animating ? "animate-spin" : ""}
            ${disabled && !isRolling 
              ? "cursor-not-allowed" 
              : "hover:scale-105 active:scale-95 cursor-pointer"
            }
          `}
          style={getDiceStyle()}
        >
          <DiceFace value={displayValue} />
        </button>
      </div>
      
      {/* Roll button */}
      <button
        onClick={onRoll}
        disabled={disabled || isRolling}
        className={`
          px-6 py-2 rounded-xl font-display font-semibold text-sm
          transition-all duration-200
          ${isRolling ? "animate-pulse" : ""}
          ${disabled && !isRolling ? "cursor-not-allowed" : "hover:opacity-90 active:scale-95"}
        `}
        style={getRollButtonStyle()}
      >
        {isRolling ? "Rolling..." : disabled ? "Waiting..." : "Roll"}
      </button>
      
      {/* Extra turn indicator */}
      {extraTurn && !isRolling && (
        <p className="text-sm font-medium" style={{ color: COLORS.amber }}>
          Rolled 6! Roll again
        </p>
      )}
      
      {/* Move info display */}
      {moveInfo && showResult && !isRolling && (
        <p 
          className="text-xs font-medium text-center"
          style={{ 
            color: moveInfo.snake ? COLORS.accent : 
                   moveInfo.ladder ? COLORS.emerald : 
                   COLORS.textMuted 
          }}
        >
          {moveInfo.snake && `Snake! ${moveInfo.from} → ${moveInfo.finalPosition}`}
          {moveInfo.ladder && `Ladder! ${moveInfo.from} → ${moveInfo.finalPosition}`}
          {moveInfo.bounce && `Bounced back`}
          {!moveInfo.snake && !moveInfo.ladder && !moveInfo.bounce && 
            `${moveInfo.from || "Start"} → ${moveInfo.finalPosition || moveInfo.to}`}
        </p>
      )}
    </div>
  );
}

export default memo(Dice);
