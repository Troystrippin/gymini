const WorkoutPlan = require("../models/WorkoutPlan");
const Exercise = require("../models/Exercise");
const User = require("../models/User");

// Defensive clamp — keeps values within schema bounds even if validators
// are bypassed. Bounds match planValidators.js exactly.
const clampInt = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
};

// POST /api/plans or PUT /api/plans/:id → body: { name, exercises: [...] }
const savePlan = async (req, res, next) => {
  try {
    const { name, exercises } = req.body;
    const isEdit = Boolean(req.params.id);

    const normalized = [];

    for (let i = 0; i < exercises.length; i++) {
      const raw = exercises[i];
      let catalogRef = null;
      let muscleGroup = raw.muscleGroup || null;
      let description = raw.description || "";
      let isCustom = !!raw.isCustom;
      let displayName = raw.name;

      if (!isCustom && raw.exerciseId) {
        try {
          const found = await Exercise.findById(raw.exerciseId);
          if (found) {
            catalogRef = found._id;
            muscleGroup = muscleGroup || found.muscleGroup;
            description = description || found.description;
            displayName = displayName || found.name;
          } else {
            // exerciseId points to a deleted catalog item → treat as custom
            isCustom = true;
          }
        } catch {
          isCustom = true;
        }
      }

      if (!displayName) {
        return res
          .status(400)
          .json({ message: `Exercise #${i + 1} is missing a name` });
      }

      normalized.push({
        exerciseId: catalogRef,
        name: displayName,
        muscleGroup,
        description,
        isCustom,
        sets: clampInt(raw.sets, 1, 50, 3),
        reps: clampInt(raw.reps, 1, 200, 10),
        completed: false,
        order: i,
      });
    }

    const planData = {
      userId: req.user._id,
      name: (name && name.trim()) || "My Plan",
      exercises: normalized,
    };

    let plan;
    if (isEdit) {
      plan = await WorkoutPlan.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        planData,
        { new: true, runValidators: true },
      );
    } else {
      plan = await WorkoutPlan.create(planData);
    }

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Auto-activate ONLY on create. Editing an old plan shouldn't hijack
    // the user's currently active plan.
    if (!isEdit) {
      await User.findByIdAndUpdate(req.user._id, {
        activePlanId: plan._id,
      });
    }

    res.status(isEdit ? 200 : 201).json(plan);
  } catch (err) {
    console.error("savePlan:", err);
    next(err);
  }
};

// PUT /api/plans/:id/select
const selectPlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    await User.findByIdAndUpdate(req.user._id, { activePlanId: plan._id });
    res.json({
      message: "Plan selected",
      planId: plan._id,
      activePlanId: plan._id,
    });
  } catch (err) {
    console.error("selectPlan:", err);
    next(err);
  }
};

// GET /api/plans
const getPlans = async (req, res, next) => {
  try {
    const plans = await WorkoutPlan.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(
      plans.map((plan) => ({
        ...plan.toObject(),
        isActive: String(plan._id) === String(req.user.activePlanId),
      })),
    );
  } catch (err) {
    console.error("getPlans:", err);
    next(err);
  }
};

// GET /api/plans/:id
const getPlanById = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (err) {
    console.error("getPlanById:", err);
    next(err);
  }
};

// DELETE /api/plans/:id
const deletePlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    let newActivePlanId = req.user.activePlanId || null;
    if (String(req.user.activePlanId) === String(plan._id)) {
      const replacement = await WorkoutPlan.findOne({
        userId: req.user._id,
        _id: { $ne: plan._id },
      }).sort({ createdAt: -1 });

      newActivePlanId = replacement?._id || null;
      await User.findByIdAndUpdate(req.user._id, {
        activePlanId: newActivePlanId,
      });
    }

    res.json({
      message: "Plan deleted",
      activePlanId: newActivePlanId,
    });
  } catch (err) {
    console.error("deletePlan:", err);
    next(err);
  }
};

module.exports = { savePlan, getPlans, getPlanById, deletePlan, selectPlan };