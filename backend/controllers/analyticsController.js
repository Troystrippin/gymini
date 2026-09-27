const WorkoutLog = require("../models/WorkoutLog");
const WeightLog = require("../models/WeightLog");
const WorkoutPlan = require("../models/WorkoutPlan");
const { estimateCalories } = require("../utils/calorieEstimate");

// ─── Helpers ────────────────────────────────────────────────────

const dayKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const monthKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const bmiCategory = (bmi) => {
  if (!bmi) return null;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 40) return "Obese";
  return "Morbidly Obese";
};

// ─── GET /api/analytics/progress ────────────────────────────────
// Returns everything ProgressScreen needs in one request.
exports.getProgressAnalytics = async (req, res, next) => {
  try {
    const user = req.user;
    const heightCm = user?.details?.heightCm || null;
    const currentWeightKg = user?.details?.weightKg || null;

    // ── Weight history: last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceKey = dayKey(since);

    const weightLogs = await WeightLog.find({
      userId: user._id,
      date: { $gte: sinceKey },
    })
      .sort({ date: 1 })
      .lean();

    // Seed with initial weight (onboarding) if no logs exist yet
    const weightSeries =
      weightLogs.length > 0
        ? weightLogs.map((l) => ({ date: l.date, weightKg: l.weightKg }))
        : currentWeightKg
          ? [{ date: sinceKey, weightKg: currentWeightKg }]
          : [];

    // BMI trend computed from weight series
    const bmiSeries = heightCm
      ? weightSeries.map((p) => ({
          date: p.date,
          bmi: +(p.weightKg / (heightCm / 100) ** 2).toFixed(1),
        }))
      : [];

    // ── Workout + calorie history: last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const logs = await WorkoutLog.find({
      userId: user._id,
      dateCompleted: { $gte: sixMonthsAgo },
    })
      .select("dateCompleted durationSec planName completedExercises")
      .lean();

    // Bucket by month
    const monthBuckets = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = monthKey(d);
      monthBuckets[key] = {
        key,
        label: MONTH_LABELS[d.getMonth()],
        workouts: 0,
        calories: 0,
      };
    }

    let totalCalories = 0;
    for (const log of logs) {
      const d = new Date(log.dateCompleted);
      const key = monthKey(d);
      if (!monthBuckets[key]) continue;

      const kcal = estimateCalories(log, currentWeightKg);
      monthBuckets[key].workouts += 1;
      monthBuckets[key].calories += kcal;
      totalCalories += kcal;
    }

    const monthOrder = Object.keys(monthBuckets).sort();

    // ── Summary stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthLogs = logs.filter(
      (l) => new Date(l.dateCompleted) >= monthStart,
    );
    const workoutsThisMonth = thisMonthLogs.length;
    const caloriesThisMonth = thisMonthLogs.reduce(
      (sum, l) => sum + estimateCalories(l, currentWeightKg),
      0,
    );

    // ── Weight delta
    const initialWeight = user?.details?.weightKg || null;
    const firstLog = weightSeries[0];
    const lastLog = weightSeries[weightSeries.length - 1];

    let weightChange = null;
    if (firstLog && lastLog) {
      weightChange = +(lastLog.weightKg - firstLog.weightKg).toFixed(1);
    }

    const latestBmi = bmiSeries.length
      ? bmiSeries[bmiSeries.length - 1].bmi
      : heightCm && currentWeightKg
        ? +(currentWeightKg / (heightCm / 100) ** 2).toFixed(1)
        : null;

    res.json({
      summary: {
        currentWeightKg,
        heightCm,
        latestBmi,
        bmiCategory: bmiCategory(latestBmi),
        weightChange30d: weightChange,
        workoutsThisMonth,
        caloriesThisMonth,
        totalCalories6mo: totalCalories,
      },
      weightSeries, // [{ date, weightKg }]
      bmiSeries, // [{ date, bmi }]
      workoutsByMonth: monthOrder.map((k) => ({
        label: monthBuckets[k].label,
        value: monthBuckets[k].workouts,
      })),
      caloriesByMonth: monthOrder.map((k) => ({
        label: monthBuckets[k].label,
        value: monthBuckets[k].calories,
      })),
    });
  } catch (err) {
    console.error("getProgressAnalytics:", err.message);
    next(err);
  }
};

// ─── GET /api/analytics/home ────────────────────────────────────
// Returns home-screen summary: today's workouts, streak, weekly calories,
// and a snapshot of the active plan's completion progress.
exports.getHomeAnalytics = async (req, res, next) => {
  try {
    const user = req.user;

    // ── Today's completed workouts
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayLogs = await WorkoutLog.find({
      userId: user._id,
      dateCompleted: { $gte: startOfToday },
    })
      .select("durationSec planName completedExercises totalExercises")
      .lean();

    const todayWorkoutCount = todayLogs.length;
    const todayCalories = todayLogs.reduce(
      (sum, l) => sum + estimateCalories(l, user?.details?.weightKg),
      0,
    );

    // ── Weekly streak (already computed in workoutController.getStats)
    // Reuse the same logic so Home and Progress agree.
    const allLogs = await WorkoutLog.find({ userId: user._id })
      .sort({ dateCompleted: -1 })
      .select("dateCompleted durationSec planName completedExercises")
      .lean();

    const dayKeys = new Set(
      allLogs.map((l) => dayKey(new Date(l.dateCompleted))),
    );

    const today = new Date();
    const todayK = dayKey(today);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayK = dayKey(yesterday);

    let anchor = null;
    if (dayKeys.has(todayK)) anchor = today;
    else if (dayKeys.has(yesterdayK)) anchor = yesterday;

    let currentStreak = 0;
    if (anchor) {
      let cursor = new Date(anchor);
      while (dayKeys.has(dayKey(cursor))) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // ── Weekly calories (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const weekLogs = allLogs.filter(
      (l) => new Date(l.dateCompleted) >= weekAgo,
    );
    const caloriesThisWeek = weekLogs.reduce(
      (sum, l) => sum + estimateCalories(l, user?.details?.weightKg),
      0,
    );

    // ── Active plan snapshot
    let activePlan = null;
    if (user.activePlanId) {
      const plan = await WorkoutPlan.findOne({
        _id: user.activePlanId,
        userId: user._id,
      }).lean();
      if (plan) {
        activePlan = {
          _id: plan._id,
          name: plan.name,
          totalExercises: plan.exercises.length,
        };
      }
    }

    res.json({
      todayWorkoutCount,
      todayCalories,
      currentStreak,
      caloriesThisWeek,
      weekWorkoutCount: weekLogs.length,
      activePlan,
    });
  } catch (err) {
    console.error("getHomeAnalytics:", err.message);
    next(err);
  }
};