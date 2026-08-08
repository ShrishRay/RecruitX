const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { computeMatchScore } = require('../utils/matchingEngine');

/**
 * GET /api/match/job/:jobId
 * Get all candidates ranked by match score for a specific job.
 */
exports.getRankedCandidates = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email skills experience preferredRole preferredLocation education projects');

    // Build ranked list with fresh match scores
    const rankedCandidates = applications
      .filter(app => app.candidate) // Only include apps with valid candidates
      .map(app => ({
        applicationId: app._id,
        candidate: app.candidate,
        matchScore: computeMatchScore(app.candidate, job),
        status: app.status,
        appliedAt: app.appliedAt
      }));

    // Sort by score descending and assign ranks
    rankedCandidates.sort((a, b) => b.matchScore - a.matchScore);
    rankedCandidates.forEach((item, idx) => { item.rank = idx + 1; });

    res.json({ rankedCandidates, job: { title: job.title, id: job._id } });
  } catch (error) {
    console.error('Ranking error:', error);
    res.status(500).json({ message: 'Server error computing rankings' });
  }
};

/**
 * GET /api/match/candidate
 * Get match scores for all available jobs for the logged-in candidate
 */
exports.getCandidateMatches = async (req, res) => {
  try {
    const candidate = await User.findById(req.user._id);
    const jobs = await Job.find({ isActive: true })
      .populate('postedBy', 'name company');

    const matches = jobs.map(job => ({
      job: {
        id: job._id,
        title: job.title,
        location: job.location,
        skillsRequired: job.skillsRequired,
        experienceRequired: job.experienceRequired,
        company: job.postedBy?.company || 'Unknown',
        recruiter: job.postedBy?.name || 'Unknown'
      },
      matchScore: computeMatchScore(candidate, job)
    }));

    matches.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ message: 'Server error computing matches' });
  }
};
