const express = require('express');
const router = express.Router();
const { getRankedCandidates, getCandidateMatches } = require('../controllers/matchController');
const { protect, authorize } = require('../middleware/auth');

router.get('/job/:jobId', protect, authorize('recruiter'), getRankedCandidates);
router.get('/candidate', protect, authorize('candidate'), getCandidateMatches);

module.exports = router;
