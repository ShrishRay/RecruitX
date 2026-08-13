const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { computeMatchScore } = require('../utils/matchingEngine');

/**
 * POST /api/applications
 * Apply to a job (candidate only). Auto-computes match score.
 */
exports.applyToJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existing = await Application.findOne({ candidate: req.user._id, job: jobId });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Get full candidate profile for verification check & match scoring
    const candidate = await User.findById(req.user._id);
    if (!candidate || !candidate.isEmailVerified || !candidate.isPhoneVerified) {
      return res.status(403).json({
        message: 'Candidate verification required. Please verify both your email address and phone number before applying for job openings.',
        code: 'VERIFICATION_REQUIRED',
        isEmailVerified: !!candidate?.isEmailVerified,
        isPhoneVerified: !!candidate?.isPhoneVerified
      });
    }

    // Compute match score
    const matchScore = computeMatchScore(candidate, job);

    const application = await Application.create({
      candidate: req.user._id,
      job: jobId,
      matchScore,
      status: 'applied',
      appliedAt: new Date()
    });

    // Populate job info for response
    const populated = await Application.findById(application._id)
      .populate('job', 'title location salary');

    res.status(201).json({ application: populated });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ message: 'Server error applying to job' });
  }
};

/**
 * GET /api/applications/candidate
 * Get all applications for the logged-in candidate
 */
exports.getCandidateApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate({
        path: 'job',
        select: 'title location skillsRequired experienceRequired salary postedBy',
        populate: {
          path: 'postedBy',
          select: 'name company'
        }
      })
      .sort({ appliedAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

/**
 * GET /api/applications/job/:jobId
 * Get all applications for a specific job (recruiter only)
 */
exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email skills experience preferredRole preferredLocation education projects')
      .sort({ matchScore: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Fetch job applications error:', error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

/**
 * PUT /api/applications/:id/status
 * Update application status — shortlist or reject (recruiter only)
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be shortlisted or rejected' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const jobId = typeof application.job === 'object' ? application.job._id || application.job : application.job;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const postedById = typeof job.postedBy === 'object' ? job.postedBy._id || job.postedBy : job.postedBy;
    if (String(postedById) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    await Application.findByIdAndUpdate(req.params.id, { status });
    const updated = await Application.findById(req.params.id).populate('candidate', 'name email skills experience');

    res.json({ application: updated });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error updating application' });
  }
};
