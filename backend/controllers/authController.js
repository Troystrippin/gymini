const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Generate a JWT Token ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        token: generateToken(user._id),
        onboardingCompleted: user.onboardingCompleted,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        token: generateToken(user._id),
        onboardingCompleted: user.onboardingCompleted,
        profile: {
          goal: user.goal,
          biologicalSex: user.biologicalSex,
          age: user.age,
          height: user.height,
          weight: user.weight,
          workoutDaysPerWeek: user.workoutDaysPerWeek,
          activityLevel: user.activityLevel,
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (Onboarding)
// @route   PUT /api/auth/onboarding
// @access  Private
const updateOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.goal = req.body.goal || user.goal;
    user.biologicalSex = req.body.biologicalSex || user.biologicalSex;
    user.age = req.body.age || user.age;
    user.height = req.body.height || user.height;
    user.weight = req.body.weight || user.weight;
    user.workoutDaysPerWeek = req.body.workoutDaysPerWeek || user.workoutDaysPerWeek;
    user.activityLevel = req.body.activityLevel || user.activityLevel;
    user.onboardingCompleted = true;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      onboardingCompleted: updatedUser.onboardingCompleted,
      profile: {
        goal: updatedUser.goal,
        biologicalSex: updatedUser.biologicalSex,
        age: updatedUser.age,
        height: updatedUser.height,
        weight: updatedUser.weight,
        workoutDaysPerWeek: updatedUser.workoutDaysPerWeek,
        activityLevel: updatedUser.activityLevel,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  updateOnboarding,
  getMe,
};