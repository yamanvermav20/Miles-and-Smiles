import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is not set");
  process.exit(1);
}

// Socket authentication middleware
export default function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    console.error("❌ Socket auth failed: No token provided");
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    console.log(`✅ Socket authenticated: ${decoded.username} (${decoded.id})`);
    next();
  } catch (err) {
    console.error("❌ Socket auth failed: Invalid token", err.message);
    return next(new Error("Authentication error: Invalid token"));
  }
}

