import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export default function CandidateInterviews() {
  const { showSuccess, showError } = useToast();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/interviews/candidate');
      setInterviews(res.data.interviews || []);
    } catch (err) {
      console.error('Fetch candidate interviews error:', err);
      showError('Failed to load your scheduled interviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  const now = new Date();
  const upcomingInterviews = interviews.filter(
    i => (i.status === 'scheduled' || i.status === 'rescheduled') && new Date(i.startTime) >= now
  );
  const pastInterviews = interviews.filter(
    i => i.status === 'completed' || new Date(i.startTime) < now || i.status === 'cancelled'
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Scheduled Interviews
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Access your Google Meet video links, sync appointments with Google Calendar, and prepare for upcoming recruiter evaluations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/candidate/dashboard">
            <Button variant="secondary" size="md" className="font-bold">
              ← Candidate Dashboard
            </Button>
          </Link>
          <Link to="/candidate/jobs">
            <Button size="md" className="font-bold bg-indigo-600 hover:bg-indigo-700">
              Browse More Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Banner with Upcoming Count */}
      <Card hover={false} className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">📹</span>
              <h2 className="text-base font-extrabold text-white">
                Google Meet Video Interview Center
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Synced
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              When an employer shortlists your profile, your interview is confirmed here with an instant 1-click Google Meet link and calendar invitation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-300 uppercase">Upcoming Calls</p>
              <p className="text-2xl font-black text-emerald-400">{upcomingInterviews.length}</p>
            </div>
            <div className="text-center bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-300 uppercase">Total Completed</p>
              <p className="text-2xl font-black text-indigo-300">
                {interviews.filter(i => i.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Upcoming Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🔴 Upcoming Interview Calls</span>
            <span className="text-xs font-bold text-slate-500">({upcomingInterviews.length})</span>
          </h2>
        </div>

        {upcomingInterviews.length === 0 ? (
          <EmptyState
            title="No upcoming interviews scheduled"
            description="Complete skill assessments on your applied jobs to get shortlisted and receive interview invites from top employers."
            action={
              <Link to="/candidate/jobs">
                <Button className="font-bold bg-indigo-600 hover:bg-indigo-700">Browse Jobs</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {upcomingInterviews.map((interview) => {
              const job = interview.job || {};
              const recruiter = interview.recruiter || job.postedBy || {};
              const startDate = new Date(interview.startTime);

              return (
                <Card
                  key={interview._id}
                  className="p-5 border-l-4 border-l-emerald-500 hover:border-indigo-300 transition-all shadow-xs space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {job.title || interview.title || 'Technical Interview'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span>● Confirmed Call</span>
                        </span>
                        {recruiter.company && (
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                            🏢 {recruiter.company}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                        <span>Recruiter: <strong className="text-slate-800">{recruiter.name || interview.recruiterName}</strong></span>
                        <span>·</span>
                        <span>{recruiter.email || interview.recruiterEmail}</span>
                        {job.location && (
                          <>
                            <span>·</span>
                            <span>📍 {job.location}</span>
                          </>
                        )}
                      </div>

                      {/* Date & Time pill */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <div className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-2xs">
                          <span>🗓️</span>
                          <span>
                            {startDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span>at</span>
                          <span className="text-emerald-400 font-extrabold">
                            {startDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-slate-400">({interview.durationMinutes || 45} mins)</span>
                        </div>

                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl font-semibold border border-slate-200">
                          🌍 {interview.timeZone || 'UTC'}
                        </span>
                      </div>

                      {/* Agenda */}
                      {interview.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-medium">
                          <strong className="text-slate-800">Recruiter Agenda / Notes:</strong> {interview.description}
                        </p>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {interview.meetLink && (
                        <a
                          href={interview.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                        >
                          <span className="text-sm">🎥</span>
                          <span>Join Google Meet Call</span>
                        </a>
                      )}

                      <div className="flex items-center gap-2">
                        {interview.googleCalendarLink && (
                          <a
                            href={interview.googleCalendarLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs"
                          >
                            <span>📅 Add to Google Calendar</span>
                          </a>
                        )}

                        {interview.meetLink && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(interview.meetLink);
                              showSuccess('Google Meet link copied to clipboard!');
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                            title="Copy Google Meet Link"
                          >
                            📋 Copy Link
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Interviews Section */}
      {pastInterviews.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-base font-bold text-slate-700">
            Past & Completed Interview History ({pastInterviews.length})
          </h2>

          <div className="space-y-3">
            {pastInterviews.map((interview) => {
              const job = interview.job || {};
              const recruiter = interview.recruiter || job.postedBy || {};
              const startDate = new Date(interview.startTime);

              return (
                <Card key={interview._id} className="p-4 bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-800">{job.title || interview.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 capitalize">
                          {interview.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {recruiter.company ? `${recruiter.company} · ` : ''}{recruiter.name} · {startDate.toLocaleDateString()}
                      </p>
                    </div>

                    {interview.meetLink && interview.status !== 'cancelled' && (
                      <a
                        href={interview.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Re-open Meet Link →
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
