const User = require("../models/User");
const WorkoutLog = require("../models/WorkoutLog");
const WorkoutPlan = require("../models/WorkoutPlan");
const WeightLog = require("../models/WeightLog");
const MealPlan = require("../models/MealPlan");
const FavoriteExercise = require("../models/FavoriteExercise");
const Exercise = require("../models/Exercise");

// ─── Helpers ─────────────────────────────────────────────────

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, delta) => {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
};

const dayKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Build a dense array of the last N day keys (oldest → newest).
const lastNDays = (n) => {
  const days = [];
  const today = startOfDay();
  for (let i = n - 1; i >= 0; i--) {
    days.push(dayKey(addDays(today, -i)));
  }
  return days;
};

const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── GET /api/admin/analytics ────────────────────────────────
// Moderator + Admin. Read-only aggregate metrics for the dashboard.
const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = startOfDay();
    const weekStart = startOfWeek();
    const thirtyDaysAgo = addDays(todayStart, -29); // inclusive of today
    const sevenDaysAgo = addDays(todayStart, -6);

    // ── Growth ────────────────────────────────────────────────
    const [newUsersRaw, activeUsersRaw] = await Promise.all([
      // New users per day — last 30 days
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      // Distinct users with a workout per day — last 30 days
      WorkoutLog.aggregate([
        { $match: { dateCompleted: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              day: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$dateCompleted",
                },
              },
              userId: "$userId",
            },
          },
        },
        {
          $group: {
            _id: "$_id.day",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const newUsersMap = new Map(newUsersRaw.map((r) => [r._id, r.count]));
    const activeUsersMap = new Map(activeUsersRaw.map((r) => [r._id, r.count]));

    const days = lastNDays(30);
    const newUsersByDay = days.map((d) => ({
      date: d,
      count: newUsersMap.get(d) || 0,
    }));
    const activeUsersByDay = days.map((d) => ({
      date: d,
      count: activeUsersMap.get(d) || 0,
    }));

    // ── Engagement ────────────────────────────────────────────
    const [
      totalUsers,
      totalWorkouts,
      workoutsThisWeek,
      workoutsToday,
      totalWeightLogs,
      totalMealPlans,
    ] = await Promise.all([
      User.countDocuments(),
      WorkoutLog.countDocuments(),
      WorkoutLog.countDocuments({ dateCompleted: { $gte: weekStart } }),
      WorkoutLog.countDocuments({ dateCompleted: { $gte: todayStart } }),
      WeightLog.countDocuments(),
      MealPlan.countDocuments(),
    ]);

    const avgWorkoutsPerUser =
      totalUsers > 0 ? Math.round((totalWorkouts / totalUsers) * 10) / 10 : 0;

    // ── Leaderboards ──────────────────────────────────────────
    const [topFavoritesRaw, topPlanExercisesRaw, topUsersRaw] =
      await Promise.all([
        // Most favorited exercises
        FavoriteExercise.aggregate([
          { $group: { _id: "$exerciseId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        // Most-used exercises across all workout plans
        WorkoutPlan.aggregate([
          { $unwind: "$exercises" },
          {
            $group: {
              _id: "$exercises.name",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        // Most active users (by workout count)
        WorkoutLog.aggregate([
          { $group: { _id: "$userId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

    // Hydrate favorite exercises with names
    const favoriteIds = topFavoritesRaw.map((f) => f._id);
    const favoriteExercises = await Exercise.find({
      _id: { $in: favoriteIds },
    })
      .select("name muscleGroup")
      .lean();
    const favoriteMap = new Map(
      favoriteExercises.map((e) => [String(e._id), e]),
    );

    const topFavorites = topFavoritesRaw
      .map((f) => {
        const ex = favoriteMap.get(String(f._id));
        if (!ex) return null;
        return {
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          count: f.count,
        };
      })
      .filter(Boolean);

    const topPlanExercises = topPlanExercisesRaw.map((p) => ({
      name: p._id || "Unknown",
      count: p.count,
    }));

    // Hydrate top users
    const topUserIds = topUsersRaw.map((u) => u._id);
    const topUsersDocs = await User.find({ _id: { $in: topUserIds } })
      .select("fullName email")
      .lean();
    const userMap = new Map(topUsersDocs.map((u) => [String(u._id), u]));

    const topUsers = topUsersRaw
      .map((u) => {
        const doc = userMap.get(String(u._id));
        if (!doc) return null;
        return {
          name: doc.fullName,
          email: doc.email,
          workouts: u.count,
        };
      })
      .filter(Boolean);

    // ── Retention ─────────────────────────────────────────────
    const [
      activeLast7DaysRaw,
      onboardingComplete,
      usersWithPlans,
      returningUsersRaw,
    ] = await Promise.all([
      WorkoutLog.distinct("userId", {
        dateCompleted: { $gte: sevenDaysAgo },
      }),
      User.countDocuments({ onboardingCompleted: true }),
      WorkoutPlan.distinct("userId").then((a) => a.length),
      // Users with 2+ workouts = returning
      WorkoutLog.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $match: { count: { $gte: 2 } } },
        { $count: "total" },
      ]),
    ]);

    const retention = {
      activeLast7Days: activeLast7DaysRaw.length,
      onboardingComplete,
      usersWithPlans,
      returningUsers: returningUsersRaw[0]?.total || 0,
    };

    res.json({
      growth: {
        newUsersByDay,
        activeUsersByDay,
      },
      engagement: {
        totalWorkouts,
        workoutsThisWeek,
        workoutsToday,
        totalWeightLogs,
        totalMealPlans,
        avgWorkoutsPerUser,
      },
      leaderboards: {
        topFavorites,
        topPlanExercises,
        topUsers,
      },
      retention,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };
