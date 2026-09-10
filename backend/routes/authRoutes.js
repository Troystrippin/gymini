const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateOnboarding,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes
router.put('/onboarding', protect, updateOnboarding);
router.get('/me', protect, getMe);

module.exports = router;