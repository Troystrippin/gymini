const mongoose = require("mongoose");

const WeightLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weightKg: {
      type: Number,
      required: true,
      min: 20,
      max: 500,
    },
    // Store as YYYY-MM-DD so multiple logs on the same day dedupe.
    date: {
      type: String,
      required: true,
      index: true,
    },
    note: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

// One weight log per user per day (upsert on re-log).
WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });
// For "last 30 days" queries.
WeightLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("WeightLog", WeightLogSchema);