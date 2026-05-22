/**
 * TicTacToe Main Component
 * Clean, typography-driven game interface
 */

import { useTicTacToeGame } from "../components/tictactoe/useTicTacToeGame.js";
import Board from "../components/tictactoe/Board.jsx";
import GameInfo from "../components/tictactoe/GameInfo.jsx";
import FloatingChat from "../components/tictactoe/FloatingChat.jsx";
import ExitButton from "../components/tictactoe/ExitButton.jsx";

/**
 * @param {Object} props
 * @param {Object} props.roomData - Room data containing socket and roomId
 */
function TicTacToe({ roomData }) {
  const { socket, roomId } = roomData || {};

  // Use custom hook for all game state and logic
  const {
    board,
    turn,
    mySymbol,
    winner,
    gameStarted,
    opponentLeft,
    error,
    isMyTurn,
    isReconnecting,
    playerInfo,
    handleCellClick,
    handlePlayAgain,
  } = useTicTacToeGame(socket, roomId);

  // Get player names
  const playerXName = playerInfo?.X?.username || "Player X";
  const playerOName = playerInfo?.O?.username || "Player O";

  return (
    <div className="game-shell min-h-screen bg-bg font-body overflow-hidden">
      {/* Layered background */}
      <div className="fixed inset-0 bg-gradient-to-b from-bg via-bg to-bg-deep" />
      <div className="fixed inset-0 geo-pattern pointer-events-none opacity-30" />
      
      {/* Accent glow - subtle, positioned */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet/5 blur-[100px] pointer-events-none" />
      
      {/* Exit Button */}
      <ExitButton socket={socket} roomId={roomId} />

      {/* Main Game Container */}
      <div className="relative min-h-screen flex flex-col px-4 sm:px-6 py-6 max-w-md mx-auto">
        
        {/* Header - Typography focused */}
        <header className="flex-shrink-0 text-center mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2 font-medium">
            Room {roomId}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text tracking-tight">
            Tic Tac Toe
          </h1>
        </header>

        {/* Players - Clean horizontal layout */}
        {gameStarted && winner === null && (
          <div className="flex items-stretch justify-between gap-3 mb-6">
            {/* Player X */}
            <div className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${
              turn === "X" 
                ? "bg-surface border-violet/40 shadow-lg shadow-violet/10" 
                : "bg-surface/50 border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-xl font-bold ${
                  turn === "X" ? "bg-violet text-white" : "bg-bg-deep text-text-muted"
                }`}>
                  ✕
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    {mySymbol === "X" ? "You" : "Opponent"}
                  </p>
                  <p className="font-display font-semibold text-text truncate">
                    {playerXName}
                  </p>
                </div>
                {turn === "X" && (
                  <div className="w-2 h-2 rounded-full bg-violet animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Player O */}
            <div className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${
              turn === "O" 
                ? "bg-surface border-accent/40 shadow-lg shadow-accent/10" 
                : "bg-surface/50 border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-xl font-bold ${
                  turn === "O" ? "bg-accent text-white" : "bg-bg-deep text-text-muted"
                }`}>
                  ○
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    {mySymbol === "O" ? "You" : "Opponent"}
                  </p>
                  <p className="font-display font-semibold text-text truncate">
                    {playerOName}
                  </p>
                </div>
                {turn === "O" && (
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Info - Shows waiting/reconnecting/gameover states */}
        <GameInfo
          gameStarted={gameStarted}
          opponentLeft={opponentLeft}
          winner={winner}
          mySymbol={mySymbol}
          turn={turn}
          isMyTurn={isMyTurn}
          error={error}
          socketConnected={socket?.connected}
          isReconnecting={isReconnecting}
          onPlayAgain={handlePlayAgain}
          playerInfo={playerInfo}
        />

        {/* Game Board */}
        {gameStarted && (
          <Board
            board={board}
            isMyTurn={isMyTurn}
            winner={winner}
            onCellClick={handleCellClick}
          />
        )}
      </div>

      {/* Floating Chat */}
      {socket && roomId && <FloatingChat socket={socket} roomId={roomId} />}
    </div>
  );
}

export default TicTacToe;
