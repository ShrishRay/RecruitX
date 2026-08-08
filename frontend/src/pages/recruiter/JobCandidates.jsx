import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

export default function JobCandidates() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [ranked, setRanked] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'shortlisted' | 'rejected'

  useEffect(() => {
    fetchRankedCandidates();
  }, [jobId]);

  const fetchRankedCandidates = async () => {
    try {
      const res = await api.get(`/match/job/${jobId}`);
      setRanked(res.data.rankedCandidates || []);
      setJobTitle(res.data.job?.title || 'Job');
    } catch (err) {
      console.error('Error fetching ranked candidates:', err);
      showError('Failed to load ranked candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    setUpdating(applicationId);
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      setRanked(prev =>
        prev.map(r =>
          r.applicationId === applicationId ? { ...r, status } : r
        )
      );
      showSuccess(`Candidate status updated to ${status}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showError('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredCandidates = useMemo(() => {
    if (statusTab === 'all') return ranked;
    return ranked.filter(r => r.status === statusTab);
  }, [ranked, statusTab]);

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button & Header */}
      <div>
        <button
          onClick={() => navigate('/recruiter/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{jobTitle}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {ranked.length} candidates ranked by automated match score.
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-bold text-slate-700 shrink-0">
            {['all', 'shortlisted', 'rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  statusTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <EmptyState
          title={`No ${statusTab === 'all' ? '' : statusTab} candidates found`}
          description="No candidate applications match your current status filter."
          action={
            statusTab !== 'all' ? (
              <Button variant="secondary" onClick={() => setStatusTab('all')}>
                View All Candidates
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          {/* Top 3 Highlight Cards (Shown when view = all) */}
          {statusTab === 'all' && ranked.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ranked.slice(0, 3).map((item, index) => (
                <Card
                  key={item.applicationId}
                  className={`p-5 relative cursor-pointer ${
                    index === 0 ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20' : ''
                  }`}
                  onClick={() => setSelectedCandidate(item)}
                >
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shadow-xs bg-slate-100 text-slate-700">
                    #{index + 1}
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-3 shadow-xs">
                      {item.candidate?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.candidate?.name}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{item.candidate?.preferredRole || 'Candidate'}</p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{item.candidate?.experience || 0} yrs experience</p>

                    <div className="mt-3">
                      <ProgressBar value={item.matchScore} size="sm" />
                    </div>

                    <div className="mt-3 flex justify-center">
                      <Badge variant={item.status}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Full Candidates Table */}
          <Card padding={false} hover={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Rank</th>
                    <th className="px-5 py-3.5">Candidate</th>
                    <th className="px-5 py-3.5">Skills</th>
                    <th className="px-5 py-3.5">Exp</th>
                    <th className="px-5 py-3.5 w-40">Match Score</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCandidates.map((item) => (
                    <tr key={item.applicationId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full font-extrabold bg-slate-100 text-slate-700">
                          #{item.rank}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedCandidate(item)}
                          className="text-left cursor-pointer group"
                        >
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                            {item.candidate?.name}
                          </p>
                          <p className="text-[11px] text-slate-500">{item.candidate?.email}</p>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.candidate?.skills?.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200/60">
                              {skill}
                            </span>
                          ))}
                          {(item.candidate?.skills?.length || 0) > 3 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{item.candidate.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {item.candidate?.experience || 0} yrs
                      </td>

                      <td className="px-5 py-4">
                        <ProgressBar value={item.matchScore} size="sm" />
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant={item.status}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'shortlisted' && (
                            <Button
                              variant="success"
                              size="sm"
                              loading={updating === item.applicationId}
                              onClick={() => handleStatusUpdate(item.applicationId, 'shortlisted')}
                              className="font-bold"
                            >
                              Shortlist
                            </Button>
                          )}
                          {item.status !== 'rejected' && (
                            <Button
                              variant="danger"
                              size="sm"
                              loading={updating === item.applicationId}
                              onClick={() => handleStatusUpdate(item.applicationId, 'rejected')}
                              className="font-bold"
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Candidate Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title="Candidate Profile"
        size="lg"
      >
        {selectedCandidate && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs">
                {selectedCandidate.candidate?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">{selectedCandidate.candidate?.name}</h3>
                <p className="text-xs text-slate-500">{selectedCandidate.candidate?.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black text-indigo-600">{Math.round(selectedCandidate.matchScore)}%</p>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Match Score</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <p className="text-[11px] font-extrabold uppercase text-slate-400">Experience</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCandidate.candidate?.experience || 0} years</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <p className="text-[11px] font-extrabold uppercase text-slate-400">Target Role</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCandidate.candidate?.preferredRole || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.candidate?.skills?.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100/80">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {selectedCandidate.candidate?.projects?.length > 0 && (
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Projects</h4>
                <div className="space-y-2">
                  {selectedCandidate.candidate.projects.map((project, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                      <p className="font-bold text-slate-900">{project.title}</p>
                      <p className="text-slate-600 mt-1 font-medium">{project.description}</p>
                      {project.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.map((tech, j) => (
                            <span key={j} className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 text-slate-700 font-semibold rounded">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelectedCandidate(null)}>
                Close
              </Button>
              {selectedCandidate.status !== 'shortlisted' && (
                <Button
                  variant="success"
                  onClick={() => {
                    handleStatusUpdate(selectedCandidate.applicationId, 'shortlisted');
                    setSelectedCandidate(null);
                  }}
                  className="font-bold"
                >
                  Shortlist Candidate
                </Button>
              )}
              {selectedCandidate.status !== 'rejected' && (
                <Button
                  variant="danger"
                  onClick={() => {
                    handleStatusUpdate(selectedCandidate.applicationId, 'rejected');
                    setSelectedCandidate(null);
                  }}
                  className="font-bold"
                >
                  Reject Candidate
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
