/**
 * Game Info Component for Memory
 * Displays scores, turn indicator, and game status
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
 * GameInfo component
 */
function GameInfo({
  gameStarted,
  opponentLeft,
  winner,
  myPlayerNumber,
  currentTurn,
  isMyTurn,
  scores,
  error,
  socketConnected,
  isReconnecting,
  onPlayAgain,
  playerInfo = {},
  totalPairs = 8,
}) {
  const didWin = winner === myPlayerNumber;
  const isTie = winner === "tie";
  const opponentNumber = myPlayerNumber === 1 ? 2 : 1;
  const opponentName = playerInfo[opponentNumber]?.username || "Opponent";
  const myName = playerInfo[myPlayerNumber]?.username || "You";
  const winnerName = winner && winner !== "tie" ? (playerInfo[winner]?.username || `Player ${winner}`) : null;

  // Waiting for opponent - full screen centered
  if (!gameStarted && !opponentLeft) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
        <div className="relative mb-6">
          {/* Pulsing rings */}
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-violet/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-xl bg-violet flex items-center justify-center shadow-glow">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <p className="text-text font-medium flex items-center">
          {socketConnected ? "Waiting for opponent" : "Connecting"}
          <AnimatedDots />
        </p>
        <p className="text-xs text-text-muted mt-2">
          Share the room code with a friend
        </p>
      </div>
    );
  }

  // Opponent left
  if (opponentLeft) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="w-14 h-14 rounded-xl bg-amber-soft flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <p className="text-amber font-medium mb-1">
          {error || "Opponent left the game"}
        </p>
        <p className="text-xs text-text-muted">
          You win by forfeit!
        </p>
      </div>
    );
  }

  // Game over
  if (winner) {
    return (
      <div className="flex flex-col items-center py-8">
        {/* Winner Icon */}
        <div className={`
          w-16 h-16 rounded-xl flex items-center justify-center mb-4
          ${isTie 
            ? "bg-surface border border-border" 
            : didWin 
              ? "bg-amber shadow-glow-accent" 
              : "bg-surface border border-border"
          }
        `}>
          <span className="text-3xl">
            {isTie ? "🤝" : didWin ? "🏆" : "😔"}
          </span>
        </div>
        
        {/* Result Text */}
        <h2 className={`
          font-display text-2xl font-semibold mb-1
          ${isTie 
            ? "text-text" 
            : didWin 
              ? "text-amber" 
              : "text-text-secondary"
          }
        `}>
          {isTie ? "It's a Tie!" : didWin ? "You Win!" : "You Lost"}
        </h2>
        
        {!isTie && (
          <p className="text-text-secondary text-sm mb-2">
            {didWin ? "Amazing memory!" : `${winnerName} wins!`}
          </p>
        )}
        
        {/* Final Scores */}
        <div className="flex gap-4 mb-6 mt-2">
          <div className="text-center px-4 py-2 rounded-xl bg-violet-soft border border-violet/20">
            <div className="text-sm text-text-muted">{myName}</div>
            <div className="font-display text-2xl font-bold text-violet">{scores[myPlayerNumber]}</div>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-accent-soft border border-accent/20">
            <div className="text-sm text-text-muted">{opponentName}</div>
            <div className="font-display text-2xl font-bold text-accent">{scores[opponentNumber]}</div>
          </div>
        </div>
        
        {/* Play Again Button */}
        <button
          onClick={onPlayAgain}
          className="btn-primary"
        >
          Play Again
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-accent-soft rounded-xl p-4 text-center">
        <p className="text-accent">{error}</p>
      </div>
    );
  }

  // Reconnecting state
  if (isReconnecting) {
    return (
      <div className="flex items-center justify-center gap-2 text-violet">
        <div className="w-5 h-5 border-2 border-violet border-t-transparent rounded-full animate-spin" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  // Active game - turn indicator
  return (
    <div className="flex items-center justify-center gap-2 text-lg font-medium">
      {isMyTurn ? (
        <span className="text-violet flex items-center">
          <span className="w-3 h-3 rounded-full bg-violet mr-2 animate-pulse" />
          Your turn - find a match!
        </span>
      ) : (
        <span className="text-text-secondary flex items-center">
          <span className="w-3 h-3 rounded-full bg-text-muted mr-2" />
          {opponentName}'s turn
          <AnimatedDots />
        </span>
      )}
    </div>
  );
}

export default memo(GameInfo);
