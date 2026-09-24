const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─────────────────────────────────────────────────────────────
// Authentication: verifies JWT and attaches req.user
// ─────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user missing" });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Not authorized" });
  }
};

// ─────────────────────────────────────────────────────────────
// Authorization: role-based access control
// Must be used AFTER protect.
// ─────────────────────────────────────────────────────────────

// Role hierarchy for rank-based checks
const ROLE_RANK = {
  user: 1,
  moderator: 2,
  admin: 3,
};

/**
 * Authorize by exact role match:
 *   authorize("admin")
 *   authorize("admin", "moderator")
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const userRole = req.user.role || "user";

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Forbidden: requires role ${allowedRoles.join(" or ")}`,
        yourRole: userRole,
      });
    }

    next();
  };
};

/**
 * Authorize by minimum rank (hierarchical):
 *   authorizeAtLeast("moderator")  → moderator + admin
 *   authorizeAtLeast("admin")      → only admin
 */
const authorizeAtLeast = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const userRank = ROLE_RANK[req.user.role] || 0;
    const requiredRank = ROLE_RANK[minimumRole] || 0;

    if (userRank < requiredRank) {
      return res.status(403).json({
        message: `Forbidden: requires ${minimumRole} or higher`,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

// Convenience shortcuts
const adminOnly = authorize("admin");
const moderatorOrAdmin = authorize("moderator", "admin");

module.exports = {
  protect,
  authorize,
  authorizeAtLeast,
  adminOnly,
  moderatorOrAdmin,
};