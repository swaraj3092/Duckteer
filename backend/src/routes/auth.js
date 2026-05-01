import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper: generate a random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: sign a JWT token
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── Password-Based Auth Routes ───────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Body: { phone, name, password }
 * Create a new account with phone + password.
 */
router.post('/signup', async (req, res) => {
  try {
    const { phone, name, password } = req.body;
    if (!phone || !password || !name) {
      return res.status(400).json({ message: 'Name, phone, and password are required.' });
    }
    if (phone.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10-digit phone number.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: 'An account with this phone number already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ phone, name, password: hashedPassword, isVerified: true });

    const token = signToken(user._id);
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user._id, phone: user.phone, name: user.name, role: user.role, patientId: user.patientId },
    });
  } catch (err) {
    console.error('[signup]', err);
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { phone, password }
 * Login with phone + password.
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required.' });
    }

    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up first.', code: 'USER_NOT_FOUND' });
    }
    if (!user.password) {
      return res.status(401).json({ message: 'Invalid password. Please try again.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password.' });
    }

    const token = signToken(user._id);
    res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: user._id, phone: user.phone, name: user.name, role: user.role, patientId: user.patientId },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Body: { phone }
 * Generates a reset token (in production, SMS this to the user).
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'No account found with this phone number.' });

    // Generate a random 6-digit reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // In production: send this via SMS (Twilio / MSG91)
    console.log(`[RESET] Phone: +91${phone} → Reset Token: ${resetToken}`);

    res.status(200).json({
      message: 'Password reset code sent to your phone.',
      // Only expose in dev — remove in production
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    });
  } catch (err) {
    console.error('[forgot-password]', err);
    res.status(500).json({ message: 'Failed to process request. Please try again.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { phone, resetToken, newPassword }
 * Validates the token and sets a new password.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, resetToken, newPassword } = req.body;
    if (!phone || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Phone, reset code, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findOne({
      phone,
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code. Please request a new one.' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = signToken(user._id);
    res.status(200).json({
      message: 'Password reset successfully! You are now logged in.',
      token,
      user: { id: user._id, phone: user.phone, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('[reset-password]', err);
    res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
});


/**
 * POST /api/auth/send-otp
 * Body: { phone: "9876543210" }
 * Creates or finds user, generates OTP (prints to console in dev), returns success.
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ message: 'A valid 10-digit phone number is required.' });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = { code: otp, expiresAt };
    await user.save();

    // In production: integrate SMS gateway (Twilio / MSG91) here
    console.log(`[OTP] Phone: +91${phone} → OTP: ${otp}`);

    res.status(200).json({
      message: 'OTP sent successfully.',
      // Return OTP in dev mode only – remove this in production!
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (err) {
    console.error('[send-otp]', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { phone: "9876543210", otp: "123456" }
 * Verifies OTP, marks user as verified, returns JWT token.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required.' });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please request an OTP first.' });
    }

    // Special case for demo testing in development mode
    if (process.env.NODE_ENV !== "production" && phone === "9876543210" && otp === "123456") {
      try {
        if (user) {
          user.otp = undefined;
          user.isVerified = true;
          await user.save();
        }
      } catch (dbErr) {
        console.warn('[auth] DB error during demo verify, continuing anyway.');
      }
      
      const token = signToken(user ? user._id : '507f1f77bcf86cd799439011'); // Mock ID if user not found
      return res.status(200).json({
        message: 'OTP verified successfully (Demo Mode).',
        token,
        user: user || { id: '507f1f77bcf86cd799439011', name: 'Demo Patient', phone, role: 'patient' }
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please request an OTP first.' });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
    
    // Clear OTP and mark verified
    user.otp = undefined;
    user.isVerified = true;
    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      message: 'OTP verified successfully.',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        patientId: user.patientId,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error('[verify-otp]', err);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

/**
 * POST /api/auth/google
 * Body: { googleId, email, name }
 * Simulated Google OAuth – in production, verify the Google token server-side.
 */
router.post('/google', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Use email as unique identifier for Google users (no phone)
    let user = await User.findOne({ email });
    if (!user) {
      // Create a placeholder phone for Google users
      user = new User({
        email,
        name: name || '',
        phone: `G_${email}`, // Google users don't have a phone initially
        isVerified: true,
      });
      await user.save();
    } else {
      user.isVerified = true;
      await user.save();
    }

    const token = signToken(user._id);

    res.status(200).json({
      message: 'Google login successful.',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientId: user.patientId,
      },
    });
  } catch (err) {
    console.error('[google-auth]', err);
    res.status(500).json({ message: 'Google login failed. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Protected: requires Authorization: Bearer <token>
 * Returns the current user's profile.
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-otp -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    console.error('[auth/me]', err);
    res.status(500).json({ message: 'Failed to fetch user profile.' });
  }
});

/**
 * POST /api/auth/doctor/register
 * Protected: requires Authorization: Bearer <token>
 * Upgrades a patient account to a doctor and creates a Doctor profile.
 */
router.post('/doctor/register', protect, async (req, res) => {
  try {
    const { name, specialty, experience, languages, feeVideo, feeChat, bio } = req.body;
    
    if (!name || !specialty) {
      return res.status(400).json({ message: 'Name and specialty are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Check if user is already a doctor
    let doctor = await Doctor.findOne({ userId: user._id });
    if (doctor) {
      return res.status(400).json({ message: 'User is already registered as a doctor.' });
    }

    // Update user role
    user.role = 'doctor';
    user.name = name;
    await user.save();

    // Create the Doctor profile
    doctor = new Doctor({
      name,
      specialty,
      experience: experience || '',
      languages: languages || ['English'],
      bio: bio || '',
      consultationFee: {
        video: Number(feeVideo) || 599,
        chat: Number(feeChat) || 399,
      },
      userId: user._id,
      availability: [] // Empty to start
    });
    await doctor.save();

    // Re-sign token with new role (optional, since role isn't in payload currently, but good practice)
    const token = signToken(user._id);

    res.status(201).json({
      message: 'Doctor profile created successfully.',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
      doctor
    });
  } catch (err) {
    console.error('[doctor/register]', err);
    res.status(500).json({ message: 'Failed to register doctor profile. Please try again.' });
  }
});

export default router;
