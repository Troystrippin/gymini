const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
    },
    name: { type: String, required: true },
    goal: {
      type: String,
      required: true,
      enum: ["Balanced", "High Protein", "Weight Loss"],
    },
    tags: [{ type: String }],
    // Numeric macros — parse from the old string format
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0, default: 0 },
    fats: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true }, // for Phase 4 moderation
  },
  { timestamps: true },
);

module.exports = mongoose.model("Meal", mealSchema);