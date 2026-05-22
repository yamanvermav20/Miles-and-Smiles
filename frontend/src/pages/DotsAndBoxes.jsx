/**
 * Dots & Boxes Main Component
 * Clean, typography-driven game interface
 */

import { useDotsAndBoxesGame } from "../components/dotsandboxes/useDotsAndBoxesGame.js";
import Board from "../components/dotsandboxes/Board.jsx";
import ScoreBoard from "../components/dotsandboxes/ScoreBoard.jsx";
import GameInfo from "../components/dotsandboxes/GameInfo.jsx";
import FloatingChat from "../components/dotsandboxes/FloatingChat.jsx";
import ExitButton from "../components/dotsandboxes/ExitButton.jsx";

function DotsAndBoxes({ roomData }) {
  const { socket, roomId } = roomData || {};

  const {
    rows,
    cols,
    horizontalLines,
    verticalLines,
    boxes,
    scores,
    currentTurn,
    myPlayerNumber,
    gameOver,
    winner,
    gameStarted,
    opponentLeft,
    error,
    isMyTurn,
    isReconnecting,
    lastMove,
    lastCompletedBoxes,
    playerInfo,
    completedBoxes,
    totalBoxes,
    handleLineClick,
    handlePlayAgain,
  } = useDotsAndBoxesGame(socket, roomId);

  return (
    <div className="game-shell min-h-screen bg-bg font-body overflow-hidden">
      {/* Layered background */}
      <div className="fixed inset-0 bg-gradient-to-b from-bg via-bg to-bg-deep" />
      <div className="fixed inset-0 geo-pattern pointer-events-none opacity-30" />
      
      {/* Accent glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber/5 blur-[100px] pointer-events-none" />
      
      {/* Exit Button */}
      <ExitButton socket={socket} roomId={roomId} />

      {/* Main Game Container */}
      <div className="relative min-h-screen flex flex-col px-4 sm:px-6 py-6 max-w-xl mx-auto">
        
        {/* Header */}
        <header className="flex-shrink-0 text-center mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2 font-medium">
            Room {roomId}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            Dots & Boxes
          </h1>
        </header>

        {/* Game Info - Shows waiting/reconnecting/gameover states */}
        {(!gameStarted || gameOver) && (
          <GameInfo
            gameStarted={gameStarted}
            opponentLeft={opponentLeft}
            gameOver={gameOver}
            winner={winner}
            myPlayerNumber={myPlayerNumber}
            currentTurn={currentTurn}
            isMyTurn={isMyTurn}
            error={error}
            socketConnected={socket?.connected}
            isReconnecting={isReconnecting}
            scores={scores}
            onPlayAgain={handlePlayAgain}
          />
        )}

        {/* Active Game Layout */}
        {gameStarted && !gameOver && (
          <>
            {/* Turn Indicator */}
            <GameInfo
              gameStarted={gameStarted}
              opponentLeft={opponentLeft}
              gameOver={gameOver}
              winner={winner}
              myPlayerNumber={myPlayerNumber}
              currentTurn={currentTurn}
              isMyTurn={isMyTurn}
              error={error}
              socketConnected={socket?.connected}
              isReconnecting={isReconnecting}
              scores={scores}
              onPlayAgain={handlePlayAgain}
            />

            {/* Score Board */}
            <div className="flex-shrink-0 mb-3">
              <ScoreBoard
                scores={scores}
                myPlayerNumber={myPlayerNumber}
                currentTurn={currentTurn}
                gameOver={gameOver}
                playerInfo={playerInfo}
                completedBoxes={completedBoxes}
                totalBoxes={totalBoxes}
              />
            </div>

            {/* Game Board */}
            <Board
              rows={rows}
              cols={cols}
              horizontalLines={horizontalLines}
              verticalLines={verticalLines}
              boxes={boxes}
              isMyTurn={isMyTurn}
              gameOver={gameOver}
              onLineClick={handleLineClick}
              lastMove={lastMove}
              lastCompletedBoxes={lastCompletedBoxes}
            />
          </>
        )}

        {/* Score shown during game over */}
        {gameStarted && gameOver && (
          <div className="flex-shrink-0 mb-4 opacity-60">
            <ScoreBoard
              scores={scores}
              myPlayerNumber={myPlayerNumber}
              currentTurn={currentTurn}
              gameOver={gameOver}
              playerInfo={playerInfo}
              completedBoxes={completedBoxes}
              totalBoxes={totalBoxes}
            />
          </div>
        )}
      </div>

      {/* Floating Chat */}
      {socket && roomId && <FloatingChat socket={socket} roomId={roomId} />}
    </div>
  );
}

export default DotsAndBoxes;
