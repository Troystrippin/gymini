const mongoose = require("mongoose");

const PlanExerciseSchema = new mongoose.Schema(
  {
    // Catalog ref — null when the exercise is user-created (isCustom: true).
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      default: null,
    },
    // Snapshot so custom exercises work AND so we don't break
    // if the catalog exercise is later edited/deleted.
    name: { type: String, required: true },
    muscleGroup: { type: String, default: null },
    description: { type: String, default: "" },
    isCustom: { type: Boolean, default: false },
    sets: { type: Number, required: true, min: 1, default: 3 },
    reps: { type: Number, required: true, min: 1, default: 10 },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  // _id: true so each subdoc has its own _id for toggling.
  { _id: true },
);

const WorkoutPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "My Plan",
    },
    exercises: {
      type: [PlanExerciseSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WorkoutPlan", WorkoutPlanSchema);