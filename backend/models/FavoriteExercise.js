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

FavoriteExerciseSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

FavoriteExerciseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("FavoriteExercise", FavoriteExerciseSchema);
