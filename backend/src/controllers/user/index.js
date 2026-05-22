/**
 * User Controller Index
 * Re-exports all user-related controllers for backward compatibility
 */

// Profile operations
export { 
  getKing, 
  getMe, 
  updateProfilePicture, 
  updateField 
} from "./profileController.js";

// Friend operations
export { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest 
} from "./friendController.js";

export { 
  cancelFriendRequest, 
  removeFriend 
} from "./friendActionsController.js";

// Favorites operations
export { 
  getFavorites, 
  toggleFavorite 
} from "./favoritesController.js";

// Game stats operations
export { 
  getGameStats, 
  getGameHistory 
} from "./gameStatsController.js";

// Internal service
export { 
  recordGameResult 
} from "./gameResultService.js";
