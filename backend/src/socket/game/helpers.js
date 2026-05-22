/**
 * Shared helper functions for socket operations
 */

/**
 * Generate a random room code (6 characters, alphanumeric)
 * @returns {string} Random room code
 */
export function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

