const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { computeMatchScore } = require('../utils/matchingEngine');

/**
 * GET /api/match/job/:jobId
 * Get all candidates ranked by match score with 3-Tier Shortlisting Qualification evaluation.
 */
exports.getRankedCandidates = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const postedById = typeof job.postedBy === 'object' ? job.postedBy._id || job.postedBy : job.postedBy;
    if (String(postedById) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email phone skills experience preferredRole preferredLocation education projects isResumeVerified warningsCount accountStatus isSuspended trustScore');

    const totalAssessmentsCount = job.assessments?.length || (job.assessment ? 1 : 0);
    const overallJobThreshold = job.overallPassingThreshold || 60;

    const rankedCandidates = applications
      .filter(app => app.candidate)
      .map(app => {
        const candidate = app.candidate;
        const matchScore = computeMatchScore(candidate, job);
        const isResumeVerified = !!candidate.isResumeVerified && !candidate.isSuspended && candidate.accountStatus !== 'rejected';
        const isMatchPassed = matchScore >= 50;

        const results = app.assessmentResults || [];
        const overallScore = app.overallAssessmentScore || app.assessmentScore || (results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : null);
        const hasCompletedAll = results.length >= totalAssessmentsCount && totalAssessmentsCount > 0;
        const allIndividualPassed = results.length > 0 && results.every(r => r.passed);
        const meetsOverallGrade = overallScore !== null && overallScore >= overallJobThreshold;
        const allAssessmentsPassed = hasCompletedAll && allIndividualPassed && meetsOverallGrade;

        // Strict 3-Tier Qualification Rule
        const isShortlistEligible = isResumeVerified && isMatchPassed && allAssessmentsPassed;

        return {
          applicationId: app._id,
          candidate,
          matchScore,
          isMatchPassed,
          isResumeVerified,
          assessmentScore: overallScore,
          assessmentResults: results,
          allAssessmentsPassed,
          meetsOverallGrade,
          overallPassingThreshold: overallJobThreshold,
          totalAssessmentsCount,
          completedAssessmentsCount: results.length,
          isShortlistEligible,
          status: app.status,
          appliedAt: app.appliedAt
        };
      });

    // Sort by shortlist qualification first, then by match score
    rankedCandidates.sort((a, b) => {
      if (a.isShortlistEligible && !b.isShortlistEligible) return -1;
      if (!a.isShortlistEligible && b.isShortlistEligible) return 1;
      return b.matchScore - a.matchScore;
    });

    rankedCandidates.forEach((item, idx) => { item.rank = idx + 1; });

    const qualifiedCount = rankedCandidates.filter(c => c.isShortlistEligible).length;

    res.json({ 
      rankedCandidates, 
      qualifiedCount,
      totalCount: rankedCandidates.length,
      overallPassingThreshold: overallJobThreshold,
      job: { 
        title: job.title, 
        id: job._id, 
        skillsRequired: job.skillsRequired,
        overallPassingThreshold: overallJobThreshold,
        assessmentsCount: totalAssessmentsCount,
        assessments: job.assessments || (job.assessment ? [job.assessment] : [])
      } 
    });
  } catch (error) {
    console.error('Ranking error:', error);
    res.status(500).json({ message: 'Server error computing rankings' });
  }
};

/**
 * GET /api/match/candidate
 */
exports.getCandidateMatches = async (req, res) => {
  try {
    const candidate = await User.findById(req.user._id);
    const jobs = await Job.find({ isActive: true })
      .populate('postedBy', 'name company isCompanyVerified trustScore');

    const matches = jobs.map(job => ({
      job: {
        id: job._id,
        title: job.title,
        location: job.location,
        skillsRequired: job.skillsRequired,
        experienceRequired: job.experienceRequired,
        salary: job.salary,
        overallPassingThreshold: job.overallPassingThreshold || 60,
        assessmentsCount: job.assessments?.length || (job.assessment ? 1 : 0),
        assessments: job.assessments || (job.assessment ? [job.assessment] : []),
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
