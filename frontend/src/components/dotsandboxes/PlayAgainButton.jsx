/**
 * Play Again Button Component
 * Beautiful animated button for playing again
 */

import { memo } from "react";

function PlayAgainButton({ onClick, variant = "default" }) {
  const baseClasses =
    "relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4";

  const variants = {
    win: "bg-white text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-300 shadow-lg hover:shadow-xl",
    lose: "bg-white text-slate-600 hover:bg-slate-50 focus:ring-slate-300 shadow-lg hover:shadow-xl",
    draw: "bg-white text-amber-600 hover:bg-amber-50 focus:ring-amber-300 shadow-lg hover:shadow-xl",
    default:
      "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-300 shadow-lg hover:shadow-xl",
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      <span className="text-xl">🔄</span>
      <span>Play Again</span>
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
      </div>
    </button>
  );
}

export default memo(PlayAgainButton);
