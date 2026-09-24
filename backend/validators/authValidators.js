const { body } = require("express-validator");

// Allows: ASCII letters, accented Latin, spaces, hyphens, apostrophes, periods.
// Rejects: digits, emoji, symbols (except '. -'), control chars.
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ'.\- ]+$/;

const registerRules = [
  body("fullName")
    .exists({ checkFalsy: true })
    .withMessage("Full name is required")
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Full name must be 2–80 characters")
    .matches(NAME_REGEX)
    .withMessage(
      "Full name can only contain letters, spaces, hyphens, apostrophes, and periods",
    )
    .escape(),

  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail()
    .isLength({ max: 254 }),

  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain a letter")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
];

const loginRules = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isString()
    .isLength({ min: 1, max: 128 }),
];

const onboardingRules = [
  body("goal")
    .optional()
    .isIn([
      "Lose Weight",
      "Build Muscle",
      "Improve Endurance",
      "Stay Active",
      "Athletic Performance",
    ])
    .withMessage("Invalid goal"),

  body("details").optional().isObject(),

  body("details.biologicalSex").optional().isIn(["Male", "Female"]),

  body("details.age").optional().isInt({ min: 13, max: 120 }).toInt(),
  body("details.heightCm").optional().isFloat({ min: 50, max: 300 }).toFloat(),
  body("details.weightKg").optional().isFloat({ min: 20, max: 500 }).toFloat(),
  body("details.workoutDaysPerWeek")
    .optional()
    .isInt({ min: 0, max: 7 })
    .toInt(),
  body("details.activityLevel")
    .optional()
    .isIn([
      "Sedentary",
      "Lightly Active",
      "Moderately Active",
      "Very Active",
    ]),

  // Legacy flat fields (kept for transition)
  body("biologicalSex").optional().isIn(["Male", "Female"]),
  body("age").optional().isInt({ min: 13, max: 120 }).toInt(),
  body("height").optional().isFloat({ min: 50, max: 300 }).toFloat(),
  body("weight").optional().isFloat({ min: 20, max: 500 }).toFloat(),
  body("workoutDaysPerWeek").optional().isInt({ min: 0, max: 7 }).toInt(),
  body("activityLevel")
    .optional()
    .isIn([
      "Sedentary",
      "Lightly Active",
      "Moderately Active",
      "Very Active",
    ]),
];

const verifyEmailRules = [
  body("code")
    .exists({ checkFalsy: true })
    .withMessage("Code is required")
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Code must be 6 digits")
    .isNumeric()
    .withMessage("Code must be 6 digits"),
];

const resendVerificationRules = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail(),
];

const forgotPasswordRules = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail(),
];

const resetPasswordRules = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail(),

  body("code")
    .exists({ checkFalsy: true })
    .withMessage("Code is required")
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Code must be 6 digits")
    .isNumeric()
    .withMessage("Code must be 6 digits"),

  body("newPassword")
    .exists({ checkFalsy: true })
    .withMessage("New password is required")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain a letter")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
];

const changePasswordRules = [
  body("currentPassword")
    .exists({ checkFalsy: true })
    .withMessage("Current password is required")
    .isString()
    .isLength({ min: 1, max: 128 }),

  body("newPassword")
    .exists({ checkFalsy: true })
    .withMessage("New password is required")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain a letter")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
];

const updateProfileRules = [
  body("fullName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Full name must be 2–80 characters")
    .matches(NAME_REGEX)
    .withMessage(
      "Full name can only contain letters, spaces, hyphens, apostrophes, and periods",
    )
    .escape(),
];

module.exports = {
  registerRules,
  loginRules,
  onboardingRules,
  verifyEmailRules,
  resendVerificationRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
  updateProfileRules,
};