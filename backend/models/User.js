const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // --- Authentication Info ---
  fullName: {
    type: String,
    required: [true, 'Please add a full name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6
  },

  // --- Onboarding Info ---
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  goal: {
    type: String,
    enum: ['Lose Weight', 'Build Muscle', 'Improve Endurance', 'Stay Active', 'Athletic Performance'],
    default: null
  },
  biologicalSex: {
    type: String,
    enum: ['Male', 'Female'],
    default: null
  },
  age: { type: Number, default: null },
  height: { type: Number, default: null },
  weight: { type: Number, default: null },
  workoutDaysPerWeek: { type: Number, default: null },
  activityLevel: {
    type: String,
    enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);