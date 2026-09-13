const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    muscleGroup: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "chest",
        "back",
        "shoulders",
        "arms",
        "legs",
        "core",
        "full body",
        "cardio",
      ],
    },
    equipment: {
      type: String,
      default: "none", // this can be enum but i leave it just like that for more flexible choice for creator
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
    },
    medaiUrl: {
      type: String, //optional image/video/image kung masipag maghanap source
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermidiate", "advance"],
      default: "beginner",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Exercise", ExerciseSchema);
