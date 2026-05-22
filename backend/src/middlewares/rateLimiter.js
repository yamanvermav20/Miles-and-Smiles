/**
 * Rate Limiter Middleware
 * Uses Redis for distributed rate limiting with IP throttling
 */

import redisClient from "../config/redis.js";

/**
 * Rate limiter configuration
 */
const RATE_LIMITS = {
  // General API rate limits
  default: { windowMs: 60000, max: 100 }, // 100 requests per minute
  
  // Auth endpoints - stricter limits
  auth: { windowMs: 900000, max: 100 }, // 10 attempts per 15 minutes
  login: { windowMs: 900000, max: 100 }, // 5 login attempts per 15 minutes
  signup: { windowMs: 3600000, max: 100 }, // 3 signups per hour per IP
  
  // Sensitive operations
  passwordReset: { windowMs: 3600000, max: 3 }, // 3 per hour
  
  // Game actions - higher limits
  gameAction: { windowMs: 1000, max: 10 }, // 10 actions per second (anti-cheat)
  
  // Social actions
  friendRequest: { windowMs: 60000, max: 20 }, // 20 per minute
  message: { windowMs: 1000, max: 5 }, // 5 messages per second
};

/**
 * IP blacklist check patterns (suspicious IPs)
 */
const suspiciousPatterns = new Set();

/**
 * Get rate limit key for Redis
 */
function getRateLimitKey(type, identifier) {
  return `ratelimit:${type}:${identifier}`;
}

/**
 * Get client identifier (IP + optional user ID)
 */
function getClientIdentifier(req) {
  const ip = req.ip || 
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
    req.connection?.remoteAddress || 
    "unknown";
  
  const userId = req.user?.id || "";
  
  return { ip, userId, combined: `${ip}:${userId}` };
}

/**
 * Check if rate limit is exceeded
 * @param {string} key - Redis key
 * @param {number} max - Maximum requests
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { limited, current, remaining, resetIn }
 */
async function checkRateLimit(key, max, windowMs) {
  try {
    const current = await redisClient.incr(key);
    
    if (current === 1) {
      // First request - set expiry
      await redisClient.pExpire?.(key, windowMs) || 
        await redisClient.expire?.(key, Math.ceil(windowMs / 1000));
    }
    
    const ttl = await redisClient.pTtl?.(key) || (await redisClient.ttl?.(key) || 0) * 1000;
    
    return {
      limited: current > max,
      current,
      remaining: Math.max(0, max - current),
      resetIn: ttl > 0 ? ttl : windowMs,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open - allow request if Redis is down
    return { limited: false, current: 0, remaining: max, resetIn: windowMs };
  }
}

/**
 * Create rate limiter middleware
 * @param {string} type - Rate limit type
 * @param {Object} customConfig - Custom configuration override
 */
export function rateLimiter(type = "default", customConfig = {}) {
  const config = { ...RATE_LIMITS[type], ...customConfig };
  
  return async (req, res, next) => {
    const { ip, combined } = getClientIdentifier(req);
    
    // Check IP blacklist
    if (suspiciousPatterns.has(ip)) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Your IP has been temporarily blocked",
      });
    }
    
    // Use combined key for authenticated users, IP for guests
    const identifier = req.user ? combined : ip;
    const key = getRateLimitKey(type, identifier);
    
    const result = await checkRateLimit(key, config.max, config.windowMs);
    
    // Set rate limit headers
    res.set({
      "X-RateLimit-Limit": config.max,
      "X-RateLimit-Remaining": result.remaining,
      "X-RateLimit-Reset": Math.ceil(Date.now() + result.resetIn),
    });
    
    if (result.limited) {
      // Log suspicious activity
      console.warn(`⚠️ Rate limit exceeded: ${type} for ${identifier}`);
      
      // Track repeat offenders
      const offenseKey = `ratelimit:offense:${ip}`;
      const offenses = await redisClient.incr(offenseKey);
      await redisClient.expire?.(offenseKey, 3600); // 1 hour tracking
      
      // Temporary blacklist after repeated violations
      if (offenses > 10) {
        suspiciousPatterns.add(ip);
        setTimeout(() => suspiciousPatterns.delete(ip), 3600000); // 1 hour blacklist
        console.warn(`🚫 IP temporarily blacklisted: ${ip}`);
      }
      
      return res.status(429).json({
        error: "Too many requests",
        message: `Rate limit exceeded. Please try again in ${Math.ceil(result.resetIn / 1000)} seconds`,
        retryAfter: Math.ceil(result.resetIn / 1000),
      });
    }
    
    next();
  };
}

/**
 * Auth-specific rate limiter with additional protections
 */
export function authRateLimiter(action = "login") {
  return async (req, res, next) => {
    const { ip } = getClientIdentifier(req);
    const username = req.body?.username?.toLowerCase() || "";
    
    // Check IP-based limit
    const ipKey = getRateLimitKey(`auth:${action}:ip`, ip);
    const ipResult = await checkRateLimit(
      ipKey,
      RATE_LIMITS[action]?.max || 5,
      RATE_LIMITS[action]?.windowMs || 900000
    );
    
    // Check username-based limit (prevent brute force on specific accounts)
    let usernameResult = { limited: false };
    if (username) {
      const usernameKey = getRateLimitKey(`auth:${action}:user`, username);
      usernameResult = await checkRateLimit(usernameKey, 100, 900000);
    }
    
    // Set headers
    res.set({
      "X-RateLimit-Limit": RATE_LIMITS[action]?.max || 500,
      "X-RateLimit-Remaining": Math.min(ipResult.remaining, usernameResult.remaining || Infinity),
    });
    
    if (ipResult.limited || usernameResult.limited) {
      const resetIn = Math.max(ipResult.resetIn, usernameResult.resetIn || 0);
      
      // Log failed attempt
      console.warn(`⚠️ Auth rate limit: ${action} from ${ip} for user ${username || "unknown"}`);
      
      return res.status(429).json({
        error: "Too many attempts",
        message: `Too many ${action} attempts. Please try again later.`,
        retryAfter: Math.ceil(resetIn / 1000),
      });
    }
    
    next();
  };
}

/**
 * Socket.io rate limiter
 * @param {Object} socket - Socket instance
 * @param {string} event - Event name
 * @param {Object} config - Rate limit config
 * @returns {boolean} Whether request is allowed
 */
export async function socketRateLimiter(socket, event, config = { windowMs: 1000, max: 10 }) {
  const userId = socket.userId || socket.id;
  const key = getRateLimitKey(`socket:${event}`, userId);
  
  const result = await checkRateLimit(key, config.max, config.windowMs);
  
  if (result.limited) {
    console.warn(`⚠️ Socket rate limit: ${event} for ${userId}`);
    socket.emit("error", {
      type: "RATE_LIMIT",
      message: "Too many requests. Please slow down.",
    });
    return false;
  }
  
  return true;
}

/**
 * Middleware to track and log all requests (for observability)
 */
export function requestLogger() {
  return (req, res, next) => {
    const start = Date.now();
    const { ip, userId } = getClientIdentifier(req);
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        ip,
        userId: userId || "guest",
        userAgent: req.headers["user-agent"],
      };
      
      // Log slow requests
      if (duration > 1000) {
        console.warn("🐢 Slow request:", logData);
      }
      
      // Log errors
      if (res.statusCode >= 400) {
        console.warn("❌ Error response:", logData);
      }
    });
    
    next();
  };
}

export default {
  rateLimiter,
  authRateLimiter,
  socketRateLimiter,
  requestLogger,
  RATE_LIMITS,
};
