const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    mealId: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0, default: 0 },
    fats: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const totalsSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
  },
  { _id: false },
);

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Store as YYYY-MM-DD string so timezone / time-of-day doesn't shift the "day"
    date: { type: String, required: true, index: true },
    entries: { type: [entrySchema], default: [] },
    totals: { type: totalsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

// One plan per user per day
mealPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("MealPlan", mealPlanSchema);