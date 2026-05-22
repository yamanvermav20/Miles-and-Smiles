import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dices, ArrowRight, RefreshCw } from "lucide-react";

const games = [
  { 
    name: "Tic Tac Toe", 
    slug: "tic-tac-toe",
    emoji: "⭕",
    color: "violet"
  },
  { 
    name: "Memory", 
    slug: "memory",
    emoji: "🎴",
    color: "emerald"
  },
  { 
    name: "Snakes & Ladders", 
    slug: "snakes-and-ladders",
    emoji: "🐍",
    color: "amber"
  },
  { 
    name: "Dots & Boxes", 
    slug: "dots-and-boxes",
    emoji: "⬜",
    color: "accent"
  },
];

export default function GameSuggester() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestedGame, setSuggestedGame] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % games.length);
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const runTest = () => {
    setIsRunning(true);
    setSuggestedGame(null);

    setTimeout(() => {
      setIsRunning(false);
      const randomGame = games[Math.floor(Math.random() * games.length)];
      setSuggestedGame(randomGame);
    }, 1500);
  };

  const playGame = () => {
    if (suggestedGame) {
      navigate(`/games/${suggestedGame.slug}`);
    }
  };

  const getBgColor = (color) => {
    const colors = {
      violet: "bg-violet/20",
      emerald: "bg-emerald/20",
      amber: "bg-amber/20",
      accent: "bg-accent/20",
    };
    return colors[color] || colors.accent;
  };

  return (
    <div className="inline-flex items-center gap-3 p-2 pr-3 rounded-full bg-surface border border-border shadow-sm hover:shadow-md transition-shadow">
      {/* Dice/Result display */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
        suggestedGame ? getBgColor(suggestedGame.color) : 'bg-bg-deep'
      }`}>
        {isRunning ? (
          <span className="text-2xl animate-bounce" style={{ animationDuration: '0.15s' }}>
            {games[currentIndex].emoji}
          </span>
        ) : suggestedGame ? (
          <span className="text-2xl">{suggestedGame.emoji}</span>
        ) : (
          <Dices className="w-5 h-5 text-text-muted" />
        )}
      </div>

      {/* Text */}
      <div className="min-w-[100px]">
        {isRunning ? (
          <p className="text-sm font-medium text-text-muted">Picking...</p>
        ) : suggestedGame ? (
          <p className="text-sm font-semibold text-text">{suggestedGame.name}</p>
        ) : (
          <p className="text-sm text-text-muted">Random pick?</p>
        )}
      </div>

      {/* Action Button */}
      {!suggestedGame ? (
        <button
          onClick={runTest}
          disabled={isRunning}
          className="px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {isRunning ? "..." : "Go"}
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={runTest}
            className="p-2 rounded-full hover:bg-bg-deep transition-colors"
            title="Try again"
          >
            <RefreshCw className="w-4 h-4 text-text-muted" />
          </button>
          <button
            onClick={playGame}
            className="px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-1"
          >
            Play <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
