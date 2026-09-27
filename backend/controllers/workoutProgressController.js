const WorkoutProgress = require("../models/WorkoutProgress");
const WorkoutPlan = require("../models/WorkoutPlan");

// ─── Helpers ─────────────────────────────────────────────────────

const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isValidDateKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const serializeProgress = (doc) => {
  if (!doc) return null;
  return {
    _id: doc._id,
    userId: doc.userId,
    planId: doc.planId,
    date: doc.date,
    completedExerciseIds: doc.completedExerciseIds || [],
    setResults:
      doc.setResults instanceof Map
        ? Object.fromEntries(doc.setResults)
        : doc.setResults || {},
    finishedAt: doc.finishedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

// ─── GET /api/workouts/progress?planId=X&date=YYYY-MM-DD ─────────
exports.getProgress = async (req, res, next) => {
  try {
    const date = req.query.date || todayKey();
    if (!isValidDateKey(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const planId = req.query.planId;
    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    const doc = await WorkoutProgress.findOne({
      userId: req.user._id,
      planId,
      date,
    });

    if (!doc) {
      return res.json({
        planId,
        date,
        completedExerciseIds: [],
        setResults: {},
        finishedAt: null,
      });
    }
    res.json(serializeProgress(doc));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/workouts/progress ─────────────────────────────────
// Body: { planId, date?, completedExerciseIds: [...], setResults: { exId: [ {reps, weightKg} ] } }
exports.saveProgress = async (req, res, next) => {
  try {
    const date = req.body.date || todayKey();
    if (!isValidDateKey(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const { planId, completedExerciseIds, setResults } = req.body;
    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    // Ownership check — user must own the plan.
    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: req.user._id,
    });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Validate completedExerciseIds — must all be subdoc _ids of this plan.
    const validIds = new Set(plan.exercises.map((e) => String(e._id)));
    const cleanedIds = Array.isArray(completedExerciseIds)
      ? completedExerciseIds
          .map((id) => String(id))
          .filter((id) => validIds.has(id))
      : [];

    // Sanitize setResults — keep only keys that map to a real exercise subdoc.
    const cleanedSets = {};
    if (setResults && typeof setResults === "object") {
      for (const [exId, sets] of Object.entries(setResults)) {
        if (!validIds.has(String(exId))) continue;
        if (!Array.isArray(sets)) continue;
        cleanedSets[String(exId)] = sets
          .slice(0, 50) // cap
          .map((s) => ({
            reps: Math.max(0, Number(s?.reps) || 0),
            weightKg: Math.max(0, Number(s?.weightKg) || 0),
          }));
      }
    }

    const update = {
      completedExerciseIds: cleanedIds,
      setResults: cleanedSets,
    };

    // If the user just completed every exercise, stamp finishedAt.
    // If they un-completed an exercise, clear it.
    const allDone =
      plan.exercises.length > 0 &&
      cleanedIds.length === plan.exercises.length;

    const existing = await WorkoutProgress.findOne({
      userId: req.user._id,
      planId,
      date,
    });

    if (allDone) {
      update.finishedAt = existing?.finishedAt || new Date();
    } else {
      update.finishedAt = null;
    }

    const doc = await WorkoutProgress.findOneAndUpdate(
      { userId: req.user._id, planId, date },
      {
        $set: update,
        $setOnInsert: { userId: req.user._id, planId, date },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // NOTE: Do NOT write a WorkoutLog here. The mobile client already
    // writes one via POST /api/workouts/sessions when the user taps
    // "Finish". Duplicating it here caused double-logged sessions.
    // The WorkoutLog model is owned by workoutController.saveSession.

    res.json(serializeProgress(doc));
  } catch (err) {
    next(err);
  }
};