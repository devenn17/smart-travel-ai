import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getDbConnectionStatus } from '../config/db.js';

// Helper to sign JWT token
const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Standard cookie options
export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
});

// @desc    Register a new user account
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check database readiness
    const dbStatus = getDbConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify MONGODB_URI in server configuration.',
      });
    }

    // Input validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.',
        field: 'name',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.',
        field: 'name',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
        field: 'email',
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
        field: 'email',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
        field: 'password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
        field: 'password',
      });
    }

    // Check for existing account with the same email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
        field: 'email',
      });
    }

    // Hash password with bcrypt (cost factor 12)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Persist new user with strictly enforced 'user' role
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      isActive: true,
    });

    // Generate JWT token
    const token = signToken(newUser._id);

    // Set HttpOnly session cookie
    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Welcome to SmartTravel.',
      user: newUser.toSafeObject(),
      token,
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (code 11000) gracefully
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
        field: 'email',
      });
    }
    next(error);
  }
};

// @desc    Authenticate user & issue JWT
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check database readiness
    const dbStatus = getDbConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify MONGODB_URI in server configuration.',
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select passwordHash for verification
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      // Use generic invalid credentials message to prevent account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
        isDeactivated: true,
      });
    }

    // Generate JWT token
    const token = signToken(user._id);

    // Set HttpOnly session cookie
    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Authentication successful. Welcome back.',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private (requires valid JWT / cookie)
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toSafeObject ? req.user.toSafeObject() : req.user,
  });
};

// @desc    Sign out user and clear session cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  const cookieOptions = getCookieOptions();
  // Clear the token cookie by setting expires in the past
  res.clearCookie('token', {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });

  return res.status(200).json({
    success: true,
    message: 'Signed out successfully. Session terminated.',
  });
};
