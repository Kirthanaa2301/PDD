const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    profile: {
      age: Number,
      severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
      triggers: [String],
      inhaler: String,
      frequency: String,
      emergencyContact: String,
      hasCompletedOnboarding: { type: Boolean, default: false },
    },

    streak: { type: Number, default: 0 },
    lastLoginDate: { type: String, default: null },
    loginDates: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
