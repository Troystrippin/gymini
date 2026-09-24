const User = require("../models/User");
const WorkoutPlan = require("../models/WorkoutPlan");

// GET /api/admin/users
const listUsers = async (req, res, next) => {
  try {
    const { role, search, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (role && ["user", "moderator", "admin"].includes(role)) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -emailVerificationCode -passwordResetCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const planCount = await WorkoutPlan.countDocuments({ userId: user._id });

    res.json({ user, planCount });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/role → body: { role: "admin" | "moderator" | "user" }
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["user", "moderator", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent self-demotion (avoid locking yourself out)
    if (String(req.params.id) === String(req.user._id) && role !== "admin") {
      return res.status(400).json({
        message: "You cannot demote yourself. Ask another admin.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    console.log(
      `[admin] ${req.user.email} changed role of ${user.email} → ${role}`,
    );
    res.json({ message: "Role updated", user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Cascade: remove their plans
    await WorkoutPlan.deleteMany({ userId: user._id });

    console.log(`[admin] ${req.user.email} deleted user ${user.email}`);
    res.json({ message: "User deleted", userId: user._id });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stats
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