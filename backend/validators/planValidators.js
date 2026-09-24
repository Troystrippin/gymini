const { body, param } = require("express-validator");
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

const planIdParam = [
  param("id")
    .exists()
    .withMessage("Plan id is required")
    .custom(isObjectId)
    .withMessage("Invalid plan id"),
];

const savePlanRules = [
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Plan name must be 1–30 characters")
    .escape(),

  body("exercises")
    .exists()
    .withMessage("Exercises are required")
    .isArray({ min: 1, max: 30 })
    .withMessage("Plan must contain 1–30 exercises"),

  body("exercises.*.name")
    .exists({ checkFalsy: true })
    .withMessage("Each exercise needs a name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Exercise name must be 1–100 characters")
    .escape(),

  body("exercises.*.exerciseId")
    .optional({ nullable: true })
    .custom((value) => value === null || value === "" || isObjectId(value))
    .withMessage("Invalid exercise id"),

  body("exercises.*.sets")
    .exists()
    .withMessage("Each exercise needs sets")
    .isInt({ min: 1, max: 50 })
    .withMessage("Sets must be 1–50")
    .toInt(),

  body("exercises.*.reps")
    .exists()
    .withMessage("Each exercise needs reps")
    .isInt({ min: 1, max: 200 })
    .withMessage("Reps must be 1–200")
    .toInt(),

  body("exercises.*.isCustom")
    .optional()
    .isBoolean()
    .withMessage("isCustom must be a boolean")
    .toBoolean(),

  body("exercises.*.muscleGroup")
    .optional({ nullable: true })
    .isIn(MUSCLE_GROUPS)
    .withMessage("Invalid muscle group"),

  body("exercises.*.description")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be ≤ 500 characters"),

  body("exercises.*.order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer")
    .toInt(),
];

module.exports = { planIdParam, savePlanRules };