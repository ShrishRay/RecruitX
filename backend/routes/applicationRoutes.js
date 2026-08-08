const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getCandidateApplications,
  getJobApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('candidate'), applyToJob);
router.get('/candidate', protect, authorize('candidate'), getCandidateApplications);
router.get('/job/:jobId', protect, authorize('recruiter'), getJobApplications);
router.put('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);

module.exports = router;
