const express = require("express");
const router = express.Router();
const {
  getTodayWorkout,
  toggleExercise,
} = require("../controllers/workoutController");
const { protect } = require("../middleware/authMiddleware");

router.get("/today", protect, getTodayWorkout);
router.patch("/:planId/exercises/:exerciseId", protect, toggleExercise);

module.exports = router;