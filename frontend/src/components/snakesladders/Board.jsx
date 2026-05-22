/**
 * Snakes and Ladders Board Component
 * Clean 10x10 board with snakes and ladders
 */

import { memo, useMemo } from "react";

// Hardcoded colors for reliable rendering
const COLORS = {
  amber: "#F5A623",
  emerald: "#2DD4A7",
  accent: "#FF6B4A",
  surface: "#FFFFFF",
  bgDeep: "#F5F0E8",
  border: "#E8E4DC",
  borderLight: "rgba(232, 228, 220, 0.5)",
  textMuted: "#9C9488",
};

/**
 * Get the position number for a cell (zigzag numbering from bottom-left)
 */
function getCellPosition(row, col) {
  const rowFromBottom = 9 - row;
  const isRightToLeft = rowFromBottom % 2 === 1;
  const colFromLeft = isRightToLeft ? 9 - col : col;
  return rowFromBottom * 10 + colFromLeft + 1;
}

/**
 * Cell component - clean and minimal
 */
const Cell = memo(function Cell({ 
  position, 
  player1Here, 
  player2Here,
  player1Animating,
  player2Animating,
  snakeData,
  ladderData,
  isFinish,
}) {
  const hasSnake = snakeData !== null;
  const hasLadder = ladderData !== null;
  
  // Get cell style based on content
  const getCellStyle = () => {
    if (isFinish) return { backgroundColor: "rgba(245, 166, 35, 0.2)" };
    if (position === 1) return { backgroundColor: "rgba(45, 212, 167, 0.2)" };
    if (hasSnake) return { backgroundColor: "rgba(255, 107, 74, 0.1)" };
    if (hasLadder) return { backgroundColor: "rgba(45, 212, 167, 0.1)" };
    return { backgroundColor: position % 2 === 0 ? COLORS.bgDeep : COLORS.surface };
  };

  // Get number color based on cell type
  const getNumberColor = () => {
    if (isFinish) return COLORS.amber;
    if (position === 1) return COLORS.emerald;
    if (hasSnake) return COLORS.accent;
    if (hasLadder) return COLORS.emerald;
    return COLORS.textMuted;
  };
  
  return (
    <div
      className="relative aspect-square flex items-center justify-center transition-colors"
      style={{ 
        ...getCellStyle(),
        border: `1px solid ${COLORS.borderLight}`,
      }}
    >
      {/* Position number - top left */}
      <span 
        className="absolute top-0 left-0.5 text-[7px] sm:text-[8px] font-medium"
        style={{ color: getNumberColor() }}
      >
        {position}
      </span>
      
      {/* Snake indicator with destination */}
      {hasSnake && (
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs sm:text-sm leading-none animate-float">🐍</span>
          <span 
            className="text-[6px] sm:text-[7px] font-bold leading-none mt-0.5"
            style={{ color: COLORS.accent }}
          >
            →{snakeData.tail}
          </span>
        </div>
      )}
      
      {/* Ladder indicator with destination */}
      {hasLadder && (
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs sm:text-sm leading-none animate-float">🪜</span>
          <span 
            className="text-[6px] sm:text-[7px] font-bold leading-none mt-0.5"
            style={{ color: COLORS.emerald }}
          >
            →{ladderData.top}
          </span>
        </div>
      )}
      
      {/* Finish indicator */}
      {isFinish && !hasSnake && !hasLadder && (
        <span className="text-sm sm:text-base">🏆</span>
      )}
      
      {/* Start indicator */}
      {position === 1 && !hasLadder && (
        <span 
          className="text-[7px] sm:text-[8px] font-bold"
          style={{ color: COLORS.emerald }}
        >
          START
        </span>
      )}
      
      {/* Players tokens */}
      <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
        {player1Here && (
          <div 
            className={`
              w-3 h-3 sm:w-4 sm:h-4 rounded-full 
              border border-white
              flex items-center justify-center
              ${player1Animating ? "animate-pulse scale-110" : "transition-all duration-300"}
            `}
            style={{ 
              backgroundColor: COLORS.emerald,
              boxShadow: player1Animating ? `0 0 12px ${COLORS.emerald}` : "none",
            }}
          >
            <span className="text-[5px] sm:text-[6px] font-bold text-white">1</span>
          </div>
        )}
        {player2Here && (
          <div 
            className={`
              w-3 h-3 sm:w-4 sm:h-4 rounded-full 
              border border-white
              flex items-center justify-center
              ${player2Animating ? "animate-pulse scale-110" : "transition-all duration-300"}
            `}
            style={{ 
              backgroundColor: COLORS.amber,
              boxShadow: player2Animating ? `0 0 12px ${COLORS.amber}` : "none",
            }}
          >
            <span className="text-[5px] sm:text-[6px] font-bold text-white">2</span>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Board component
 */
function Board({ positions, snakes, ladders, animatingPlayer }) {
  // Build snake and ladder lookup maps with destination info
  const { snakeMap, ladderMap } = useMemo(() => {
    const snakeMap = new Map();
    const ladderMap = new Map();
    
    Object.entries(snakes).forEach(([head, tail]) => {
      snakeMap.set(parseInt(head), { head: parseInt(head), tail: parseInt(tail) });
    });
    
    Object.entries(ladders).forEach(([bottom, top]) => {
      ladderMap.set(parseInt(bottom), { bottom: parseInt(bottom), top: parseInt(top) });
    });
    
    return { snakeMap, ladderMap };
  }, [snakes, ladders]);

  // Generate board cells (10x10)
  const board = useMemo(() => {
    const cells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const position = getCellPosition(row, col);
        cells.push({
          row,
          col,
          position,
          player1Here: positions[1] === position,
          player2Here: positions[2] === position,
          player1Animating: animatingPlayer === 1 && positions[1] === position,
          player2Animating: animatingPlayer === 2 && positions[2] === position,
          snakeData: snakeMap.get(position) || null,
          ladderData: ladderMap.get(position) || null,
          isFinish: position === 100,
        });
      }
    }
    return cells;
  }, [positions, snakeMap, ladderMap, animatingPlayer]);

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Board container */}
      <div 
        className="relative rounded-2xl p-2 sm:p-3"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 8px 32px rgba(26, 23, 20, 0.1)",
        }}
      >
        {/* Grid */}
        <div 
          className="grid grid-cols-10 gap-0 rounded-xl overflow-hidden"
          style={{ border: `1px solid ${COLORS.border}` }}
        >
          {board.map((cell) => (
            <Cell
              key={cell.position}
              position={cell.position}
              player1Here={cell.player1Here}
              player2Here={cell.player2Here}
              player1Animating={cell.player1Animating}
              player2Animating={cell.player2Animating}
              snakeData={cell.snakeData}
              ladderData={cell.ladderData}
              isFinish={cell.isFinish}
            />
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] sm:text-xs">
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ backgroundColor: "rgba(255, 107, 74, 0.1)" }}
          >
            <span>🐍</span>
            <span className="font-medium" style={{ color: COLORS.accent }}>Down</span>
          </div>
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ backgroundColor: "rgba(45, 212, 167, 0.1)" }}
          >
            <span>🪜</span>
            <span className="font-medium" style={{ color: COLORS.emerald }}>Up</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Board);
