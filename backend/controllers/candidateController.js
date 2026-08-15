const User = require('../models/User');
const { extractTextFromPdf } = require('../utils/resumeValidator');
const { validateResumeWithOpenSourceLLM, OPEN_SOURCE_MODEL } = require('../utils/llmResumeValidator');

/**
 * GET /api/candidate/profile
 * Get authenticated candidate's profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        skills: user.skills || [],
        experience: user.experience || 0,
        projects: user.projects || [],
        education: user.education || { degree: '', institution: '', year: '' },
        preferredRole: user.preferredRole || '',
        preferredLocation: user.preferredLocation || '',
        isResumeVerified: !!user.isResumeVerified,
        resumeFileName: user.resumeFileName || '',
        resumeScore: user.resumeScore || 0,
        verifiedSkills: user.verifiedSkills || [],
        warningsCount: user.warningsCount || 0,
        warningHistory: user.warningHistory || [],
        accountStatus: user.accountStatus || 'active',
        isSuspended: !!user.isSuspended,
        rejectionReason: user.rejectionReason || '',
        isEmailVerified: !!user.isEmailVerified,
        isPhoneVerified: !!user.isPhoneVerified,
        trustScore: user.trustScore || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

/**
 * PUT /api/candidate/profile
 * Update the authenticated candidate's profile claims
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.accountStatus === 'rejected' || user.isSuspended || (user.warningsCount && user.warningsCount >= 3)) {
      return res.status(403).json({
        message: 'Account is permanently rejected due to 3 profile discrepancy warnings. Profile modifications are permanently blocked.',
        accountStatus: 'rejected'
      });
    }

    // Skills registered during profile creation are permanent and cannot be edited
    const allowedFields = [
      'name', 'experience', 'projects',
      'education', 'preferredRole', 'preferredLocation'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    res.json({
      message: 'Profile claims updated successfully',
      profile: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        skills: updatedUser.skills,
        experience: updatedUser.experience,
        projects: updatedUser.projects,
        education: updatedUser.education,
        preferredRole: updatedUser.preferredRole,
        preferredLocation: updatedUser.preferredLocation,
        isResumeVerified: !!updatedUser.isResumeVerified,
        resumeFileName: updatedUser.resumeFileName || '',
        warningsCount: updatedUser.warningsCount || 0,
        warningHistory: updatedUser.warningHistory || [],
        accountStatus: updatedUser.accountStatus || 'active',
        isSuspended: !!updatedUser.isSuspended,
        isEmailVerified: !!updatedUser.isEmailVerified,
        isPhoneVerified: !!updatedUser.isPhoneVerified,
        trustScore: updatedUser.trustScore || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

/**
 * POST /api/candidate/resume
 * Upload a candidate resume in PDF format and compare against profile claims using Open-Source LLM.
 * Strictly compares claimed details against the uploaded resume. Does not alter or overwrite profile fields.
 * Issues permanent warnings if discrepancies are found.
 */
