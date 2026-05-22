/**
 * Auth Controller Index
 * Re-exports all auth-related controllers
 */

// Core auth
export { signup } from "./signupController.js";
export { login } from "./loginController.js";

// Session management
export { 
  refresh,
  logout,
  logoutAll,
  logoutOthers,
  getSessions,
  revokeSession,
} from "./sessionController.js";

// Password management
export { changePassword } from "./passwordController.js";

// Legacy alias for backward compatibility
export { signup as signUp } from "./signupController.js";
