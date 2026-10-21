const WorkoutLog = require("../models/WorkoutLog");
const WeightLog = require("../models/WeightLog");
const WorkoutPlan = require("../models/WorkoutPlan");
const { estimateCalories } = require("../utils/calorieEstimate");

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

exports.getProgressAnalytics = async (req, res, next) => {
  try {
    const user = req.user;
    const heightCm = user?.details?.heightCm || null;
    const currentWeightKg = user?.details?.weightKg || null;

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceKey = dayKey(since);

    const weightLogs = await WeightLog.find({
      userId: user._id,
      date: { $gte: sinceKey },
    })
      .sort({ date: 1 })
      .lean();

    const weightSeries =
      weightLogs.length > 0
        ? weightLogs.map((l) => ({ date: l.date, weightKg: l.weightKg }))
        : currentWeightKg
          ? [{ date: sinceKey, weightKg: currentWeightKg }]
          : [];

    const bmiSeries = heightCm
      ? weightSeries.map((p) => ({
          date: p.date,
          bmi: +(p.weightKg / (heightCm / 100) ** 2).toFixed(1),
        }))
      : [];

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

    const now = new Date();
    const localMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const timezoneOffsetMs = localMonthStart.getTimezoneOffset() * 60000;
    const monthStart = new Date(localMonthStart.getTime() - timezoneOffsetMs);

    const thisMonthLogs = logs.filter(
      (l) => new Date(l.dateCompleted) >= monthStart,
    );
    const workoutsThisMonth = thisMonthLogs.length;
    const caloriesThisMonth = thisMonthLogs.reduce(
      (sum, l) => sum + estimateCalories(l, currentWeightKg),
      0,
    );

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
      weightSeries,
      bmiSeries,
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

exports.getHomeAnalytics = async (req, res, next) => {
  try {
    const user = req.user;

    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0,
    );
    const timezoneOffsetMs = startOfToday.getTimezoneOffset() * 60000;
    const localStartOfToday = new Date(
      startOfToday.getTime() - timezoneOffsetMs,
    );

    const todayLogs = await WorkoutLog.find({
      userId: user._id,
      dateCompleted: { $gte: localStartOfToday },
    })
      .select("durationSec planName completedExercises totalExercises")
      .lean();

    const todayWorkoutCount = todayLogs.length;
    const todayCalories = todayLogs.reduce(
      (sum, l) => sum + estimateCalories(l, user?.details?.weightKg),
      0,
    );

    const allLogs = await WorkoutLog.find({ userId: user._id })
      .sort({ dateCompleted: -1 })
      .select("dateCompleted durationSec planName completedExercises")
      .lean();

    const dayKeys = new Set(
      allLogs.map((l) => dayKey(new Date(l.dateCompleted))),
    );

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
