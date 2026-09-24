const express = require("express");
const router = express.Router();
const {
  createExercise,
  getExercises,
  getExerciseById,
} = require("../controllers/exerciseController");
const { protect } = require("../middleware/authMiddleware");
const { handleValidation } = require("../middleware/validate");
const {
  exerciseIdParam,
  createExerciseRules,
  listExercisesRules,
} = require("../validators/exerciseValidators");

router.get("/", listExercisesRules, handleValidation, getExercises);
router.post(
  "/",
  protect,
  createExerciseRules,
  handleValidation,
  createExercise,
);
router.get("/:id", exerciseIdParam, handleValidation, getExerciseById);

module.exports = router;