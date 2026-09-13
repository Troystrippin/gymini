const mongoose = require("mongoose");

// this is the personalize (not shared but can be) exercise plan  for user
const PlanExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId, //this is will get the exercise that User picked
      ref: "Exercise",
      required: true,
    },
    sets: {
      type: Number,
      required: true,
      min: 1,
    },
    reps: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Boolean, //this uses the toggle completed exercise in home
      default: false,
    },
  },
  { _id: false },
);

//this is the overall workout plan this will show the different exercise user sets fot their plan
const WorkoutPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true, //for personalize naming for User exercise plan Leg day etc.
    },
    exercises: {
      type: [PlanExerciseSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WorkoutPlan", WorkoutPlanSchema);
