const Job = require('../models/Job');
const Application = require('../models/Application');
const { generateMultipleAssessmentsForSkills } = require('../utils/assessmentGenerator');

const POPULATE_RECRUITER_FIELDS = 'name company companyWebsite companyRegNumber isCompanyVerified trustScore isEmailVerified isPhoneVerified';

/**
 * POST /api/jobs
 * Create a new job posting with multiple skill assessments, customizable thresholds, time limits, and overall passing grade.
 */
exports.createJob = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      skillsRequired, 
      experienceRequired, 
      location, 
      salary,
      overallPassingThreshold,
      assessments,
      assessment 
    } = req.body;

    if (!title || !description || !experienceRequired) {
      return res.status(400).json({ message: 'Title, description, and experience are required' });
    }

    const skills = Array.isArray(skillsRequired) ? skillsRequired : [];
    const overallThresholdNum = overallPassingThreshold ? Number(overallPassingThreshold) : 60;

    // Support multiple assessments or single assessment array
    let finalAssessments = [];
    if (Array.isArray(assessments) && assessments.length > 0) {
      finalAssessments = assessments.map((a, idx) => ({
        title: a.title || `Round ${idx + 1}: ${a.skill || 'Technical'} Assessment`,
        description: a.description || `Assessment evaluating ${a.skill || 'technical'} competency.`,
        skill: a.skill || skills[idx] || 'General',
        passingThreshold: a.passingThreshold ? Number(a.passingThreshold) : overallThresholdNum,
        timeLimit: a.timeLimit ? Number(a.timeLimit) : 15,
        isEnabled: a.isEnabled !== false,
        questions: Array.isArray(a.questions) ? a.questions : []
      }));
    } else if (assessment && Array.isArray(assessment.questions) && assessment.questions.length > 0) {
      finalAssessments = [{
        title: assessment.title || `${title} - Skill Assessment`,
        description: assessment.description || '',
        skill: skills[0] || 'General',
        passingThreshold: assessment.passingThreshold ? Number(assessment.passingThreshold) : overallThresholdNum,
        timeLimit: assessment.timeLimit ? Number(assessment.timeLimit) : 15,
        isEnabled: assessment.isEnabled !== false,
        questions: assessment.questions
      }];
    } else {
      // Auto-generate multiple module assessments for required skills
      finalAssessments = generateMultipleAssessmentsForSkills(skills, title, overallThresholdNum, 15);
    }

    const job = await Job.create({
      title,
      description,
      skillsRequired: skills,
      experienceRequired,
      location: location || 'Remote',
      salary: salary || 'Competitive',
      postedBy: req.user._id,
      isActive: true,
      overallPassingThreshold: overallThresholdNum,
      assessments: finalAssessments,
      assessment: finalAssessments[0] || null
    });

    res.status(201).json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error creating job' });
  }
};

/**
 * POST /api/jobs/generate-assessment
 * Preview multiple assessment modules based on skills required with threshold and time limit
 */
exports.generateAssessmentPreview = async (req, res) => {
  try {
    const { skillsRequired = [], title = 'Technical Role', passingThreshold = 60, timeLimit = 15 } = req.body;
    const assessments = generateMultipleAssessmentsForSkills(skillsRequired, title, passingThreshold, timeLimit);
    res.json({ assessments, assessment: assessments[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error generating assessment modules' });
  }
};

/**
 * GET /api/jobs
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
 * GET /api/jobs/all
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
 * GET /api/jobs/:id/assessments
 * Returns all assessment modules for a job (hiding answers for candidates)
 */
exports.getJobAssessments = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const isOwnerRecruiter = req.user && job.postedBy.toString() === req.user._id.toString();

    let candidateApp = null;
    if (req.user && req.user.role === 'candidate') {
      candidateApp = await Application.findOne({ candidate: req.user._id, job: job._id });
    }

    let assessments = job.assessments;
    if (!assessments || assessments.length === 0) {
      if (job.assessment && job.assessment.questions && job.assessment.questions.length > 0) {
        assessments = [job.assessment];
      } else {
        assessments = generateMultipleAssessmentsForSkills(job.skillsRequired, job.title, job.overallPassingThreshold || 60, 15);
        job.assessments = assessments;
        job.assessment = assessments[0];
        await job.save();
      }
    }

    const existingResults = candidateApp?.assessmentResults || [];

    const safeAssessments = assessments.map(a => {
      const aId = String(a._id || a.id || 'default');
      const completedResult = existingResults.find(r => String(r.assessmentId) === aId);
      const isAlreadyTaken = !!completedResult || (candidateApp?.assessmentTakenAt && (!existingResults || existingResults.length === 0));

      const safeQuestions = (a.questions || []).map((q, idx) => {
        if (isOwnerRecruiter) return q;
        return {
          _id: q._id,
          index: idx,
          question: q.question,
          options: q.options,
          skill: q.skill,
          difficulty: q.difficulty
        };
      });

      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        skill: a.skill,
        passingThreshold: a.passingThreshold || job.overallPassingThreshold || 60,
        timeLimit: a.timeLimit || 15,
        totalQuestions: safeQuestions.length,
        questions: safeQuestions,
        isEnabled: a.isEnabled !== false,
        alreadyTaken: isAlreadyTaken,
        score: completedResult?.score !== undefined ? completedResult.score : (candidateApp?.assessmentScore || null),
        passed: completedResult?.passed !== undefined ? completedResult.passed : (candidateApp?.assessmentPassed || null),
        takenAt: completedResult?.takenAt || candidateApp?.assessmentTakenAt || null
      };
    });

    res.json({
      jobId: job._id,
      jobTitle: job.title,
      overallPassingThreshold: job.overallPassingThreshold || 60,
      totalAssessments: safeAssessments.length,
      assessments: safeAssessments,
      assessment: safeAssessments[0]
    });
  } catch (error) {
    console.error('Fetch assessments error:', error);
    res.status(500).json({ message: 'Server error loading assessments' });
  }
};

/**
 * GET /api/jobs/:id/assessment
 */
exports.getJobAssessment = async (req, res) => {
  return exports.getJobAssessments(req, res);
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
    res.json({ message: 'Job posting deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting job' });
  }
};
