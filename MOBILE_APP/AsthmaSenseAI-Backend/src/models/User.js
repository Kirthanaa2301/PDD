import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    age: { type: Number },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
    triggers: [{ type: String }],
    inhaler: { type: String },
    frequency: { type: String },
    emergencyContact: { type: String, default: '' },
    hasCompletedOnboarding: { type: Boolean, default: false },
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastLoginDate: {
    type: String,
    default: null,
  },
  loginDates: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', UserSchema);
export default User;
