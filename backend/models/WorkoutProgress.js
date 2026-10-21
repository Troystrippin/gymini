const mongoose = require("mongoose");

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

    date: { type: String, required: true, index: true },

    completedExerciseIds: {
      type: [String],
      default: [],
    },

    setResults: {
      type: Map,
      of: [SetResultSchema],
      default: () => new Map(),
    },

    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

WorkoutProgressSchema.index(
  { userId: 1, planId: 1, date: 1 },
  { unique: true },
);

module.exports = mongoose.model("WorkoutProgress", WorkoutProgressSchema);
