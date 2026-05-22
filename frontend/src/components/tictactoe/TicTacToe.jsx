/**
 * TicTacToe Main Component
 * Main game controller that orchestrates all sub-components
 */

import { useTicTacToeGame } from "./useTicTacToeGame.js";
import Board from "./Board.jsx";
import GameInfo from "./GameInfo.jsx";
import Chat from "../Chat.jsx";

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
    handleCellClick,
    handlePlayAgain,
  } = useTicTacToeGame(socket, roomId);

  return (
    <div className="min-h-screen bg-[--bg] text-[--text] p-4 relative">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Tic Tac Toe</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Room: {roomId} | Game: {roomData?.gameName}
        </p>

        {/* Game Status and Info */}
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
        />

        {/* Game Board */}
        <Board
          board={board}
          isMyTurn={isMyTurn}
          winner={winner}
          onCellClick={handleCellClick}
        />

        {/* Game Instructions */}
        {gameStarted && winner === null && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {isMyTurn
              ? "Click on an empty cell to make your move"
              : "Wait for your opponent to make their move"}
          </div>
        )}
      </div>

      {/* Chat Component */}
      {socket && roomId && <Chat socket={socket} roomId={roomId} />}
    </div>
  );
}

export default TicTacToe;
