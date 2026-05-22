import { useState, useEffect, useCallback, useMemo } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useTurn } from "../../hooks/useTurn";

// Chess piece Unicode symbols
const PIECE_SYMBOLS = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙",
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  },
};

// Coordinate labels
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

/**
 * Chess Board Component
 */
function ChessBoard({
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
  playerColor,
  isFlipped,
}) {
  const renderBoard = useMemo(() => {
    const squares = [];
    const rows = isFlipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
    const cols = isFlipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];

    for (const row of rows) {
      for (const col of cols) {
        const isLight = (row + col) % 2 === 0;
        const piece = board[row]?.[col];
        const isSelected =
          selectedSquare?.row === row && selectedSquare?.col === col;
        const isLegalMove = legalMoves.some(
          (m) => m.toRow === row && m.toCol === col
        );
        const isLastMove =
          (lastMove?.fromRow === row && lastMove?.fromCol === col) ||
          (lastMove?.toRow === row && lastMove?.toCol === col);
        const isCapture = isLegalMove && piece;

        squares.push(
          <div
            key={`${row}-${col}`}
            className={`
              relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
              flex items-center justify-center cursor-pointer
              transition-colors duration-150
              ${isLight ? "bg-amber-100" : "bg-amber-600"}
              ${isSelected ? "ring-4 ring-blue-500 ring-inset" : ""}
              ${isLastMove ? "bg-yellow-300/50" : ""}
              hover:brightness-110
            `}
            onClick={() => onSquareClick(row, col)}
          >
            {/* Legal move indicator */}
            {isLegalMove && !isCapture && (
              <div className="absolute w-4 h-4 rounded-full bg-black/20" />
            )}

            {/* Capture indicator */}
            {isCapture && (
              <div className="absolute inset-0 ring-4 ring-inset ring-red-500/50 rounded" />
            )}

            {/* Chess piece */}
            {piece && (
              <span
                className={`
                  text-4xl sm:text-5xl select-none
                  ${piece.color === "white" ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : "text-gray-900"}
                  ${isSelected ? "scale-110" : ""}
                  transition-transform duration-150
                `}
              >
                {PIECE_SYMBOLS[piece.color]?.[piece.type]}
              </span>
            )}

            {/* Coordinate labels on edges */}
            {col === (isFlipped ? 7 : 0) && (
              <span className="absolute left-1 top-0 text-xs font-bold text-gray-600">
                {RANKS[row]}
              </span>
            )}
            {row === (isFlipped ? 0 : 7) && (
              <span className="absolute right-1 bottom-0 text-xs font-bold text-gray-600">
                {FILES[col]}
              </span>
            )}
          </div>
        );
      }
    }

    return squares;
  }, [board, selectedSquare, legalMoves, lastMove, isFlipped, onSquareClick]);

  return (
    <div className="grid grid-cols-8 border-4 border-amber-800 rounded shadow-xl">
      {renderBoard}
    </div>
  );
}

/**
 * Game Info Panel
 */
