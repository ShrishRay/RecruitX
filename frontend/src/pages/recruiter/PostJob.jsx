import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import TagInput from '../../components/ui/TagInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function PostJob() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [error, setError] = useState('');
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    skillsRequired: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
    experienceRequired: '3',
    location: 'Remote',
    salary: '$120K - $150K',
    overallPassingThreshold: 65,
    assessments: []
  });

  useEffect(() => {
    if (form.skillsRequired.length > 0 && form.assessments.length === 0) {
      handleGenerateAllAssessments();
    }
  }, []);

  const handleGenerateAllAssessments = async () => {
    if (form.skillsRequired.length === 0) {
      showError('Please add at least 1 required skill before generating assessments.');
      return;
    }

    setGeneratingAssessment(true);
    try {
      const res = await api.post('/jobs/generate-assessment', {
        skillsRequired: form.skillsRequired,
        title: form.title || 'Technical Role',
        passingThreshold: form.overallPassingThreshold || 65,
        timeLimit: 15
      });

      const modules = res.data.assessments || (res.data.assessment ? [res.data.assessment] : []);
      setForm(prev => ({
        ...prev,
        assessments: modules
      }));
      setActiveModuleIdx(0);
      showSuccess(`✨ Auto-generated ${modules.length} technical assessment rounds matching all required skills!`);
    } catch (err) {
      console.error('Generate assessments error:', err);
      showError('Failed to generate assessment modules');
    } finally {
      setGeneratingAssessment(false);
    }
  };

  const addAssessmentModule = () => {
    const nextIdx = form.assessments.length + 1;
    const newSkill = form.skillsRequired[form.assessments.length] || 'Technical Skill';
    const newModule = {
      title: `Round ${nextIdx}: ${newSkill} Assessment`,
      description: `Assessment evaluating ${newSkill} skills and core competencies.`,
      skill: newSkill,
      passingThreshold: form.overallPassingThreshold || 65,
      timeLimit: 15,
      isEnabled: true,
      questions: [
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          skill: newSkill
        }
      ]
    };

    setForm(prev => ({
      ...prev,
      assessments: [...prev.assessments, newModule]
    }));
    setActiveModuleIdx(form.assessments.length);
  };

  const removeAssessmentModule = (moduleIdx) => {
    if (form.assessments.length <= 1) {
      showError('A job posting must retain at least 1 technical assessment module.');
      return;
    }
    const filtered = form.assessments.filter((_, i) => i !== moduleIdx);
    setForm(prev => ({ ...prev, assessments: filtered }));
    setActiveModuleIdx(Math.max(0, moduleIdx - 1));
  };

  const updateModuleField = (moduleIdx, field, value) => {
    setForm(prev => {
      const updated = [...prev.assessments];
      updated[moduleIdx] = { ...updated[moduleIdx], [field]: value };
      return { ...prev, assessments: updated };
    });
  };

  const addQuestionToModule = (moduleIdx) => {
    setForm(prev => {
      const updated = [...prev.assessments];
      const targetMod = updated[moduleIdx];
      targetMod.questions = [
        ...targetMod.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          skill: targetMod.skill || 'General'
        }
      ];
      return { ...prev, assessments: updated };
    });
  };

  const removeQuestionFromModule = (moduleIdx, qIdx) => {
    setForm(prev => {
      const updated = [...prev.assessments];
      updated[moduleIdx].questions = updated[moduleIdx].questions.filter((_, i) => i !== qIdx);
      return { ...prev, assessments: updated };
    });
  };

  const updateQuestionInModule = (moduleIdx, qIdx, field, value) => {
    setForm(prev => {
      const updated = [...prev.assessments];
      const questions = [...updated[moduleIdx].questions];
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      updated[moduleIdx].questions = questions;
      return { ...prev, assessments: updated };
    });
  };

  const updateOptionInModule = (moduleIdx, qIdx, optIdx, value) => {
    setForm(prev => {
      const updated = [...prev.assessments];
      const questions = [...updated[moduleIdx].questions];
      const options = [...questions[qIdx].options];
      options[optIdx] = value;
      questions[qIdx] = { ...questions[qIdx], options };
      updated[moduleIdx].questions = questions;
      return { ...prev, assessments: updated };
    });
  };

  const setCorrectOptionInModule = (moduleIdx, qIdx, optIdx) => {
    setForm(prev => {
      const updated = [...prev.assessments];
      const questions = [...updated[moduleIdx].questions];
      questions[qIdx] = { ...questions[qIdx], correctAnswer: optIdx };
      updated[moduleIdx].questions = questions;
      return { ...prev, assessments: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.description || !form.experienceRequired) {
      setError('Title, description, and required experience are mandatory');
      return;
    }

    if (form.skillsRequired.length === 0) {
      setError('Please provide at least one required technical skill');
      return;
    }

    if (form.assessments.length === 0) {
      setError('Please configure at least one assessment module for candidates.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/jobs', {
        title: form.title,
        description: form.description,
        skillsRequired: form.skillsRequired,
        experienceRequired: Number(form.experienceRequired),
        location: form.location,
        salary: form.salary,
        overallPassingThreshold: Number(form.overallPassingThreshold) || 60,
        assessments: form.assessments,
        assessment: form.assessments[0]
      });

      showSuccess(`Job published with ${form.overallPassingThreshold}% Overall Passing Grade and ${form.assessments.length} Assessment Rounds!`);
      navigate('/recruiter/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating job posting';
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const currentModule = form.assessments[activeModuleIdx] || form.assessments[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Post a Job & Configure Assessments</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Create role requirements, set recruiter overall passing grades, assessment rounds, and time limits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Job Details */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Role Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Job Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Full Stack Developer"
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">Job Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe role responsibilities, team structure, stack, and project goals..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 hover:border-slate-300 transition-colors resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Requirements */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Required Qualifications
          </h2>
          <div className="space-y-4">
            <TagInput
              label="Required Skills (Auto-populates multiple technical assessment rounds)"
              tags={form.skillsRequired}
              onChange={(skills) => setForm({ ...form, skillsRequired: skills })}
              placeholder="Type required skill and press Enter (e.g. React, Node.js, AWS)"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Required Experience (years)"
                type="number"
                min="0"
                value={form.experienceRequired}
                onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })}
                placeholder="e.g. 3"
                required
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Remote, San Francisco"
              />
              <Input
                label="Salary Range"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="e.g. $130K - $160K"
              />
            </div>
          </div>
        </Card>

        {/* ── OVERALL PASSING GRADE THRESHOLD CARD ── */}
        <Card hover={false} className="p-5 border-2 border-indigo-200 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Recruiter Overall Passing Grade Threshold (%)
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  Strict Filter
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Candidates must achieve an overall assessment score <strong>strictly &ge; {form.overallPassingThreshold}%</strong>, have a verified resume, and a match score &ge; 50% to qualify for recruiter shortlisting.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-1 rounded-xl">
                {form.overallPassingThreshold}%
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
            <input
              type="range"
              min="40"
              max="95"
              step="5"
              value={form.overallPassingThreshold}
              onChange={(e) => setForm({ ...form, overallPassingThreshold: Number(e.target.value) })}
              className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              {[50, 60, 65, 70, 75, 80, 85, 90].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, overallPassingThreshold: val })}
                  className={`px-2 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                    form.overallPassingThreshold === val 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-xs' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── MULTIPLE TECHNICAL ASSESSMENTS SECTION ── */}
        <Card hover={false} className="space-y-5 border-2 border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Multiple Technical Skill Assessment Rounds ({form.assessments.length})
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded">
                  Multi-Round Filter
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure passing thresholds and duration time limits. Candidates must complete all enabled assessment modules within time limits and satisfy thresholds to qualify for shortlisting.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addAssessmentModule}
                className="text-xs font-bold"
              >
                + Add Round
              </Button>
              <Button
                type="button"
                size="sm"
                loading={generatingAssessment}
                onClick={handleGenerateAllAssessments}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                ✨ Auto-Generate All Rounds
              </Button>
            </div>
          </div>

          {/* Module Selector Tabs */}
          {form.assessments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-xl">
              {form.assessments.map((mod, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveModuleIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModuleIdx === idx 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  <span>{mod.skill || `Round ${idx + 1}`}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                    activeModuleIdx === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    ⏱️ {mod.timeLimit || 15}m · {mod.passingThreshold}%
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Module Editor */}
          {currentModule && (
            <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-2xs space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Round #{activeModuleIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={currentModule.title}
                    onChange={(e) => updateModuleField(activeModuleIdx, 'title', e.target.value)}
                    className="text-sm font-extrabold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none px-1"
                    placeholder="Assessment Title"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Skill Focus:</span>
                  <input
                    type="text"
                    value={currentModule.skill}
                    onChange={(e) => updateModuleField(activeModuleIdx, 'skill', e.target.value)}
                    className="text-xs font-bold text-indigo-900 bg-indigo-50/50 border border-indigo-200 rounded-lg px-2 py-1 focus:outline-none"
                    placeholder="e.g. React"
                  />
                  {form.assessments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAssessmentModule(activeModuleIdx)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 ml-2 cursor-pointer"
                    >
                      Delete Round
                    </button>
                  )}
                </div>
              </div>

              {/* Threshold & Time Limit Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Passing Threshold */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 uppercase">
                      🎯 Round Passing Threshold (%):
                    </label>
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                      {currentModule.passingThreshold}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="40"
                      max="95"
                      step="5"
                      value={currentModule.passingThreshold}
                      onChange={(e) => updateModuleField(activeModuleIdx, 'passingThreshold', Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      {[50, 60, 70, 80].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateModuleField(activeModuleIdx, 'passingThreshold', val)}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded border cursor-pointer ${
                            currentModule.passingThreshold === val 
                              ? 'bg-indigo-600 text-white border-indigo-600' 
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Assessment Time Limit */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1">
                      <span>⏱️ Time Limit (Minutes):</span>
                    </label>
                    <span className="text-sm font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      {currentModule.timeLimit || 15} Mins
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={currentModule.timeLimit || 15}
                      onChange={(e) => updateModuleField(activeModuleIdx, 'timeLimit', Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      {[10, 15, 20, 30].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateModuleField(activeModuleIdx, 'timeLimit', val)}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded border cursor-pointer ${
                            (currentModule.timeLimit || 15) === val 
                              ? 'bg-amber-600 text-white border-amber-600' 
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {val}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Questions in this Round ({currentModule.questions?.length || 0})
                  </p>
                  <button
                    type="button"
                    onClick={() => addQuestionToModule(activeModuleIdx)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    + Add Question
                  </button>
                </div>

                {currentModule.questions?.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 relative shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        Q#{qIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestionFromModule(activeModuleIdx, qIndex)}
                        className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <Input
                      label="Question Prompt"
                      value={q.question}
                      onChange={(e) => updateQuestionInModule(activeModuleIdx, qIndex, 'question', e.target.value)}
                      placeholder="e.g. Which hook performs side effects in React?"
                      required
                    />

                    {/* Options */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Answer Options (Select radio button for the correct answer):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white">
                            <input
                              type="radio"
                              name={`correct_${activeModuleIdx}_${qIndex}`}
                              checked={q.correctAnswer === optIndex}
                              onChange={() => setCorrectOptionInModule(activeModuleIdx, qIndex, optIndex)}
                              className="w-4 h-4 text-indigo-600 cursor-pointer accent-indigo-600"
                            />
                            <span className="text-xs font-bold text-slate-500 w-4">{String.fromCharCode(65 + optIndex)}.</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOptionInModule(activeModuleIdx, qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              required
                              className="w-full text-xs font-medium bg-transparent border-none focus:outline-none text-slate-900"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => navigate('/recruiter/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} size="lg" className="font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-sm">
            Publish Job with {form.overallPassingThreshold}% Passing Grade
          </Button>
        </div>
      </form>
    </div>
  );
}
