import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Provide a fallback secret for tests when `JWT_SECRET` isn't set.
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is not set; using fallback secret (test mode)');
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid token user." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
}

