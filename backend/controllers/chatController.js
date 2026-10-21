const Meal = require('../models/Meal');
const Exercise = require('../models/Exercise');
const ChatConversation = require("../models/ChatConversation");

let geminiClient;

// Client side stuff, from google

const getGeminiClient = async () => {
    if (!process.env.GEMINI_API_KEY) {
        const error = new Error("Chatbot is not configured");
        error.status = 503;
        throw error;
    }


    if (!geminiClient) {
        const { GoogleGenAI } = await import("@google/genai");
        geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        });
    }

return geminiClient;

};


exports.chat = async (req, res, next) => {
    const { message } = req.body;

    if (
        typeof message !== "string" ||
        !message.trim() ||
        message.trim().length > 2000
        

    ) {
        return res.status(400).json({
            message: "Message is required and must be 2,000 characters or fewer.", // keeps you from sending empty messages. Also adds character limits for dummies    
        });
    }   

    try {
        let conversation = await ChatConversation.findOne({
            userId: req.user._id,
        });

        const isExpired = Boolean(
            conversation && conversation.expiresAt <= new Date(),
        );

        const previousInteractionId = isExpired
            ? null
            : conversation?.geminiInteractionId;

        const [meals, exercises] = await Promise.all([
      Meal.find({ active: true })
        .select("name type goal calories protein carbs fats description") //gets the stuff from the db
        .sort({ name: 1 })
        .limit(20)
        .lean(),

      Exercise.find({
        $or: [
          { isCustom: false },
          { isCustom: true, status: "approved" },
        ],
      })
        .select("name muscleGroup equipment difficulty description") //should be the same as the other one
        .sort({ name: 1 })
        .limit(30)
        .lean(),
    ]);

    const profile = {
      goal: req.user.goal || "not specified",
      activityLevel: req.user.details?.activityLevel || "not specified",
      workoutDaysPerWeek:
        req.user.details?.workoutDaysPerWeek ?? "not specified",
    };

    // Prompt goes here, also where it gets info from the database. The prompt can be changed

    const ai = await getGeminiClient();
    const result = await ai.interactions.create({
        model: process.env.GEMINI_MODEL || "gemini-3.8-flash", // using this one for now, note to self: ask proj manager for model recs
        system_instruction: `You are GYMini's meal and exercise recommendation assistant. Use the supplied catalog when providing meals or exercises. You may invent new items if necessary, but the catalog should be your primary source. Do not diagnose conditions or present
recommendations as medical advice. Keep suggestions practical. For exercises indicate the sets and reps and, suggest at least 4(or the amount the user specifies) and, present them as a numbered list. Do not respond to nonsensensical or irrelivant prompts.
        User profile: 
        ${JSON.stringify(profile)}

        Available meals: 
        ${JSON.stringify(meals)}

        Available exercises: 
        ${JSON.stringify(exercises)}
            `,
            input: message,
            ...(previousInteractionId
                ? { previous_interaction_id: previousInteractionId }
                : {}),
    });

    const reply = result.output_text?.trim();

    //This shows up if theres no response

    if (!reply) {
        return res.status(502).json({
            message: "The chatbot did not return a response. Please try again.",
        });
    }

    const now = new Date();

    if (!conversation) {
        conversation = new ChatConversation({ userId: req.user._id });
    }

    if (isExpired) {
        conversation.messages = [];
    }

    conversation.geminiInteractionId = result.id;
    conversation.messages.push(
        {sender: "user", text: message.trim(), sentAt: now},
        { sender: "assistant", text: reply, sentAt: now },
    );

// should let u keep the last 50 messages
    conversation.messages = conversation.messages.slice(-50)
    conversation.lastActiveAt = now;
    conversation.expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // expiry timer thingy
    
    await conversation.save();

    return res.json({
        reply,
        conversationId: conversation._id,
    });
    
    } catch (error) {
        return next(error);
    }
};

//Thing that lets u come back to convos ig

exports.getCurrentConversation = async (req, res, next) => {
    try {
        const conversation = await ChatConversation.findOne({
            userId: req.user._id,
            expiresAt: { $gt: new Date() },
        }).lean();

        res.json({
            conversationId: conversation?._id.toString() || null,
            messages: (conversation?.messages || []).map((message) => ({
                id: message._id.toString(),
                text: message.text,
                sender: message.sender,
            })),
        });
    } catch (err) {
        next(err);
    }
};
