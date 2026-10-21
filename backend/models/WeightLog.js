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

    date: {
      type: String,
      required: true,
      index: true,
    },
    note: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

WeightLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("WeightLog", WeightLogSchema);
