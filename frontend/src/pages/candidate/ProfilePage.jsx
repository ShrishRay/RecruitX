import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import TagInput from '../../components/ui/TagInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import VerificationModal from '../../components/VerificationModal';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Resume Upload & Open-Source LLM Comparison State
  const [uploadingResume, setUploadingResume] = useState(false);
  const [testStage, setTestStage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [resumeValidationResult, setResumeValidationResult] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(user?.resumeFileName || '');
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    skills: [],
    experience: 0,
    projects: [{ title: '', description: '', technologies: [] }],
    education: { degree: '', institution: '', year: '' },
    preferredRole: '',
    preferredLocation: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/candidate/profile');
      const p = res.data.profile;
      setForm({
        name: p.name || '',
        skills: p.skills || [],
        experience: p.experience || 0,
        projects: p.projects?.length > 0 ? p.projects : [{ title: '', description: '', technologies: [] }],
        education: p.education || { degree: '', institution: '', year: '' },
        preferredRole: p.preferredRole || '',
        preferredLocation: p.preferredLocation || '',
      });
      setSelectedFileName(p.resumeFileName || '');
      updateUser(p);
    } catch (err) {
      console.error('Error fetching profile:', err);
      showError('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (user?.accountStatus === 'rejected' || user?.isSuspended || (user?.warningsCount && user?.warningsCount >= 3)) {
      showError('Cannot modify profile. Your account is permanently rejected.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        experience: Number(form.experience),
        education: {
          ...form.education,
          year: form.education.year ? Number(form.education.year) : undefined,
        },
        projects: form.projects.filter(p => p.title.trim() !== ''),
      };
      const res = await api.put('/candidate/profile', payload);
      updateUser(res.data.profile);
      showSuccess('Profile claims updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      showError(err.response?.data?.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  // Compare uploaded resume against candidate profile using Open-Source LLM
  const processAndUploadResume = async (file, fallbackText = '', demoFileName = '') => {
    if (user?.accountStatus === 'rejected' || user?.isSuspended || (user?.warningsCount && user?.warningsCount >= 3)) {
      showError('Account is permanently rejected. Additional resume uploads and comparisons are disabled.');
      return;
    }

    setUploadingResume(true);
    setTestStage('Step 1/3: Reading PDF binary & extracting text streams...');
    setResumeValidationResult(null);

    try {
      let base64Data = '';
      let extractedClientText = fallbackText;
      const fileName = demoFileName || file?.name || 'candidate_resume.pdf';

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64Data = btoa(binary);

        if (!extractedClientText) {
          const textMatches = binary.match(/\((.*?)\)/g) || [];
          extractedClientText = textMatches.map(m => m.slice(1, -1)).join(' ');
        }
      }

      setTestStage('Step 2/3: Open-Source LLM comparing profile claims against resume contents...');

      const res = await api.post('/candidate/resume', {
        resumeFile: base64Data,
        resumeFileName: fileName,
        resumeText: extractedClientText
      });

      const data = res.data;
      setTestStage('Step 3/3: Evaluating discrepancy score & checking warning strike policy...');
      
      setResumeValidationResult(data.validation);
      setSelectedFileName(fileName);

      if (data.profile) updateUser(data.profile);

      if (data.accountRejected) {
        showError(data.message || 'LLM Comparison: Account permanently rejected due to 3 warnings!');
      } else if (data.warningIssued) {
        showError(data.message || `LLM Comparison: Permanent Warning ${data.warningsCount}/3 issued!`);
      } else if (data.success) {
        showSuccess(data.message || 'LLM Comparison: Resume 100% corroborated with profile!');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.validation) setResumeValidationResult(data.validation);
      if (data?.profile) updateUser(data.profile);
      showError(data?.message || 'Error executing Open-Source LLM resume comparison');
    } finally {
      setUploadingResume(false);
      setTestStage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Automatic trigger on file selection
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showError('Please upload a PDF format resume (.pdf)');
      return;
    }

    // Automatically run the comparison immediately upon file selection
    processAndUploadResume(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAccountRejected) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isAccountRejected) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showError('Please upload a PDF format resume (.pdf)');
      return;
    }

    // Automatically run the comparison immediately upon drop
    processAndUploadResume(file);
  };

  const addProject = () => {
    setForm({
      ...form,
      projects: [...form.projects, { title: '', description: '', technologies: [] }],
    });
  };

  const removeProject = (index) => {
    setForm({ ...form, projects: form.projects.filter((_, i) => i !== index) });
  };

  const updateProject = (index, field, value) => {
    const updated = [...form.projects];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, projects: updated });
  };

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  const isFullyVerified = user?.isEmailVerified && user?.isPhoneVerified;
  const warningsCount = user?.warningsCount || 0;
  const isAccountRejected = user?.accountStatus === 'rejected' || user?.isSuspended || warningsCount >= 3;
  const isResumeVerified = user?.isResumeVerified && !isAccountRejected;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">
      {showVerificationModal && (
        <VerificationModal 
          isOpen={showVerificationModal} 
          onClose={() => setShowVerificationModal(false)} 
        />
      )}
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Candidate Profile & Resume Verification</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Provide your profile claims below, then upload your official PDF resume. The Open-Source LLM compares your resume against your profile claims to corroborate authenticity.
        </p>
      </div>

      {/* ── PERMANENT REJECTION OR WARNING BANNER ── */}
      {isAccountRejected ? (
        <Card hover={false} className="p-5 border-l-4 border-l-rose-600 bg-rose-50/90 border-rose-200 shadow-md">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⛔</span>
              <h2 className="text-base font-black text-rose-900">ACCOUNT PERMANENTLY REJECTED & SUSPENDED</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                3/3 Permanent Warnings
              </span>
            </div>
            <p className="text-xs font-semibold text-rose-800 leading-relaxed">
              Your account has been permanently rejected because details provided in your profile could not be corroborated in your uploaded resumes across 3 warnings. Warnings cannot be cleared, and all job applications and profile edits are permanently locked.
            </p>
            {user?.rejectionReason && (
              <p className="text-[11px] font-mono text-rose-700 bg-white/90 p-2.5 rounded-lg border border-rose-200">
                Audit Log: {user.rejectionReason}
              </p>
            )}
          </div>
        </Card>
      ) : warningsCount > 0 ? (
        <Card hover={false} className="p-5 border-l-4 border-l-amber-500 bg-amber-50/90 border-amber-200 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h2 className="text-base font-bold text-amber-900">
                Permanent Discrepancy Warning ({warningsCount}/3)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-900 border border-amber-300">
                {3 - warningsCount} Warning(s) Left Before Permanent Rejection
              </span>
            </div>
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              Discrepancies were detected between your profile claims and your uploaded resume by the LLM audit. <span className="font-bold underline">Warnings are permanent and cannot be cleared.</span> If your account receives 3 warnings, it will be permanently rejected.
            </p>
          </div>
        </Card>
      ) : null}

      {/* ── OPEN-SOURCE LLM RESUME COMPARISON & PDF UPLOAD SECTION ── */}
      <Card hover={false} className="p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Open-Source LLM Resume vs Profile Corroborator</h2>
                <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                  Qwen 2.5 7B
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                The open-source LLM cross-examines your uploaded resume text against your claimed profile details below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isResumeVerified ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-xs">
                <span>🛡️ Resume Verified by LLM (100%) ✓</span>
              </span>
            ) : isAccountRejected ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                Account Rejected
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                LLM Comparison Pending
              </span>
            )}
          </div>
        </div>

        {/* 3-Warning Protocol Visual Tracker */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Permanent Warning Strike Status (Non-Resettable)</span>
            <span className={warningsCount === 0 ? 'text-emerald-700' : warningsCount >= 3 ? 'text-rose-700' : 'text-amber-700'}>
              {warningsCount === 0 ? '0/3 Warnings (Good Standing)' : `${warningsCount}/3 Warnings Recorded`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded-lg text-center text-[11px] font-bold border transition-colors ${
              warningsCount >= 1 ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              Warning 1 {warningsCount >= 1 ? '✗' : ''}
            </div>
            <div className={`p-2 rounded-lg text-center text-[11px] font-bold border transition-colors ${
              warningsCount >= 2 ? 'bg-amber-200 border-amber-400 text-amber-950 font-black' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              Warning 2 (Final) {warningsCount >= 2 ? '✗' : ''}
            </div>
            <div className={`p-2 rounded-lg text-center text-[11px] font-bold border transition-colors ${
              warningsCount >= 3 ? 'bg-rose-600 border-rose-700 text-white font-black' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              3rd: Permanent Rejection {warningsCount >= 3 ? '⛔' : ''}
            </div>
          </div>
        </div>

        {/* PDF File Upload Zone (Auto-Runs Open-Source LLM on Drop or File Pick) */}
        {!isAccountRejected ? (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all space-y-3 ${
              isDragging 
                ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]' 
                : 'border-slate-300 hover:border-indigo-500 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,application/pdf"
              className="hidden"
              id="pdf-upload"
            />

            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-xs border transition-all ${
              isDragging 
                ? 'bg-indigo-600 text-white border-indigo-700 animate-bounce' 
                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <div>
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <span className="text-sm font-bold text-indigo-600 hover:text-indigo-800 underline">
                  Select a PDF resume to compare against your profile
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">or drop your .pdf resume here for instant automated LLM comparison</span>
              </label>
              {selectedFileName && (
                <p className="text-xs font-bold text-slate-700 mt-2 bg-white inline-block px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                  📎 Uploaded Resume: {selectedFileName}
                </p>
              )}
            </div>

            {uploadingResume && (
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 flex flex-col items-center justify-center gap-1.5 text-xs font-bold text-indigo-700 animate-pulse">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Open-Source LLM Comparing Resume with Profile Claims...</span>
                </div>
                {testStage && (
                  <span className="text-[11px] text-indigo-600 font-mono font-medium">
                    {testStage}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 text-center text-xs font-semibold text-rose-800">
            Resume uploads and automated comparisons are locked due to permanent account rejection.
          </div>
        )}

        {/* Automated LLM Test Output Breakdown Card */}
        {resumeValidationResult && (
          <div className={`p-4 rounded-xl border space-y-3 ${
            resumeValidationResult.isValid ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{resumeValidationResult.isValid ? '✅' : '❌'}</span>
                <div>
                  <p className={`text-xs font-bold ${resumeValidationResult.isValid ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {resumeValidationResult.isValid ? 'LLM Comparison Passed: 100% Corroborated' : `LLM Discrepancy Alert (${resumeValidationResult.discrepancies?.length || 0} issues)`}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Model: {resumeValidationResult.modelUsed || 'Qwen/Qwen2.5-7B-Instruct (Open-Source LLM)'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-black ${
                resumeValidationResult.isValid ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
              }`}>
                Match: {resumeValidationResult.matchScore}%
              </span>
            </div>

            {/* LLM In-Depth Analysis Reasoning */}
            {resumeValidationResult.llmAnalysis && (
              <div className="p-3 bg-white/90 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                  <span>🤖 Open-Source LLM Comparison Audit</span>
                </p>
                <p className="text-[11px] text-slate-800">{resumeValidationResult.llmAnalysis}</p>
              </div>
            )}

            {/* Verified vs Missing Skills Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-emerald-800 mb-1.5 flex items-center gap-1">
                  <span>✓ Corroborated in Resume ({resumeValidationResult.verifiedSkills?.length || 0})</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {resumeValidationResult.verifiedSkills?.length > 0 ? (
                    resumeValidationResult.verifiedSkills.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">None verified</span>
                  )}
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-rose-800 mb-1.5 flex items-center gap-1">
                  <span>✗ Missing from Resume ({resumeValidationResult.missingSkills?.length || 0})</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {resumeValidationResult.missingSkills?.length > 0 ? (
                    resumeValidationResult.missingSkills.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold border border-rose-100">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-emerald-600 font-medium">0 missing skills ✓</span>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Discrepancy List */}
            {resumeValidationResult.discrepancies?.length > 0 && (
              <div className="bg-white/90 p-3 rounded-lg border border-rose-200 space-y-1 text-xs text-rose-800">
                <p className="font-bold text-[11px] uppercase tracking-wider text-rose-900">Discrepancy Breakdown:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {resumeValidationResult.discrepancies.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Account Identity Verification Card */}
      <Card hover={false} className="p-5 border-l-4 border-l-indigo-600 bg-gradient-to-r from-indigo-50/40 to-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Contact Verification Status</h2>
              <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${isFullyVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isFullyVerified ? 'Verified Profile ✓' : 'Verification Required ⚡'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {isFullyVerified 
                ? 'Your contact details are verified! You can apply for all active job requisitions.' 
                : 'Please complete both Email and Phone verification to unlock job applications.'}
            </p>
            <div className="flex items-center gap-3 mt-2.5 text-xs font-semibold">
              <span className={user?.isEmailVerified ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                Email: {user?.isEmailVerified ? 'Verified ✓' : 'Unverified ✗'}
              </span>
              <span>·</span>
              <span className={user?.isPhoneVerified ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                Phone: {user?.isPhoneVerified ? `Verified (${user?.phone || ''}) ✓` : 'Unverified ✗'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowVerificationModal(true)}
            className="font-bold shrink-0 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            {isFullyVerified ? 'Manage Verification' : 'Verify Account Now'}
          </Button>
        </div>
      </Card>

      {/* Profile Claims Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Candidate Profile Claims (Must be corroborated by uploaded resume)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              disabled={isAccountRejected}
              required
            />
            <Input
              label="Years of Experience"
              type="number"
              min="0"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              disabled={isAccountRejected}
              required
            />
            <Input
              label="Target Role"
              value={form.preferredRole}
              onChange={(e) => setForm({ ...form, preferredRole: e.target.value })}
              placeholder="e.g. Full Stack Developer"
              disabled={isAccountRejected}
            />
            <Input
              label="Preferred Location"
              value={form.preferredLocation}
              onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })}
              placeholder="e.g. Remote, New York"
              disabled={isAccountRejected}
            />
          </div>
        </Card>

        {/* Permanent Skills Registered at Profile Creation */}
        <Card hover={false} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Registered Technical Skills
            </h2>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
              🔒 Permanent / Non-Editable
            </span>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <span>🛡️ Corroboration Rule:</span>
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Your uploaded PDF resume must contain all the skills listed below. <strong>Your resume is free to contain additional skills, tools, and experiences beyond these</strong>, which are 100% permitted. Skills registered during profile creation cannot be edited.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {form.skills && form.skills.length > 0 ? (
              form.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-indigo-900 border border-indigo-200 shadow-2xs gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No skills registered during signup</span>
            )}
          </div>
        </Card>

        {/* Education */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            Education Background
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Degree / Major"
              value={form.education.degree}
              onChange={(e) => setForm({ ...form, education: { ...form.education, degree: e.target.value } })}
              placeholder="e.g. B.S. Computer Science"
              disabled={isAccountRejected}
            />
            <Input
              label="University / Institution"
              value={form.education.institution}
              onChange={(e) => setForm({ ...form, education: { ...form.education, institution: e.target.value } })}
              placeholder="e.g. Stanford University"
              disabled={isAccountRejected}
            />
            <Input
              label="Graduation Year"
              type="number"
              value={form.education.year}
              onChange={(e) => setForm({ ...form, education: { ...form.education, year: e.target.value } })}
              placeholder="e.g. 2022"
              disabled={isAccountRejected}
            />
          </div>
        </Card>

        {/* Projects */}
        <Card hover={false} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Key Projects
            </h2>
            {!isAccountRejected && (
              <Button variant="ghost" size="sm" onClick={addProject} type="button" className="text-indigo-600 font-bold">
                + Add Project
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {form.projects.map((project, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-slate-400">Project #{index + 1}</span>
                  {!isAccountRejected && form.projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProject(index)}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Input
                  label="Project Title"
                  value={project.title}
                  onChange={(e) => updateProject(index, 'title', e.target.value)}
                  placeholder="e.g. E-Commerce Microservices Platform"
                  disabled={isAccountRejected}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-800">Description</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    placeholder="Briefly summarize what you built, key challenges solved, and outcomes..."
                    rows={3}
                    disabled={isAccountRejected}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 hover:border-slate-300 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <TagInput
                  label="Technologies Used"
                  tags={project.technologies || []}
                  onChange={(techs) => !isAccountRejected && updateProject(index, 'technologies', techs)}
                  placeholder="Add technology tags..."
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-between">
          <Button 
            type="submit" 
            loading={saving} 
            size="lg" 
            disabled={isAccountRejected}
            className="font-bold px-8 bg-indigo-600 hover:bg-indigo-700"
          >
            Save Profile Claims
          </Button>

          {isAccountRejected && (
            <span className="text-xs font-bold text-rose-600">
              Profile permanently locked due to 3 warnings.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
