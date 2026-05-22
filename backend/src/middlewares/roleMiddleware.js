/**
 * Role-based Access Control Middleware
 * Handles authorization based on user roles
 */

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = ["user", "moderator", "admin"];

/**
 * Get role level
 * @param {string} role - Role name
 * @returns {number} Role level
 */
function getRoleLevel(role) {
  const level = ROLE_HIERARCHY.indexOf(role);
  return level === -1 ? 0 : level;
}

/**
 * Check if user has required role or higher
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean}
 */
export function hasRole(userRole, requiredRole) {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

/**
 * Middleware to require a specific role
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware
 */
export function requireRole(...roles) {
  const requiredRoles = roles.flat();
  
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }
    
    const userRole = req.user.role || "user";
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => 
      hasRole(userRole, role)
    );
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to access this resource",
        required: requiredRoles,
        current: userRole,
      });
    }
    
    next();
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole("admin");

/**
 * Middleware to require moderator role (or higher)
 */
export const requireModerator = requireRole("moderator");

/**
 * Check if user can moderate another user
 * @param {string} moderatorRole - Moderator's role
 * @param {string} targetRole - Target user's role
 * @returns {boolean}
 */
export function canModerate(moderatorRole, targetRole) {
  // Can only moderate users with lower role level
  return getRoleLevel(moderatorRole) > getRoleLevel(targetRole);
}

/**
 * Middleware to check if user can perform action on target user
 * @returns {Function} Express middleware
 */
export function canModerateUser() {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }
    
    const targetUserId = req.params.userId || req.body.userId;
    
    // Users can always perform actions on themselves
    if (req.user.id === targetUserId) {
      return next();
    }
    
    // Get target user's role
    const User = (await import("../models/User.js")).default;
    const targetUser = await User.findById(targetUserId).select("role");
    
    if (!targetUser) {
      return res.status(404).json({
        error: "Not found",
        message: "User not found",
      });
    }
    
    const userRole = req.user.role || "user";
    const targetRole = targetUser.role || "user";
    
    if (!canModerate(userRole, targetRole)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You cannot perform this action on this user",
      });
    }
    
    // Attach target user to request
    req.targetUser = targetUser;
    next();
  };
}

/**
 * Role permissions matrix
 */
export const PERMISSIONS = {
  // User management
  "user:view": ["user", "moderator", "admin"],
  "user:edit-self": ["user", "moderator", "admin"],
  "user:edit-others": ["admin"],
  "user:ban": ["moderator", "admin"],
  "user:unban": ["moderator", "admin"],
  "user:delete": ["admin"],
  "user:change-role": ["admin"],
  
  // Game management
  "game:play": ["user", "moderator", "admin"],
  "game:spectate": ["user", "moderator", "admin"],
  "game:moderate": ["moderator", "admin"],
  "game:end-force": ["moderator", "admin"],
  
  // Chat management
  "chat:send": ["user", "moderator", "admin"],
  "chat:delete-own": ["user", "moderator", "admin"],
  "chat:delete-others": ["moderator", "admin"],
  "chat:mute-user": ["moderator", "admin"],
  
  // Admin features
  "admin:dashboard": ["admin"],
  "admin:stats": ["moderator", "admin"],
  "admin:logs": ["admin"],
  "admin:settings": ["admin"],
};

/**
 * Check if user has specific permission
 * @param {string} userRole - User's role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(userRole, permission) {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Middleware to require specific permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }
    
    const userRole = req.user.role || "user";
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Permission '${permission}' required`,
      });
    }
    
    next();
  };
}

/**
 * Get all permissions for a role
 * @param {string} role - Role name
 * @returns {string[]} List of permissions
 */
export function getRolePermissions(role) {
  return Object.entries(PERMISSIONS)
    .filter(([_, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

export default {
  hasRole,
  requireRole,
  requireAdmin,
  requireModerator,
  canModerate,
  canModerateUser,
  hasPermission,
  requirePermission,
  getRolePermissions,
  PERMISSIONS,
  ROLE_HIERARCHY,
};
