const mongoose = require("mongoose");

const AdminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Snapshot so logs remain readable even if the admin is deleted/renamed.
    adminEmail: {
      type: String,
      required: true,
      index: true,
    },
    // e.g. "exercise.approve", "user.role_change", "meal.delete"
    action: {
      type: String,
      required: true,
      index: true,
    },
    // e.g. "exercise", "user", "meal"
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Human-readable label — exercise name, user email, meal name, etc.
    targetLabel: {
      type: String,
      default: null,
    },
    // Arbitrary extra context (e.g. { from: "user", to: "admin" }).
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Auto-delete after 90 days.
AdminLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound index for the common filtered list query.
AdminLogSchema.index({ createdAt: -1, action: 1, targetType: 1 });

module.exports = mongoose.model("AdminLog", AdminLogSchema);