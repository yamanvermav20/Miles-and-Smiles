import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfilePictureEditor from "../components/ProfilePictureEditor.jsx";
import EditableField from "../components/EditableField.jsx";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../axiosClient";
import { Trophy, Target, Flame, Calendar, TrendingUp, Gamepad2, Award, Clock, ArrowLeft } from "lucide-react";

// Game icons mapping
const gameIcons = {
  "Tic Tac Toe": "⭕",
  "Memory": "🎴",
  "Snakes and Ladders": "🐍",
  "Dots and Boxes": "⬜",
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch game stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get("/api/user/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const updateField = async (field, value) => {
    const res = await axiosClient.put("/api/user/updateField", {
      [field]: value,
    });
    updateUser(res.data.user);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format relative time
  const formatRelativeTime = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000);
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(date);
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

  return (
    <div className="min-h-screen bg-bg font-body grain">
      {/* Background elements */}
      <div className="fixed inset-0 geo-pattern pointer-events-none opacity-40" />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2.5 rounded-xl bg-bg-deep hover:bg-accent-soft hover:text-accent transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-semibold text-text">Profile</h1>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Header Card */}
        <div className="relative card-accent p-8 animate-hero overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet/20 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <ProfilePictureEditor />

            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text mb-2">{user?.username}</h1>
              <p className="text-text-secondary mb-6">
                Member since {formatDate(user?.createdAt)}
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <div className="tag tag-emerald">
                  <Trophy size={14} />
                  <span>{stats?.totalWins || 0} Wins</span>
                </div>
                <div className="tag tag-violet">
                  <Gamepad2 size={14} />
                  <span>{stats?.totalGamesPlayed || 0} Games</span>
                </div>
                {stats?.currentStreak > 0 && (
                  <div className="tag tag-amber">
                    <Flame size={14} />
                    <span>{stats.currentStreak} Streak</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1.5 bg-surface border border-border rounded-2xl">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "history", label: "Match History", icon: Clock },
            { id: "settings", label: "Settings", icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-display font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "text-text-muted hover:text-text hover:bg-bg-deep"
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Win Rate */}
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-soft flex items-center justify-center">
                    <Target size={20} className="text-emerald" />
                  </div>
                  <span className="text-text-secondary text-sm">Win Rate</span>
                </div>
                <div className="font-display text-3xl font-bold text-emerald">
                  {stats?.winPercentage || 0}%
                </div>
                <div className="mt-3 h-2 bg-bg-deep rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald rounded-full transition-all duration-500"
                    style={{ width: `${stats?.winPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Total Games */}
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-soft flex items-center justify-center">
                    <Gamepad2 size={20} className="text-violet" />
                  </div>
                  <span className="text-text-secondary text-sm">Total Games</span>
                </div>
                <div className="font-display text-3xl font-bold text-violet">
                  {stats?.totalGamesPlayed || 0}
                </div>
                <p className="text-xs text-text-muted mt-2">
                  {stats?.totalWins || 0}W / {stats?.totalLosses || 0}L / {stats?.totalDraws || 0}D
                </p>
              </div>

              {/* Current Streak */}
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-soft flex items-center justify-center">
                    <Flame size={20} className="text-amber" />
                  </div>
                  <span className="text-text-secondary text-sm">Win Streak</span>
                </div>
                <div className="font-display text-3xl font-bold text-amber">
                  {stats?.currentStreak || 0}
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Best: {stats?.longestStreak || 0} wins
                </p>
              </div>

              {/* Last Played */}
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
                    <Calendar size={20} className="text-accent" />
                  </div>
                  <span className="text-text-secondary text-sm">Last Played</span>
                </div>
                <div className="font-display text-xl font-bold text-accent">
                  {formatRelativeTime(stats?.lastGamePlayed)}
                </div>
              </div>
            </div>

            {/* Per-Game Stats */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2 text-text">
                <Trophy size={20} className="text-amber" />
                Game Statistics
              </h3>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stats?.gameStats?.length > 0 ? (
                <div className="grid gap-4">
                  {stats.gameStats.map((game, i) => {
                    const gameWinRate = game.gamesPlayed > 0 
                      ? Math.round((game.wins / game.gamesPlayed) * 100) 
                      : 0;
                    return (
                      <div 
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-bg-deep rounded-xl border border-border"
                      >
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <span className="text-2xl">{gameIcons[game.gameName] || "🎮"}</span>
                          <div>
                            <h4 className="font-display font-medium text-text">{game.gameName}</h4>
                            <p className="text-xs text-text-muted">
                              Last: {formatRelativeTime(game.lastPlayed)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="font-display text-lg font-bold text-violet">{game.gamesPlayed}</div>
                            <div className="text-xs text-text-muted">Played</div>
                          </div>
                          <div>
                            <div className="font-display text-lg font-bold text-emerald">{game.wins}</div>
                            <div className="text-xs text-text-muted">Wins</div>
                          </div>
                          <div>
                            <div className="font-display text-lg font-bold text-amber">{game.highestScore}</div>
                            <div className="text-xs text-text-muted">High Score</div>
                          </div>
                          <div>
                            <div className="font-display text-lg font-bold text-accent">{gameWinRate}%</div>
                            <div className="text-xs text-text-muted">Win Rate</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-deep flex items-center justify-center">
                    <Gamepad2 size={32} className="text-text-muted" />
                  </div>
                  <p className="text-text-secondary">No games played yet</p>
                  <p className="text-sm text-text-muted mt-1">Start playing to see your stats!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Match History Tab */}
        {activeTab === "history" && (
          <div className="card p-6 animate-fadeIn">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2 text-text">
              <Clock size={20} className="text-violet" />
              Recent Matches
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stats?.matchHistory?.length > 0 ? (
              <div className="space-y-3">
                {stats.matchHistory.map((match, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-4 p-4 bg-bg-deep rounded-xl border border-border"
                  >
                    <span className="text-2xl">{gameIcons[match.gameName] || "🎮"}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-medium text-text truncate">{match.gameName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getResultColor(match.result)}`}>
                          {match.result.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        vs {match.opponent}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-display font-bold">
                        <span className={match.myScore > match.opponentScore ? "text-emerald" : match.myScore < match.opponentScore ? "text-accent" : "text-amber"}>
                          {match.myScore}
                        </span>
                        <span className="text-text-muted mx-1">-</span>
                        <span className="text-text-secondary">{match.opponentScore}</span>
                      </div>
                      <p className="text-xs text-text-muted">
                        {formatRelativeTime(match.playedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-deep flex items-center justify-center">
                  <Clock size={32} className="text-text-muted" />
                </div>
                <p className="text-text-secondary">No match history yet</p>
                <p className="text-sm text-text-muted mt-1">Play some games to see your history!</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Basic Info */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold mb-4 text-text">Basic Info</h3>
              
              <div className="space-y-1">
                <EditableField
                  label="Username"
                  value={user?.username}
                  onSave={(name) => updateField("username", name)}
                />
                <EditableField
                  label="Birthday"
                  value={user?.birthday?.slice(0, 10)}
                  onSave={(date) => updateField("birthday", date)}
                  type="date"
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold mb-4 text-text">Account</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-text">Friends</p>
                    <p className="text-sm text-text-secondary">{user?.friends?.length || 0} friends</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-text">Favorite Games</p>
                    <p className="text-sm text-text-secondary">{user?.favouriteGames?.length || 0} games</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-text">Member Since</p>
                    <p className="text-sm text-text-secondary">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
