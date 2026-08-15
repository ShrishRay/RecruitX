const Job = require('../models/Job');

const POPULATE_RECRUITER_FIELDS = 'name company companyWebsite companyRegNumber isCompanyVerified trustScore isEmailVerified isPhoneVerified';

/**
 * POST /api/jobs
 */
exports.createJob = async (req, res) => {
  try {
    const { title, description, skillsRequired, experienceRequired, location, salary } = req.body;

    if (!title || !description || !experienceRequired) {
      return res.status(400).json({ message: 'Title, description, and experience are required' });
    }

    const job = await Job.create({
      title,
      description,
      skillsRequired: skillsRequired || [],
      experienceRequired,
      location: location || 'Remote',
      salary,
      postedBy: req.user._id,
      isActive: true
    });

    res.status(201).json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error creating job' });
  }
};

/**
 * GET /api/jobs — recruiter sees their own jobs
 */
exports.getJobs = async (req, res) => {
  try {
    let jobs;
    if (req.user.role === 'recruiter') {
      jobs = await Job.find({ postedBy: req.user._id })
        .populate('postedBy', POPULATE_RECRUITER_FIELDS)
        .sort({ createdAt: -1 });
    } else {
      jobs = await Job.find({ isActive: true })
        .populate('postedBy', POPULATE_RECRUITER_FIELDS)
        .sort({ createdAt: -1 });
    }

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
};

/**
 * GET /api/jobs/all — all active jobs (for candidates)
 */
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('postedBy', POPULATE_RECRUITER_FIELDS)
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
};

/**
 * GET /api/jobs/:id
 */
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', POPULATE_RECRUITER_FIELDS);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching job' });
  }
};

/**
 * DELETE /api/jobs/:id
 */
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const postedById = typeof job.postedBy === 'object' ? job.postedBy._id || job.postedBy : job.postedBy;
    if (String(postedById) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting job' });
  }
};
