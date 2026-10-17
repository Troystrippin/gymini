const mongoose = require("mongoose");
const AdminLog = require("../models/AdminLog");
const UserActivity = require("../models/UserActivity");

const MAX_LIMIT = 100;
const MAX_SKIP = 10000;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/logs
const listLogs = async (req, res, next) => {
  try {
    const {
      action,
      targetType,
      search,
      from,
      to,
      page: rawPage = 1,
      limit: rawLimit = 50,
    } = req.query;

    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(rawLimit) || 50));
    const page = Math.max(1, Number(rawPage) || 1);
    const skip = Math.min(MAX_SKIP, (page - 1) * limit);

    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = toDate;
      }
    }

    // --- 1. Query Admin Logs ---
    const adminFilter = { ...dateFilter };
    if (action) adminFilter.action = action;
    if (search) {
      const safe = escapeRegex(search);
      adminFilter.$or = [
        { adminEmail: { $regex: safe, $options: "i" } },
        { targetLabel: { $regex: safe, $options: "i" } },
        { action: { $regex: safe, $options: "i" } },
      ];
    }

    // --- 2. Query User Logs ---
    const userFilter = { ...dateFilter };
    if (action) userFilter.action = action;
    if (search) {
      const safe = escapeRegex(search);
      userFilter.$or = [
        { userEmail: { $regex: safe, $options: "i" } },
        { action: { $regex: safe, $options: "i" } },
      ];
    }

    const isAdminAction = !action || (!action.startsWith("user.") || action === "user.role_change" || action === "user.delete") && !action.startsWith("plan.") && !action.startsWith("workout.") && !action.startsWith("meal_plan.");
    const isUserAction = !action || (action.startsWith("user.") && action !== "user.role_change" && action !== "user.delete") || action.startsWith("plan.") || action.startsWith("workout.") || action.startsWith("meal_plan.");

    let adminLogs = [];
    let userLogs = [];

    if (isAdminAction) {
      adminLogs = await AdminLog.find(adminFilter).lean();
    }
    if (isUserAction) {
      userLogs = await UserActivity.find(userFilter).lean();
    }

    // --- 3. Merge and Sort ---
    const normalizedUserLogs = userLogs.map(log => ({
      _id: log._id,
      createdAt: log.createdAt,
      adminEmail: log.userEmail, 
      action: log.action,
      targetType: "user_action",
      targetLabel: log.userEmail,
      metadata: log.metadata,
      isUserLog: true,
    }));

    let allLogs = [...adminLogs, ...normalizedUserLogs];
    allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter by targetType if requested
    if (targetType) {
      allLogs = allLogs.filter(l => l.targetType === targetType);
    }

    const total = allLogs.length;
    const paginatedLogs = allLogs.slice(skip, skip + limit);

    // Populate admin details
    const populatedLogs = await Promise.all(
      paginatedLogs.map(async (log) => {
        if (log.isUserLog) return log;
        const adminUser = await mongoose.model("User").findById(log.adminId).select("fullName email").lean();
        return { ...log, adminId: adminUser };
      })
    );

    res.json({ logs: populatedLogs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/logs/filters
const getLogFilters = async (req, res, next) => {
  try {
    const [adminActions, userActions] = await Promise.all([
      AdminLog.distinct("action"),
      UserActivity.distinct("action"),
    ]);

    const actions = [...new Set([...adminActions, ...userActions])].sort();

    res.json({
      actions,
      targetTypes: ["exercise", "user", "meal", "user_action"],
      admins: [], 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listLogs, getLogFilters };