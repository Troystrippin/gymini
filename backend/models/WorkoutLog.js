const mongoose = require("mongoose");

// One set's outcome: what the user actually logged.
const PerformedSetSchema = new mongoose.Schema(
  {
    reps: { type: Number, min: 0, default: 0 },
    weightKg: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

// One exercise's outcome within a session.
// Embeds both the aggregate (fast stats) and the per-set detail
// (progression tracking / "last time you did X").
const PerformedExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      default: null, // null for custom exercises
    },
    name: { type: String, required: true }, // snapshot
    muscleGroup: { type: String, default: null },

    targetSets: { type: Number, default: 0 },
    targetReps: { type: Number, default: 0 },

    // Aggregate — fastest for list views & stats
    setsCompleted: { type: Number, min: 0, default: 0 },
    repsCompleted: { type: Number, min: 0, default: 0 },

    // Per-set detail — used for progression charts
    sets: { type: [PerformedSetSchema], default: [] },

    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

// Full session record.
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
      default: null, // may be null if plan was deleted after
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