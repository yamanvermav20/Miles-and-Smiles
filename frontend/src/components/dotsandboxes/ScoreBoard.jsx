import { memo, useEffect, useState } from "react";

function ScoreBoard({ scores, myPlayerNumber, currentTurn, gameOver, playerInfo, completedBoxes, totalBoxes }) {
  const player1Name = playerInfo?.[1]?.username || "Player 1";
  const player2Name = playerInfo?.[2]?.username || "Player 2";
  const progress = totalBoxes > 0 ? Math.round((completedBoxes / totalBoxes) * 100) : 0;
  
  // Track score changes for animation
  const [animateP1, setAnimateP1] = useState(false);
  const [animateP2, setAnimateP2] = useState(false);
  const [prevScores, setPrevScores] = useState(scores);

  useEffect(() => {
    if (scores[1] > prevScores[1]) {
      setAnimateP1(true);
      setTimeout(() => setAnimateP1(false), 300);
    }
    if (scores[2] > prevScores[2]) {
      setAnimateP2(true);
      setTimeout(() => setAnimateP2(false), 300);
    }
    setPrevScores(scores);
  }, [scores]);

  return (
    <div className="flex items-center justify-between gap-3 px-2">
      {/* Player 1 */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
          currentTurn === 1 && !gameOver
            ? "bg-indigo-500/10 dark:bg-indigo-500/20 shadow-[0_0_16px_rgba(99,102,241,0.3)]"
            : "bg-slate-100/50 dark:bg-slate-800/50"
        }`}
      >
        <div className={`relative ${currentTurn === 1 && !gameOver ? "animate-pulse" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">
              {player1Name.charAt(0).toUpperCase()}
            </span>
          </div>
          {myPlayerNumber === 1 && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[60px] sm:max-w-[80px]">
            {myPlayerNumber === 1 ? "You" : player1Name}
          </div>
          <div className={`text-xl font-bold text-slate-800 dark:text-slate-100 transition-transform ${animateP1 ? "scale-125 text-indigo-500" : ""}`}>
            {scores[1]}
          </div>
        </div>
      </div>

      {/* Center - Progress */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {completedBoxes}/{totalBoxes}
        </div>
        <div className="w-16 sm:w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Player 2 */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
          currentTurn === 2 && !gameOver
            ? "bg-amber-500/10 dark:bg-amber-500/20 shadow-[0_0_16px_rgba(245,158,11,0.3)]"
            : "bg-slate-100/50 dark:bg-slate-800/50"
        }`}
      >
        <div className="min-w-0 text-right">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[60px] sm:max-w-[80px]">
            {myPlayerNumber === 2 ? "You" : player2Name}
          </div>
          <div className={`text-xl font-bold text-slate-800 dark:text-slate-100 transition-transform ${animateP2 ? "scale-125 text-amber-500" : ""}`}>
            {scores[2]}
          </div>
        </div>
        <div className={`relative ${currentTurn === 2 && !gameOver ? "animate-pulse" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">
              {player2Name.charAt(0).toUpperCase()}
            </span>
          </div>
          {myPlayerNumber === 2 && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ScoreBoard);
