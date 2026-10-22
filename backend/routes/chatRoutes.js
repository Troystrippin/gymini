const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/authMiddleware");
const {
  chat,
  getCurrentConversation,
  archiveCurrentConversation,
  getChatHistory,
  getArchivedConversation
} = require("../controllers/chatController");

const router = express.Router();

router.use(protect);

router.post("/current/archive", archiveCurrentConversation);

router.get("/history", getChatHistory);

router.get("/history/:id", getArchivedConversation);

router.get("/current", getCurrentConversation);

router.post(
  "/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { message: "Too many chat requests. Please wait a moment." },
  }),
  chat,
);

module.exports = router;
