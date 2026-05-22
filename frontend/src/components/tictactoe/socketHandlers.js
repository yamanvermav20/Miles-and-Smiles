/**
 * Socket Handlers
 * All Socket.IO event listeners for TicTacToe game
 */

/**
 * Set up all socket event listeners for TicTacToe
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} handlers - Object containing handler functions
 * @returns {Function} Cleanup function to remove all listeners
 */
export function setupSocketHandlers(socket, handlers) {
  if (!socket) return () => {};

  const {
    onRoomJoined,
    onPlayerJoined,
    onGameStart,
    onGameUpdate,
    onGameOver,
    onGameDraw,
    onOpponentLeft,
    onGameError,
  } = handlers;

  // Register all event listeners
  if (onRoomJoined) socket.on("room-joined", onRoomJoined);
  if (onPlayerJoined) socket.on("player-joined", onPlayerJoined);
  if (onGameStart) socket.on("game:start", onGameStart);
  if (onGameUpdate) socket.on("game:update", onGameUpdate);
  if (onGameOver) socket.on("game:over", onGameOver);
  if (onGameDraw) socket.on("game:draw", onGameDraw);
  if (onOpponentLeft) socket.on("game:opponent_left", onOpponentLeft);
  if (handlers.onGameSync) socket.on("game:sync", handlers.onGameSync);
  if (handlers.onPlayerOffline)
    socket.on("player-offline", handlers.onPlayerOffline);
  if (handlers.onPlayerRejoined)
    socket.on("player-rejoined", handlers.onPlayerRejoined);
  if (onGameError) socket.on("game:error", onGameError);

  // Return cleanup function
  return () => {
    if (onRoomJoined) socket.off("room-joined", onRoomJoined);
    if (onPlayerJoined) socket.off("player-joined", onPlayerJoined);
    if (onGameStart) socket.off("game:start", onGameStart);
    if (onGameUpdate) socket.off("game:update", onGameUpdate);
    if (onGameOver) socket.off("game:over", onGameOver);
    if (onGameDraw) socket.off("game:draw", onGameDraw);
    if (onOpponentLeft) socket.off("game:opponent_left", onOpponentLeft);
    if (handlers.onGameSync) socket.off("game:sync", handlers.onGameSync);
    if (handlers.onPlayerOffline)
      socket.off("player-offline", handlers.onPlayerOffline);
    if (handlers.onPlayerRejoined)
      socket.off("player-rejoined", handlers.onPlayerRejoined);
    if (onGameError) socket.off("game:error", onGameError);
  };
}
