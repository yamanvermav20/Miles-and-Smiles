/**
 * Chess Handler - Re-export Module
 * For backward compatibility, re-exports from modular chess/ folder
 * 
 * @see ./chess/index.js for implementation
 */

export { 
  setupChessHandler, 
  startChessGame, 
  handleChessPlayerLeave 
} from "./chess/index.js";

export { default } from "./chess/index.js";
