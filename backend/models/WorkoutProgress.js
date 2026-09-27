const mongoose = require("mongoose");

// Per-set result snapshot. Loose shape — we just persist whatever the client sends.
const SetResultSchema = new mongoose.Schema(
  {
    reps: { type: Number, min: 0, default: 0 },
    weightKg: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const WorkoutProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutPlan",
      required: true,
      index: true,
    },
    // YYYY-MM-DD, same convention as MealPlan and WeightLog.
    date: { type: String, required: true, index: true },

    // Which exercises (by WorkoutPlan subdoc _id) are marked done today.
    completedExerciseIds: {
      type: [String],
      default: [],
    },

    // exerciseId (string) → array of set results, in order.
    // Stored as a Mongoose Map so keys are arbitrary strings.
    setResults: {
      type: Map,
      of: [SetResultSchema],
      default: () => new Map(),
    },

    // Set when the user hits "Finish Workout" (all done) — not for partial saves.
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One doc per user per plan per day.
WorkoutProgressSchema.index({ userId: 1, planId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("WorkoutProgress", WorkoutProgressSchema);