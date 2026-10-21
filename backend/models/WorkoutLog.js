const mongoose = require("mongoose");

const PerformedSetSchema = new mongoose.Schema(
  {
    reps: { type: Number, min: 0, default: 0 },
    weightKg: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const PerformedExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      default: null,
    },
    name: { type: String, required: true },
    muscleGroup: { type: String, default: null },

    targetSets: { type: Number, default: 0 },
    targetReps: { type: Number, default: 0 },

    setsCompleted: { type: Number, min: 0, default: 0 },
    repsCompleted: { type: Number, min: 0, default: 0 },

    sets: { type: [PerformedSetSchema], default: [] },

    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const WorkoutLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutPlan",
      default: null,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },

    startedAt: { type: Date, default: null },
    dateCompleted: { type: Date, required: true, default: Date.now },
    durationSec: { type: Number, min: 0, default: 0 },

    exercisesPerformed: {
      type: [PerformedExerciseSchema],
      default: [],
    },

    totalExercises: { type: Number, min: 0, default: 0 },
    completedExercises: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

WorkoutLogSchema.index({ userId: 1, dateCompleted: -1 });

module.exports = mongoose.model("WorkoutLog", WorkoutLogSchema);
