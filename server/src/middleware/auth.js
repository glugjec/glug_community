import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export function signToken(user) {
  const secret = process.env.JWT_SECRET || "glug-secret-key-development";
  const id = user.id || user._id?.toString();
  return jwt.sign(
    { id, username: user.username, role: user.role || "student" },
    secret,
    { expiresIn: "7d" }
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const secret = process.env.JWT_SECRET || "glug-secret-key-development";
  try {
    const decoded = jwt.verify(header.slice(7), secret);
    req.user = decoded;

    // Check user ban status in database
    const dbUser = await User.findById(decoded.id).select("isBanned banReason banExpiresAt role");
    if (!dbUser) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user.role = dbUser.role || decoded.role;

    if (dbUser.isBanned) {
      // Check if temporary ban has expired
      if (dbUser.banExpiresAt && new Date(dbUser.banExpiresAt) <= new Date()) {
        dbUser.isBanned = false;
        dbUser.banReason = "";
        dbUser.banExpiresAt = null;
        await dbUser.save();
      } else {
        return res.status(403).json({
          error: "Your account has been suspended",
          isBanned: true,
          banReason: dbUser.banReason || "Violation of community guidelines",
          banExpiresAt: dbUser.banExpiresAt,
        });
      }
    }

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const secret = process.env.JWT_SECRET || "glug-secret-key-development";
    try {
      const decoded = jwt.verify(header.slice(7), secret);
      req.user = decoded;
      const dbUser = await User.findById(decoded.id).select("isBanned banReason banExpiresAt role");
      if (dbUser) {
        req.user.role = dbUser.role || decoded.role;
        if (dbUser.isBanned) {
          if (dbUser.banExpiresAt && new Date(dbUser.banExpiresAt) <= new Date()) {
            dbUser.isBanned = false;
            dbUser.banReason = "";
            dbUser.banExpiresAt = null;
            await dbUser.save();
            req.user.isBanned = false;
          } else {
            // Treat as unauthenticated for optional auth if banned
            req.user = null;
            // Mark user as banned on req.user for read checks without losing identity
            req.user.isBanned = true;
          }
        } else {
          req.user.isBanned = false;
        }
      }
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator access required" });
  }
  next();
}
