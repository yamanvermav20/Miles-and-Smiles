import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trophy, Target, TrendingUp, Clock, Play, History, Award, Swords } from "lucide-react";
import axiosClient from "../axiosClient.js";

// Game icons mapping
const gameIcons = {
  "Tic Tac Toe": "⭕",
  "Memory": "🎴",
  "Snakes and Ladders": "🐍",
  "Dots and Boxes": "⬜",
};

const GameHistoryModal = ({ isOpen, onClose, gameName, onPlay }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchGameHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/api/user/history/${encodeURIComponent(gameName)}`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching game history:", err);
      setError("Failed to load game history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && gameName) {
      fetchGameHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, gameName]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    
    document.addEventListener("keydown", handleEsc);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Format date
  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get result badge color
  const getResultColor = (result) => {
    switch (result) {
      case "win": return "bg-emerald-soft text-emerald border-emerald/20";
      case "loss": return "bg-accent-soft text-accent border-accent/20";
      case "draw": return "bg-amber-soft text-amber border-amber/20";
      default: return "bg-bg-deep text-text-muted border-border";
    }
  };

  if (!isOpen) return null;

  // Use portal to render modal at document body level, escaping any parent overflow:hidden
  return createPortal(
    <>
      {/* Backdrop - clickable to close */}
      <div 
        className="fixed inset-0 z-[100] bg-[#1A1714]/70 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Panel */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-lg card overflow-hidden max-h-[85vh] flex flex-col animate-scaleIn pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-border bg-gradient-to-r from-accent-soft to-violet-soft">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{gameIcons[gameName] || "🎮"}</span>
              <div>
                <h2 className="font-display text-xl font-semibold text-text">{gameName}</h2>
                <p className="text-sm text-text-secondary">Your game history</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-bg-deep hover:bg-accent-soft hover:text-accent transition-colors text-text-muted"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-accent">{error}</p>
              <button
                onClick={fetchGameHistory}
                className="mt-4 btn-secondary text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Stats Section */}
              {data?.stats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-deep rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                      <Trophy size={14} />
                      <span>Win Rate</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-emerald">
                      {data.stats.winPercentage || 0}%
                    </p>
                  </div>
                  <div className="bg-bg-deep rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                      <Target size={14} />
                      <span>Games Played</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-text">
                      {data.stats.gamesPlayed || 0}
                    </p>
                  </div>
                  <div className="bg-bg-deep rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                      <TrendingUp size={14} />
                      <span>Wins / Losses</span>
                    </div>
                    <p className="font-display text-lg font-bold">
                      <span className="text-emerald">{data.stats.wins || 0}</span>
                      <span className="text-text-muted mx-1">/</span>
                      <span className="text-accent">{data.stats.losses || 0}</span>
                    </p>
                  </div>
                  <div className="bg-bg-deep rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                      <Award size={14} />
                      <span>Best Score</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-violet">
                      {data.stats.highestScore || 0}
                    </p>
                  </div>
                </div>
              )}

              {/* Match History */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <History size={16} className="text-text-muted" />
                  <h3 className="font-display font-semibold text-text-secondary">Recent Matches</h3>
                </div>
                
                {!data?.history || data.history.length === 0 ? (
                  <div className="text-center py-8 bg-bg-deep rounded-xl border border-border">
                    <Swords size={32} className="mx-auto text-text-muted mb-3" />
                    <p className="text-text-secondary">No matches played yet</p>
                    <p className="text-sm text-text-muted mt-1">Play your first game!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.history.map((match, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-bg-deep rounded-xl border border-border hover:border-border-strong transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg border capitalize ${getResultColor(match.result)}`}>
                            {match.result}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-text">
                              vs {match.opponent || "Unknown"}
                            </p>
                            <p className="text-xs text-text-muted">
                              {formatDate(match.playedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-sm font-semibold">
                            <span className="text-violet">{match.myScore}</span>
                            <span className="text-text-muted mx-1">-</span>
                            <span className="text-text-secondary">{match.opponentScore}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer / Play Button */}
        <div className="p-6 border-t border-border bg-surface">
          <button
            onClick={onPlay}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Play {gameName}
          </button>
        </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default GameHistoryModal;