exports.uploadAndValidateResume = async (req, res) => {
  try {
    const { resumeFile, resumeFileName, resumeText } = req.body;

    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'candidate') {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (user.accountStatus === 'rejected' || user.isSuspended || (user.warningsCount && user.warningsCount >= 3)) {
      return res.status(403).json({
        message: 'Account is permanently rejected due to 3 unverified profile discrepancy warnings. Rejection is permanent and cannot be modified.',
        accountStatus: 'rejected',
        warningsCount: 3,
        rejectionReason: user.rejectionReason || 'Profile details could not be corroborated in uploaded resumes after 3 warnings.'
      });
    }

    if (!resumeFile && (!resumeText || resumeText.trim().length < 5)) {
      return res.status(400).json({ message: 'Please upload a valid PDF resume file.' });
    }

    // Extract text stream from the PDF document
    const extractedText = extractTextFromPdf(resumeFile, resumeText);

    if (!extractedText || extractedText.trim().length < 5) {
      return res.status(400).json({
        message: 'Could not extract readable text from the uploaded PDF resume. Please ensure it is not password protected or an empty scan.'
      });
    }

    // Compare candidate profile claims against extracted resume content using Open-Source LLM
    const validation = await validateResumeWithOpenSourceLLM(user, extractedText);

    const currentWarnings = user.warningsCount || 0;
    const warningHistory = Array.isArray(user.warningHistory) ? [...user.warningHistory] : [];

    console.log(`\n==================================================`);
    console.log(`🤖 [RECRUITX OPEN-SOURCE LLM RESUME & PROFILE CORROBORATION]`);
    console.log(`   Model: ${validation.modelUsed || OPEN_SOURCE_MODEL}`);
    console.log(`   Candidate: ${user.name} (${user.email})`);
    console.log(`   Resume File: ${resumeFileName || 'resume.pdf'}`);
    console.log(`   Validation Result: ${validation.isValid ? 'PASSED (Verified 100%)' : 'FAILED (Discrepancies Found)'}`);
    console.log(`   Claimed Skills: ${JSON.stringify(user.skills || [])}`);
    console.log(`   Verified Skills: ${JSON.stringify(validation.verifiedSkills)}`);
    console.log(`   Missing Skills: ${JSON.stringify(validation.missingSkills)}`);
    console.log(`   LLM Audit: ${validation.llmAnalysis || 'Corroboration complete'}`);
    console.log(`   Current Warnings (Permanent): ${currentWarnings}`);
    console.log(`==================================================\n`);

    if (validation.isValid) {
      // 100% Corroborated: Mark resume as verified
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          isResumeVerified: true,
          resumeFileName: resumeFileName || user.resumeFileName || 'resume.pdf',
          resumeScore: validation.matchScore,
          resumeVerifiedAt: new Date().toISOString(),
          verifiedSkills: validation.verifiedSkills,
          accountStatus: currentWarnings > 0 ? 'warning_issued' : 'verified'
        },
        { returnDocument: 'after' }
      );

      return res.json({
        success: true,
        message: `Resume successfully corroborated with profile claims! Match Score: ${validation.matchScore}%.`,
        validation,
        profile: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          skills: updatedUser.skills,
          experience: updatedUser.experience,
          projects: updatedUser.projects,
          education: updatedUser.education,
          preferredRole: updatedUser.preferredRole,
          preferredLocation: updatedUser.preferredLocation,
          isResumeVerified: true,
          resumeFileName: updatedUser.resumeFileName,
          resumeScore: updatedUser.resumeScore,
          verifiedSkills: updatedUser.verifiedSkills,
          warningsCount: updatedUser.warningsCount || 0,
          accountStatus: updatedUser.accountStatus,
          isSuspended: false,
          isEmailVerified: !!updatedUser.isEmailVerified,
          isPhoneVerified: !!updatedUser.isPhoneVerified,
          trustScore: updatedUser.trustScore || 0
        }
      });
    } else {
      // Discrepancy Found: Issue Permanent Warning Strike
      const newWarningsCount = currentWarnings + 1;
      const newWarningRecord = {
        warningNumber: newWarningsCount,
        maxWarnings: 3,
        timestamp: new Date().toISOString(),
        resumeFileName: resumeFileName || 'uploaded_resume.pdf',
        discrepancies: validation.discrepancies,
        missingSkills: validation.missingSkills,
        matchScore: validation.matchScore
      };

      warningHistory.push(newWarningRecord);

      let accountStatus = 'warning_issued';
      let isSuspended = false;
      let rejectionReason = '';

      if (newWarningsCount >= 3) {
        accountStatus = 'rejected';
        isSuspended = true;
        rejectionReason = `Account permanently rejected: 3 profile discrepancy warnings issued. The latest resume (${resumeFileName || 'uploaded_resume.pdf'}) was missing claimed skills: [${validation.missingSkills.join(', ')}].`;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          isResumeVerified: false,
          resumeScore: validation.matchScore,
          verifiedSkills: validation.verifiedSkills,
          warningsCount: newWarningsCount,
          warningHistory,
          accountStatus,
          isSuspended,
          rejectionReason: rejectionReason || user.rejectionReason
        },
        { returnDocument: 'after' }
      );

      if (newWarningsCount >= 3) {
        return res.status(403).json({
          accountRejected: true,
          message: `ACCOUNT REJECTED: You have received 3 discrepancy warnings. Profile claims could not be corroborated in your uploaded resumes. Account is permanently suspended.`,
          warningsCount: 3,
          validation,
          profile: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            skills: updatedUser.skills,
            experience: updatedUser.experience,
            projects: updatedUser.projects,
            education: updatedUser.education,
            preferredRole: updatedUser.preferredRole,
            preferredLocation: updatedUser.preferredLocation,
            isResumeVerified: false,
            warningsCount: 3,
            accountStatus: 'rejected',
            isSuspended: true,
            rejectionReason,
            isEmailVerified: !!updatedUser.isEmailVerified,
            isPhoneVerified: !!updatedUser.isPhoneVerified,
            trustScore: updatedUser.trustScore || 0
          }
        });
      }

      return res.status(400).json({
        warningIssued: true,
        message: `DISCREPANCY WARNING (${newWarningsCount}/3): Claimed profile details could not be corroborated in your resume. ${3 - newWarningsCount} warning(s) remaining before permanent account rejection.`,
        warningsCount: newWarningsCount,
        warningsRemaining: 3 - newWarningsCount,
        validation,
        profile: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          skills: updatedUser.skills,
          experience: updatedUser.experience,
          projects: updatedUser.projects,
          education: updatedUser.education,
          preferredRole: updatedUser.preferredRole,
          preferredLocation: updatedUser.preferredLocation,
          isResumeVerified: false,
          warningsCount: newWarningsCount,
          accountStatus: 'warning_issued',
          isSuspended: false,
          isEmailVerified: !!updatedUser.isEmailVerified,
          isPhoneVerified: !!updatedUser.isPhoneVerified,
          trustScore: updatedUser.trustScore || 0
        }
      });
    }
  } catch (error) {
    console.error('Validate resume error:', error);
    res.status(500).json({ message: 'Server error comparing resume with profile' });
  }
};

