const WorkoutProgress = require("../models/WorkoutProgress");
const WorkoutLog = require("../models/WorkoutLog");
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

    // When the user fully finishes, write a WorkoutLog so history/stats update.
    // Guard against duplicate logs on the same day for the same plan.
    if (allDone && !existing?.finishedAt) {
      try {
        const exercisesPerformed = plan.exercises.map((ex) => {
          const sets = cleanedSets[String(ex._id)] || [];
          const repsCompleted = sets.reduce((sum, s) => sum + s.reps, 0);
          return {
            exerciseId: ex.exerciseId || null,
            name: ex.name,
            muscleGroup: ex.muscleGroup || null,
            targetSets: ex.sets,
            targetReps: ex.reps,
            setsCompleted: sets.length,
            repsCompleted,
            sets,
            completed: true,
          };
        });

        await WorkoutLog.create({
          userId: req.user._id,
          planId: plan._id,
          planName: plan.name,
          startedAt: existing?.createdAt || new Date(),
          dateCompleted: new Date(),
          durationSec: 0, // we don't track elapsed time server-side; client could send it
          exercisesPerformed,
          totalExercises: plan.exercises.length,
          completedExercises: plan.exercises.length,
        });
        console.log(
          `[workout-progress] logged finished session user=${req.user._id} plan=${plan._id}`,
        );
      } catch (logErr) {
        // Don't fail the request if logging fails — the progress doc is authoritative.
        console.error("[workout-progress] failed to write log:", logErr.message);
      }
    }

    res.json(serializeProgress(doc));
  } catch (err) {
    next(err);
  }
};