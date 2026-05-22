/**
 * Memory Card Matching Game Main Component
 * Clean, typography-driven game interface
 */

import { useMemoryGame } from "../components/memory/useMemoryGame.js";
import Board from "../components/memory/Board.jsx";
import GameInfo from "../components/memory/GameInfo.jsx";
import FloatingChat from "../components/memory/FloatingChat.jsx";
import ExitButton from "../components/memory/ExitButton.jsx";

/**
 * @param {Object} props
 * @param {Object} props.roomData - Room data containing socket and roomId
 */
function Memory({ roomData }) {
  const { socket, roomId } = roomData || {};

  // Use custom hook for all game state and logic
  const {
    cards,
    gridSize,
    flippedCards,
    currentTurn,
    myPlayerNumber,
    winner,
    gameStarted,
    opponentLeft,
    error,
    isReconnecting,
    scores,
    isProcessing,
    lastFlip,
    showingMatch,
    playerInfo,
    isMyTurn,
    flipCard,
    handleReset,
    handleLeaveRoom,
  } = useMemoryGame(socket, roomId);

  // Get player names
  const player1Name = playerInfo[1]?.username || "Player 1";
  const player2Name = playerInfo[2]?.username || "Player 2";
  const opponentNumber = myPlayerNumber === 1 ? 2 : 1;
  const totalPairs = Math.floor(cards.length / 2);

  return (
    <div className="game-shell min-h-screen bg-bg font-body overflow-hidden">
      {/* Layered background */}
      <div className="fixed inset-0 bg-gradient-to-b from-bg via-bg to-bg-deep" />
      <div className="fixed inset-0 geo-pattern pointer-events-none opacity-30" />
      
      {/* Accent glow - violet for memory */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet/5 blur-[100px] pointer-events-none" />
      
      {/* Exit Button */}
      <ExitButton socket={socket} roomId={roomId} />

      {/* Main Game Container */}
      <div className="relative min-h-screen flex flex-col px-4 sm:px-6 py-6 max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="flex-shrink-0 text-center mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2 font-medium">
            Room {roomId}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            Memory Match
          </h1>
          {gameStarted && winner === null && (
            <p className="text-xs text-text-muted mt-1">{totalPairs} pairs to find</p>
          )}
        </header>

        {/* Players - Clean horizontal layout */}
        {gameStarted && winner === null && (
          <div className="flex items-stretch justify-between gap-3 mb-4">
            {/* Player 1 */}
            <div className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${
              currentTurn === 1 && !isProcessing
                ? "bg-surface border-violet/40 shadow-lg shadow-violet/10" 
                : "bg-surface/50 border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg font-bold ${
                  currentTurn === 1 && !isProcessing ? "bg-violet text-white" : "bg-bg-deep text-text-muted"
                }`}>
                  {player1Name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    {myPlayerNumber === 1 ? "You" : "Opponent"}
                  </p>
                  <p className="font-display text-xl font-bold text-text">
                    {scores[1]} <span className="text-xs font-body text-text-muted font-normal">pairs</span>
                  </p>
                </div>
                {currentTurn === 1 && !isProcessing && (
                  <div className="w-2 h-2 rounded-full bg-violet animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Player 2 */}
            <div className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${
              currentTurn === 2 && !isProcessing
                ? "bg-surface border-accent/40 shadow-lg shadow-accent/10" 
                : "bg-surface/50 border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg font-bold ${
                  currentTurn === 2 && !isProcessing ? "bg-accent text-white" : "bg-bg-deep text-text-muted"
                }`}>
                  {player2Name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    {myPlayerNumber === 2 ? "You" : "Opponent"}
                  </p>
                  <p className="font-display text-xl font-bold text-text">
                    {scores[2]} <span className="text-xs font-body text-text-muted font-normal">pairs</span>
                  </p>
                </div>
                {currentTurn === 2 && !isProcessing && (
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Turn Indicator - Minimal */}
        {gameStarted && winner === null && (
          <div className="text-center mb-4">
            <p className={`text-sm font-medium ${isMyTurn ? "text-violet" : "text-text-muted"}`}>
              {isMyTurn ? "Your turn" : `${playerInfo[opponentNumber]?.username || "Opponent"}'s turn`}
            </p>
            
            {/* Match notification */}
            {lastFlip?.isMatch && showingMatch && (
              <p className="mt-1 text-emerald text-sm font-medium">Match found!</p>
            )}
          </div>
        )}

        {/* Game Info - Shows waiting/reconnecting/gameover states */}
        {(!gameStarted || opponentLeft || winner) && (
          <GameInfo
            gameStarted={gameStarted}
            opponentLeft={opponentLeft}
            winner={winner}
            myPlayerNumber={myPlayerNumber}
            currentTurn={currentTurn}
            isMyTurn={isMyTurn}
            scores={scores}
            error={error}
            socketConnected={socket?.connected}
            isReconnecting={isReconnecting}
            onPlayAgain={handleReset}
            playerInfo={playerInfo}
            totalPairs={totalPairs}
          />
        )}

        {/* Game Board */}
        {gameStarted && winner === null && (
          <Board
            cards={cards}
            gridSize={gridSize}
            onCardClick={flipCard}
            disabled={!isMyTurn || isProcessing}
            showingMatch={showingMatch}
          />
        )}
      </div>

      {/* Floating Chat */}
      {socket && roomId && <FloatingChat socket={socket} roomId={roomId} />}
    </div>
  );
}

export default Memory;
