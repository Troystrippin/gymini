const express = require("express");
const router = express.Router();
const {
  getExercises,
  createExercise,
  deleteExercise,
} = require("../controllers/exerciseController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getExercises);
router.post("/", protect, createExercise);
router.delete("/:id", protect, deleteExercise);

module.exports = router;