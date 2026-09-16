const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    muscleGroup: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Chest",
        "Back",
        "Shoulders",
        "Arms",
        "Legs",
        "Core",
        "Full Body",
        "Cardio",
        "Other",
      ],
    },
    equipment: { type: String, default: "Bodyweight", trim: true },
    description: { type: String, default: "" },
    mediaUrl: { type: String, default: null },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    isCustom: { type: Boolean, default: false, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

ExerciseSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Exercise", ExerciseSchema);