const UserActivity = require("../models/UserActivity");

const logUserAction = async (req, action, metadata = null) => {
  try {
    if (!req.user) return; // Only log if a user is authenticated

    await UserActivity.create({
      userId: req.user._id,
      userEmail: req.user.email,
      action,
      metadata,
      ip: req.ip || null,
    });
  } catch (err) {
    console.error("[userActivityLog] failed:", err.message);
  }
};

module.exports = { logUserAction };