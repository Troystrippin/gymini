const Meal = require("../models/Meal");
const MealPlan = require("../models/MealPlan");
const mealsSeed = require("../data/mealsSeed");
const { logUserAction } = require("../utils/userActivityLog");

const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isValidDateKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const computeTotals = (entries) =>
  entries.reduce(
    (acc, e) => {
      acc.calories += e.calories || 0;
      acc.protein += e.protein || 0;
      acc.carbs += e.carbs || 0;
      acc.fats += e.fats || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

const goalToMealGoal = (userGoal) => {
  if (!userGoal) return "Balanced";
  const g = String(userGoal).toLowerCase();
  if (g.includes("lose") || g.includes("weight loss") || g.includes("cut"))
    return "Weight Loss";
  if (g.includes("muscle") || g.includes("gain") || g.includes("protein"))
    return "High Protein";
  return "Balanced";
};

const ensureSeeded = async () => {
  const count = await Meal.estimatedDocumentCount();
  if (count > 0) return;
  try {
    await Meal.insertMany(mealsSeed);
    console.log(`[meals] seeded ${mealsSeed.length} meals`);
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
};
module.exports.ensureSeeded = ensureSeeded;

exports.getMeals = async (req, res, next) => {
  try {
    const { goal, type, q } = req.query;
    const filter = { active: true };
    if (goal) filter.goal = goal;
    if (type) filter.type = type;
    if (q) filter.name = { $regex: q, $options: "i" };

    const meals = await Meal.find(filter).sort({ type: 1, name: 1 }).lean();
    res.json(meals);
  } catch (err) {
    next(err);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const targetGoal = goalToMealGoal(req.user?.goal);

    const types = ["Breakfast", "Lunch", "Dinner", "Snack"];
    const picks = await Promise.all(
      types.map(async (type) => {
        const primary = await Meal.findOne({
          active: true,
          type,
          goal: targetGoal,
        }).lean();
        if (primary) return primary;
        return Meal.findOne({ active: true, type }).lean();
      }),
    );

    res.json({
      goal: targetGoal,
      meals: picks.filter(Boolean),
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyPlan = async (req, res, next) => {
  try {
    const date = req.query.date || todayKey();
    if (!isValidDateKey(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const plan = await MealPlan.findOne({
      user: req.user._id,
      date,
    }).lean();

    if (!plan) {
      return res.json({ date, entries: [], totals: computeTotals([]) });
    }
    res.json(plan);
  } catch (err) {
    next(err);
  }
};

exports.saveMealPlan = async (req, res, next) => {
  try {
    const date = req.body.date || todayKey();
    if (!isValidDateKey(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const rawEntries = Array.isArray(req.body.entries)
      ? req.body.entries
      : null;
    if (!rawEntries) {
      return res.status(400).json({ message: "entries must be an array" });
    }
    if (rawEntries.length > 20) {
      return res
        .status(400)
        .json({ message: "Too many entries in meal plan (max 20)" });
    }

    const mealIds = rawEntries.map((e) => e.mealId).filter(Boolean);
    const catalog = await Meal.find({ id: { $in: mealIds } }).lean();
    const byId = new Map(catalog.map((m) => [m.id, m]));

    const entries = rawEntries
      .map((e) => {
        const src = byId.get(e.mealId);
        if (!src) return null;
        return {
          mealId: src.id,
          type: src.type,
          name: src.name,
          calories: src.calories,
          protein: src.protein,
          carbs: src.carbs,
          fats: src.fats,
        };
      })
      .filter(Boolean);

    const totals = computeTotals(entries);

    const plan = await MealPlan.findOneAndUpdate(
      { user: req.user._id, date },
      { user: req.user._id, date, entries, totals },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    await logUserAction(req, "meal_plan.save", {
      date,
      mealsCount: entries.length,
      totalCalories: totals.calories,
    });

    res.json(plan);
  } catch (err) {
    next(err);
  }
};

exports.addMealToPlan = async (req, res, next) => {
  try {
    const date = req.body.date || todayKey();
    const { mealId } = req.body;
    if (!mealId) return res.status(400).json({ message: "mealId required" });

    const meal = await Meal.findOne({ id: mealId, active: true }).lean();
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    const plan =
      (await MealPlan.findOne({ user: req.user._id, date })) ||
      new MealPlan({ user: req.user._id, date, entries: [] });

    if (plan.entries.some((e) => e.mealId === mealId)) {
      return res.json(plan.toObject());
    }
    if (plan.entries.length >= 20) {
      return res.status(400).json({ message: "Meal plan is full" });
    }

    plan.entries.push({
      mealId: meal.id,
      type: meal.type,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
    });
    plan.totals = computeTotals(plan.entries);
    await plan.save();
    res.json(plan.toObject());
  } catch (err) {
    next(err);
  }
};

exports.removeMealFromPlan = async (req, res, next) => {
  try {
    const date = req.body.date || todayKey();
    const { mealId } = req.body;
    if (!mealId) return res.status(400).json({ message: "mealId required" });

    const plan = await MealPlan.findOne({ user: req.user._id, date });
    if (!plan) {
      return res.json({ date, entries: [], totals: computeTotals([]) });
    }

    plan.entries = plan.entries.filter((e) => e.mealId !== mealId);
    plan.totals = computeTotals(plan.entries);
    await plan.save();
    res.json(plan.toObject());
  } catch (err) {
    next(err);
  }
};

exports.repeatPlan = async (req, res, next) => {
  try {
    const { fromDate } = req.body;
    const toDate = req.body.toDate || todayKey();
    if (!isValidDateKey(fromDate) || !isValidDateKey(toDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const source = await MealPlan.findOne({
      user: req.user._id,
      date: fromDate,
    }).lean();
    if (!source || source.entries.length === 0) {
      return res
        .status(404)
        .json({ message: "No meals found on the source date" });
    }

    const entries = source.entries;
    const totals = computeTotals(entries);

    const plan = await MealPlan.findOneAndUpdate(
      { user: req.user._id, date: toDate },
      { user: req.user._id, date: toDate, entries, totals },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    res.json(plan);
  } catch (err) {
    next(err);
  }
};

exports.getMealStats = async (req, res, next) => {
  try {
    const to = req.query.to || todayKey();
    const from =
      req.query.from ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      })();

    if (!isValidDateKey(from) || !isValidDateKey(to)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const plans = await MealPlan.find({
      user: req.user._id,
      date: { $gte: from, $lte: to },
    }).lean();

    const days = plans.map((p) => ({
      date: p.date,
      calories: p.totals?.calories || 0,
      protein: p.totals?.protein || 0,
      carbs: p.totals?.carbs || 0,
      fats: p.totals?.fats || 0,
      mealCount: p.entries.length,
    }));

    const totals = days.reduce(
      (acc, d) => {
        acc.calories += d.calories;
        acc.protein += d.protein;
        acc.carbs += d.carbs;
        acc.fats += d.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );

    const daysLogged = days.filter((d) => d.mealCount > 0).length;
    const avg = daysLogged
      ? {
          calories: Math.round(totals.calories / daysLogged),
          protein: Math.round(totals.protein / daysLogged),
          carbs: Math.round(totals.carbs / daysLogged),
          fats: Math.round(totals.fats / daysLogged),
        }
      : { calories: 0, protein: 0, carbs: 0, fats: 0 };

    res.json({ from, to, days, totals, average: avg, daysLogged });
  } catch (err) {
    next(err);
  }
};
