const express = require("express");
const router = express.Router();

const {
  listUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getStats,
} = require("../controllers/adminController");

const { getAnalytics } = require("../controllers/adminAnalyticsController");

const {
  listExercises,
  getExerciseStats,
  getExerciseById: getAdminExerciseById,
  approveExercise,
  rejectExercise,
  updateExercise: updateAdminExercise,
  deleteExercise: deleteAdminExercise,
} = require("../controllers/adminExerciseController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const { body, param } = require("express-validator");
const { handleValidation } = require("../middleware/validate");

const {
  exerciseIdParam,
  listExercisesRules,
  rejectExerciseRules,
  updateExerciseRules,
} = require("../validators/adminExerciseValidators");

const userIdParam = [param("id").isMongoId().withMessage("Invalid user id")];

const updateRoleRules = [
  ...userIdParam,
  body("role")
    .isIn(["user", "admin"])
    .withMessage("Role must be user or admin"),
];

router.use(protect);
router.use(adminOnly);

// Users
router.get("/users", listUsers);
router.get("/stats", getStats);
router.get("/analytics", getAnalytics);
router.get("/users/:id", userIdParam, handleValidation, getUserById);
router.put(
  "/users/:id/role",
  updateRoleRules,
  handleValidation,
  updateUserRole,
);
router.delete("/users/:id", userIdParam, handleValidation, deleteUser);

// Exercises
router.get(
  "/exercises",
  listExercisesRules,
  handleValidation,
  listExercises,
);
router.get("/exercises/stats", getExerciseStats);
router.get(
  "/exercises/:id",
  exerciseIdParam,
  handleValidation,
  getAdminExerciseById,
);
router.patch(
  "/exercises/:id/approve",
  exerciseIdParam,
  handleValidation,
  approveExercise,
);
router.patch(
  "/exercises/:id/reject",
  rejectExerciseRules,
  handleValidation,
  rejectExercise,
);
router.put(
  "/exercises/:id",
  updateExerciseRules,
  handleValidation,
  updateAdminExercise,
);
router.delete(
  "/exercises/:id",
  exerciseIdParam,
  handleValidation,
  deleteAdminExercise,
);

module.exports = router;