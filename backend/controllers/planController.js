const WorkoutPlan = require("../models/WorkoutPlan");
const Exercise = require("../models/Exercise");
const User = require("../models/User");

// POST /api/plans or PUT /api/plans/:id → body: { name, exercises: [...] }
const savePlan = async (req, res) => {
  try {
    const { name, exercises } = req.body;

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res
        .status(400)
        .json({ message: "Plan must contain at least one exercise" });
    }

    if (name && name.trim().length > 30) {
      return res
        .status(400)
        .json({ message: "Plan name must be 30 characters or fewer" });
    }

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
        sets: Math.max(1, Number(raw.sets) || 3),
        reps: Math.max(1, Number(raw.reps) || 10),
        completed: false,
        order: i,
      });
    }

    const planData = {
      userId: req.user._id,
      name: (name && name.trim()) || "My Plan",
      exercises: normalized,
    };
    const plan = req.params.id
      ? await WorkoutPlan.findOneAndUpdate(
          { _id: req.params.id, userId: req.user._id },
          planData,
          { new: true, runValidators: true },
        )
      : await WorkoutPlan.create(planData);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    await User.findByIdAndUpdate(req.user._id, { activePlanId: plan._id });

    res.status(req.params.id ? 200 : 201).json(plan);
  } catch (err) {
    console.error("savePlan:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/plans/:id/select
const selectPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    await User.findByIdAndUpdate(req.user._id, { activePlanId: plan._id });
    res.json({ message: "Plan selected", planId: plan._id });
  } catch (err) {
    console.error("selectPlan:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/plans
const getPlans = async (req, res) => {
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
    res.status(500).json({ message: err.message });
  }
};

// GET /api/plans/:id
const getPlanById = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (err) {
    console.error("getPlanById:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/plans/:id
const deletePlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    if (String(req.user.activePlanId) === String(plan._id)) {
      const replacement = await WorkoutPlan.findOne({
        userId: req.user._id,
        _id: { $ne: plan._id },
      }).sort({ createdAt: -1 });
      await User.findByIdAndUpdate(req.user._id, {
        activePlanId: replacement?._id || null,
      });
    }
    res.json({ message: "Plan deleted" });
  } catch (err) {
    console.error("deletePlan:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { savePlan, getPlans, getPlanById, deletePlan, selectPlan };
