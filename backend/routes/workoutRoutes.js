const express = require("express");
const router = express.Router();
const {
  getTodayWorkout,
  toggleExercise,
  saveSession,
  getHistory,
  getStats,
} = require("../controllers/workoutController");
const {
  getProgress,
  saveProgress,
} = require("../controllers/workoutProgressController");
const { protect } = require("../middleware/authMiddleware");

router.get("/today", protect, getTodayWorkout);
router.post("/sessions", protect, saveSession);
router.get("/history", protect, getHistory);
router.get("/stats", protect, getStats);

// Phase 3.5 — persistent per-day workout progress
router.get("/progress", protect, getProgress);
router.put("/progress", protect, saveProgress);

// Keep for backwards-compat with the current mobile screen.
router.patch("/:planId/exercises/:exerciseId", protect, toggleExercise);

module.exports = router;