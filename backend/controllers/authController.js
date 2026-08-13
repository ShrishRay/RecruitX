const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a JWT token for authenticated user
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'recruitx_jwt_secret_key_2026_super_secret';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
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
        photoURL,
        phone: user.phone || '',
        isEmailVerified: !!user.isEmailVerified,
        isPhoneVerified: !!user.isPhoneVerified,
        trustScore: user.trustScore !== undefined ? user.trustScore : ((user.isEmailVerified ? 50 : 0) + (user.isPhoneVerified ? 50 : 0))
      }
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ message: 'Server error during Google Authentication' });
  }
};


/**
 * POST /api/auth/signup
 * Register a new user (candidate or recruiter) with required phone number
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, role, company } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ message: 'Please provide all required fields, including mobile phone number.' });
    }

    if (!['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either candidate or recruiter' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create user with registered email and phone
    const userData = { name, email, password, phone, role };
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
        company: user.company,
        phone: user.phone,
        isEmailVerified: false,
        isPhoneVerified: false,
        trustScore: 0
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
        company: user.company,
        phone: user.phone || '',
        isEmailVerified: !!user.isEmailVerified,
        isPhoneVerified: !!user.isPhoneVerified,
        trustScore: user.trustScore !== undefined ? user.trustScore : ((user.isEmailVerified ? 50 : 0) + (user.isPhoneVerified ? 50 : 0))
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
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const trustScore = (user.isEmailVerified ? 50 : 0) + (user.isPhoneVerified ? 50 : 0);
    res.json({ 
      user: {
        ...user,
        trustScore
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const { sendEmailOtp } = require('../utils/emailService');
const { sendSmsOtp } = require('../utils/smsService');

// In-memory OTP store: key -> { code, target, expiresAt }
const otpStore = {};

/**
 * POST /api/auth/send-otp
 * Generate and send real-time OTP strictly to the registered profile email/phone
 */
exports.sendOtp = async (req, res) => {
  try {
    const { type, target } = req.body; // type: 'email' | 'phone'
    if (!type || !['email', 'phone'].includes(type)) {
      return res.status(400).json({ message: 'Invalid verification type. Must be email or phone.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let destination = '';

    if (type === 'email') {
      destination = user.email;
    } else if (type === 'phone') {
      if (!user.phone) {
        return res.status(400).json({ message: 'No mobile phone number found on your profile. Phone number must be registered during signup.' });
      }
      destination = user.phone;
    }

    // Generate dynamic 6-digit random OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in OTP memory store (valid for 10 minutes)
    const storeKey = `${req.user._id}_${type}`;
    otpStore[storeKey] = {
      code: generatedOtp,
      target: destination,
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    console.log(`\n==================================================`);
    console.log(`🔐 [RECRUITX STRICT PROFILE OTP DISPATCH]`);
    console.log(`   User: ${user.name} (${user.role})`);
    console.log(`   Type: ${type.toUpperCase()}`);
    console.log(`   Registered Destination: ${destination}`);
    console.log(`   Code: ${generatedOtp}`);
    console.log(`==================================================\n`);

    // Dispatch real-time OTP via Nodemailer or Twilio/2Factor/Fast2SMS
    if (type === 'email') {
      await sendEmailOtp(destination, generatedOtp);
    } else if (type === 'phone') {
      await sendSmsOtp(destination, generatedOtp);
    }

    res.json({
      message: `Verification code sent to your registered ${type === 'email' ? 'email address' : 'phone number'} (${destination})!`,
      target: destination
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Error generating and dispatching verification code' });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify dynamic OTP code and update user email/phone verification status + trust score
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { type, otp, target, phone, email } = req.body;

    if (!type || !['email', 'phone'].includes(type)) {
      return res.status(400).json({ message: 'Type must be email or phone' });
    }

    const storeKey = `${req.user._id}_${type}`;
    const storedRecord = otpStore[storeKey];

    // Check if OTP matches generated dynamic code or demo override '123456'
    const isValid = (storedRecord && storedRecord.code === String(otp).trim()) || String(otp).trim() === '123456';

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP code. Please enter the correct 6-digit code.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {};
    if (type === 'email') {
      updates.isEmailVerified = true;
      if (email || target) updates.email = email || target;
    } else if (type === 'phone') {
      updates.isPhoneVerified = true;
      if (phone || target) updates.phone = phone || target;
    }

    const isEmailVerified = type === 'email' ? true : !!user.isEmailVerified;
    const isPhoneVerified = type === 'phone' ? true : !!user.isPhoneVerified;
    const trustScore = (isEmailVerified ? 50 : 0) + (isPhoneVerified ? 50 : 0);
    updates.trustScore = trustScore;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { returnDocument: 'after' });

    // Clean up OTP store
    delete otpStore[storeKey];

    res.json({
      message: `${type === 'email' ? 'Email' : 'Phone number'} (${target || phone || email || 'address'}) verified successfully!`,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        company: updatedUser.company,
        phone: updatedUser.phone || '',
        isEmailVerified: !!updatedUser.isEmailVerified,
        isPhoneVerified: !!updatedUser.isPhoneVerified,
        trustScore
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};
