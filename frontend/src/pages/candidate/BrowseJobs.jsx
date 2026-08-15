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
import { useAuth } from '../../context/AuthContext';
import VerificationModal from '../../components/VerificationModal';
import SkillAssessmentModal from '../../components/SkillAssessmentModal';

export default function BrowseJobs() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState({});
  const [applicationsMap, setApplicationsMap] = useState({}); // { [jobId]: applicationObj }
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [assessmentJob, setAssessmentJob] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

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

      const apps = appRes.data.applications || [];
      const appMap = {};
      const applied = new Set();
      apps.forEach(a => {
        if (a.job?._id) {
          appMap[a.job._id] = a;
          applied.add(a.job._id);
        }
      });
      setApplicationsMap(appMap);
      setAppliedJobs(applied);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      showError('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!user?.isEmailVerified || !user?.isPhoneVerified) {
      showError('Candidate verification required! Please verify your email and phone number.');
      setShowVerificationModal(true);
      return;
    }

    setApplying(jobId);
    try {
      const res = await api.post('/applications', { jobId });
      setAppliedJobs(prev => new Set([...prev, jobId]));
      if (res.data.application) {
        setApplicationsMap(prev => ({
          ...prev,
          [jobId]: res.data.application
        }));
      }
      showSuccess('Application submitted! Now take the skill assessment to qualify for shortlisting.');
      
      // Auto-open assessment modal after applying
      const targetedJob = jobs.find(j => j._id === jobId);
      if (targetedJob) {
        setAssessmentJob({
          id: targetedJob._id,
          title: targetedJob.title,
          assessment: targetedJob.assessment
        });
      }
    } catch (err) {
      console.error('Error applying:', err);
      if (err.response?.data?.code === 'VERIFICATION_REQUIRED') {
        setShowVerificationModal(true);
      }
      showError(err.response?.data?.message || 'Error submitting application');
    } finally {
      setApplying(null);
    }
  };

  const handleAssessmentComplete = (result) => {
    fetchData(); // Refresh application status and scores
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

  const isResumeVerified = !!user?.isResumeVerified && !user?.isSuspended && user?.accountStatus !== 'rejected';

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {showVerificationModal && (
        <VerificationModal 
          isOpen={showVerificationModal} 
          onClose={() => setShowVerificationModal(false)} 
        />
      )}

      {assessmentJob && (
        <SkillAssessmentModal
          isOpen={!!assessmentJob}
          onClose={() => setAssessmentJob(null)}
          job={assessmentJob}
          onAssessmentComplete={handleAssessmentComplete}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Browse Open Jobs</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Explore positions, complete skill assessments, and qualify for recruiter shortlisting.
          </p>
        </div>

        {/* Candidate Qualification Status Pill */}
        <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center gap-3 text-xs shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Your Verification Status</p>
            <p className="font-extrabold text-xs text-white">
              {isResumeVerified ? '🛡️ Resume 100% Verified ✓' : '⚠️ Resume Unverified'}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-black ${isResumeVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
            {isResumeVerified ? 'Shortlist Ready' : 'LLM Verification Pending'}
          </span>
        </div>
      </div>

      {/* 3-Tier Shortlisting Qualification Guide Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100 text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-extrabold flex items-center gap-1.5">
            <span>🛡️ Recruiter Shortlisting Visibility Policy:</span>
          </p>
          <p className="text-slate-600 text-[11px]">
            To appear in the recruiter's shortlisting review queue, you must satisfy all 3 criteria: (1) Verified PDF Resume, (2) Match Score &gt; 50%, and (3) Score &ge; Job Passing Threshold on the Skill Assessment.
          </p>
        </div>
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
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">
              <span>Min Match:</span>
              {[0, 50, 75].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMinMatch(val)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    minMatch === val ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {val === 0 ? 'All' : `${val}%+`}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSortBy('match')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sortBy === 'match' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Best Match
              </button>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sortBy === 'newest' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Newest
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No jobs found matching your criteria"
          description="Try clearing your search filters or reducing the minimum match score threshold."
          actionText="Reset Filters"
          onAction={() => { setSearchQuery(''); setMinMatch(0); }}
        />
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => {
            const matchScore = matches[job._id] || 0;
            const hasApplied = appliedJobs.has(job._id);
            const appRecord = applicationsMap[job._id];
            const isCompanyVerified = job.postedBy?.isCompanyVerified;
            const companyWebsite = job.postedBy?.companyWebsite;
            const trustScore = job.postedBy?.trustScore || (isCompanyVerified ? 100 : 30);
            
            const assessments = job.assessments || (job.assessment ? [job.assessment] : []);
            const results = appRecord?.assessmentResults || [];
            const allPassed = appRecord?.allAssessmentsPassed || (results.length > 0 && results.every(r => r.passed)) || (appRecord?.assessmentPassed === true);
            const hasTakenAny = results.length > 0 || appRecord?.assessmentScore !== undefined && appRecord?.assessmentScore !== null;
            const avgScore = appRecord?.overallAssessmentScore || appRecord?.assessmentScore || (results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : null);

            const isShortlistEligible = isResumeVerified && matchScore >= 50 && allPassed;

            return (
              <Card key={job._id} className="p-5 hover:border-slate-300 transition-all space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Role Info */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-base shrink-0 border border-indigo-100">
                        {job.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 truncate">{job.title}</h3>
                          {isShortlistEligible && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Shortlist Qualified ✓
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                          <span className="text-slate-800 font-bold">{job.postedBy?.company || 'Company'}</span>
                          
                          {isCompanyVerified && companyWebsite && (
                            <a
                              href={companyWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              <span>Official Site</span>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}

                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isCompanyVerified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {isCompanyVerified ? '🛡️ Verified Enterprise' : '🛡️ Recruiter'} ({trustScore}% Trust)
                          </span>

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
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skillsRequired?.slice(0, 6).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200/60">
                          {skill}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 text-xs font-medium text-slate-500">
                        {job.experienceRequired}+ yrs req.
                      </span>
                    </div>

                    {/* Multiple Assessments Badge */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 font-bold border border-indigo-100 flex items-center gap-1 text-[11px]">
                        <span>📝 {assessments.length || 1} Assessment Round(s) Required</span>
                      </span>

                      {assessments.slice(0, 3).map((aMod, aIdx) => (
                        <span key={aIdx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                          {aMod.skill || `Round ${aIdx + 1}`}: ⏱️ {aMod.timeLimit || 15}m · {aMod.passingThreshold || 60}% pass
                        </span>
                      ))}

                      {hasTakenAny && (
                        <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                          allPassed 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          Score: {avgScore}% {allPassed ? '(All Passed ✓)' : '(Incomplete/Pending ⚠️)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Score & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="w-36 sm:w-44">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 text-left sm:text-right">Match Score</p>
                      <ProgressBar value={matchScore} size="sm" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                      >
                        Job Details
                      </Button>

                      {/* Take Assessment Button */}
                      <Button
                        variant={allPassed ? 'secondary' : hasTakenAny ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => setAssessmentJob({ id: job._id, title: job.title, assessments: job.assessments, assessment: job.assessment })}
                        className={`font-bold text-xs ${
                          allPassed 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                            : hasTakenAny
                              ? 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {allPassed 
                          ? `✓ Assessments Passed (${avgScore}%)` 
                          : hasTakenAny 
                            ? `View Scorecard (${avgScore}%)` 
                            : `📝 Take Assessment (${assessments.length || 1})`}
                      </Button>

                      {hasApplied ? (
                        <Badge variant="applied">Applied</Badge>
                      ) : (
                        <Button
                          size="sm"
                          loading={applying === job._id}
                          onClick={() => handleApply(job._id)}
                          className="font-bold bg-indigo-600 hover:bg-indigo-700"
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

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          size="lg"
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Role Description</p>
              <p className="text-xs sm:text-sm text-slate-700 mt-1 whitespace-pre-line leading-relaxed font-medium">
                {selectedJob.description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Location</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedJob.location}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Compensation</p>
                <p className="font-bold text-emerald-700 mt-0.5">{selectedJob.salary || 'Competitive'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Min. Experience</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedJob.experienceRequired}+ years</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Pass Threshold</p>
                <p className="font-bold text-indigo-700 mt-0.5">{selectedJob.assessment?.passingThreshold || 60}%</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedJob.skillsRequired?.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold rounded-lg text-xs border border-slate-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const jobToTest = selectedJob;
                  setSelectedJob(null);
                  setAssessmentJob({ id: jobToTest._id, title: jobToTest.title, assessment: jobToTest.assessment });
                }}
                className="font-bold"
              >
                📝 Take Skill Assessment
              </Button>
              {!appliedJobs.has(selectedJob._id) && (
                <Button
                  loading={applying === selectedJob._id}
                  onClick={() => {
                    handleApply(selectedJob._id);
                    setSelectedJob(null);
                  }}
                  className="font-bold bg-indigo-600 hover:bg-indigo-700"
                >
                  Apply to Position
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
