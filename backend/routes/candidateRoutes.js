const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, authorize('candidate'), getProfile);
router.put('/profile', protect, authorize('candidate'), updateProfile);

module.exports = router;
