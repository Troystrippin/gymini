const mongoose = require("mongoose");
const WorkoutPlan = require("../models/WorkoutPlan");
const Exercise = require("../models/Exercise"); // side-effect: registers model

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
        done: ex.completed,
      })),
    };

    res.json(formatted);
  } catch (error) {
    console.error("getTodayWorkout:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle an exercise's completed status
// @route   PATCH /api/workouts/:planId/exercises/:exerciseId
const toggleExercise = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.planId,
      userId: req.user._id,
    });

    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const planExercise = plan.exercises.id(req.params.exerciseId);

    if (!planExercise) {
      return res.status(404).json({ message: "Exercise not in this plan" });
    }

    planExercise.completed = !planExercise.completed;
    await plan.save();

    res.json({ _id: planExercise._id, done: planExercise.completed });
  } catch (error) {
    console.error("toggleExercise:", error.message);
    res.status(500).json({ message: error.message });
  }
};

function getEmojiForPlan(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("leg")) return "🦵";
  if (lower.includes("push") || lower.includes("chest")) return "💪";
  if (lower.includes("pull") || lower.includes("back")) return "🔙";
  if (lower.includes("cardio")) return "🏃";
  if (lower.includes("core") || lower.includes("abs")) return "🔥";
  return "🏋️";
}

module.exports = { getTodayWorkout, toggleExercise };
