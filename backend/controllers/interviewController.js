const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const {
  createCalendarEventWithMeet,
  updateCalendarEvent,
  cancelCalendarEvent,
  generateGoogleCalendarUrl,
  generateICalendarData
} = require('../utils/googleCalendarService');
const {
  sendInterviewInvitationEmail,
  sendInterviewCancellationEmail
} = require('../utils/emailService');

/**
 * POST /api/interviews/schedule
 * Recruiter schedules an interview with a shortlisted candidate
 */
exports.scheduleInterview = async (req, res) => {
  try {
    const {
      applicationId,
      startTime,
      endTime: customEndTime,
      durationMinutes = 45,
      timeZone = 'UTC',
      title,
      description = ''
    } = req.body;

    if (!applicationId || !startTime) {
      return res.status(400).json({ message: 'Application ID and start time are required' });
    }

    const application = await Application.findById(applicationId)
      .populate('candidate', 'name email phone skills experience isResumeVerified')
      .populate('job', 'title location salary postedBy');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = application.job;
    if (!job) {
      return res.status(404).json({ message: 'Associated job not found' });
    }

    // Verify requesting user is the recruiter who posted the job
    const postedById = typeof job.postedBy === 'object' ? job.postedBy._id || job.postedBy : job.postedBy;
    if (String(postedById) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to schedule interviews for this job' });
    }

    const candidate = application.candidate;
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start time format' });
    }

    // Calculate end time based on duration if not explicitly provided
    let end = customEndTime ? new Date(customEndTime) : new Date(start.getTime() + Number(durationMinutes) * 60 * 1000);
    if (isNaN(end.getTime()) || end <= start) {
      end = new Date(start.getTime() + Number(durationMinutes) * 60 * 1000);
    }

    const meetingTitle = title && title.trim() ? title.trim() : `Technical Interview: ${candidate.name} - ${job.title}`;
    const recruiterUser = await User.findById(req.user._id);

    // Create Google Calendar event with Google Meet link
    const calendarResult = await createCalendarEventWithMeet({
      title: meetingTitle,
      description: description || `Interview for ${job.title} at ${recruiterUser?.company || 'RecruitX'}`,
      startTime: start,
      endTime: end,
      timeZone,
      recruiterEmail: recruiterUser.email,
      recruiterName: recruiterUser.name,
      candidateEmail: candidate.email,
      candidateName: candidate.name
    });

    // Check if an existing interview exists for this application
    let interview = await Interview.findOne({ application: applicationId });

    if (interview) {
      // Update existing interview
      interview.startTime = start;
      interview.endTime = end;
      interview.durationMinutes = Number(durationMinutes);
      interview.timeZone = timeZone;
      interview.title = meetingTitle;
      interview.description = description;
      interview.status = 'scheduled';
      interview.meetLink = calendarResult.meetLink;
      interview.googleEventId = calendarResult.googleEventId || interview.googleEventId;
      interview.googleCalendarLink = calendarResult.googleCalendarLink;
      interview.calendarEventCreated = calendarResult.calendarEventCreated;
      interview.candidateEmail = candidate.email;
      interview.candidateName = candidate.name;
      interview.recruiterEmail = recruiterUser.email;
      interview.recruiterName = recruiterUser.name;
      await interview.save();
    } else {
      // Create new interview
      interview = await Interview.create({
        application: applicationId,
        job: job._id,
        candidate: candidate._id,
        recruiter: req.user._id,
        title: meetingTitle,
        description,
        startTime: start,
        endTime: end,
        durationMinutes: Number(durationMinutes),
        timeZone,
        status: 'scheduled',
        meetLink: calendarResult.meetLink,
        googleEventId: calendarResult.googleEventId,
        googleCalendarLink: calendarResult.googleCalendarLink,
        calendarEventCreated: calendarResult.calendarEventCreated,
        candidateEmail: candidate.email,
        candidateName: candidate.name,
        recruiterEmail: recruiterUser.email,
        recruiterName: recruiterUser.name
      });
    }

    // Ensure application is marked as shortlisted & link interview
    application.status = 'shortlisted';
    application.interviewScheduled = true;
    application.interview = interview._id;
    await application.save();

    // Dispatch confirmation emails to both Candidate and Recruiter
    try {
      // Send to Candidate
      await sendInterviewInvitationEmail({
        toEmail: candidate.email,
        recipientName: candidate.name,
        isRecruiter: false,
        jobTitle: job.title,
        companyName: recruiterUser?.company || 'RecruitX Partner',
        startTime: start,
        endTime: end,
        durationMinutes: Number(durationMinutes),
        timeZone,
        meetLink: calendarResult.meetLink,
        googleCalendarLink: calendarResult.googleCalendarLink,
        description,
        icsData: calendarResult.icsData,
        otherPartyName: recruiterUser.name,
        otherPartyEmail: recruiterUser.email
      });

      // Send to Recruiter
      await sendInterviewInvitationEmail({
        toEmail: recruiterUser.email,
        recipientName: recruiterUser.name,
        isRecruiter: true,
        jobTitle: job.title,
        companyName: recruiterUser?.company || 'RecruitX Partner',
        startTime: start,
        endTime: end,
        durationMinutes: Number(durationMinutes),
        timeZone,
        meetLink: calendarResult.meetLink,
        googleCalendarLink: calendarResult.googleCalendarLink,
        description,
        icsData: calendarResult.icsData,
        otherPartyName: candidate.name,
        otherPartyEmail: candidate.email
      });
    } catch (emailErr) {
      console.warn('⚠️ [EMAIL DISPATCH WARNING]:', emailErr.message);
    }

    const populatedInterview = await Interview.findById(interview._id)
      .populate('job', 'title location salary')
      .populate('candidate', 'name email phone skills experience')
      .populate('recruiter', 'name email company');

    res.status(201).json({
      message: `Interview successfully scheduled! Appointment and Google Meet link sent to ${candidate.email} and ${recruiterUser.email}.`,
      interview: populatedInterview,
      meetLink: calendarResult.meetLink,
      googleCalendarLink: calendarResult.googleCalendarLink,
      application
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ message: 'Server error scheduling interview', error: error.message });
  }
};

