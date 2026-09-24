const express = require("express");
const router = express.Router();
const {
  listUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getStats,
} = require("../controllers/adminController");
const {
  protect,
  adminOnly,
  moderatorOrAdmin,
} = require("../middleware/authMiddleware");
const { body, param } = require("express-validator");
const { handleValidation } = require("../middleware/validate");

// Validators
const userIdParam = [param("id").isMongoId().withMessage("Invalid user id")];

const updateRoleRules = [
  ...userIdParam,
  body("role")
    .isIn(["user", "moderator", "admin"])
    .withMessage("Role must be user, moderator, or admin"),
];

// All routes require authentication
router.use(protect);

// Moderator + Admin: read-only
router.get("/users", moderatorOrAdmin, listUsers);
router.get("/stats", moderatorOrAdmin, getStats);

// Admin only
router.get("/users/:id", adminOnly, userIdParam, handleValidation, getUserById);
router.put(
  "/users/:id/role",
  adminOnly,
  updateRoleRules,
  handleValidation,
  updateUserRole,
);
router.delete(
  "/users/:id",
  adminOnly,
  userIdParam,
  handleValidation,
  deleteUser,
);

module.exports = router;