/**
 * POST /api/candidate/generate-mock-test
 * Candidate generates personalized technical mock test with custom questions count, subject, and difficulty
 */
exports.generateMockTest = async (req, res) => {
  try {
    const { generateMockTest } = require('../utils/llmMockTestGenerator');
    const { subject = 'React', difficulty = 'intermediate', questionCount = 5 } = req.body;

    const mockTest = generateMockTest({ subject, difficulty, questionCount });

    res.json({
      test: {
        testId: mockTest.testId,
        subject: mockTest.subject,
        difficulty: mockTest.difficulty,
        questionCount: mockTest.questionCount,
        model: mockTest.model,
        generatedAt: mockTest.generatedAt,
        questions: mockTest.questions.map(q => ({
          id: q.id,
          index: q.index,
          question: q.question,
          options: q.options,
          subject: q.subject,
          difficulty: q.difficulty
        }))
      },
      // Full test data stored in memory/session
      _serverPayload: mockTest
    });
  } catch (error) {
    console.error('Generate mock test error:', error);
    res.status(500).json({ message: 'Server error generating personalized mock test' });
  }
};

/**
 * POST /api/candidate/submit-mock-test
 * Evaluates candidate mock test answers, generates detailed score breakdown and AI feedback
 */
exports.submitMockTest = async (req, res) => {
  try {
    const { subject = 'General', difficulty = 'intermediate', answers = [], questions = [] } = req.body;

    let correctCount = 0;
    const feedback = questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected !== undefined && Number(selected) === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        questionIndex: idx,
        question: q.question,
        options: q.options,
        selectedOption: selected !== undefined ? Number(selected) : -1,
        correctOption: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || `The correct answer is Option ${String.fromCharCode(65 + (q.correctAnswer || 0))}.`
      };
    });

    const total = questions.length || 1;
    const score = Math.round((correctCount / total) * 100);

    let performanceTier = 'Needs Improvement';
    if (score >= 85) performanceTier = 'Expert / Mastery';
    else if (score >= 70) performanceTier = 'Proficient';
    else if (score >= 50) performanceTier = 'Intermediate';

    res.json({
      score,
      correctCount,
      totalQuestions: total,
      subject,
      difficulty,
      performanceTier,
      feedback,
      aiRecommendations: score >= 80
        ? `Outstanding mastery of ${subject} (${difficulty} level)! You are well-prepared for technical interview rounds.`
        : `Good effort! Review the detailed explanations above for questions where you missed concepts to solidify your ${subject} foundation.`
    });
  } catch (error) {
    console.error('Submit mock test error:', error);
    res.status(500).json({ message: 'Server error evaluating mock test' });
  }
};

