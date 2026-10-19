const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/authMiddleware");
const { chat } = require("../controllers/chatController");

const router = express.Router();

router.use(protect);

// rate limit for chat endpoint, stops potential(megumi) bots from sending too many requests

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