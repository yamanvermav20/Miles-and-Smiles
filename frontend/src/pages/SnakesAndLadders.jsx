/**
 * Snakes and Ladders Main Component
 * Clean, typography-driven game interface
 */

import { useSnakesAndLaddersGame } from "../components/snakesladders/useSnakesAndLaddersGame.js";
import Board from "../components/snakesladders/Board.jsx";
import Dice from "../components/snakesladders/Dice.jsx";
import GameInfo from "../components/snakesladders/GameInfo.jsx";
import FloatingChat from "../components/snakesladders/FloatingChat.jsx";
import ExitButton from "../components/snakesladders/ExitButton.jsx";

/**
 * @param {Object} props
 * @param {Object} props.roomData - Room data containing socket and roomId
 */
function SnakesAndLadders({ roomData }) {
  const { socket, roomId } = roomData || {};

  // Use custom hook for all game state and logic
  const {
    positions,
    currentTurn,
    myPlayerNumber,
    winner,
    gameStarted,
    opponentLeft,
    error,
    isReconnecting,
    lastDiceRoll,
    isRolling,
    extraTurn,
    lastMove,
    animatingPlayer,
    isAnimating,
    playerInfo,
    isMyTurn,
    snakes,
    ladders,
    handleRollDice,
    handlePlayAgain,
  } = useSnakesAndLaddersGame(socket, roomId);

  // Get player names
  const player1Name = playerInfo[1]?.username || "Player 1";
  const player2Name = playerInfo[2]?.username || "Player 2";

  return (
    <div className="game-shell min-h-screen bg-bg font-body overflow-hidden">
      {/* Layered background */}
      <div className="fixed inset-0 bg-gradient-to-b from-bg via-bg to-bg-deep" />
      <div className="fixed inset-0 geo-pattern pointer-events-none opacity-30" />
      
      {/* Accent glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald/5 blur-[100px] pointer-events-none" />
      
      {/* Exit Button */}
      <ExitButton socket={socket} roomId={roomId} />

      {/* Main Game Container */}
      <div className="relative min-h-screen flex flex-col px-4 sm:px-6 py-6 max-w-lg mx-auto">
        
        {/* Header */}
        <header className="flex-shrink-0 text-center mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2 font-medium">
            Room {roomId}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            Snakes & Ladders
          </h1>
        </header>

        {/* Players - Clean horizontal layout */}
        {gameStarted && winner === null && (
          <div className="flex items-stretch justify-between gap-3 mb-4">
            {/* Player 1 */}
            <div className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${
              currentTurn === 1 && !isAnimating
                ? "bg-surface border-emerald/40 shadow-lg shadow-emerald/10" 
                : "bg-surface/50 border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg font-bold ${
                  currentTurn === 1 && !isAnimating ? "bg-emerald text-white" : "bg-bg-deep text-text-muted"
                }`}>
                  {player1Name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    {myPlayerNumber === 1 ? "You" : "Opponent"}
                  </p>
                  <p className="font-display text-lg font-bold text-text">
                    {positions[1] === 0 ? "Start" : positions[1]}
                  </p>
                </div>
                {currentTurn === 1 && !isAnimating && (
                  <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Player 2 */}
            <div className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${
              currentTurn === 2 && !isAnimating
                ? "bg-surface border-amber/40 shadow-lg shadow-amber/10" 
                : "bg-surface/50 border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg font-bold ${
                  currentTurn === 2 && !isAnimating ? "bg-amber text-white" : "bg-bg-deep text-text-muted"
                }`}>
                  {player2Name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    {myPlayerNumber === 2 ? "You" : "Opponent"}
                  </p>
                  <p className="font-display text-lg font-bold text-text">
                    {positions[2] === 0 ? "Start" : positions[2]}
                  </p>
                </div>
                {currentTurn === 2 && !isAnimating && (
                  <div className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Info */}
        <GameInfo
          gameStarted={gameStarted}
          opponentLeft={opponentLeft}
          winner={winner}
          myPlayerNumber={myPlayerNumber}
          currentTurn={currentTurn}
          isMyTurn={isMyTurn}
          error={error}
          socketConnected={socket?.connected}
          isReconnecting={isReconnecting}
          onPlayAgain={handlePlayAgain}
          playerInfo={playerInfo}
          lastMove={lastMove}
        />

        {/* Game Board */}
        {gameStarted && winner === null && (
          <Board
            positions={positions}
            snakes={snakes}
            ladders={ladders}
            animatingPlayer={animatingPlayer}
          />
        )}

        {/* Dice Section */}
        {gameStarted && winner === null && (
          <div className="mt-4 flex justify-center">
            <Dice
              value={lastDiceRoll}
              isRolling={isRolling}
              onRoll={handleRollDice}
              disabled={!isMyTurn || isAnimating}
              extraTurn={extraTurn && isMyTurn && !isAnimating}
              moveInfo={lastMove}
            />
          </div>
        )}
      </div>

      {/* Floating Chat */}
      {socket && roomId && <FloatingChat socket={socket} roomId={roomId} />}
    </div>
  );
}

export default SnakesAndLadders;
