const mongoose = require("mongoose");

const FavoriteExerciseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// One favorite per (user, exercise). DB-level guarantee against
// race-condition double-inserts — no read-before-write needed.
FavoriteExerciseSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

// Serves "list my favorites, newest first" without a collection scan.
FavoriteExerciseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("FavoriteExercise", FavoriteExerciseSchema);