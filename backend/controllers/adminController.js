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
const Exercise = require("../models/Exercise");

const MAX_PAGE_LIMIT = 100;
const MAX_SKIP = 10000;
const ALLOWED_ROLES = ["user", "admin"];

const escapeRegex = (s) =>
  String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SENSITIVE_USER_FIELDS =
  "-password -emailVerificationCode -emailVerificationExpires " +
  "-passwordResetCode -passwordResetExpires " +
  "-failedLoginAttempts -lockoutUntil";

// ─── GET /api/admin/users ────────────────────────────────────
const listUsers = async (req, res, next) => {
  try {
    const {
      role,
      search,
      limit: rawLimit = 50,
      page: rawPage = 1,
    } = req.query;

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

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(SENSITIVE_USER_FIELDS)
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

// ─── GET /api/admin/users/:id ────────────────────────────────
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

// ─── PUT /api/admin/users/:id/role ───────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Role must be user or admin" });
    }

    if (String(req.params.id) === String(req.user._id) && role !== "admin") {
      return res
        .status(400)
        .json({ message: "You cannot demote yourself." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    ).select(SENSITIVE_USER_FIELDS);

    if (!user) return res.status(404).json({ message: "User not found" });

    console.log(
      `[admin] ${req.user.email} changed role of ${user.email} → ${role}`,
    );

    res.json({ message: "Role updated", user });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/admin/users/:id ─────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const results = await Promise.all([
      WorkoutPlan.deleteMany({ userId: user._id }),
      WorkoutLog.deleteMany({ userId: user._id }),
      WorkoutProgress.deleteMany({ userId: user._id }),
      WeightLog.deleteMany({ userId: user._id }),
      MealPlan.deleteMany({ user: user._id }),
      MealLog.deleteMany({ userId: user._id }),
      Goal.deleteMany({ userId: user._id }),
      FavoriteExercise.deleteMany({ userId: user._id }),
      RefreshToken.deleteMany({ userId: user._id }),
      Exercise.deleteMany({ createdBy: user._id }),
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

    res.json({
      message: "User deleted",
      userId: user._id,
      cascade: summary,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/stats ────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalAdmins, totalPlans] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      WorkoutPlan.countDocuments(),
    ]);

    res.json({
      totalUsers,
      totalAdmins,
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