function GameInfo({
  players,
  turn,
  status,
  winner,
  playerColor,
  timeWhite,
  timeBlack,
  onResign,
  onOfferDraw,
  drawOffer,
  onAcceptDraw,
  onDeclineDraw,
  isAIGame = false,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white space-y-4">
      {/* Players */}
      <div className="space-y-2">
        {/* Black player (top) */}
        <div
          className={`
            flex items-center justify-between p-2 rounded
            ${turn === "black" ? "bg-gray-700 ring-2 ring-green-500" : "bg-gray-700/50"}
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">♚</span>
            <span>{players?.black?.username || "Waiting..."}</span>
          </div>
          {timeBlack !== undefined && (
            <span
              className={`font-mono ${timeBlack < 30 ? "text-red-400" : ""}`}
            >
              {formatTime(timeBlack)}
            </span>
          )}
        </div>

        {/* White player (bottom) */}
        <div
          className={`
            flex items-center justify-between p-2 rounded
            ${turn === "white" ? "bg-gray-700 ring-2 ring-green-500" : "bg-gray-700/50"}
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">♔</span>
            <span>{players?.white?.username || "Waiting..."}</span>
          </div>
          {timeWhite !== undefined && (
            <span
              className={`font-mono ${timeWhite < 30 ? "text-red-400" : ""}`}
            >
              {formatTime(timeWhite)}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-center p-2 bg-gray-700 rounded">
        {status === "checkmate" && (
          <span className="text-green-400 font-bold">
            Checkmate! {winner === "white" ? "White" : "Black"} wins!
          </span>
        )}
        {status === "stalemate" && (
          <span className="text-yellow-400 font-bold">Stalemate - Draw!</span>
        )}
        {status === "draw" && (
          <span className="text-yellow-400 font-bold">Draw!</span>
        )}
        {status === "check" && (
          <span className="text-red-400 font-bold">Check!</span>
        )}
        {status === "playing" && (
          <span className="text-gray-300">
            {turn === playerColor ? "Your turn" : "Opponent's turn"}
          </span>
        )}
      </div>

      {/* Draw offer - only show for multiplayer */}
      {!isAIGame && drawOffer && drawOffer !== playerColor && (
        <div className="bg-yellow-600/20 p-3 rounded space-y-2">
          <p className="text-center">Opponent offers a draw</p>
          <div className="flex gap-2">
            <button
              onClick={onAcceptDraw}
              className="flex-1 bg-green-600 hover:bg-green-700 py-1 rounded"
            >
              Accept
            </button>
            <button
              onClick={onDeclineDraw}
              className="flex-1 bg-red-600 hover:bg-red-700 py-1 rounded"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {status === "playing" && (
        <div className="flex gap-2">
          {!isAIGame && (
            <button
              onClick={onOfferDraw}
              disabled={drawOffer === playerColor}
              className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 py-2 rounded"
            >
              {drawOffer === playerColor ? "Draw Offered" : "Offer Draw"}
            </button>
          )}
          <button
            onClick={onResign}
            className={`${isAIGame ? "w-full" : "flex-1"} bg-red-600 hover:bg-red-700 py-2 rounded`}
          >
            Resign
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Move History Panel
 */
function MoveHistory({ moves }) {
  const moveList = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: moves[i],
        black: moves[i + 1],
      });
    }
    return pairs;
  }, [moves]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <h3 className="font-bold mb-2">Move History</h3>
      <div className="max-h-48 overflow-y-auto space-y-1 text-sm font-mono">
        {moveList.map((pair) => (
          <div key={pair.number} className="flex gap-2">
            <span className="text-gray-400 w-6">{pair.number}.</span>
            <span className="w-16">{pair.white?.notation || ""}</span>
            <span className="w-16">{pair.black?.notation || ""}</span>
          </div>
        ))}
        {moveList.length === 0 && (
          <p className="text-gray-400 italic">No moves yet</p>
        )}
      </div>
    </div>
  );
}

/**
 * Promotion Dialog
 */
function PromotionDialog({ color, onSelect }) {
  const pieces = ["queen", "rook", "bishop", "knight"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 shadow-xl">
        <h3 className="text-center font-bold mb-4">Choose Promotion</h3>
        <div className="flex gap-2">
          {pieces.map((piece) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className="w-16 h-16 bg-amber-100 hover:bg-amber-200 rounded flex items-center justify-center text-4xl"
            >
              {PIECE_SYMBOLS[color][piece]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Chess Game Component
 */
export default function ChessGame({ roomId, userId, username, isAIGame = false }) {
  const { socket, connected } = useSocket();
  const { isMyTurn, turnTimer, turnHistory } = useTurn(roomId, userId);

  // Game state
  const [board, setBoard] = useState(null);
  const [players, setPlayers] = useState({ white: null, black: null });
  const [turn, setTurn] = useState("white");
  const [status, setStatus] = useState("waiting");
  const [winner, setWinner] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [drawOffer, setDrawOffer] = useState(null);

  // UI state
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Determine player's color (always white in AI games)
  const playerColor = useMemo(() => {
    if (isAIGame) return "white";
    if (players.white?.userId === userId) return "white";
    if (players.black?.userId === userId) return "black";
    return null;
  }, [players, userId, isAIGame]);

  // Auto-flip board for black
  useEffect(() => {
    if (playerColor === "black" && !isFlipped) {
      setIsFlipped(true);
    }
  }, [playerColor, isFlipped]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Game started
    const handleGameStarted = (data) => {
      setBoard(data.board);
      setPlayers(data.players);
      setTurn(data.turn);
      setStatus("playing");
      setMoveHistory([]);
      setWinner(null);
      setDrawOffer(null);
    };

    // Move made
    const handleMoveMade = (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setLastMove(data.move);
      setMoveHistory((prev) => [...prev, data.move]);

      if (data.status) {
        setStatus(data.status);
      }
      if (data.winner) {
        setWinner(data.winner);
      }

      // Clear selection
      setSelectedSquare(null);
      setLegalMoves([]);
    };

    // Legal moves response
    const handleLegalMoves = (data) => {
      setLegalMoves(data.moves || []);
    };

    // Draw offered
    const handleDrawOffered = (data) => {
      setDrawOffer(data.color);
    };

    // Draw declined
    const handleDrawDeclined = () => {
      setDrawOffer(null);
    };

    // Game ended
    const handleGameEnded = (data) => {
      setStatus(data.status);
      setWinner(data.winner);
    };

    // Game sync (for reconnection)
    const handleGameSync = (data) => {
      setBoard(data.board);
      setPlayers(data.players);
      setTurn(data.turn);
      setStatus(data.status || "playing");
      setWinner(data.winner);
      setMoveHistory(data.moveHistory || []);
    };

    socket.on("chess:gameStarted", handleGameStarted);
    socket.on("chess:moveMade", handleMoveMade);
    socket.on("chess:legalMoves", handleLegalMoves);
    socket.on("chess:drawOffered", handleDrawOffered);
    socket.on("chess:drawDeclined", handleDrawDeclined);
    socket.on("chess:gameEnded", handleGameEnded);
    socket.on("game:sync", handleGameSync);
    
    // AI game events (use same handlers)
    socket.on("chess:ai-game-start", (data) => {
      setBoard(data.gameState.board);
      setPlayers(data.gameState.players);
      setTurn(data.gameState.turn);
      setStatus("playing");
      setMoveHistory([]);
      setWinner(null);
    });
    socket.on("chess:move-made", handleMoveMade);
    socket.on("chess:legal-moves", handleLegalMoves);
    socket.on("chess:game-over", (data) => {
      setStatus(data.reason);
      setWinner(data.winner);
    });

    return () => {
      socket.off("chess:gameStarted", handleGameStarted);
      socket.off("chess:moveMade", handleMoveMade);
      socket.off("chess:legalMoves", handleLegalMoves);
      socket.off("chess:drawOffered", handleDrawOffered);
      socket.off("chess:drawDeclined", handleDrawDeclined);
      socket.off("chess:gameEnded", handleGameEnded);
      socket.off("game:sync", handleGameSync);
      socket.off("chess:ai-game-start");
      socket.off("chess:move-made");
      socket.off("chess:legal-moves");
      socket.off("chess:game-over");
    };
  }, [socket]);

  // Handle square click
  const handleSquareClick = useCallback(
    (row, col) => {
      if (!socket || status !== "playing" || !playerColor) return;
      if (turn !== playerColor) return;

      const piece = board[row]?.[col];

      // If we have a selected piece and click on a legal move
      if (selectedSquare && legalMoves.some((m) => m.toRow === row && m.toCol === col)) {
        const move = legalMoves.find((m) => m.toRow === row && m.toCol === col);

        // Check for pawn promotion
        if (move.isPromotion) {
          setPendingPromotion({
            fromRow: selectedSquare.row,
            fromCol: selectedSquare.col,
            toRow: row,
            toCol: col,
          });
          return;
        }

        // Make the move - use different event for AI games
        const moveEvent = isAIGame ? "chess:ai-move" : "chess:move";
        socket.emit(moveEvent, {
          roomId,
          move: {
            from: `${String.fromCharCode(97 + selectedSquare.col)}${8 - selectedSquare.row}`,
            to: `${String.fromCharCode(97 + col)}${8 - row}`,
          },
        });

        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Select own piece
      if (piece && piece.color === playerColor) {
        setSelectedSquare({ row, col });
        const legalMovesEvent = isAIGame ? "chess:ai-get-legal-moves" : "chess:getLegalMoves";
        socket.emit(legalMovesEvent, { roomId, position: { row, col } });
      } else {
        // Deselect
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [socket, status, playerColor, turn, board, selectedSquare, legalMoves, roomId, isAIGame]
  );

  // Handle promotion selection
  const handlePromotion = useCallback(
    (piece) => {
      if (!pendingPromotion || !socket) return;

      const moveEvent = isAIGame ? "chess:ai-move" : "chess:move";
      socket.emit(moveEvent, {
        roomId,
        move: {
          from: `${String.fromCharCode(97 + pendingPromotion.fromCol)}${8 - pendingPromotion.fromRow}`,
          to: `${String.fromCharCode(97 + pendingPromotion.toCol)}${8 - pendingPromotion.toRow}`,
          promotion: piece,
        },
      });

      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [pendingPromotion, socket, roomId, isAIGame]
  );

  // Handle resign
  const handleResign = useCallback(() => {
    if (!socket || status !== "playing") return;
    if (confirm("Are you sure you want to resign?")) {
      const resignEvent = isAIGame ? "chess:ai-resign" : "chess:resign";
      socket.emit(resignEvent, { roomId });
    }
  }, [socket, status, roomId, isAIGame]);

  // Handle draw offer
  const handleOfferDraw = useCallback(() => {
    if (!socket || status !== "playing") return;
    socket.emit("chess:offerDraw", { roomId });
    setDrawOffer(playerColor);
  }, [socket, status, roomId, playerColor]);

  // Handle draw response
  const handleAcceptDraw = useCallback(() => {
    if (!socket) return;
    socket.emit("chess:respondDraw", { roomId, accept: true });
  }, [socket, roomId]);

  const handleDeclineDraw = useCallback(() => {
    if (!socket) return;
    socket.emit("chess:respondDraw", { roomId, accept: false });
    setDrawOffer(null);
  }, [socket, roomId]);

  // Loading state
  if (!board) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Waiting for game to start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center p-4">
      {/* Chess Board */}
      <div className="flex flex-col items-center">
        <ChessBoard
          board={board}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={lastMove}
          onSquareClick={handleSquareClick}
          playerColor={playerColor}
          isFlipped={isFlipped}
        />

        {/* Flip board button */}
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="mt-2 px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Flip Board
        </button>
      </div>

      {/* Side panels */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <GameInfo
          players={players}
          turn={turn}
          status={status}
          winner={winner}
          playerColor={playerColor}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          drawOffer={drawOffer}
          onAcceptDraw={handleAcceptDraw}
          onDeclineDraw={handleDeclineDraw}
          isAIGame={isAIGame}
        />

        <MoveHistory moves={moveHistory} />
      </div>

      {/* Promotion dialog */}
      {pendingPromotion && (
        <PromotionDialog color={playerColor} onSelect={handlePromotion} />
      )}
    </div>
  );
}
