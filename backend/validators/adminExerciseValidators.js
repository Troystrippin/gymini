const { param, query, body } = require("express-validator");

const exerciseIdParam = [
  param("id").isMongoId().withMessage("Invalid exercise id"),
];

const listExercisesRules = [
  query("page")
    .optional({ checkFalsy: true, nullable: true })
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer")
    .toInt(),
  query("limit")
    .optional({ checkFalsy: true, nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),
  query("status")
    .optional({ checkFalsy: true, nullable: true })
    .isIn(["pending", "approved", "rejected"])
    .withMessage("status must be pending, approved, or rejected"),
  query("type")
    .optional({ checkFalsy: true, nullable: true })
    .isIn(["builtin", "custom"])
    .withMessage("type must be builtin or custom"),
];

const rejectExerciseRules = [
  ...exerciseIdParam,
  body("reason")
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .withMessage("reason must be a string")
    .isLength({ max: 500 })
    .withMessage("reason must be at most 500 characters"),
];

const updateExerciseRules = [
  ...exerciseIdParam,
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("name must be 1-100 characters"),
  body("muscleGroup")
    .optional()
    .isIn([
      "Chest",
      "Back",
      "Shoulders",
      "Arms",
      "Legs",
      "Core",
      "Full Body",
      "Cardio",
      "Other",
    ])
    .withMessage("Invalid muscle group"),
  body("equipment").optional().isString().trim().isLength({ max: 50 }),
  body("difficulty")
    .optional()
    .isIn(["Beginner", "Intermediate", "Advanced"])
    .withMessage("Invalid difficulty"),
  body("description").optional().isString().isLength({ max: 2000 }),
  body("mediaUrl")
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .isLength({ max: 500 }),
];

module.exports = {
  exerciseIdParam,
  listExercisesRules,
  rejectExerciseRules,
  updateExerciseRules,
};