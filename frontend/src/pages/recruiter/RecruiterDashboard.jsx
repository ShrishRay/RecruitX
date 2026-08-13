import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import VerificationModal from '../../components/VerificationModal';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [jobStats, setJobStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      const fetchedJobs = res.data.jobs || [];
      setJobs(fetchedJobs);

      const stats = {};
      await Promise.all(
        fetchedJobs.map(async (job) => {
          try {
            const appRes = await api.get(`/applications/job/${job._id}`);
            const apps = appRes.data.applications || [];
            stats[job._id] = {
              total: apps.length,
              shortlisted: apps.filter(a => a.status === 'shortlisted').length,
              rejected: apps.filter(a => a.status === 'rejected').length,
            };
          } catch {
            stats[job._id] = { total: 0, shortlisted: 0, rejected: 0 };
          }
        })
      );
      setJobStats(stats);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      showError('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingJobId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/jobs/${deletingJobId}`);
      showSuccess('Job deleted successfully');
      setJobs(jobs.filter(j => j._id !== deletingJobId));
      setDeletingJobId(null);
    } catch (err) {
      console.error('Error deleting job:', err);
      showError(err.response?.data?.message || 'Error deleting job');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalApplicants = Object.values(jobStats).reduce((sum, s) => sum + s.total, 0);
  const totalShortlisted = Object.values(jobStats).reduce((sum, s) => sum + s.shortlisted, 0);

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  const trustScore = user?.trustScore !== undefined ? user.trustScore : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Recruiter Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage your open postings and track candidate applicant leaderboards.
          </p>
        </div>
        <Link to="/recruiter/post-job">
          <Button size="md" className="font-bold gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Recruiter Trust Score Banner */}
      <Card hover={false} className="p-5 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/40 via-indigo-50/20 to-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <h2 className="text-base font-bold text-slate-900">Recruiter Authenticity & Trust Score</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${trustScore === 100 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                {trustScore}% Trust Score
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Your trust score is displayed to candidates on your job postings. Verify both email and phone number to reach 100% Verified Employer status.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
              <span className={user?.isEmailVerified ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                Email Verified: {user?.isEmailVerified ? 'Yes (+50%) ✓' : 'No ✗'}
              </span>
              <span>·</span>
              <span className={user?.isPhoneVerified ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                Phone Verified: {user?.isPhoneVerified ? 'Yes (+50%) ✓' : 'No ✗'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowVerificationModal(true)}
            className="font-bold shrink-0"
          >
            {trustScore === 100 ? 'View Verification Badges' : 'Boost Trust Score'}
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Job Postings', value: jobs.length, color: 'text-indigo-600', icon: '📋' },
          { label: 'Total Applicants', value: totalApplicants, color: 'text-blue-600', icon: '👥' },
          { label: 'Shortlisted Talent', value: totalShortlisted, color: 'text-emerald-600', icon: '⭐' },
        ].map((stat) => (
          <Card key={stat.label} hover={false} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
                <p className={`text-3xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
              </div>
              <div className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Jobs Listing */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Active Postings</h2>
          <span className="text-xs font-semibold text-slate-500">{jobs.length} roles active</span>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            title="No job postings created yet"
            description="Post your first open position to start receiving matched candidates."
            action={
              <Link to="/recruiter/post-job">
                <Button className="font-bold">Create Job Posting</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3 stagger-children">
            {jobs.map((job) => {
              const stats = jobStats[job._id] || { total: 0, shortlisted: 0, rejected: 0 };

              return (
                <Card key={job._id} className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 truncate">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                        <span>{job.experienceRequired}+ yrs experience</span>
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Required Skills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skillsRequired?.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200/60">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="flex items-center gap-4 text-center">
                        <div className="px-3">
                          <p className="text-base font-extrabold text-slate-900">{stats.total}</p>
                          <p className="text-[11px] font-semibold text-slate-400">Applicants</p>
                        </div>
                        <div className="px-3 border-l border-slate-200">
                          <p className="text-base font-extrabold text-emerald-600">{stats.shortlisted}</p>
                          <p className="text-[11px] font-semibold text-slate-400">Shortlisted</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/recruiter/jobs/${job._id}/candidates`)}
                          className="font-bold"
                        >
                          View Candidates
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingJobId(job._id)}
                          className="text-rose-600 hover:bg-rose-50 p-2"
                          aria-label="Delete job posting"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Confirm Modal for Delete */}
      <ConfirmModal
        isOpen={!!deletingJobId}
        onClose={() => setDeletingJobId(null)}
        onConfirm={confirmDelete}
        title="Delete Job Posting?"
        message="Are you sure you want to delete this job posting? All candidate applications associated with this job will also be removed."
        confirmText="Delete Posting"
        confirmVariant="danger"
        loading={isDeleting}
      />

      {/* Identity Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </div>
  );
}
