/**
 * Matchmaking State
 * Shared state for matchmaking system
 * 
 * @module socket/handlers/matchmaking/state
 */

// ─────────────────────────────────────────
// ACTIVE SEARCHES
// Tracks players currently searching for matches
// Map<socketId, { game, mode, queueEntryId, startedAt }>
// ─────────────────────────────────────────
export const activeSearches = new Map();

// ─────────────────────────────────────────
// PENDING PRIVATE ROOMS
// Private room invites waiting for acceptance
// Map<inviteCode, { roomId, hostId, hostUsername, game, createdAt }>
// ─────────────────────────────────────────
export const pendingPrivateRooms = new Map();

/**
 * Add an active search
 * @param {string} socketId - Socket ID
 * @param {Object} searchData - Search data
 */
export function addActiveSearch(socketId, searchData) {
  activeSearches.set(socketId, {
    ...searchData,
    startedAt: Date.now(),
  });
}

/**
 * Remove an active search
 * @param {string} socketId - Socket ID
 * @returns {Object|undefined} The removed search data
 */
export function removeActiveSearch(socketId) {
  const search = activeSearches.get(socketId);
  activeSearches.delete(socketId);
  return search;
}

/**
 * Get an active search
 * @param {string} socketId - Socket ID
 * @returns {Object|undefined} The search data
 */
export function getActiveSearch(socketId) {
  return activeSearches.get(socketId);
}

/**
 * Add a pending private room
 * @param {string} inviteCode - Invite code
 * @param {Object} roomData - Room data
 */
export function addPendingRoom(inviteCode, roomData) {
  pendingPrivateRooms.set(inviteCode, {
    ...roomData,
    createdAt: Date.now(),
  });
}

/**
 * Remove and get a pending private room
 * @param {string} inviteCode - Invite code
 * @returns {Object|undefined} The room data
 */
export function removePendingRoom(inviteCode) {
  const room = pendingPrivateRooms.get(inviteCode);
  pendingPrivateRooms.delete(inviteCode);
  return room;
}

/**
 * Get a pending private room
 * @param {string} inviteCode - Invite code
 * @returns {Object|undefined} The room data
 */
export function getPendingRoom(inviteCode) {
  return pendingPrivateRooms.get(inviteCode);
}