/**
 * GET /api/interviews/candidate
 * Fetch all interviews scheduled for the logged-in candidate
 */
exports.getCandidateInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ candidate: req.user._id })
      .populate({
        path: 'job',
        select: 'title location salary postedBy',
        populate: {
          path: 'postedBy',
          select: 'name company isCompanyVerified trustScore'
        }
      })
      .populate('recruiter', 'name email company phone photoURL isCompanyVerified trustScore')
      .populate('application', 'status matchScore assessmentScore allAssessmentsPassed')
      .sort({ startTime: 1 });

    res.json({ interviews });
  } catch (error) {
    console.error('Fetch candidate interviews error:', error);
    res.status(500).json({ message: 'Server error fetching candidate interviews' });
  }
};

/**
 * GET /api/interviews/recruiter
 * Fetch all interviews scheduled across recruiter's jobs
 */
exports.getRecruiterInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiter: req.user._id })
      .populate('job', 'title location salary')
      .populate('candidate', 'name email phone skills experience isResumeVerified trustScore')
      .populate('application', 'status matchScore assessmentScore allAssessmentsPassed')
      .sort({ startTime: 1 });

    res.json({ interviews });
  } catch (error) {
    console.error('Fetch recruiter interviews error:', error);
    res.status(500).json({ message: 'Server error fetching recruiter interviews' });
  }
};

/**
 * GET /api/interviews/job/:jobId
 * Fetch all interviews for a specific job posting
 */
exports.getJobInterviews = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const postedById = typeof job.postedBy === 'object' ? job.postedBy._id || job.postedBy : job.postedBy;
    if (String(postedById) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view interviews for this job' });
    }

    const interviews = await Interview.find({ job: req.params.jobId })
      .populate('candidate', 'name email phone skills experience isResumeVerified trustScore')
      .populate('application', 'status matchScore assessmentScore allAssessmentsPassed')
      .sort({ startTime: 1 });

    res.json({ interviews, jobTitle: job.title });
  } catch (error) {
    console.error('Fetch job interviews error:', error);
    res.status(500).json({ message: 'Server error fetching job interviews' });
  }
};

