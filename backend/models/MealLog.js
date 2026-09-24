const mongoose = require("mongoose");

const mealLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Same date format as MealPlan
    date: { type: String, required: true, index: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, ref: "Meal" },
    slug: { type: String },
    name: { type: String, required: true },
    type: { type: String },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    consumedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

mealLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("MealLog", mealLogSchema);