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

    target: { type: Number, required: true },

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

GoalSchema.index(
  { userId: 1, type: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

module.exports = mongoose.model("Goal", GoalSchema);
