import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';

export default function BrowseJobs() {
  const { showSuccess, showError } = useToast();
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState({});
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatch, setMinMatch] = useState(0);
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'newest'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, matchRes, appRes] = await Promise.all([
        api.get('/jobs/all'),
        api.get('/match/candidate'),
        api.get('/applications/candidate'),
      ]);

      setJobs(jobsRes.data.jobs || []);

      const matchMap = {};
      (matchRes.data.matches || []).forEach(m => {
        matchMap[m.job.id] = m.matchScore;
      });
      setMatches(matchMap);

      const applied = new Set((appRes.data.applications || []).map(a => a.job?._id).filter(Boolean));
      setAppliedJobs(applied);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      showError('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    setApplying(jobId);
    try {
      await api.post('/applications', { jobId });
      setAppliedJobs(prev => new Set([...prev, jobId]));
      showSuccess('Application submitted successfully!');
    } catch (err) {
      console.error('Error applying:', err);
      showError(err.response?.data?.message || 'Error submitting application');
    } finally {
      setApplying(null);
    }
  };

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => {
        const matchScore = matches[job._id] || 0;
        if (matchScore < minMatch) return false;

        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        const titleMatch = job.title?.toLowerCase().includes(q);
        const companyMatch = job.postedBy?.company?.toLowerCase().includes(q);
        const locationMatch = job.location?.toLowerCase().includes(q);
        const skillMatch = job.skillsRequired?.some(s => s.toLowerCase().includes(q));

        return titleMatch || companyMatch || locationMatch || skillMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return (matches[b._id] || 0) - (matches[a._id] || 0);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [jobs, matches, searchQuery, minMatch, sortBy]);

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Browse Open Jobs</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Explore roles and view your real-time compatibility match score for each position.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card hover={false} className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by job title, company, location, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={(props) => (
                <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Min Match Filter */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <span>Min Match:</span>
              <select
                value={minMatch}
                onChange={(e) => setMinMatch(Number(e.target.value))}
                className="bg-transparent font-bold outline-none cursor-pointer"
              >
                <option value={0}>All Jobs</option>
                <option value={50}>50%+ Match</option>
                <option value={70}>70%+ Match</option>
                <option value={85}>85%+ Match</option>
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold outline-none cursor-pointer"
              >
                <option value="match">Highest Match</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No matching jobs found"
          description="Try adjusting your search query or minimum match score filter."
          action={
            <Button variant="secondary" onClick={() => { setSearchQuery(''); setMinMatch(0); }}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {filteredJobs.map((job) => {
            const matchScore = matches[job._id] || 0;
            const hasApplied = appliedJobs.has(job._id);

            return (
              <Card key={job._id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100/60">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-slate-900 truncate">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                          <span className="text-slate-800">{job.postedBy?.company || 'Company'}</span>
                          <span>·</span>
                          <span>{job.location}</span>
                          {job.salary && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-700 font-bold">{job.salary}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skillsRequired?.slice(0, 6).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200/60">
                          {skill}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 text-xs font-medium text-slate-500">
                        {job.experienceRequired}+ yrs req.
                      </span>
                    </div>
                  </div>

                  {/* Match Score & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="w-36 sm:w-44">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 text-left sm:text-right">Match Score</p>
                      <ProgressBar value={matchScore} size="sm" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                      >
                        Details
                      </Button>
                      {hasApplied ? (
                        <Badge variant="applied">Applied</Badge>
                      ) : (
                        <Button
                          size="sm"
                          loading={applying === job._id}
                          onClick={() => handleApply(job._id)}
                          className="font-bold"
                        >
                          Apply Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title || 'Job Details'}
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 pb-3 border-b border-slate-100">
              <span className="text-slate-900 font-bold">{selectedJob.postedBy?.company}</span>
              <span>·</span>
              <span>{selectedJob.location}</span>
              {selectedJob.salary && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 font-bold">{selectedJob.salary}</span>
                </>
              )}
            </div>

            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedJob.skillsRequired?.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100/80">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">Required Experience</h4>
              <p className="text-sm font-semibold text-slate-800">{selectedJob.experienceRequired}+ years</p>
            </div>

            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Job Description</h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                {selectedJob.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              {appliedJobs.has(selectedJob._id) ? (
                <Badge variant="applied">Already Applied</Badge>
              ) : (
                <Button
                  loading={applying === selectedJob._id}
                  onClick={() => {
                    handleApply(selectedJob._id);
                    setSelectedJob(null);
                  }}
                  className="font-bold"
                >
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
