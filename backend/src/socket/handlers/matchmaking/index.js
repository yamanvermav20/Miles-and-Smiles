/**
 * Matchmaking Module
 * Re-exports all matchmaking handlers
 * 
 * @module socket/handlers/matchmaking
 */

export { setupMatchmakingHandler } from "./matchmakingHandler.js";
export { runMatchmakingCycle } from "./matchCycle.js";
export { activeSearches, pendingPrivateRooms } from "./state.js";
export { handleMatchFound } from "./matchHandler.js";

// Default export for backward compatibility
export { default } from "./matchmakingHandler.js";
