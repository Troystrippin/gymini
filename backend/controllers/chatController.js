const Meal = require("../models/Meal");
const Exercise = require("../models/Exercise");
const ChatConversation = require("../models/ChatConversation");
const mongoose = require("mongoose");

let geminiClient;

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
      message: "Message is required and must be 2,000 characters or fewer.",
    });
  }

  try {
    let conversation = await ChatConversation.findOne({
      userId: req.user._id,
      status: "active",
    });

    const isExpired = Boolean(
      conversation && conversation.expiresAt <= new Date(),
    );

    const previousInteractionId = isExpired
      ? null
      : conversation?.geminiInteractionId;

    const [meals, exercises] = await Promise.all([
      Meal.find({ active: true })
        .select("name type goal calories protein carbs fats description")
        .sort({ name: 1 })
        .limit(20)
        .lean(),

      Exercise.find({
        $or: [{ isCustom: false }, { isCustom: true, status: "approved" }],
      })
        .select("name muscleGroup equipment difficulty description")
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

    const ai = await getGeminiClient();
    const result = await ai.interactions.create({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      system_instruction: `You are GYMini's meal and exercise recommendation assistant. Use the supplied catalog when providing meals or exercises. You may invent new items if necessary, but the catalog should be your primary source. Do not diagnose conditions or present
recommendations as medical advice. Keep suggestions practical. For exercises, indicate details like: description, equipment, difficulty and, sets and reps. Suggest at least 4(or the amount the user specifies) and, present them as a numbered list. Do not respond to nonsensensical or irrelivant prompts. Act like a knowledgeable human coach, use a casual and friendly tone.
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
      { sender: "user", text: message.trim(), sentAt: now },
      { sender: "assistant", text: reply, sentAt: now, geminiInteractionId: result.id, },
    );

    conversation.messages = conversation.messages.slice(-50);
    conversation.lastActiveAt = now;
    conversation.expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    await conversation.save();

    return res.json({
      reply,
      conversationId: conversation._id,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getCurrentConversation = async (req, res, next) => {
  try {
    const conversation = await ChatConversation.findOne({
      userId: req.user._id,
      status: "active",
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

exports.archiveCurrentConversation = async (req, res, next ) => {
  try {
    await ChatConversation.findOneAndUpdate(
      { userId: req.user._id, status: "active" },
      {
        $set : {
          status: "archived",
          archivedAt: new Date(),
        },
      },
    );
    res.json({ message: "Conversation archived. "});
  } catch (err) {
    next(err);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: "archived",
          expiresAt: { $gt: new Date() },
        },
      },
      { $sort: { archivedAt: -1, _id: -1 } },
      { $limit: 20 },
      {
        $project: {
          archivedAt: 1,
          lastActiveAt: 1,
          firstMessage: { $arrayElemAt: ["$messages", 0] },
        },
      },
    ]);

      res.json(
        conversations.map((conversation) => ({
          id: conversation._id.toString(),
          archivedAt: conversation.archivedAt,
          preview:
          conversation.firstMessage?.text?.slice(0, 120) ||
          "Archived conversation",
        })),
      );
  } catch (err) {
    next(err);
  }
};

exports.getArchivedConversation = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid conversation ID,"});
    }

    const conversation = await ChatConversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: "archived",
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!conversation) {
      return res.status(404).json({ message: "Archived conversation not found."});
    }

    res.json({
      id: conversation._id.toString(),
      messages: conversation.messages.map((message) => ({
        id: message._id.toString(),
        text: message.text,
        sender: message.sender,
      })),
    });
  } catch (err) {
    next(err);
  }
};
