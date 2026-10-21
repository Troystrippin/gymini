const mongoose = require("mongoose");

const PlanExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      default: null,
    },

    name: { type: String, required: true },
    muscleGroup: { type: String, default: null },
    description: { type: String, default: "" },
    isCustom: { type: Boolean, default: false },
    sets: { type: Number, required: true, min: 1, default: 3 },
    reps: { type: Number, required: true, min: 1, default: 10 },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },

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
      maxlength: 30,
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
