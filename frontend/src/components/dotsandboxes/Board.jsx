import { memo, useMemo, useCallback } from "react";

// Hardcoded colors for reliable rendering
const COLORS = {
  violet: "#8B7CF6",
  amber: "#F5A623",
  text: "#1A1714",
  border: "#E8E4DC",
  borderLight: "rgba(232, 228, 220, 0.5)",
  borderFaint: "rgba(232, 228, 220, 0.3)",
  surface: "#FFFFFF",
  textMuted: "#9C9488",
};

// Player color configs with inline style objects
const PLAYER_COLORS = {
  1: {
    line: COLORS.violet,
    lineShadow: `0 4px 12px rgba(139, 124, 246, 0.4)`,
    boxBg: "rgba(139, 124, 246, 0.1)",
    boxBgNew: "rgba(139, 124, 246, 0.2)",
    textColor: COLORS.violet,
  },
  2: {
    line: COLORS.amber,
    lineShadow: `0 4px 12px rgba(245, 166, 35, 0.4)`,
    boxBg: "rgba(245, 166, 35, 0.1)",
    boxBgNew: "rgba(245, 166, 35, 0.2)",
    textColor: COLORS.amber,
  },
};

const Dot = memo(function Dot() {
  return (
    <div 
      className="w-full h-full rounded-full"
      style={{ backgroundColor: COLORS.text }}
    />
  );
});

const HorizontalLine = memo(function HorizontalLine({ drawn, player, isClickable, onClick, isLastMove }) {
  if (drawn) {
    const colors = PLAYER_COLORS[player];
    return (
      <div className="w-full h-full flex items-center px-0.5">
        <div 
          className="w-full h-2 sm:h-2.5 rounded-full transition-all duration-200"
          style={{ 
            backgroundColor: colors?.line || COLORS.border,
            boxShadow: isLastMove ? colors?.lineShadow : "none",
          }}
        />
      </div>
    );
  }

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className="w-full h-full flex items-center px-0.5 group cursor-pointer touch-manipulation"
        aria-label="Draw line"
      >
        <div 
          className="w-full h-2 sm:h-2.5 rounded-full transition-all duration-150 group-hover:shadow-md"
          style={{ backgroundColor: COLORS.borderLight }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.border}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.borderLight}
        />
      </button>
    );
  }

  return (
    <div className="w-full h-full flex items-center px-0.5">
      <div 
        className="w-full h-2 sm:h-2.5 rounded-full"
        style={{ backgroundColor: COLORS.borderFaint }}
      />
    </div>
  );
});

const VerticalLine = memo(function VerticalLine({ drawn, player, isClickable, onClick, isLastMove }) {
  if (drawn) {
    const colors = PLAYER_COLORS[player];
    return (
      <div className="w-full h-full flex justify-center py-0.5">
        <div 
          className="w-2 sm:w-2.5 h-full rounded-full transition-all duration-200"
          style={{ 
            backgroundColor: colors?.line || COLORS.border,
            boxShadow: isLastMove ? colors?.lineShadow : "none",
          }}
        />
      </div>
    );
  }

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className="w-full h-full flex justify-center py-0.5 group cursor-pointer touch-manipulation"
        aria-label="Draw line"
      >
        <div 
          className="w-2 sm:w-2.5 h-full rounded-full transition-all duration-150 group-hover:shadow-md"
          style={{ backgroundColor: COLORS.borderLight }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.border}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.borderLight}
        />
      </button>
    );
  }

  return (
    <div className="w-full h-full flex justify-center py-0.5">
      <div 
        className="w-2 sm:w-2.5 h-full rounded-full"
        style={{ backgroundColor: COLORS.borderFaint }}
      />
    </div>
  );
});

const Box = memo(function Box({ owner, isNewCapture }) {
  if (!owner) return <div className="w-full h-full rounded-lg" />;

  const colors = PLAYER_COLORS[owner];
  
  return (
    <div 
      className="w-full h-full rounded-lg flex items-center justify-center transition-all duration-300 animate-scale-in"
      style={{ backgroundColor: isNewCapture ? colors.boxBgNew : colors.boxBg }}
    >
      <span 
        className="text-xs sm:text-sm font-bold select-none"
        style={{ color: colors.textColor }}
      >
        ●
      </span>
    </div>
  );
});

