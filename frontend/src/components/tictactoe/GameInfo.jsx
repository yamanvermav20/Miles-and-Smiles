/**
 * Game Info Component
 * Displays game status with modern styling matching DotsAndBoxes
 */

import { memo } from "react";

// Animated dots component
const AnimatedDots = () => (
  <span className="inline-flex gap-1 ml-1">
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
  </span>
);

/**
 * @param {Object} props
 */
function GameInfo({
  gameStarted,
  opponentLeft,
  winner,
  mySymbol,
  turn,
  isMyTurn,
  error,
  socketConnected,
  isReconnecting,
  onPlayAgain,
  playerInfo = {},
}) {
  const didWin = winner === mySymbol;
  const isDraw = winner === "draw";
  
  // Get opponent symbol and name
  const opponentSymbol = mySymbol === "X" ? "O" : "X";
  const opponentName = playerInfo[opponentSymbol]?.username || "Opponent";

  // Waiting for opponent - full screen centered
  if (!gameStarted && !opponentLeft) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24">
        <div className="relative mb-6">
          {/* Pulsing rings */}
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-blue-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 font-medium flex items-center">
          {socketConnected ? "Waiting for opponent" : "Connecting"}
          <AnimatedDots />
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Share the room code with a friend
        </p>
      </div>
    );
  }

  // Opponent left
  if (opponentLeft) {
    return (
      <div className="flex flex-col items-center py-8 sm:py-12">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <p className="text-amber-600 dark:text-amber-400 font-medium mb-1">
          {error || "Opponent left the game"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          You win by forfeit!
        </p>
      </div>
    );
  }

  // Reconnecting overlay
  if (isReconnecting) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-4 mb-3 rounded-xl bg-slate-100 dark:bg-slate-800">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Opponent reconnecting<AnimatedDots />
        </span>
      </div>
    );
  }

  // Turn indicator during game
  if (gameStarted && winner === null) {
    return (
      <div className="flex items-center justify-center mb-3">
        <div className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          isMyTurn
            ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        }`}>
          {isMyTurn ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Your turn ({mySymbol})
            </span>
          ) : (
            <span className="flex items-center">
              {opponentName}'s turn ({turn})<AnimatedDots />
            </span>
          )}
        </div>
      </div>
    );
  }

  // Game over
  if (winner !== null) {
    return (
      <div className="flex flex-col items-center py-6 sm:py-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          isDraw 
            ? "bg-slate-100 dark:bg-slate-800" 
            : didWin 
            ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30" 
            : "bg-slate-100 dark:bg-slate-800"
        }`}>
          {isDraw ? (
            <span className="text-2xl">🤝</span>
          ) : didWin ? (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-2xl">😔</span>
          )}
        </div>
        
        <h2 className={`text-2xl font-bold mb-1 ${
          isDraw 
            ? "text-slate-700 dark:text-slate-300" 
            : didWin 
            ? "text-green-600 dark:text-green-400" 
            : "text-slate-600 dark:text-slate-400"
        }`}>
          {isDraw ? "It's a Draw!" : didWin ? "You Won!" : "You Lost"}
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {isDraw ? "No winner this time" : `${playerInfo[winner]?.username || winner} wins the game`}
        </p>
        
        <button
          onClick={onPlayAgain}
          className="px-6 py-3 rounded-xl
            bg-gradient-to-r from-blue-500 to-blue-600
            text-white font-medium
            shadow-lg shadow-blue-500/30
            hover:shadow-xl hover:shadow-blue-500/40
            active:scale-95 transition-all"
        >
          Play Again
        </button>
      </div>
    );
  }

  // Error fallback
  if (error) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return null;
}

export default memo(GameInfo);
