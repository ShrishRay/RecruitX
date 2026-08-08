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

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications/candidate');
      setApplications(res.data.applications);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    avgScore: applications.length > 0
      ? Math.round(applications.reduce((sum, a) => sum + a.matchScore, 0) / applications.length)
      : 0,
  };

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track your job applications and check live candidate match scores.
          </p>
        </div>
        <Link to="/candidate/jobs">
          <Button size="md" className="font-bold">
            Browse All Jobs
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: stats.total, color: 'text-indigo-600', icon: '📋' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-emerald-600', icon: '⭐' },
          { label: 'Under Review', value: stats.total - stats.shortlisted - stats.rejected, color: 'text-blue-600', icon: '⏳' },
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
                <Button className="font-bold">Browse Jobs Now</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3 stagger-children">
            {applications.map((app) => (
              <Card key={app._id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {app.job?.title || 'Position'}
                      </h3>
                      <Badge variant={app.status}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                      {app.job?.postedBy?.company && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {app.job.postedBy.company}
                        </span>
                      )}
                      {app.job?.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {app.job.location}
                        </span>
                      )}
                      {app.appliedAt && (
                        <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Match score bar */}
                  <div className="w-full sm:w-48 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Match Compatibility</p>
                    <ProgressBar value={app.matchScore} size="sm" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
