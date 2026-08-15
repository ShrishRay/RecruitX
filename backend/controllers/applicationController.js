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
    const candidate = await User.findById(req.user._id);
    if (candidate && (candidate.accountStatus === 'rejected' || candidate.isSuspended)) {
      return res.status(403).json({
        message: 'Account Rejected: Your account is suspended due to 3 unverified profile discrepancy warnings against uploaded resumes.',
        code: 'ACCOUNT_REJECTED',
        warningsCount: candidate.warningsCount || 3,
        rejectionReason: candidate.rejectionReason
      });
    }

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

    const populated = await Application.findById(application._id)
      .populate('job', 'title location salary assessments assessment overallPassingThreshold');

    res.status(201).json({ 
      application: populated,
      message: 'Application submitted! Please complete the required skill assessments to satisfy the overall passing grade and qualify for recruiter shortlisting.'
    });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ message: 'Server error applying to job' });
  }
};

/**
 * POST /api/applications/job/:jobId/assessment/:assessmentId?
 * Candidate takes and submits an assessment module for a job.
 * RULE: Candidates can take each assessment module strictly ONLY ONCE.
 */
exports.submitJobAssessment = async (req, res) => {
  try {
    const { jobId, assessmentId } = req.params;
    const { answers = [] } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const candidate = await User.findById(req.user._id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Locate the target assessment module
    let targetAssessment = null;
    if (job.assessments && job.assessments.length > 0) {
      if (assessmentId) {
        targetAssessment = job.assessments.find(a => String(a._id) === String(assessmentId) || String(a.id) === String(assessmentId));
      }
      if (!targetAssessment) {
        targetAssessment = job.assessments[0];
      }
    } else if (job.assessment && job.assessment.questions) {
      targetAssessment = job.assessment;
    }

    if (!targetAssessment || !targetAssessment.questions || targetAssessment.questions.length === 0) {
      return res.status(400).json({ message: 'Target assessment module not found or has no questions.' });
    }

    const currentAssessmentId = String(targetAssessment._id || targetAssessment.id || 'default');

    // Find existing application
    let application = await Application.findOne({ candidate: req.user._id, job: jobId });

    // STRICT 1-ATTEMPT ENFORCEMENT: Check if assessment module was already attempted
    if (application) {
      const existingResults = application.assessmentResults || [];
      const alreadyAttempted = existingResults.find(r => String(r.assessmentId) === currentAssessmentId);
      
      if (alreadyAttempted || (application.assessmentTakenAt && (!existingResults || existingResults.length === 0))) {
        return res.status(403).json({
          message: 'Assessment already completed. Recruiter technical assessments can only be attempted once per candidate.',
          code: 'ASSESSMENT_ALREADY_COMPLETED',
          alreadyTaken: true,
          score: alreadyAttempted?.score || application.assessmentScore,
          passed: alreadyAttempted?.passed || application.assessmentPassed,
          takenAt: alreadyAttempted?.takenAt || application.assessmentTakenAt
        });
      }
    }

    // Evaluate answers
    let correctCount = 0;
    const detailedAnswers = [];
    const questions = targetAssessment.questions;

    questions.forEach((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected !== undefined && Number(selected) === q.correctAnswer;
      if (isCorrect) correctCount++;

      detailedAnswers.push({
        questionIndex: idx,
        selectedOption: selected !== undefined ? Number(selected) : -1,
        isCorrect,
        questionText: q.question,
        skill: q.skill || targetAssessment.skill
      });
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const threshold = targetAssessment.passingThreshold || job.overallPassingThreshold || 60;
    const passed = score >= threshold;

    const matchScore = computeMatchScore(candidate, job);
    let existingResults = application?.assessmentResults || [];
    const otherResults = existingResults.filter(r => String(r.assessmentId) !== currentAssessmentId);
    
    const newResult = {
      assessmentId: currentAssessmentId,
      title: targetAssessment.title || 'Skill Assessment',
      skill: targetAssessment.skill || '',
      score,
      passingThreshold: threshold,
      passed,
      takenAt: new Date(),
      answers: detailedAnswers
    };

    const updatedResults = [...otherResults, newResult];

    // Determine if all required assessments for the job are completed and passed
    const requiredAssessments = job.assessments && job.assessments.length > 0
      ? job.assessments.filter(a => a.isEnabled !== false)
      : [targetAssessment];

    const allIndividualPassed = requiredAssessments.every(reqA => {
      const reqId = String(reqA._id || reqA.id || 'default');
      const resEntry = updatedResults.find(r => String(r.assessmentId) === reqId);
      return resEntry && resEntry.passed === true;
    });

    const avgScore = Math.round(updatedResults.reduce((sum, r) => sum + r.score, 0) / updatedResults.length);
    const overallJobThreshold = job.overallPassingThreshold || 60;
    const meetsOverallThreshold = avgScore >= overallJobThreshold && updatedResults.length >= requiredAssessments.length;
    const finalAllPassed = allIndividualPassed && meetsOverallThreshold;

    if (!application) {
      application = await Application.create({
        candidate: req.user._id,
        job: jobId,
        matchScore,
        status: 'applied',
        appliedAt: new Date(),
        assessmentResults: updatedResults,
        allAssessmentsPassed: finalAllPassed,
        overallAssessmentScore: avgScore,
        assessmentScore: score,
        assessmentPassed: passed,
        assessmentTakenAt: new Date(),
        assessmentAnswers: detailedAnswers
      });
    } else {
      application = await Application.findByIdAndUpdate(
        application._id,
        {
          assessmentResults: updatedResults,
          allAssessmentsPassed: finalAllPassed,
          overallAssessmentScore: avgScore,
          assessmentScore: score,
          assessmentPassed: passed,
          assessmentTakenAt: new Date(),
          assessmentAnswers: detailedAnswers,
          matchScore
        },
        { returnDocument: 'after' }
      );
    }

    // Check 3-Tier Shortlisting Qualification Rule:
    // 1. Resume verified (0 strikes)
    // 2. Match Score >= 50%
    // 3. Overall Assessment Score >= job.overallPassingThreshold & all modules completed
    const isResumeVerified = !!candidate.isResumeVerified && !candidate.isSuspended && candidate.accountStatus !== 'rejected';
    const isMatchPassed = matchScore >= 50;
    const isQualifiedForShortlisting = isResumeVerified && isMatchPassed && finalAllPassed;

    res.json({
      assessmentId: currentAssessmentId,
      title: targetAssessment.title,
      score,
      totalQuestions,
      correctCount,
      passingThreshold: threshold,
      overallPassingThreshold: overallJobThreshold,
      passed,
      allAssessmentsPassed: finalAllPassed,
      overallAssessmentScore: avgScore,
      matchScore,
      isResumeVerified,
      isQualifiedForShortlisting,
      results: updatedResults,
      message: passed 
        ? `Assessment "${targetAssessment.title}" Completed with ${score}% (Threshold: ${threshold}%). Overall Score: ${avgScore}% (Job Threshold: ${overallJobThreshold}%).`
        : `Assessment Score: ${score}%. Passing threshold was ${threshold}%.`,
      application
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ message: 'Server error evaluating assessment' });
  }
};

/**
 * GET /api/applications/candidate
 */
exports.getCandidateApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate({
        path: 'job',
        select: 'title location skillsRequired experienceRequired salary postedBy assessments assessment overallPassingThreshold',
        populate: {
          path: 'postedBy',
          select: 'name company isCompanyVerified trustScore'
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
 */
exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const postedById = typeof job.postedBy === 'object' ? job.postedBy._id || job.postedBy : job.postedBy;
    if (String(postedById) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email phone skills experience preferredRole preferredLocation education projects isResumeVerified warningsCount accountStatus isSuspended trustScore isEmailVerified isPhoneVerified')
      .sort({ matchScore: -1 });

    const totalAssessmentsCount = job.assessments?.length || (job.assessment ? 1 : 0);
    const overallJobThreshold = job.overallPassingThreshold || 60;

    const processedApplications = applications
      .filter(app => app.candidate)
      .map(app => {
        const candidate = app.candidate;
        const isResumeVerified = !!candidate.isResumeVerified && !candidate.isSuspended && candidate.accountStatus !== 'rejected';
        const matchScore = app.matchScore !== undefined ? app.matchScore : computeMatchScore(candidate, job);
        const isMatchPassed = matchScore >= 50;

        const results = app.assessmentResults || [];
        const overallScore = app.overallAssessmentScore || app.assessmentScore || (results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : null);
        const hasCompletedAll = results.length >= totalAssessmentsCount && totalAssessmentsCount > 0;
        const allIndividualPassed = results.length > 0 && results.every(r => r.passed);
        const meetsOverallGrade = overallScore !== null && overallScore >= overallJobThreshold;
        const allAssessmentsPassed = hasCompletedAll && allIndividualPassed && meetsOverallGrade;

        // Strict 3-Tier Qualification Rule: Only allow candidates satisfying all 3 requirements
        const isShortlistEligible = isResumeVerified && isMatchPassed && allAssessmentsPassed;

        return {
          applicationId: app._id,
          candidate: {
            id: candidate._id,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            skills: candidate.skills,
            experience: candidate.experience,
            preferredRole: candidate.preferredRole,
            preferredLocation: candidate.preferredLocation,
            education: candidate.education,
            projects: candidate.projects,
            isResumeVerified,
            warningsCount: candidate.warningsCount || 0,
            accountStatus: candidate.accountStatus,
            isSuspended: !!candidate.isSuspended,
            trustScore: candidate.trustScore || 0
          },
          matchScore,
          assessmentScore: overallScore,
          assessmentResults: results,
          allAssessmentsPassed,
          meetsOverallGrade,
          overallPassingThreshold: overallJobThreshold,
          totalAssessmentsCount,
          completedAssessmentsCount: results.length,
          isResumeVerified,
          isShortlistEligible,
          status: app.status,
          appliedAt: app.appliedAt
        };
      });

    const qualifiedCandidates = processedApplications.filter(app => app.isShortlistEligible);
    const pendingCandidates = processedApplications.filter(app => !app.isShortlistEligible);

    res.json({
      job: {
        id: job._id,
        title: job.title,
        skillsRequired: job.skillsRequired,
        overallPassingThreshold: overallJobThreshold,
        assessments: job.assessments || (job.assessment ? [job.assessment] : [])
      },
      totalApplicants: processedApplications.length,
      qualifiedCount: qualifiedCandidates.length,
      pendingCount: pendingCandidates.length,
      overallPassingThreshold: overallJobThreshold,
      qualifiedCandidates,
      allApplications: processedApplications,
      applications: processedApplications
    });
  } catch (error) {
    console.error('Fetch job applications error:', error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

/**
 * PUT /api/applications/:id/status
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

    const updated = await Application.findByIdAndUpdate(
      req.params.id, 
      { status },
      { returnDocument: 'after' }
    ).populate('candidate', 'name email skills experience isResumeVerified');

    res.json({ 
      application: updated,
      message: `Candidate application marked as ${status}!`
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error updating application' });
  }
};
