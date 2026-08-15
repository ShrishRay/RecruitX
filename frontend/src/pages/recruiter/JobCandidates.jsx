import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

export default function JobCandidates() {
  const { jobId } = useParams();
  const { showSuccess, showError } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filterView, setFilterView] = useState('qualified'); // 'qualified' | 'all'

  useEffect(() => {
    fetchCandidates();
  }, [jobId]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/applications/job/${jobId}`);
      setCandidates(res.data.applications || res.data.allApplications || []);
      setJob(res.data.job || null);
    } catch (err) {
      console.error('Error fetching job candidates:', err);
      showError('Failed to load candidate applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    setUpdating(applicationId);
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      showSuccess(`Candidate status marked as ${status}!`);
      setCandidates(prev =>
        prev.map(c => (c.applicationId === applicationId ? { ...c, status } : c))
      );
      if (selectedCandidate && selectedCandidate.applicationId === applicationId) {
        setSelectedCandidate(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error('Update status error:', err);
      showError(err.response?.data?.message || 'Failed to update candidate status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  const overallThreshold = job?.overallPassingThreshold || 60;
  const qualifiedCandidates = candidates.filter(c => c.isShortlistEligible);
  const pendingCandidates = candidates.filter(c => !c.isShortlistEligible);
  const displayedCandidates = filterView === 'qualified' ? qualifiedCandidates : candidates;

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
            <span>Candidates</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {job?.title || 'Job Applications'}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Evaluate applicants who satisfy verified resume claims, &gt;50% match score, and achieve an overall assessment grade &ge; {overallThreshold}%.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/recruiter/dashboard">
            <Button variant="secondary" size="md" className="font-bold">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 3-TIER SHORTLISTING QUALIFICATION HERO BANNER ── */}
      <Card hover={false} className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h2 className="text-sm font-extrabold text-white">
                Strict 3-Tier Recruiter Shortlisting Protocol
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Active Enforced
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Candidates are visible for shortlisting <strong>ONLY</strong> if they fulfill all 3 conditions: (1) 100% verified PDF resume via Open-Source LLM, (2) Match score &ge; 50%, and (3) Overall assessment score &ge; {overallThreshold}% across all required rounds.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-300 uppercase">🎯 Pass Grade</p>
              <p className="text-xl font-black text-amber-400">&ge; {overallThreshold}%</p>
            </div>
            <div className="text-center bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-300 uppercase">⭐ Qualified</p>
              <p className="text-xl font-black text-emerald-400">{qualifiedCandidates.length}</p>
            </div>
            <div className="text-center bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-300 uppercase">📋 Total</p>
              <p className="text-xl font-black text-slate-200">{candidates.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterView('qualified')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterView === 'qualified'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            ⭐ Qualified for Shortlisting ({qualifiedCandidates.length})
          </button>
          <button
            onClick={() => setFilterView('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterView === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            All Applicants ({candidates.length})
          </button>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing {displayedCandidates.length} candidate{displayedCandidates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Candidate List */}
      {displayedCandidates.length === 0 ? (
        <EmptyState
          title={filterView === 'qualified' ? 'No candidates qualified yet' : 'No applicants yet'}
          description={
            filterView === 'qualified'
              ? `Applicants will appear here once their PDF resumes are verified, match score is ≥ 50%, and overall assessment grade is ≥ ${overallThreshold}%.`
              : 'Candidates who apply to this role will appear here.'
          }
          action={
            filterView === 'qualified' && candidates.length > 0 ? (
              <Button onClick={() => setFilterView('all')} variant="secondary" className="font-bold">
                View All {candidates.length} Applicants
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedCandidates.map((item) => {
            const cand = item.candidate || {};
            const isQualified = item.isShortlistEligible;
            const isResumeVerified = item.isResumeVerified;
            const isMatchPassed = item.matchScore >= 50;
            const allPassed = item.allAssessmentsPassed;
            const results = item.assessmentResults || [];

            return (
              <Card 
                key={item.applicationId} 
                className={`p-5 transition-all space-y-4 ${
                  isQualified ? 'border-indigo-200 bg-white hover:border-indigo-400 shadow-xs' : 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Candidate Info */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 shadow-xs ${
                        isQualified ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {cand.name?.charAt(0)?.toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 truncate">{cand.name}</h3>
                          
                          {isQualified ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <span>⭐ 100% Shortlist Qualified</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Criteria Incomplete
                            </span>
                          )}

                          <Badge variant={item.status}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                          <span className="text-slate-800 font-bold">{cand.preferredRole || 'Software Engineer'}</span>
                          <span>·</span>
                          <span>{cand.experience || 0} years exp</span>
                          <span>·</span>
                          <span>{cand.email}</span>
                          {cand.phone && (
                            <>
                              <span>·</span>
                              <span>{cand.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cand.skills?.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs font-semibold bg-white text-indigo-900 rounded-md border border-slate-200 shadow-2xs">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* 3-Tier Qualification Status Pill Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {/* 1. Resume Verification */}
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border flex items-center gap-1 ${
                        isResumeVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        <span>{isResumeVerified ? '🛡️ Resume Verified ✓' : '⚠️ Resume Unverified ✗'}</span>
                      </span>

                      {/* 2. Match Score (>=50%) */}
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border flex items-center gap-1 ${
                        isMatchPassed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        <span>🎯 Match: {item.matchScore}% {isMatchPassed ? '(≥ 50% ✓)' : '(Below 50% ✗)'}</span>
                      </span>

                      {/* 3. Skill Assessments Status */}
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border flex items-center gap-1 ${
                        allPassed 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        <span>
                          📝 Assessments: {item.assessmentScore !== null && item.assessmentScore !== undefined ? `${item.assessmentScore}% Avg` : 'Pending'} {allPassed ? `(≥ ${overallThreshold}% Pass ✓)` : `(Requires ≥ ${overallThreshold}% ✗)`}
                        </span>
                      </span>
                    </div>

                    {/* Individual Assessment Rounds Breakdown */}
                    {results.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                        {results.map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              r.passed ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200' : 'bg-rose-50/80 text-rose-900 border-rose-200'
                            }`}
                          >
                            {r.skill || `Round ${rIdx + 1}`}: {r.score}% ({r.passed ? '✓' : '✗'})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Actions & Match Gauge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="w-36 sm:w-44">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 text-left sm:text-right">Match Score</p>
                      <ProgressBar value={item.matchScore} size="sm" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedCandidate(item)}
                      >
                        Audit Details
                      </Button>

                      {item.status !== 'shortlisted' && (
                        <Button
                          size="sm"
                          disabled={!isQualified}
                          loading={updating === item.applicationId}
                          onClick={() => handleStatusUpdate(item.applicationId, 'shortlisted')}
                          className={`font-bold text-white shadow-xs ${
                            isQualified 
                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                              : 'bg-slate-300 cursor-not-allowed opacity-60 text-slate-600'
                          }`}
                        >
                          Shortlist ⭐
                        </Button>
                      )}

                      {item.status !== 'rejected' && (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={updating === item.applicationId}
                          onClick={() => handleStatusUpdate(item.applicationId, 'rejected')}
                        >
                          Reject
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

      {/* Candidate Profile Details Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={`Candidate Profile: ${selectedCandidate.candidate?.name}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Qualification Summary Card */}
            <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-100 space-y-2 text-xs">
              <p className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px]">
                3-Tier Qualification Status & Assessment Audit
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                  <p className="text-[10px] font-bold text-slate-400">PDF RESUME VERIFICATION</p>
                  <p className={`font-bold mt-0.5 ${selectedCandidate.isResumeVerified ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedCandidate.isResumeVerified ? '100% Corroborated ✓' : 'Discrepancy / Unverified ✗'}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                  <p className="text-[10px] font-bold text-slate-400">JOB MATCH SCORE</p>
                  <p className={`font-bold mt-0.5 ${selectedCandidate.matchScore >= 50 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedCandidate.matchScore}% {selectedCandidate.matchScore >= 50 ? '(≥ 50% ✓)' : '(Below 50% ✗)'}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                  <p className="text-[10px] font-bold text-slate-400">OVERALL ASSESSMENT GRADE</p>
                  <p className={`font-bold mt-0.5 ${selectedCandidate.allAssessmentsPassed ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedCandidate.assessmentScore !== null ? `${selectedCandidate.assessmentScore}%` : 'Pending'} {selectedCandidate.allAssessmentsPassed ? `(≥ ${overallThreshold}% Pass ✓)` : `(Requires ≥ ${overallThreshold}% ✗)`}
                  </p>
                </div>
              </div>
            </div>

            {/* Candidate Details */}
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase text-[10px]">Candidate Email & Phone</p>
                <p className="text-slate-800 font-semibold mt-0.5">{selectedCandidate.candidate?.email} · {selectedCandidate.candidate?.phone || 'No phone provided'}</p>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase text-[10px]">Skills Listed in Verified Profile</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedCandidate.candidate?.skills?.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-xs border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {selectedCandidate.candidate?.education && (
                <div>
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Education</p>
                  <p className="text-slate-800 font-medium mt-0.5">{selectedCandidate.candidate.education}</p>
                </div>
              )}

              {selectedCandidate.candidate?.projects && (
                <div>
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Projects & Experience</p>
                  <p className="text-slate-800 font-medium mt-0.5">{selectedCandidate.candidate.projects}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedCandidate(null)}>
                Close
              </Button>
              {selectedCandidate.status !== 'shortlisted' && (
                <Button
                  disabled={!selectedCandidate.isShortlistEligible}
                  onClick={() => handleStatusUpdate(selectedCandidate.applicationId, 'shortlisted')}
                  className={`font-bold text-white ${
                    selectedCandidate.isShortlistEligible 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-slate-300 cursor-not-allowed opacity-60 text-slate-600'
                  }`}
                >
                  Shortlist Candidate ⭐
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
