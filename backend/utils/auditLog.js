const AdminLog = require("../models/AdminLog");

/**
 * Fire-and-forget admin action logger.
 * Never throws — logging failures must not break the actual admin action.
 */
const logAdminAction = async (
  req,
  { action, targetType, targetId = null, targetLabel = null, metadata = null },
) => {
  try {
    await AdminLog.create({
      adminId: req.user?._id || null,
      adminEmail: req.user?.email || "unknown",
      action,
      targetType,
      targetId: targetId || null,
      targetLabel: targetLabel || null,
      metadata: metadata || null,
      ip: req.ip || null,
    });
  } catch (err) {
    console.error("[auditLog] failed:", err.message);
  }
};

module.exports = { logAdminAction };