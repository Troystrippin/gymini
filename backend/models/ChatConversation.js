const mongoose = require("mongoose");

//Lets the AI remember convos within a session

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
        expiresAt:{
            type: Date,
            required: true,
        },
    },
    { timestamps: true},
);

// Saved convo per user
chatConversationSchema.index({ userId: 1 }, { unique: true });

// Gets rid of convos when they're inactive for too long
chatConversationSchema.index({ expiresAt: 1 }, {expireAfterSeconds: 0});

module.exports = mongoose.model("ChatConversation", chatConversationSchema);