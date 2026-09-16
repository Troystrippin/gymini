const WorkoutPlan = require("../models/WorkoutPlan");
const Exercise = require("../models/Exercise");

// POST /api/plans  → body: { name, exercises: [...] }
const savePlan = async (req, res) => {
  try {
    const { name, exercises } = req.body;

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res
        .status(400)
        .json({ message: "Plan must contain at least one exercise" });
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

    // Replace the user's active plan (latest one wins).
    await WorkoutPlan.deleteMany({ userId: req.user._id });

    const plan = await WorkoutPlan.create({
      userId: req.user._id,
      name: (name && name.trim()) || "My Plan",
      exercises: normalized,
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error("savePlan:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/plans
const getPlans = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(plans);
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
    res.json({ message: "Plan deleted" });
  } catch (err) {
    console.error("deletePlan:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { savePlan, getPlans, getPlanById, deletePlan };