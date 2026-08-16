import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import RescheduleInterviewModal from '../../components/RescheduleInterviewModal';

export default function RecruiterInterviews() {
  const { showSuccess, showError } = useToast();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'all' | 'completed' | 'cancelled'
  const [search, setSearch] = useState('');
  const [activeInterviewToEdit, setActiveInterviewToEdit] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/interviews/recruiter');
      setInterviews(res.data.interviews || []);
    } catch (err) {
      console.error('Fetch interviews error:', err);
      showError('Failed to load scheduled interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (interviewId, status) => {
    try {
      await api.put(`/interviews/${interviewId}/status`, { status });
      showSuccess(`Interview marked as ${status}`);
      setInterviews(prev =>
        prev.map(i => (i._id === interviewId ? { ...i, status } : i))
      );
    } catch (err) {
      console.error('Update status error:', err);
      showError('Failed to update status');
    }
  };

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  const now = new Date();

  const filteredInterviews = interviews.filter((interview) => {
    const start = new Date(interview.startTime);
    const matchesSearch =
      (interview.candidate?.name || interview.candidateName || '').toLowerCase().includes(search.toLowerCase()) ||
      (interview.job?.title || interview.title || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'upcoming') {
      return (interview.status === 'scheduled' || interview.status === 'rescheduled') && start >= now;
    }
    if (filter === 'completed') {
      return interview.status === 'completed';
    }
    if (filter === 'cancelled') {
      return interview.status === 'cancelled';
    }
    return true; // 'all'
  });

  const upcomingCount = interviews.filter(
    i => (i.status === 'scheduled' || i.status === 'rescheduled') && new Date(i.startTime) >= now
  ).length;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Link to="/recruiter/dashboard" className="hover:text-indigo-600">
              Dashboard
            </Link>
            <span>/</span>
            <span>Interviews</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scheduled Interviews & Meet Calls
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Manage your synchronized Google Calendar appointments and join Google Meet video conferences with shortlisted candidates.
          </p>
        </div>

        <Link to="/recruiter/dashboard">
          <Button variant="secondary" size="md" className="font-bold">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover={false} className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">Upcoming Interviews</p>
          <p className="text-2xl font-black text-white mt-1">{upcomingCount}</p>
          <p className="text-[11px] text-indigo-200 mt-0.5">Synced with Google Calendar</p>
        </Card>

        <Card hover={false} className="p-4 bg-white shadow-xs border border-slate-200">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Scheduled</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{interviews.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all active postings</p>
        </Card>

        <Card hover={false} className="p-4 bg-white shadow-xs border border-slate-200">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Completed Sessions</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {interviews.filter(i => i.status === 'completed').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Technical evaluations conducted</p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
            { id: 'all', label: `All (${interviews.length})` },
            { id: 'completed', label: `Completed (${interviews.filter(i => i.status === 'completed').length})` },
            { id: 'cancelled', label: `Cancelled (${interviews.filter(i => i.status === 'cancelled').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search candidate or job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <EmptyState
          title="No interviews found"
          description={
            filter === 'upcoming'
              ? 'You have no upcoming Google Meet interviews scheduled. Shortlist candidates on your job postings to schedule interviews.'
              : 'No interviews matching your current filter criteria.'
          }
          action={
            <Link to="/recruiter/dashboard">
              <Button className="font-bold bg-indigo-600 hover:bg-indigo-700">
                View Job Postings
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => {
            const candidate = interview.candidate || {};
            const job = interview.job || {};
            const startDate = new Date(interview.startTime);
            const isUpcoming = startDate >= now && interview.status !== 'cancelled' && interview.status !== 'completed';

            return (
              <Card
                key={interview._id}
                className={`p-5 transition-all space-y-4 ${
                  isUpcoming
                    ? 'border-indigo-200 bg-white hover:border-indigo-400 shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Details */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base shrink-0 shadow-xs">
                        {candidate.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 truncate">
                            {candidate.name || interview.candidateName || 'Candidate'}
                          </h3>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            interview.status === 'scheduled'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : interview.status === 'rescheduled'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : interview.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {interview.status}
                          </span>

                          {job.title && (
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {job.title}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                          <span>{candidate.email || interview.candidateEmail}</span>
                          {candidate.phone && (
                            <>
                              <span>·</span>
                              <span>{candidate.phone}</span>
                            </>
                          )}
                          {candidate.experience !== undefined && (
                            <>
                              <span>·</span>
                              <span>{candidate.experience} yrs exp</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Schedule Time & Timezone Pill */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs">
                        <span>🗓️</span>
                        <span>
                          {startDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span>at</span>
                        <span className="text-amber-400">
                          {startDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-slate-400">({interview.durationMinutes || 45} mins)</span>
                      </span>

                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold border border-slate-200">
                        🌍 {interview.timeZone || 'UTC'}
                      </span>
                    </div>

                    {/* Agenda / Notes if any */}
                    {interview.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-medium">
                        <strong className="text-slate-800">Agenda:</strong> {interview.description}
                      </p>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {interview.meetLink && interview.status !== 'cancelled' && (
                      <a
                        href={interview.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs"
                      >
                        <span>🎥 Join Google Meet</span>
                      </a>
                    )}

                    {interview.googleCalendarLink && interview.status !== 'cancelled' && (
                      <a
                        href={interview.googleCalendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                      >
                        <span>📅 Google Calendar</span>
                      </a>
                    )}

                    <div className="flex items-center gap-1.5">
                      {interview.meetLink && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(interview.meetLink);
                            showSuccess('Google Meet link copied to clipboard!');
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all cursor-pointer"
                          title="Copy Google Meet Link"
                        >
                          📋 Copy Link
                        </button>
                      )}

                      {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveInterviewToEdit(interview)}
                          >
                            Reschedule / Edit
                          </Button>

                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            onClick={() => handleStatusUpdate(interview._id, 'completed')}
                          >
                            Mark Completed ✓
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {activeInterviewToEdit && (
        <RescheduleInterviewModal
          isOpen={!!activeInterviewToEdit}
          onClose={() => setActiveInterviewToEdit(null)}
          interview={activeInterviewToEdit}
          onUpdated={() => {
            fetchInterviews();
          }}
        />
      )}
    </div>
  );
}
