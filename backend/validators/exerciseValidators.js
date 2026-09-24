const { body, query, param } = require("express-validator");
const mongoose = require("mongoose");

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Full Body",
  "Cardio",
  "Other",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const exerciseIdParam = [
  param("id")
    .exists()
    .withMessage("Exercise id is required")
    .custom(isObjectId)
    .withMessage("Invalid exercise id"),
];

const createExerciseRules = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Exercise name is required")
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Exercise name must be 2–80 characters")
    .escape(),

  body("muscleGroup")
    .exists({ checkFalsy: true })
    .withMessage("Muscle group is required")
    .isIn(MUSCLE_GROUPS)
    .withMessage("Invalid muscle group"),

  body("equipment")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Equipment name too long (max 50 chars)")
    .escape(),

  body("difficulty")
    .optional()
    .isIn(DIFFICULTIES)
    .withMessage("Invalid difficulty"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description too long (max 500 chars)")
    .escape(),

  body("mediaUrl")
    .optional({ nullable: true })
    .isURL()
    .withMessage("Invalid media URL"),
];

const listExercisesRules = [
  query("muscleGroup")
    .optional()
    .isIn(MUSCLE_GROUPS)
    .withMessage("Invalid muscle group"),
  query("difficulty")
    .optional()
    .isIn(DIFFICULTIES)
    .withMessage("Invalid difficulty"),
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Search term too long"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be 1–100")
    .toInt(),
  query("skip")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Skip must be non-negative")
    .toInt(),
];

module.exports = {
  exerciseIdParam,
  createExerciseRules,
  listExercisesRules,
};