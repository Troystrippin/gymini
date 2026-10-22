const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    geminiInteractionId: {
      type: String,
      default: null,
    },
  },
  { _id: true },
);

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    geminiInteractionId: {
      type: String,
      default: null,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

chatConversationSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { status: "active" }, });

chatConversationSchema.index({ userId: 1, updatedAt: -1 });

chatConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
