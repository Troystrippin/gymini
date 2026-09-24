const WorkoutPlan = require("../models/WorkoutPlan");
const WorkoutLog = require("../models/WorkoutLog");
const Exercise = require("../models/Exercise"); // registers schema

// ──────────────────────────────────────────────────────────────
// EXISTING — today's workout + toggle
// ──────────────────────────────────────────────────────────────

// @desc    Get the user's active workout plan (used as "today's workout")
// @route   GET /api/workouts/today
const getTodayWorkout = async (req, res) => {
  try {
    const plan = req.user.activePlanId
      ? await WorkoutPlan.findOne({
          _id: req.user.activePlanId,
          userId: req.user._id,
        })
      : await WorkoutPlan.findOne({ userId: req.user._id }).sort({
          createdAt: -1,
        });

    if (!plan) {
      return res.status(404).json({ message: "No workout plan found" });
    }

    const formatted = {
      _id: plan._id,
      title: plan.name,
      emoji: getEmojiForPlan(plan.name),
      exercises: plan.exercises.map((ex) => ({
        _id: ex._id.toString(),
        name: ex.name,
        muscle: ex.muscleGroup,
        sets: `${ex.sets}×${ex.reps}`,
        plannedSets: ex.sets,
        plannedReps: ex.reps,
        done: false, // session-local; reset each day
      })),
    };

    res.json(formatted);
  } catch (error) {
    console.error("getTodayWorkout:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle an exercise's completed status (session-local only)
// @route   PATCH /api/workouts/:planId/exercises/:exerciseId
// NOTE: This no longer persists onto the plan. `completed` is a session
// flag. Real persistence happens on POST /api/workouts/sessions.
const toggleExercise = async (req, res) => {
  // Kept for backwards-compat with the mobile app.
  // Returns the toggled value without writing anything to the DB.
  res.json({ _id: req.params.exerciseId, done: true });
};

// ──────────────────────────────────────────────────────────────
// NEW — Phase 2.3 endpoints
// ──────────────────────────────────────────────────────────────

// @desc    Save a completed session
// @route   POST /api/workouts/sessions
// @body    { planId, planName, startedAt, durationSec, exercises: [...] }
const saveSession = async (req, res) => {
  try {
    const {
      planId,
      planName,
      startedAt,
      durationSec = 0,
      exercises = [],
    } = req.body;

    if (!planName || !exercises.length) {
      return res
        .status(400)
        .json({ message: "planName and exercises are required" });
    }

    // Normalize + snapshot exercise names so history survives catalog edits.
    const normalized = await Promise.all(
      exercises.map(async (ex) => {
        const sets = Array.isArray(ex.sets)
          ? ex.sets
              .map((s) => ({
                reps: Math.max(0, Number(s.reps) || 0),
                weightKg: Math.max(0, Number(s.weightKg) || 0),
              }))
              .filter((s) => s.reps > 0 || s.weightKg > 0)
          : [];

        const setsCompleted = sets.length;
        const repsCompleted = sets.reduce((sum, s) => sum + s.reps, 0);

        // Resolve name/muscle from catalog if not provided.
        let name = ex.name;
        let muscleGroup = ex.muscleGroup || null;
        if (!name && ex.exerciseId) {
          const found = await Exercise.findById(ex.exerciseId).select(
            "name muscleGroup",
          );
          if (found) {
            name = found.name;
            muscleGroup = muscleGroup || found.muscleGroup;
          }
        }

        return {
          exerciseId: ex.exerciseId || null,
          name: name || "Unknown exercise",
          muscleGroup,
          targetSets: Number(ex.targetSets) || 0,
          targetReps: Number(ex.targetReps) || 0,
          setsCompleted,
          repsCompleted,
          sets,
          completed: !!ex.completed,
        };
      }),
    );

    const log = await WorkoutLog.create({
      userId: req.user._id,
      planId: planId || null,
      planName: planName.trim(),
      startedAt: startedAt ? new Date(startedAt) : null,
      dateCompleted: new Date(),
      durationSec: Math.max(0, Number(durationSec) || 0),
      exercisesPerformed: normalized,
      totalExercises: normalized.length,
      completedExercises: normalized.filter((e) => e.completed).length,
    });

    console.log(
      `[workout] saved session user=${req.user._id} log=${log._id} exercises=${normalized.length}`,
    );

    res.status(201).json(log);
  } catch (error) {
    console.error("saveSession:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    List session history (paginated)
// @route   GET /api/workouts/history?page=1&limit=20
const getHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      WorkoutLog.find({ userId: req.user._id })
        .sort({ dateCompleted: -1 })
        .skip(skip)
        .limit(limit),
      WorkoutLog.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("getHistory:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Aggregate stats + streak
// @route   GET /api/workouts/stats
const getStats = async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ userId: req.user._id })
      .sort({ dateCompleted: -1 })
      .select("dateCompleted durationSec completedExercises");

    const totalSessions = logs.length;
    const totalMinutes = Math.round(
      logs.reduce((sum, l) => sum + (l.durationSec || 0), 0) / 60,
    );
    const totalExercises = logs.reduce(
      (sum, l) => sum + (l.completedExercises || 0),
      0,
    );

    // ── Streak: consecutive days (allowing today or yesterday as anchor)
    const dayKeys = new Set(
      logs.map((l) => toDayKey(new Date(l.dateCompleted))),
    );

    const today = new Date();
    const todayKey = toDayKey(today);
    const yesterdayKey = toDayKey(addDays(today, -1));

    let anchor = null;
    if (dayKeys.has(todayKey)) anchor = today;
    else if (dayKeys.has(yesterdayKey)) anchor = addDays(today, -1);

    let currentStreak = 0;
    if (anchor) {
      let cursor = anchor;
      while (dayKeys.has(toDayKey(cursor))) {
        currentStreak += 1;
        cursor = addDays(cursor, -1);
      }
    }

    // Longest streak — walk all days in order
    const sortedDays = [...dayKeys].sort();
    let longestStreak = 0;
    let run = 0;
    let prev = null;
    for (const key of sortedDays) {
      const cur = new Date(key);
      if (prev && daysBetween(prev, cur) === 1) {
        run += 1;
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prev = cur;
    }

    // Sessions this week (Mon–Sun)
    const weekStart = startOfWeek(today);
    const thisWeekSessions = logs.filter(
      (l) => new Date(l.dateCompleted) >= weekStart,
    ).length;

    res.json({
      totalSessions,
      totalMinutes,
      totalExercises,
      currentStreak,
      longestStreak,
      thisWeekSessions,
      lastSessionAt: logs[0]?.dateCompleted || null,
    });
  } catch (error) {
    console.error("getStats:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function getEmojiForPlan(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("leg")) return "🦵";
  if (lower.includes("push") || lower.includes("chest")) return "💪";
  if (lower.includes("pull") || lower.includes("back")) return "🔙";
  if (lower.includes("cardio")) return "🏃";
  if (lower.includes("core") || lower.includes("abs")) return "🔥";
  return "🏋️";
}

function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function daysBetween(a, b) {
  const ms = 1000 * 60 * 60 * 24;
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bUTC - aUTC) / ms);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

module.exports = {
  getTodayWorkout,
  toggleExercise,
  saveSession,
  getHistory,
  getStats,
};