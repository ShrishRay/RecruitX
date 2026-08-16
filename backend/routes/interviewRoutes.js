const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  getCandidateInterviews,
  getRecruiterInterviews,
  getJobInterviews,
  rescheduleInterview,
  updateInterviewStatus
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middleware/auth');

// Recruiter routes
router.post('/schedule', protect, authorize('recruiter'), scheduleInterview);
router.get('/recruiter', protect, authorize('recruiter'), getRecruiterInterviews);
router.get('/job/:jobId', protect, authorize('recruiter'), getJobInterviews);
router.put('/:id/reschedule', protect, authorize('recruiter'), rescheduleInterview);
router.put('/:id/status', protect, authorize('recruiter'), updateInterviewStatus);

// Candidate routes
router.get('/candidate', protect, authorize('candidate'), getCandidateInterviews);

module.exports = router;
