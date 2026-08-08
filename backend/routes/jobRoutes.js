const express = require('express');
const router = express.Router();
const { createJob, getJobs, getAllJobs, getJob, deleteJob } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('recruiter'), createJob);
router.get('/', protect, getJobs);
router.get('/all', protect, getAllJobs);
router.get('/:id', protect, getJob);
router.delete('/:id', protect, authorize('recruiter'), deleteJob);

module.exports = router;
