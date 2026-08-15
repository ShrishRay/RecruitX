const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  uploadAndValidateResume,
  generateMockTest,
  submitMockTest
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, authorize('candidate'), getProfile);
router.put('/profile', protect, authorize('candidate'), updateProfile);
router.post('/resume', protect, authorize('candidate'), uploadAndValidateResume);
router.post('/mock-test/generate', protect, authorize('candidate'), generateMockTest);
router.post('/mock-test/submit', protect, authorize('candidate'), submitMockTest);

module.exports = router;
