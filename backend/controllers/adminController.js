const User = require("../models/User");
const WorkoutPlan = require("../models/WorkoutPlan");
const WorkoutLog = require("../models/WorkoutLog");
const WorkoutProgress = require("../models/WorkoutProgress");
const WeightLog = require("../models/WeightLog");
const MealPlan = require("../models/MealPlan");
const MealLog = require("../models/MealLog");
const Goal = require("../models/Goal");
const FavoriteExercise = require("../models/FavoriteExercise");
const RefreshToken = require("../models/RefreshToken");

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const MAX_PAGE_LIMIT = 100;
const MAX_SKIP = 10000;
const ALLOWED_ROLES = ["user", "moderator", "admin"];

// Escape user-supplied regex input so it can't inject metacharacters
// or trigger catastrophic backtracking on the users collection.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Fields that must never leave the API — auth internals, recovery codes,
// and lockout state.
const SENSITIVE_USER_FIELDS =
  "-password -emailVerificationCode -emailVerificationExpires " +
  "-passwordResetCode -passwordResetExpires " +
  "-failedLoginAttempts -lockoutUntil";

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users
// Moderator + Admin. Paginated, filtered, role-scoped projection.
// ─────────────────────────────────────────────────────────────
const listUsers = async (req, res, next) => {
  try {
    const {
      role,
      search,
      limit: rawLimit = 50,
      page: rawPage = 1,
    } = req.query;

    // Clamp pagination — prevents full-collection scans / PII dumps.
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, Number(rawLimit) || 50),
    );
    const page = Math.max(1, Number(rawPage) || 1);
    const skip = Math.min(MAX_SKIP, (page - 1) * limit);

    const filter = {};
    if (role && ALLOWED_ROLES.includes(role)) {
      filter.role = role;
    }
    if (search) {
      const safe = escapeRegex(String(search));
      filter.$or = [
        { email: { $regex: safe, $options: "i" } },
        { fullName: { $regex: safe, $options: "i" } },
      ];
    }

    // Role-scoped projection: moderators get only the minimum needed
    // to identify a user; admins get the full profile minus secrets.
    const isAdmin = req.user.role === "admin";
    const projection = isAdmin
      ? SENSITIVE_USER_FIELDS
      : "_id fullName email role createdAt emailVerified";

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
// Admin only. Strips auth internals from the response.
// ─────────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select(SENSITIVE_USER_FIELDS)
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [planCount, favoriteCount] = await Promise.all([
      WorkoutPlan.countDocuments({ userId: user._id }),
      FavoriteExercise.countDocuments({ userId: user._id }),
    ]);

    res.json({ user, planCount, favoriteCount });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/role
// Admin only. Body: { role: "user" | "moderator" | "admin" }
//
// NOTE: Bumping tokenVersion here is a placeholder — wire it up once
// you add `tokenVersion` to the User schema (see Phase 1 patch list).
// ─────────────────────────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent self-demotion (avoid locking yourself out).
    if (String(req.params.id) === String(req.user._id) && role !== "admin") {
      return res.status(400).json({
        message: "You cannot demote yourself. Ask another admin.",
      });
    }

    const update = { role };
    // Uncomment when tokenVersion is added to the User schema:
    // update.$inc = { tokenVersion: 1 };

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select(SENSITIVE_USER_FIELDS);

    if (!user) return res.status(404).json({ message: "User not found" });

    console.log(
      `[admin] ${req.user.email} changed role of ${user.email} → ${role}`,
    );

    // TODO (Phase 1 / R): write to AuditLog collection here.
    // await AuditLog.create({
    //   actorId: req.user._id,
    //   actorRole: req.user.role,
    //   action: "user.role.update",
    //   targetType: "User",
    //   targetId: user._id,
    //   after: { role },
    //   ip: req.ip,
    //   userAgent: req.headers["user-agent"],
    // });

    res.json({ message: "Role updated", user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// Admin only. Full cascade across every user-owned collection.
// ─────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ── Cascade ───────────────────────────────────────────────
    // Runs in parallel. Each collection scoped by userId (or `user`
    // where the model uses that field name). If any delete fails,
    // Promise.all rejects and the error handler returns 500 — the
    // user doc is already gone, so a retry is safe.
    const results = await Promise.all([
      WorkoutPlan.deleteMany({ userId: user._id }),
      WorkoutLog.deleteMany({ userId: user._id }),
      WorkoutProgress.deleteMany({ userId: user._id }),
      WeightLog.deleteMany({ userId: user._id }),
      MealPlan.deleteMany({ user: user._id }), // NOTE: field is `user`, not `userId`
      MealLog.deleteMany({ userId: user._id }),
      Goal.deleteMany({ userId: user._id }),
      FavoriteExercise.deleteMany({ userId: user._id }),
      RefreshToken.deleteMany({ userId: user._id }),
      // Custom exercises created by this user. Their refs inside
      // other users' plans are snapshotted by name, so deletion is safe.
      require("../models/Exercise").deleteMany({ createdBy: user._id }),
    ]);

    const summary = {
      workoutPlans: results[0].deletedCount,
      workoutLogs: results[1].deletedCount,
      workoutProgress: results[2].deletedCount,
      weightLogs: results[3].deletedCount,
      mealPlans: results[4].deletedCount,
      mealLogs: results[5].deletedCount,
      goals: results[6].deletedCount,
      favoriteExercises: results[7].deletedCount,
      refreshTokens: results[8].deletedCount,
      customExercises: results[9].deletedCount,
    };

    console.log(
      `[admin] ${req.user.email} deleted user ${user.email}`,
      summary,
    );

    // TODO (Phase 1 / R): write to AuditLog collection here too.

    res.json({
      message: "User deleted",
      userId: user._id,
      cascade: summary,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Moderator + Admin. Aggregate counters for the dashboard.
// ─────────────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalAdmins, totalModerators, totalPlans] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "moderator" }),
        WorkoutPlan.countDocuments(),
      ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalModerators,
      totalPlans,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getStats,
};