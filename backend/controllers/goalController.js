const Goal = require("../models/Goal");
const User = require("../models/User");
const WorkoutLog = require("../models/WorkoutLog");
const WeightLog = require("../models/WeightLog");

// ─── Helpers ─────────────────────────────────────────────────────

const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));

const computeProgress = async (goal, user) => {
  if (!goal) return null;

  if (goal.type === "weight") {
    const latest = await WeightLog.findOne({ userId: user._id })
      .sort({ date: -1 })
      .lean();
    const current =
      latest?.weightKg ?? user.details?.weightKg ?? null;

    if (current == null || goal.startValue == null) {
      return {
        type: "weight",
        currentValue: current,
        targetValue: goal.target,
        startValue: goal.startValue,
        progress: 0,
        label: "Log a weight to see progress",
      };
    }

    const delta = goal.startValue - current; // positive = loss
    const totalNeeded = goal.startValue - goal.target;

    // Avoid divide-by-zero if start == target.
    const rawProgress =
      totalNeeded === 0 ? 1 : delta / totalNeeded;

    return {
      type: "weight",
      currentValue: current,
      targetValue: goal.target,
      startValue: goal.startValue,
      delta,               // signed, positive = lost
      totalNeeded,         // signed, positive = need to lose
      progress: clamp(rawProgress),
      label:
        Math.abs(delta) < 0.05
          ? "No change yet"
          : delta > 0
            ? `Lost ${delta.toFixed(1)} kg`
            : `Gained ${Math.abs(delta).toFixed(1)} kg`,
    };
  }

  if (goal.type === "workout_frequency") {
    const weekStart = startOfWeek();
    const count = await WorkoutLog.countDocuments({
      userId: user._id,
      dateCompleted: { $gte: weekStart },
    });

    return {
      type: "workout_frequency",
      currentValue: count,
      targetValue: goal.target,
      startValue: null,
      delta: count,
      totalNeeded: goal.target,
      progress: clamp(count / Math.max(1, goal.target)),
      label: `${count} of ${goal.target} this week`,
    };
  }

  return null;
};

// ─── Controllers ────────────────────────────────────────────────

