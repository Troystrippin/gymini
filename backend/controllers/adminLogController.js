const mongoose = require("mongoose");
const AdminLog = require("../models/AdminLog");

const MAX_LIMIT = 100;
const MAX_SKIP = 10000;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/logs
const listLogs = async (req, res, next) => {
  try {
    const {
      action,
      targetType,
      adminId,
      search,
      from,
      to,
      page: rawPage = 1,
      limit: rawLimit = 50,
    } = req.query;

    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(rawLimit) || 50));
    const page = Math.max(1, Number(rawPage) || 1);
    const skip = Math.min(MAX_SKIP, (page - 1) * limit);

    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      filter.adminId = adminId;
    }

    // Date range
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { adminEmail: { $regex: safe, $options: "i" } },
        { targetLabel: { $regex: safe, $options: "i" } },
        { action: { $regex: safe, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      AdminLog.find(filter)
        .populate("adminId", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/logs/filters
// Returns the distinct set of actions and target types present in the log,
// plus the list of admins who have performed actions.
const getLogFilters = async (req, res, next) => {
  try {
    const [actions, targetTypes, adminAgg] = await Promise.all([
      AdminLog.distinct("action"),
      AdminLog.distinct("targetType"),
      AdminLog.aggregate([
        {
          $group: {
            _id: "$adminId",
            email: { $first: "$adminEmail" },
          },
        },
        { $limit: 200 },
      ]),
    ]);

    res.json({
      actions: actions.sort(),
      targetTypes: targetTypes.sort(),
      admins: adminAgg.map((a) => ({
        _id: a._id,
        email: a.email,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listLogs, getLogFilters };