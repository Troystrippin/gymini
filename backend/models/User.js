const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // --- Authentication Info ---
    fullName: {
      type: String,
      required: [true, "Please add a full name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
    },
    activePlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutPlan",
      default: null,
    },

    // --- Onboarding Info ---
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    goal: {
      type: String,
      enum: [
        "Lose Weight",
        "Build Muscle",
        "Improve Endurance",
        "Stay Active",
        "Athletic Performance",
      ],
      default: null,
    },
    details: {
      biologicalSex: {
        type: String,
        enum: ["Male", "Female"],
        default: null,
      },
      age: { type: Number, min: 13, max: 120, default: null },
      heightCm: { type: Number, min: 50, max: 300, default: null },
      weightKg: { type: Number, min: 20, max: 500, default: null },
      workoutDaysPerWeek: { type: Number, min: 0, max: 7, default: null },
      activityLevel: {
        type: String,
        enum: [
          "Sedentary",
          "Lightly Active",
          "Moderately Active",
          "Very Active",
        ],
        default: null,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
