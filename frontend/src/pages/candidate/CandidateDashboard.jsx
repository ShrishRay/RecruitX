import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import SkillAssessmentModal from '../../components/SkillAssessmentModal';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assessmentJob, setAssessmentJob] = useState(null);

  useEffect(() => {
    fetchApplications();
    fetchInterviews();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications/candidate');
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      const res = await api.get('/interviews/candidate');
      setInterviews(res.data.interviews || []);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    }
  };

  const isResumeVerified = !!user?.isResumeVerified && !user?.isSuspended && user?.accountStatus !== 'rejected';
  const now = new Date();
  const upcomingInterviews = interviews.filter(
    i => (i.status === 'scheduled' || i.status === 'rescheduled') && new Date(i.startTime) >= now
  );

  const stats = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interviews: upcomingInterviews.length,
    avgScore: applications.length > 0
      ? Math.round(applications.reduce((sum, a) => sum + a.matchScore, 0) / applications.length)
      : 0,
  };

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Skill Assessment Modal for Jobs */}
      {assessmentJob && (
        <SkillAssessmentModal
          isOpen={!!assessmentJob}
          onClose={() => setAssessmentJob(null)}
          job={assessmentJob}
          onAssessmentComplete={() => {
            fetchApplications();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track your job applications, required skill assessments, and recruiter shortlisting status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/candidate/interviews">
            <Button size="md" className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm">
              <span>🎥 Interviews</span>
              {upcomingInterviews.length > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-emerald-800 rounded-full text-[10px] font-black">
                  {upcomingInterviews.length}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/candidate/profile">
            <Button variant="secondary" size="md" className="font-bold">
              {isResumeVerified ? '🛡️ Resume Verified ✓' : '⚠️ Verify Resume'}
            </Button>
          </Link>
          <Link to="/candidate/jobs">
            <Button size="md" className="font-bold bg-indigo-600 hover:bg-indigo-700">
              Browse All Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* ── UPCOMING INTERVIEW HERO BANNER (If scheduled) ── */}
      {upcomingInterviews.length > 0 && (
        <div className="space-y-3">
          {upcomingInterviews.slice(0, 2).map((interview) => {
            const job = interview.job || {};
            const recruiter = interview.recruiter || job.postedBy || {};
            const startDate = new Date(interview.startTime);

            return (
              <Card
                key={interview._id}
                hover={false}
                className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border-2 border-emerald-500/60"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Active Interview Invitation
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {recruiter.company ? `with ${recruiter.company}` : ''}
                      </span>
                    </div>

                    <h2 className="text-lg font-extrabold text-white">
                      {job.title || interview.title || 'Technical Interview Round'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                      <span>🗓️ <strong>{startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong></span>
                      <span>⏰ <strong>{startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong> ({interview.durationMinutes || 45} mins)</span>
                      <span>👤 Recruiter: {recruiter.name || interview.recruiterName}</span>
                    </div>

                    {interview.description && (
                      <p className="text-xs text-slate-300/90 bg-white/10 p-2 rounded-lg">
                        <strong>Agenda:</strong> {interview.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0">
                    {interview.meetLink && (
                      <a
                        href={interview.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <span className="text-base">🎥</span>
                        <span>Join Google Meet Call</span>
                      </a>
                    )}

                    {interview.googleCalendarLink && (
                      <a
                        href={interview.googleCalendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-white/20"
                      >
                        <span>📅 Add to Google Calendar</span>
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: stats.total, color: 'text-indigo-600', icon: '📋' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-emerald-600', icon: '⭐' },
          { label: 'Interviews Scheduled', value: stats.interviews, color: 'text-emerald-600', icon: '🎥' },
          { label: 'Avg Match Score', value: `${stats.avgScore}%`, color: 'text-purple-600', icon: '🎯' },
        ].map((stat) => (
          <Card key={stat.label} hover={false} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
              </div>
              <div className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Application List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Active Applications</h2>
          <span className="text-xs font-semibold text-slate-500">{applications.length} submitted</span>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            title="No applications submitted yet"
            description="Explore open engineering and product roles tailored to your skill set."
            action={
              <Link to="/candidate/jobs">
                <Button className="font-bold bg-indigo-600 hover:bg-indigo-700">Browse Jobs Now</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const job = app.job || {};
              const assessments = job.assessments || (job.assessment ? [job.assessment] : []);
              const results = app.assessmentResults || [];
              const allPassed = app.allAssessmentsPassed || (results.length > 0 && results.every(r => r.passed)) || (app.assessmentPassed === true);
              const isQualified = isResumeVerified && app.matchScore >= 50 && allPassed;

              return (
                <Card key={app._id} className="p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {job.title || 'Position'}
                        </h3>
                        {isQualified && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Shortlist Eligible ✓
                          </span>
                        )}
                        <Badge variant={app.status}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                        {job.postedBy?.company && (
                          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                            {job.postedBy.company}
                          </span>
                        )}
                        {job.location && (
                          <span>· {job.location}</span>
                        )}
                        {app.appliedAt && (
                          <span>· Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Multiple Assessments Status Breakdown */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 font-bold border border-indigo-100 text-[11px]">
                          Required Assessments: {assessments.length || 1} Module(s)
                        </span>

                        {assessments.map((aModule, aIdx) => {
                          const mId = String(aModule._id || aModule.id || aIdx);
                          const resultEntry = results.find(r => String(r.assessmentId) === mId);
                          const isModulePassed = resultEntry?.passed;

                          return (
                            <span
                              key={aIdx}
                              className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                                resultEntry
                                  ? isModulePassed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {aModule.skill || `Round ${aIdx + 1}`}: {resultEntry ? `${resultEntry.score}% (${isModulePassed ? 'Passed ✓' : 'Failed ✗'})` : 'Pending ⚠️'}
                            </span>
                          );
                        })}
                      </div>

                      {/* Interview Scheduled Badge & Join Meet */}
                      {app.interview && (app.interview.status === 'scheduled' || app.interview.status === 'rescheduled') && (
                        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>🎥 Video Interview Scheduled:</span>
                            <span className="font-semibold text-emerald-800">
                              {new Date(app.interview.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(app.interview.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {app.interview.meetLink && (
                              <a
                                href={app.interview.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs"
                              >
                                Join Google Meet
                              </a>
                            )}
                            {app.interview.googleCalendarLink && (
                              <a
                                href={app.interview.googleCalendarLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs border border-slate-200"
                              >
                                📅 Calendar
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Gauge & Assessment Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                      <div className="w-full sm:w-44 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Match Compatibility</p>
                        <ProgressBar value={app.matchScore} size="sm" />
                      </div>

                      <Button
                        size="sm"
                        onClick={() => setAssessmentJob({ id: job._id, title: job.title, assessments: job.assessments, assessment: job.assessment })}
                        className={`font-bold text-xs shrink-0 ${
                          allPassed 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                            : results.length > 0
                              ? 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {allPassed ? '✓ Assessments Completed' : results.length > 0 ? 'View Scorecard' : 'Take Skill Assessments →'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
