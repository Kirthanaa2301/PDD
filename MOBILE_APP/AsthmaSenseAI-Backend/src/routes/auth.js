import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SymptomLog from '../models/SymptomLog.js';
import Session from '../models/Session.js';
import AudioReport from '../models/AudioReport.js';
import PasswordResetOtp from '../models/PasswordResetOtp.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-asthmasense-ai';

// Middleware to authenticate JWT
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password.' });
  }

  try {
    const lowercaseEmail = email.toLowerCase().trim();
    // Check if user already exists
    const existingUser = await User.findOne({ email: lowercaseEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: lowercaseEmail,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT (No expiration)
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET);

    res.status(201).json({
      token,
      userProfile: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profile: newUser.profile || {},
        streak: newUser.streak || 0,
        lastLoginDate: newUser.lastLoginDate || null,
        loginDates: newUser.loginDates || [],
        hasCompletedOnboarding: false,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    const lowercaseEmail = email.toLowerCase().trim();
    // Find user
    const user = await User.findOne({ email: lowercaseEmail });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT (No expiration)
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.json({
      token,
      userProfile: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile || {},
        streak: user.streak || 0,
        lastLoginDate: user.lastLoginDate || null,
        loginDates: user.loginDates || [],
        hasCompletedOnboarding: user.profile?.hasCompletedOnboarding || false,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    userProfile: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profile: req.user.profile || {},
      streak: req.user.streak || 0,
      lastLoginDate: req.user.lastLoginDate || null,
      loginDates: req.user.loginDates || [],
      hasCompletedOnboarding: req.user.profile?.hasCompletedOnboarding || false,
    },
  });
});

// @route   POST /api/auth/profile
// @desc    Save/update onboarding questionnaire answers
router.post('/profile', authenticateToken, async (req, res) => {
  const { age, severity, triggers, inhaler, frequency } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.profile = {
      age: age ? Number(age) : undefined,
      severity,
      triggers,
      inhaler,
      frequency,
      hasCompletedOnboarding: true,
    };

    await user.save();

    res.json({
      userProfile: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        hasCompletedOnboarding: true,
      },
    });
  } catch (err) {
    console.error('Save profile error:', err);
    res.status(500).json({ error: 'Server error saving setup profile.' });
  }
});

// @route   POST /api/auth/emergency-contact
// @desc    Update emergency contact number
router.post('/emergency-contact', authenticateToken, async (req, res) => {
  const { emergencyContact } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.profile) {
      user.profile = {};
    }
    user.profile.emergencyContact = emergencyContact || '';

    user.markModified('profile');
    await user.save();

    res.json({
      ok: true,
      emergencyContact: user.profile.emergencyContact,
    });
  } catch (err) {
    console.error('Save emergency contact error:', err);
    res.status(500).json({ error: 'Server error saving emergency contact.' });
  }
});

// @route   POST /api/auth/streak
// @desc    Update user login streak details
router.post('/streak', authenticateToken, async (req, res) => {
  const { streak, lastLoginDate, loginDates } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.streak = streak || 0;
    user.lastLoginDate = lastLoginDate || null;
    user.loginDates = loginDates || [];

    await user.save();
    res.json({ ok: true, streak: user.streak });
  } catch (err) {
    console.error('Save streak error:', err);
    res.status(500).json({ error: 'Server error saving streak.' });
  }
});

// @route   DELETE /api/auth/delete
// @desc    Delete user account and all associated records permanently from MongoDB
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Delete all associated symptom logs
    await SymptomLog.deleteMany({ userId });

    // 2. Delete all associated breathing sessions
    await Session.deleteMany({ userId });

    // 3. Delete all associated audio reports
    await AudioReport.deleteMany({ userId });

    // 4. Delete the User record itself
    await User.findByIdAndDelete(userId);

    res.json({ ok: true, message: 'Account and all associated respiratory logs have been permanently deleted.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error occurred during account deletion.' });
  }
});

// ─── GMAIL REST API HELPERS ───────────────────────────────────────────────────
// Pure HTTPS (port 443) — no SMTP — works on Railway & Render.

