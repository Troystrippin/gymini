const express = require("express");
const router = express.Router();
const {
  getTodayWorkout,
  toggleExercise,
  saveSession,
  getHistory,
  getStats,
} = require("../controllers/workoutController");
const { protect } = require("../middleware/authMiddleware");

router.get("/today", protect, getTodayWorkout);
router.post("/sessions", protect, saveSession);
router.get("/history", protect, getHistory);
router.get("/stats", protect, getStats);

// Keep for backwards-compat with the current mobile screen.
router.patch("/:planId/exercises/:exerciseId", protect, toggleExercise);

module.exports = router;