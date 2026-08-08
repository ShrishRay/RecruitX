const express = require('express');
const router = express.Router();
const { signup, login, googleLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