function Board({ rows, cols, horizontalLines, verticalLines, boxes, isMyTurn, gameOver, onLineClick, lastMove, lastCompletedBoxes }) {
  // Responsive cell size: larger on mobile (fills screen), smaller on desktop
  const cellSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 56 : 64;
  const dotSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 12 : 16;
  const touchPadding = 8;

  const isLastMoveCheck = useCallback((type, row, col) => {
    return lastMove && lastMove.type === type && lastMove.row === row && lastMove.col === col;
  }, [lastMove]);

  const isNewCapture = useCallback((row, col) => {
    return lastCompletedBoxes?.some(box => box.row === row && box.col === col);
  }, [lastCompletedBoxes]);

  const grid = useMemo(() => {
    const elements = [];

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        // Dot
        elements.push(
          <div
            key={`dot-${row}-${col}`}
            className="absolute z-20"
            style={{
              left: col * cellSize,
              top: row * cellSize,
              width: dotSize,
              height: dotSize,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Dot />
          </div>
        );

        // Horizontal line
        if (col < cols) {
          const hDrawn = horizontalLines[row]?.[col] !== 0;
          const hPlayer = horizontalLines[row]?.[col];
          const hClickable = isMyTurn && !gameOver && !hDrawn;
          const hIsLastMove = isLastMoveCheck("horizontal", row, col);

          elements.push(
            <div
              key={`hline-${row}-${col}`}
              className="absolute z-10"
              style={{
                left: col * cellSize + dotSize / 2,
                top: row * cellSize - dotSize / 2 - touchPadding,
                width: cellSize - dotSize,
                height: dotSize + touchPadding * 2,
              }}
            >
              <HorizontalLine
                drawn={hDrawn}
                player={hPlayer}
                isClickable={hClickable}
                onClick={() => onLineClick("horizontal", row, col)}
                isLastMove={hIsLastMove}
              />
            </div>
          );
        }

        // Vertical line
        if (row < rows) {
          const vDrawn = verticalLines[row]?.[col] !== 0;
          const vPlayer = verticalLines[row]?.[col];
          const vClickable = isMyTurn && !gameOver && !vDrawn;
          const vIsLastMove = isLastMoveCheck("vertical", row, col);

          elements.push(
            <div
              key={`vline-${row}-${col}`}
              className="absolute z-10"
              style={{
                left: col * cellSize - dotSize / 2 - touchPadding,
                top: row * cellSize + dotSize / 2,
                width: dotSize + touchPadding * 2,
                height: cellSize - dotSize,
              }}
            >
              <VerticalLine
                drawn={vDrawn}
                player={vPlayer}
                isClickable={vClickable}
                onClick={() => onLineClick("vertical", row, col)}
                isLastMove={vIsLastMove}
              />
            </div>
          );
        }

        // Box
        if (row < rows && col < cols) {
          const boxIsNewCapture = isNewCapture(row, col);
          elements.push(
            <div
              key={`box-${row}-${col}`}
              className="absolute"
              style={{
                left: col * cellSize + dotSize / 2 + 2,
                top: row * cellSize + dotSize / 2 + 2,
                width: cellSize - dotSize - 4,
                height: cellSize - dotSize - 4,
              }}
            >
              <Box owner={boxes[row]?.[col]} isNewCapture={boxIsNewCapture} />
            </div>
          );
        }
      }
    }
    return elements;
  }, [rows, cols, horizontalLines, verticalLines, boxes, isMyTurn, gameOver, onLineClick, isLastMoveCheck, isNewCapture, cellSize, dotSize]);

  const boardWidth = cols * cellSize;
  const boardHeight = rows * cellSize;

  return (
    <div className="flex justify-center items-center flex-1 py-2 sm:py-4 animate-fade-in">
      <div 
        className="relative p-4 sm:p-6 rounded-2xl"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 8px 32px rgba(26, 23, 20, 0.1)",
        }}
      >
        <div 
          className="relative" 
          style={{ 
            width: boardWidth, 
            height: boardHeight,
            marginLeft: dotSize / 2,
            marginTop: dotSize / 2,
            marginRight: dotSize / 2,
            marginBottom: dotSize / 2,
          }}
        >
          {grid}
        </div>
      </div>
    </div>
  );
}

export default memo(Board);
