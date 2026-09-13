const mongoose = require("mongoose");

// PerformedExerciseSchema: one exercise's outcome within a session
// (exerciseId + actual sets/reps done). Embedded sub-document only —
// never queried on its own, always accessed through its parent log.
const PerformedExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    setsCompleted: {
      type: Number,
      required: true,
      min: 0,
    },
    repsCompleted: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

// WorkoutLogSchema: the full session record — who did it, which plan
// it was based on, when, and the list of PerformedExerciseSchema
// results for every exercise done that session.
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
      required: true,
    },
    dateCompleted: {
      type: Date,
      required: true,
      default: Date.now,
    },
    exercisesPerformed: {
      type: [PerformedExerciseSchema],
      default: [],
    },
  },
  { timestamos: true },
);
// Speeds up Progress tab queries like "all logs for this user, most recent first"
WorkoutLogSchema.index({ userId: 1, dateCompleted: -1 });

module.exports = mongoose.model("WorkoutLog", WorkoutLogSchema);
