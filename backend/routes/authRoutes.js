const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  updateOnboarding,
  updateProfile,
  changePassword,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { handleValidation } = require("../middleware/validate");
const {
  registerRules,
  loginRules,
  onboardingRules,
  verifyEmailRules,
  resendVerificationRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
  updateProfileRules,
} = require("../validators/authValidators");

// ---------- Public routes ----------
router.post("/register", registerRules, handleValidation, registerUser);
router.post("/login", loginRules, handleValidation, loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.post(
  "/resend-verification",
  resendVerificationRules,
  handleValidation,
  resendVerification,
);
router.post(
  "/forgot-password",
  forgotPasswordRules,
  handleValidation,
  forgotPassword,
);
router.post(
  "/reset-password",
  resetPasswordRules,
  handleValidation,
  resetPassword,
);

// ---------- Private routes ----------
router.post("/logout-all", protect, logoutAllDevices);
router.post(
  "/verify-email",
  protect,
  verifyEmailRules,
  handleValidation,
  verifyEmail,
);
router.put(
  "/onboarding",
  protect,
  onboardingRules,
  handleValidation,
  updateOnboarding,
);
router.put(
  "/profile",
  protect,
  updateProfileRules,
  handleValidation,
  updateProfile,
);
router.put(
  "/change-password",
  protect,
  changePasswordRules,
  handleValidation,
  changePassword,
);
router.get("/me", protect, getMe);

module.exports = router;