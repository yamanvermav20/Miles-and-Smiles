/**
 * Board Component
 * Renders the 3x3 TicTacToe grid with clean, modern styling
 */

import { memo } from "react";
import Cell from "./Cell.jsx";

// Hardcoded colors for reliable rendering
const COLORS = {
  surface: "#FFFFFF",
  border: "#E8E4DC",
};

// Winning combinations
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6], // diagonals
];

/**
 * @param {Object} props
 * @param {Array<Array<string|null>>} props.board - 3x3 game board
 * @param {boolean} props.isMyTurn - Whether it's the current player's turn
 * @param {string|null} props.winner - Winner of the game (null if ongoing)
 * @param {Function} props.onCellClick - Cell click handler
 */
function Board({ board, isMyTurn, winner, onCellClick }) {
  // Find winning cells
  const getWinningCells = () => {
    if (!winner || winner === "draw") return [];
    for (const [a, b, c] of WINNING_LINES) {
      const rowA = Math.floor(a / 3), colA = a % 3;
      const rowB = Math.floor(b / 3), colB = b % 3;
      const rowC = Math.floor(c / 3), colC = c % 3;
      if (board[rowA][colA] && 
          board[rowA][colA] === board[rowB][colB] && 
          board[rowA][colA] === board[rowC][colC]) {
        return [a, b, c];
      }
    }
    return [];
  };

  const winningCells = getWinningCells();

  return (
    <div className="flex justify-center items-center flex-1 py-6 animate-fade-in">
      <div 
        className="relative p-3 rounded-2xl"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 8px 32px rgba(26, 23, 20, 0.1)",
        }}
      >
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const value = board[row][col];
            const isEmpty = value === null;
            const isClickable = isMyTurn && isEmpty && winner === null;
            const isWinningCell = winningCells.includes(i);

            return (
              <Cell
                key={i}
                value={value}
                index={i}
                isClickable={isClickable}
                onClick={onCellClick}
                isWinningCell={isWinningCell}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(Board);
