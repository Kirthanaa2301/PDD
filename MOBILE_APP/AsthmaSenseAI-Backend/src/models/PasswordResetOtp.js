import mongoose from 'mongoose';

/**
 * PasswordResetOtp — Stores short-lived 6-digit OTPs for password reset.
 * MongoDB TTL index on `expiresAt` auto-deletes documents after they expire.
 */
const PasswordResetOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired docs
  },
});

PasswordResetOtpSchema.index({ email: 1 });

const PasswordResetOtp = mongoose.model('PasswordResetOtp', PasswordResetOtpSchema);
export default PasswordResetOtp;