/**
 * PUT /api/interviews/:id/reschedule
 * Reschedule interview time and notify both parties
 */
exports.rescheduleInterview = async (req, res) => {
  try {
    const { startTime, endTime: customEndTime, durationMinutes = 45, timeZone = 'UTC', notes = '' } = req.body;
    const interview = await Interview.findById(req.params.id)
      .populate('job', 'title')
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email company');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (String(interview.recruiter._id || interview.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reschedule this interview' });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start time format' });
    }

    let end = customEndTime ? new Date(customEndTime) : new Date(start.getTime() + Number(durationMinutes) * 60 * 1000);
    if (isNaN(end.getTime()) || end <= start) {
      end = new Date(start.getTime() + Number(durationMinutes) * 60 * 1000);
    }

    interview.startTime = start;
    interview.endTime = end;
    interview.durationMinutes = Number(durationMinutes);
    interview.timeZone = timeZone;
    interview.status = 'rescheduled';
    if (notes) interview.description = `${interview.description || ''}\n\n[Rescheduled]: ${notes}`.trim();

    // Update Google Calendar event
    const updateResult = await updateCalendarEvent({
      googleEventId: interview.googleEventId,
      title: interview.title,
      description: interview.description,
      startTime: start,
      endTime: end,
      timeZone,
      candidateEmail: interview.candidate.email,
      candidateName: interview.candidate.name,
      recruiterEmail: interview.recruiter.email,
      recruiterName: interview.recruiter.name,
      meetLink: interview.meetLink
    });

    if (updateResult.googleCalendarLink) {
      interview.googleCalendarLink = updateResult.googleCalendarLink;
    }
    await interview.save();

    // Re-send updated invitations
    try {
      await sendInterviewInvitationEmail({
        toEmail: interview.candidate.email,
        recipientName: interview.candidate.name,
        isRecruiter: false,
        jobTitle: interview.job?.title || 'Technical Interview',
        companyName: interview.recruiter?.company || 'RecruitX Partner',
        startTime: start,
        endTime: end,
        durationMinutes: Number(durationMinutes),
        timeZone,
        meetLink: interview.meetLink,
        googleCalendarLink: interview.googleCalendarLink,
        description: interview.description,
        icsData: updateResult.icsData,
        otherPartyName: interview.recruiter.name,
        otherPartyEmail: interview.recruiter.email
      });
    } catch (emailErr) {
      console.warn('⚠️ [RESCHEDULE EMAIL ERROR]:', emailErr.message);
    }

    res.json({
      message: 'Interview successfully rescheduled! Updated calendar invites sent.',
      interview
    });
  } catch (error) {
    console.error('Reschedule interview error:', error);
    res.status(500).json({ message: 'Server error rescheduling interview' });
  }
};

/**
 * PUT /api/interviews/:id/status
 * Update interview status (e.g. 'completed' or 'cancelled')
 */
exports.updateInterviewStatus = async (req, res) => {
  try {
    const { status, recruiterFeedback = '', cancellationReason = '' } = req.body;
    if (!['completed', 'cancelled', 'scheduled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const interview = await Interview.findById(req.params.id)
      .populate('job', 'title')
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (String(interview.recruiter._id || interview.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this interview' });
    }

    interview.status = status;
    if (recruiterFeedback) interview.recruiterFeedback = recruiterFeedback;
    await interview.save();

    if (status === 'cancelled') {
      if (interview.googleEventId) {
        await cancelCalendarEvent(interview.googleEventId);
      }
      // Update application
      await Application.findByIdAndUpdate(interview.application, {
        interviewScheduled: false
      });
      // Send cancellation email
      await sendInterviewCancellationEmail({
        toEmail: interview.candidate.email,
        recipientName: interview.candidate.name,
        jobTitle: interview.job?.title || 'Technical Interview',
        startTime: interview.startTime,
        cancelledByName: interview.recruiter.name,
        reason: cancellationReason
      });
    }

    res.json({
      message: `Interview status updated to ${status}`,
      interview
    });
  } catch (error) {
    console.error('Update interview status error:', error);
    res.status(500).json({ message: 'Server error updating interview status' });
  }
};