// POST /api/goals  { type, target, deadline? }
exports.createGoal = async (req, res, next) => {
  try {
    const { type, target, deadline } = req.body;
    if (!["weight", "workout_frequency"].includes(type)) {
      return res.status(400).json({ message: "Invalid goal type" });
    }
    const t = Number(target);
    if (!Number.isFinite(t) || t <= 0) {
      return res.status(400).json({ message: "Target must be > 0" });
    }

    const user = await User.findById(req.user._id);

    // Snapshot startValue for weight goals.
    let startValue = null;
    if (type === "weight") {
      const latest = await WeightLog.findOne({ userId: user._id })
        .sort({ date: -1 })
        .lean();
      startValue = latest?.weightKg ?? user.details?.weightKg ?? null;

      if (startValue == null) {
        return res.status(400).json({
          message:
            "Log your current weight first so we can track progress toward this goal.",
        });
      }
    }

    // Replace any existing active goal of the same type.
    await Goal.updateMany(
      { userId: user._id, type, status: "active" },
      { $set: { status: "abandoned" } },
    );

    const goal = await Goal.create({
      userId: user._id,
      type,
      target: t,
      startValue,
      deadline: deadline ? new Date(deadline) : null,
      status: "active",
    });

    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/active
exports.getActiveGoal = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const goals = await Goal.find({
      userId: user._id,
      status: "active",
    }).lean();

    const enriched = await Promise.all(
      goals.map(async (g) => {
        const progress = await computeProgress(g, user);

        // Auto-complete weight goals when target reached.
        if (
          g.type === "weight" &&
          progress &&
          progress.targetValue != null &&
          progress.currentValue != null
        ) {
          const reachedTarget =
            (g.startValue > g.target && progress.currentValue <= g.target) ||
            (g.startValue < g.target && progress.currentValue >= g.target);
          if (reachedTarget && !g.completedAt) {
            await Goal.updateOne(
              { _id: g._id },
              { $set: { status: "completed", completedAt: new Date() } },
            );
            g.status = "completed";
            g.completedAt = new Date();
          }
        }

        return { ...g, progress };
      }),
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/goals/:id  { target?, deadline? }
exports.updateGoal = async (req, res, next) => {
  try {
    const { target, deadline } = req.body;
    const update = {};
    if (target != null) {
      const t = Number(target);
      if (!Number.isFinite(t) || t <= 0) {
        return res.status(400).json({ message: "Target must be > 0" });
      }
      update.target = t;
    }
    if (deadline !== undefined) {
      update.deadline = deadline ? new Date(deadline) : null;
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json(goal);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/goals/:id  (abandon)
exports.abandonGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { status: "abandoned" } },
      { new: true },
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json({ message: "Goal abandoned", _id: goal._id });
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/milestones
exports.getMilestones = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const [totalSessions, weightLogCount, completedGoals] = await Promise.all([
      WorkoutLog.countDocuments({ userId: user._id }),
      WeightLog.countDocuments({ userId: user._id }),
      Goal.countDocuments({ userId: user._id, status: "completed" }),
    ]);

    // Compute longest streak (walk days).
    const logs = await WorkoutLog.find({ userId: user._id })
      .select("dateCompleted")
      .lean();
    const dayKeys = new Set(
      logs.map((l) => {
        const d = new Date(l.dateCompleted);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }),
    );
    const sortedDays = [...dayKeys].sort();
    let longestStreak = 0;
    let run = 0;
    let prev = null;
    for (const key of sortedDays) {
      const cur = new Date(key);
      if (prev) {
        const diffMs =
          Date.UTC(cur.getFullYear(), cur.getMonth(), cur.getDate()) -
          Date.UTC(prev.getFullYear(), prev.getMonth(), prev.getDate());
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
        run = days === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prev = cur;
    }

    // Weight progress — derive from earliest vs latest WeightLog.
    // user.details.weightKg is overwritten on every log, so it can't
    // be used as the "start" value. There is no initialWeightKg field
    // on the User model — the earliest WeightLog IS the baseline.
    const [earliestLog, latestLog] = await Promise.all([
      WeightLog.findOne({ userId: user._id }).sort({ date: 1 }).lean(),
      WeightLog.findOne({ userId: user._id }).sort({ date: -1 }).lean(),
    ]);
    const startWeight =
      earliestLog?.weightKg ?? user.details?.weightKg ?? null;
    const currentWeight =
      latestLog?.weightKg ?? user.details?.weightKg ?? null;
    const kgLost =
      startWeight != null && currentWeight != null
        ? startWeight - currentWeight
        : 0;

    const MILESTONES = [
      {
        id: "first-workout",
        label: "First Workout",
        emoji: "🔥",
        unlocked: totalSessions >= 1,
        description: "Complete your first workout",
      },
      {
        id: "streak-3",
        label: "3-Day Streak",
        emoji: "⚡",
        unlocked: longestStreak >= 3,
        description: "Work out 3 days in a row",
      },
      {
        id: "streak-7",
        label: "7-Day Streak",
        emoji: "💪",
        unlocked: longestStreak >= 7,
        description: "Work out 7 days in a row",
      },
      {
        id: "streak-30",
        label: "30-Day Streak",
        emoji: "🏆",
        unlocked: longestStreak >= 30,
        description: "Work out 30 days in a row",
      },
      {
        id: "workouts-10",
        label: "10 Workouts",
        emoji: "🥉",
        unlocked: totalSessions >= 10,
        description: "Complete 10 workouts",
      },
      {
        id: "workouts-50",
        label: "50 Workouts",
        emoji: "🥇",
        unlocked: totalSessions >= 50,
        description: "Complete 50 workouts",
      },
      {
        id: "weight-logged",
        label: "First Weigh-In",
        emoji: "⚖️",
        unlocked: weightLogCount >= 1,
        description: "Log your first weight",
      },
      {
        id: "weight-1kg",
        label: "1 kg Lost",
        emoji: "🎯",
        unlocked: kgLost >= 1,
        description: "Lose 1 kg from your starting weight",
      },
      {
        id: "weight-5kg",
        label: "5 kg Lost",
        emoji: "🌟",
        unlocked: kgLost >= 5,
        description: "Lose 5 kg from your starting weight",
      },
      {
        id: "goal-complete",
        label: "Goal Crusher",
        emoji: "🎉",
        unlocked: completedGoals >= 1,
        description: "Complete a goal",
      },
    ];

    res.json(MILESTONES);
  } catch (err) {
    next(err);
  }
};