async function getGmailAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GMAIL_CLIENT_ID     || '',
      client_secret: process.env.GMAIL_CLIENT_SECRET || '',
      refresh_token: process.env.GMAIL_REFRESH_TOKEN || '',
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Gmail OAuth token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function sendGmailEmail(to, subject, htmlBody) {
  const accessToken = await getGmailAccessToken();
  const rawMessage = [
    `From: AsthmaSense <${process.env.EMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody,
  ].join('\r\n');
  const encoded = Buffer.from(rawMessage).toString('base64url');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gmail API send failed (${res.status})`);
  }
}

// ─── FORGOT PASSWORD ENDPOINTS ────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit OTP, saves it to DB (expires 10 min), and emails it to the user.
 * Always returns the same success response to prevent email enumeration.
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailLower = email.trim().toLowerCase();
    const user = await User.findOne({ email: emailLower });

    // Always return success — don't reveal whether the email is registered
    if (!user) {
      return res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Replace any existing OTP for this email with a fresh one
    await PasswordResetOtp.deleteMany({ email: emailLower });
    await PasswordResetOtp.create({ email: emailLower, otp, expiresAt });

    // Send OTP via Gmail REST API
    await sendGmailEmail(
      emailLower,
      'Your AsthmaSense Password Reset OTP',
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4A9EFF 0%, #2D7DD2 100%); padding: 28px 32px; text-align: center;">
            <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Asthma<span style="color: #bfdbfe;">Sense</span></span>
            <p style="color: #dbeafe; font-size: 13px; margin: 6px 0 0 0;">AI-Powered Respiratory Health</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">Password Reset Request</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 22px; margin: 0 0 28px 0;">We received a request to reset your AsthmaSense account password. Use the one-time code below. It expires in <strong style="color: #0f172a;">10 minutes</strong>.</p>
            <div style="background: #eff6ff; border: 2px solid #4A9EFF; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
              <p style="color: #4A9EFF; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px 0;">Your OTP Code</p>
              <div style="font-size: 40px; font-weight: 800; color: #0f172a; letter-spacing: 12px;">${otp}</div>
            </div>
            <div style="background: #fefce8; border-left: 3px solid #eab308; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
              <p style="color: #713f12; font-size: 13px; margin: 0;">⚠️ If you did not request this, ignore this email. Your password will remain unchanged.</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">This code is valid for a single use only and will expire after 10 minutes.</p>
          </div>
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 AsthmaSense · AI-Powered Respiratory Health</p>
            <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0 0 0;">Do not reply to this email · This is an automated message</p>
          </div>
        </div>`
    );

    console.log(`[Auth] Password reset OTP sent to: ${emailLower}`);
    res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
  } catch (err) {
    console.error('Error in /api/auth/forgot-password:', err);
    res.status(500).json({ error: err.message || 'Failed to send OTP email. Please try again.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP is correct and not expired.
 * The OTP is NOT deleted here — it is kept so reset-password can re-verify it.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const emailLower = email.trim().toLowerCase();
    const record = await PasswordResetOtp.findOne({ email: emailLower });

    if (!record) {
      return res.status(400).json({ error: 'OTP not found or already used. Please request a new one.' });
    }

    if (new Date() > record.expiresAt) {
      await PasswordResetOtp.deleteMany({ email: emailLower });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Incorrect OTP. Please check and try again.' });
    }

    console.log(`[Auth] OTP verified successfully for: ${emailLower}`);
    res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (err) {
    console.error('Error in /api/auth/verify-otp:', err);
    res.status(500).json({ error: 'Internal server error during OTP verification.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Re-verifies the OTP, updates the user's hashed password, then invalidates the OTP.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const emailLower = email.trim().toLowerCase();
    const record = await PasswordResetOtp.findOne({ email: emailLower });

    if (!record) {
      return res.status(400).json({ error: 'OTP not found or already used. Please request a new one.' });
    }

    if (new Date() > record.expiresAt) {
      await PasswordResetOtp.deleteMany({ email: emailLower });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Incorrect OTP. Cannot reset password.' });
    }

    // Hash the new password and update the user document
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.updateOne({ email: emailLower }, { password: hashedPassword });

    // Invalidate the OTP immediately after successful use
    await PasswordResetOtp.deleteMany({ email: emailLower });

    console.log(`[Auth] Password reset successfully for: ${emailLower}`);
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Error in /api/auth/reset-password:', err);
    res.status(500).json({ error: 'Internal server error during password reset.' });
  }
});

export default router;
