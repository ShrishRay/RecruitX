const express = require('express');
const router = express.Router();
const { signup, login, googleLogin, getMe, sendOtp, verifyOtp, verifyCompany } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.post('/send-otp', protect, sendOtp);
router.post('/verify-otp', protect, verifyOtp);
router.post('/verify-company', protect, verifyCompany);

module.exports = router;
