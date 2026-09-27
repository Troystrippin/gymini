const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["weight", "workout_frequency"],
    },
    // For "weight": target weight in kg.
    // For "workout_frequency": target sessions per week.
    target: { type: Number, required: true },

    // Snapshot of the value when the goal was created.
    // For "weight": starting weight (used for % progress).
    // For "workout_frequency": not used (progress is weekly).
    startValue: { type: Number, default: null },

    deadline: { type: Date, default: null },

    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One active goal per type per user.
GoalSchema.index(
  { userId: 1, type: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

module.exports = mongoose.model("Goal", GoalSchema);