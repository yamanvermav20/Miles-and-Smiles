import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChessGame from "../components/chess/ChessGame";
import RoomSelection from "../components/RoomSelection";
import { useSocket } from "../hooks/useSocket";
import { useMatch, MATCH_STATES } from "../hooks/useMatch";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

export default function Chess() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  // Matchmaking state
  const {
    matchState,
    queueTime,
    matchedRoom,
    joinQueue,
    leaveQueue,
    createPrivate,
    joinPrivate,
    privateRoomCode,
    error: matchError,
  } = useMatch();

  // Local state
  const [gameMode, setGameMode] = useState(null); // 'quick', 'ranked', 'private', 'room', 'ai-select', 'ai'
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [toast, setToast] = useState(null);
  const [aiRoomId, setAiRoomId] = useState(null);
  const [aiDifficulty, setAiDifficulty] = useState(null);

  // Handle invite code from URL
  useEffect(() => {
    const code = searchParams.get("invite");
    if (code && connected) {
      joinPrivate(code);
    }
  }, [searchParams, connected, joinPrivate]);

  // Navigate to room when match is found
  useEffect(() => {
    if (matchedRoom && matchState === MATCH_STATES.FOUND) {
      navigate(`/chess/${matchedRoom}`);
    }
  }, [matchedRoom, matchState, navigate]);

  // Show errors as toast
  useEffect(() => {
    if (matchError) {
      setToast({ type: "error", message: matchError });
    }
  }, [matchError]);

  // Listen for AI game start
  useEffect(() => {
    if (!socket) return;
    
    const handleAIGameStart = ({ roomId, gameState, playerColor, difficulty }) => {
      setAiRoomId(roomId);
      setAiDifficulty(difficulty);
      setGameMode("ai");
    };
    
    socket.on("chess:ai-game-start", handleAIGameStart);
    
    return () => {
      socket.off("chess:ai-game-start", handleAIGameStart);
    };
  }, [socket]);

  // Handle quick play
  const handleQuickPlay = () => {
    setGameMode("quick");
    joinQueue("Chess", "casual");
  };

  // Handle ranked play
  const handleRanked = () => {
    setGameMode("ranked");
    joinQueue("Chess", "ranked");
  };

  // Handle create private room
  const handleCreatePrivate = () => {
    setGameMode("private");
    createPrivate("Chess");
  };

  // Handle join private room
  const handleJoinPrivate = () => {
    if (inviteInput.trim()) {
      joinPrivate(inviteInput.trim());
    }
  };

  // Handle start AI game
  const handleStartAIGame = (difficulty) => {
    if (socket && connected) {
      socket.emit("chess:start-ai-game", { difficulty });
    }
  };

  // Handle cancel matchmaking
  const handleCancel = () => {
    leaveQueue();
    setGameMode(null);
  };

  // Handle leave AI game
  const handleLeaveAIGame = () => {
    if (socket && aiRoomId) {
      socket.emit("chess:ai-leave", { roomId: aiRoomId });
    }
    setAiRoomId(null);
    setAiDifficulty(null);
    setGameMode(null);
  };

  // Copy invite code
  const copyInviteCode = () => {
    if (privateRoomCode) {
      navigator.clipboard.writeText(privateRoomCode);
      setToast({ type: "success", message: "Invite code copied!" });
    }
  };

  // If playing vs AI, show AI game
  if (gameMode === "ai" && aiRoomId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <Navbar />
        <main className="container mx-auto py-8">
          <div className="text-center mb-4">
            <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
              🤖 Playing vs AI ({aiDifficulty})
            </span>
            <button
              onClick={handleLeaveAIGame}
              className="ml-4 text-red-400 hover:text-red-300 text-sm"
            >
              Leave Game
            </button>
          </div>
          <ChessGame 
            roomId={aiRoomId} 
            userId={user?.id} 
            username={user?.username}
            isAIGame={true}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // If we have a roomId, show the game
  if (roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <Navbar />
        <main className="container mx-auto py-8">
          <ChessGame roomId={roomId} userId={user?.id} username={user?.username} />
        </main>
        <Footer />
      </div>
    );
  }

  // Show matchmaking / room selection UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navbar />

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">♔ Chess ♚</h1>
            <p className="text-gray-400">
              The classic game of strategy. Challenge your mind!
            </p>
          </div>

          {/* Mode Selection */}
          {matchState === MATCH_STATES.IDLE && !gameMode && (
            <div className="space-y-4">
              {/* Play vs AI */}
              <button
                onClick={() => setGameMode("ai-select")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg text-xl font-semibold transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🤖</span>
                Play vs AI
              </button>

              {/* Quick Play */}
              <button
                onClick={handleQuickPlay}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg text-xl font-semibold transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-2xl">⚡</span>
                Quick Play
              </button>

              {/* Ranked */}
              <button
                onClick={handleRanked}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 px-6 rounded-lg text-xl font-semibold transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🏆</span>
                Ranked Match
                <span className="text-sm bg-amber-800 px-2 py-1 rounded">
                  ELO: {user?.gameStats?.chess?.elo || 1000}
                </span>
              </button>

              {/* Create Private */}
              <button
                onClick={handleCreatePrivate}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-lg text-xl font-semibold transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🔒</span>
                Create Private Room
              </button>

              {/* Join Private */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">
                  Join Private Room
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    placeholder="Enter invite code"
                    className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={handleJoinPrivate}
                    disabled={!inviteInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Join
                  </button>
                </div>
              </div>

              {/* Or use traditional rooms */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">
                    or browse rooms
                  </span>
                </div>
              </div>

              <button
                onClick={() => setGameMode("room")}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Browse Open Rooms
              </button>
            </div>
          )}

          {/* AI Difficulty Selection */}
          {gameMode === "ai-select" && (
            <div className="bg-gray-800 rounded-lg p-6">
              <button
                onClick={() => setGameMode(null)}
                className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
              >
                ← Back to options
              </button>
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                🤖 Select AI Difficulty
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleStartAIGame("easy")}
                  className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
                >
                  <div className="text-2xl mb-1">😊</div>
                  Easy
                </button>
                <button
                  onClick={() => handleStartAIGame("medium")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
                >
                  <div className="text-2xl mb-1">🤔</div>
                  Medium
                </button>
                <button
                  onClick={() => handleStartAIGame("hard")}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
                >
                  <div className="text-2xl mb-1">😤</div>
                  Hard
                </button>
                <button
                  onClick={() => handleStartAIGame("expert")}
                  className="bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
                >
                  <div className="text-2xl mb-1">🧠</div>
                  Expert
                </button>
              </div>
            </div>
          )}

          {/* Searching for match */}
          {matchState === MATCH_STATES.SEARCHING && (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <div className="animate-pulse mb-4">
                <div className="w-20 h-20 mx-auto bg-amber-600 rounded-full flex items-center justify-center text-4xl">
                  {gameMode === "ranked" ? "🏆" : "⚡"}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Finding Opponent...
              </h2>
              <p className="text-gray-400 mb-4">
                {gameMode === "ranked"
                  ? "Searching for a similarly skilled player"
                  : "Looking for an available player"}
              </p>
              <div className="text-3xl font-mono text-amber-400 mb-6">
                {Math.floor(queueTime / 60)}:
                {String(queueTime % 60).padStart(2, "0")}
              </div>
              <button
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Waiting for friend (private room) */}
          {privateRoomCode && matchState !== MATCH_STATES.IN_GAME && (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <div className="mb-4">
                <span className="text-6xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Private Room Created
              </h2>
              <p className="text-gray-400 mb-4">
                Share this code with a friend:
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <code className="text-3xl font-mono bg-gray-700 text-amber-400 px-6 py-3 rounded-lg">
                  {privateRoomCode}
                </code>
                <button
                  onClick={copyInviteCode}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg"
                  title="Copy code"
                >
                  📋
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Or share this link:
                <br />
                <code className="text-xs text-blue-400">
                  {window.location.origin}/chess?invite={privateRoomCode}
                </code>
              </p>
              <button
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Traditional room selection */}
          {gameMode === "room" && (
            <div>
              <button
                onClick={() => setGameMode(null)}
                className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
              >
                ← Back to options
              </button>
              <RoomSelection gameName="Chess" />
            </div>
          )}

          {/* Game Rules */}
          <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-white font-bold mb-3">How to Play</h3>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>• Click a piece to select it, then click a highlighted square to move</li>
              <li>• Each piece moves in a specific pattern</li>
              <li>• Capture enemy pieces by moving to their square</li>
              <li>• Put the enemy King in "checkmate" to win</li>
              <li>• In ranked mode, your ELO rating changes based on wins/losses</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
