const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a JWT token for authenticated user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /api/auth/google
 * Authenticate or register via Google Auth
 */
exports.googleLogin = async (req, res) => {
  try {
    const { email, name, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email from Google is required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    // If no user exists, create a new one (default to candidate)
    if (!user) {
      // Auto-generate a complex password since they login via Auth
      const randomPassword = Math.random().toString(36).slice(-8) + 'Xy1Z2@';
      
      user = await User.create({
        name: name || 'Google User',
        email,
        password: randomPassword,
        role: 'candidate',
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        photoURL // Return photo URL if available
      }
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ message: 'Server error during Google Authentication' });
  }
};


/**
 * POST /api/auth/signup
 * Register a new user (candidate or recruiter)
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either candidate or recruiter' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create user
    const userData = { name, email, password, role };
    if (role === 'recruiter' && company) {
      userData.company = company;
    }

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

/**
 * POST /api/auth/login
 * Authenticate existing user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user — must include password (excluded by default in schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user's data
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
