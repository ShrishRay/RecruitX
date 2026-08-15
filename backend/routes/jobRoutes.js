const express = require('express');
const router = express.Router();
const { 
  createJob, 
  getJobs, 
  getAllJobs, 
  getJob, 
  getJobAssessment,
  generateAssessmentPreview,
  deleteJob 
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('recruiter'), createJob);
router.post('/generate-assessment', protect, authorize('recruiter'), generateAssessmentPreview);
router.get('/', protect, getJobs);
router.get('/all', protect, getAllJobs);
router.get('/:id', protect, getJob);
router.get('/:id/assessment', protect, getJobAssessment);
router.get('/:id/assessments', protect, getJobAssessment);
router.delete('/:id', protect, authorize('recruiter'), deleteJob);

module.exports = router;
