const mongoose = require("mongoose");

//Lets the AI remember convos within a session

const chatConversationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        geminiInteractionId: {
            type: String,
            default: null,
        },
        lastActiveAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt:{
            type: Date,
            required: true,
        },
    },
    { timestamps: true},
);

// Gets rid of convos when they're inactive for too long
chatConversationSchema.index({ expiresAt: 1 }, {expireAfterSeconds: 0});

module.exports = mongoose.model("ChatConversation", chatConversationSchema);