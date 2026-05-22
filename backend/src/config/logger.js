/**
 * Winston Logger Configuration
 * Centralized logging with structured output, correlation IDs, and multiple transports
 */

import winston from "winston";
import path from "path";
import crypto from "crypto";

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Log directory
const LOG_DIR = process.env.LOG_DIR || "logs";

// Environment
const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

/**
 * Custom log format for console output
 */
const consoleFormat = printf(({ level, message, timestamp, correlationId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  
  if (correlationId) {
    msg += ` [${correlationId}]`;
  }
  
  msg += `: ${message}`;
  
  // Add metadata if present
  const metaKeys = Object.keys(metadata).filter(k => !["service", "level"].includes(k));
  if (metaKeys.length > 0) {
    const metaStr = metaKeys
      .map(k => `${k}=${JSON.stringify(metadata[k])}`)
      .join(" ");
    msg += ` | ${metaStr}`;
  }
  
  return msg;
});

/**
 * Generate correlation ID
 * @returns {string} Unique correlation ID
 */
export function generateCorrelationId() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  defaultMeta: { service: "miles-and-smiles" },
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    errors({ stack: true })
  ),
  transports: [],
  silent: isTest, // Disable logging in tests
});

// Console transport (always)
if (!isTest) {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      consoleFormat
    ),
  }));
}

// File transports (production only)
if (isProduction) {
  // All logs
  logger.add(new winston.transports.File({
    filename: path.join(LOG_DIR, "combined.log"),
    format: json(),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }));
  
  // Error logs
  logger.add(new winston.transports.File({
    filename: path.join(LOG_DIR, "error.log"),
    level: "error",
    format: json(),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 5,
  }));
  
  // Game event logs
  logger.add(new winston.transports.File({
    filename: path.join(LOG_DIR, "game-events.log"),
    level: "info",
    format: json(),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10,
  }));
}

/**
 * Child logger factory for specific components
 * @param {string} component - Component name
 * @returns {Object} Child logger
 */
export function createLogger(component) {
  return logger.child({ component });
}

/**
 * Request logger middleware
 * Adds correlation ID and logs requests
 */
export function requestLoggerMiddleware() {
  return (req, res, next) => {
    // Generate or use existing correlation ID
    req.correlationId = req.headers["x-correlation-id"] || generateCorrelationId();
    res.setHeader("x-correlation-id", req.correlationId);
    
    const startTime = Date.now();
    
    // Log request start
    logger.info("Request started", {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      userId: req.user?.id,
    });
    
    // Log response
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 500 ? "error" : 
                       res.statusCode >= 400 ? "warn" : "info";
      
      logger[logLevel]("Request completed", {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
      });
    });
    
    next();
  };
}

/**
 * Game event logger
 */
export const gameLogger = {
  matchStart: (data) => {
    logger.info("Match started", {
      event: "MATCH_START",
      ...data,
    });
  },
  
  matchEnd: (data) => {
    logger.info("Match ended", {
      event: "MATCH_END",
      ...data,
    });
  },
  
  move: (data) => {
    logger.debug("Game move", {
      event: "GAME_MOVE",
      ...data,
    });
  },
  
  playerJoin: (data) => {
    logger.info("Player joined", {
      event: "PLAYER_JOIN",
      ...data,
    });
  },
  
  playerLeave: (data) => {
    logger.info("Player left", {
      event: "PLAYER_LEAVE",
      ...data,
    });
  },
  
  playerReconnect: (data) => {
    logger.info("Player reconnected", {
      event: "PLAYER_RECONNECT",
      ...data,
    });
  },
  
  timeout: (data) => {
    logger.warn("Game timeout", {
      event: "GAME_TIMEOUT",
      ...data,
    });
  },
  
  error: (data) => {
    logger.error("Game error", {
      event: "GAME_ERROR",
      ...data,
    });
  },
};

/**
 * Socket event logger
 */
export const socketLogger = {
  connect: (data) => {
    logger.info("Socket connected", {
      event: "SOCKET_CONNECT",
      ...data,
    });
  },
  
  disconnect: (data) => {
    logger.info("Socket disconnected", {
      event: "SOCKET_DISCONNECT",
      ...data,
    });
  },
  
  event: (data) => {
    logger.debug("Socket event", {
      event: "SOCKET_EVENT",
      ...data,
    });
  },
  
  error: (data) => {
    logger.error("Socket error", {
      event: "SOCKET_ERROR",
      ...data,
    });
  },
};

/**
 * Auth event logger
 */
export const authLogger = {
  login: (data) => {
    logger.info("User login", {
      event: "AUTH_LOGIN",
      ...data,
    });
  },
  
  loginFailed: (data) => {
    logger.warn("Login failed", {
      event: "AUTH_LOGIN_FAILED",
      ...data,
    });
  },
  
  signup: (data) => {
    logger.info("User signup", {
      event: "AUTH_SIGNUP",
      ...data,
    });
  },
  
  logout: (data) => {
    logger.info("User logout", {
      event: "AUTH_LOGOUT",
      ...data,
    });
  },
  
  tokenRefresh: (data) => {
    logger.debug("Token refresh", {
      event: "AUTH_TOKEN_REFRESH",
      ...data,
    });
  },
  
  sessionInvalidated: (data) => {
    logger.info("Session invalidated", {
      event: "AUTH_SESSION_INVALIDATED",
      ...data,
    });
  },
};

/**
 * Error logger with stack trace
 */
export function logError(error, context = {}) {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
}

// Named export for convenience
export { logger };

export default logger;
