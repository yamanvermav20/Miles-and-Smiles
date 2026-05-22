/**
 * Matchmaking Handler - Re-export Module
 * For backward compatibility, re-exports from modular matchmaking/ folder
 * 
 * @see ./matchmaking/index.js for implementation
 */

export { 
  setupMatchmakingHandler,
  runMatchmakingCycle 
} from "./matchmaking/index.js";

export { default } from "./matchmaking/index.js";
