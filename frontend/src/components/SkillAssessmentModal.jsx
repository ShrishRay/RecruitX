import { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function SkillAssessmentModal({ isOpen, onClose, job, onAssessmentComplete }) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentsList, setAssessmentsList] = useState([]);
  const [overallThreshold, setOverallThreshold] = useState(60);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIdx]: optIdx }
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);

  // Live Assessment Timer State
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && job?.id) {
      fetchAssessments();
      setResult(null);
      setSelectedAnswers({});
      setCurrentStep(0);
    }
  }, [isOpen, job?.id]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${job.id}/assessments`);
      const list = res.data.assessments || (res.data.assessment ? [res.data.assessment] : []);
      setAssessmentsList(list);
      setOverallThreshold(res.data.overallPassingThreshold || 60);
      setActiveModuleIndex(0);

      const firstMod = list[0];
      if (firstMod && !firstMod.alreadyTaken) {
        setTimeLeft((firstMod.timeLimit || 15) * 60);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
      showError('Failed to load technical skill assessments');
    } finally {
      setLoading(false);
    }
  };

  const currentModule = assessmentsList[activeModuleIndex] || assessmentsList[0];
  const isAlreadyTaken = currentModule?.alreadyTaken === true;

  // Initialize and tick countdown timer for active uncompleted module
  useEffect(() => {
    if (!isOpen || !currentModule || isAlreadyTaken || result) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const durationSec = (currentModule.timeLimit || 15) * 60;
    setTimeLeft(durationSec);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeModuleIndex, isOpen, isAlreadyTaken, !!result]);

  const handleAutoSubmitOnTimeout = async () => {
    showError('Time Expired! Automatically submitting your assessment attempt now.');
    handleSubmit(true);
  };

  const handleSelectModule = (index) => {
    setActiveModuleIndex(index);
    setSelectedAnswers({});
    setCurrentStep(0);
    setResult(null);
  };

  const handleSelectOption = (questionIdx, optionIdx) => {
    if (isAlreadyTaken) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (isAlreadyTaken) {
      showError('This assessment has already been completed and cannot be retaken.');
      return;
    }

    const questions = currentModule?.questions || [];
    const unanswered = questions.some((_, i) => selectedAnswers[i] === undefined);

    if (unanswered && !isAutoSubmit) {
      showError('Please answer all questions before submitting this assessment module.');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    setSubmitting(true);
    try {
      const answersArray = questions.map((_, i) => selectedAnswers[i]);
      const moduleId = currentModule?._id || currentModule?.id;
      const endpoint = moduleId
        ? `/applications/job/${job.id}/assessment/${moduleId}`
        : `/applications/job/${job.id}/assessment`;

      const res = await api.post(endpoint, {
        answers: answersArray
      });

      setResult(res.data);
      if (res.data.passed) {
        showSuccess(`Module Passed with ${res.data.score}%!`);
      } else {
        showError(`Module Score: ${res.data.score}%. Passing threshold was ${res.data.passingThreshold}%.`);
      }

      // Mark module as taken in local list
      setAssessmentsList(prev => prev.map((m, idx) =>
        idx === activeModuleIndex
          ? { ...m, alreadyTaken: true, score: res.data.score, passed: res.data.passed }
          : m
      ));

      if (onAssessmentComplete) {
        onAssessmentComplete(res.data);
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      showError(err.response?.data?.message || 'Error submitting assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const questions = currentModule?.questions || [];
  const currentQ = questions[currentStep];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const threshold = currentModule?.passingThreshold || overallThreshold;
  const timeLimit = currentModule?.timeLimit || 15;

  const isTimeCritical = timeLeft <= 60;
  const isTimeWarning = timeLeft <= 180 && timeLeft > 60;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={job?.title ? `${job.title} - Skill Assessments` : 'Technical Assessments'} size="lg">
      {loading ? (
        <div className="py-16 text-center">
          <Spinner size="lg" />
          <p className="text-xs text-slate-500 font-semibold mt-3">Loading technical assessment modules...</p>
        </div>
      ) : assessmentsList.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No assessments configured for this job opening.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Assessment Modules Switcher (Multiple Rounds) */}
          {assessmentsList.length > 1 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">Select Assessment Module / Round:</p>
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
                {assessmentsList.map((mod, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectModule(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeModuleIndex === idx
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span>{mod.skill ? `${mod.skill}` : `Round ${idx + 1}`}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">({mod.timeLimit || 15}m)</span>
                    {mod.alreadyTaken && (
                      <span className={`text-[10px] px-1 py-0.2 rounded font-black ${mod.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                        {mod.score}% {mod.passed ? '✓' : '✗'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CASE 1: JUST SUBMITTED (RESULT SCREEN) ── */}
          {result ? (
            <div className="space-y-6 py-2 animate-fade-in text-center">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl shadow-md ${result.passed ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                }`}>
                {result.passed ? '✓' : '✗'}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {result.passed ? `${currentModule.title} Passed!` : 'Passing Threshold Not Met'}
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  {result.passed
                    ? `Your score satisfies the required qualification threshold. Overall Assessment Score: ${result.overallAssessmentScore || result.score}% (Job Threshold: ${result.overallPassingThreshold || overallThreshold}%).`
                    : `You scored ${result.score}%, but this module requires at least ${result.passingThreshold}%. Attempt recorded.`}
                </p>
              </div>

              {/* 1-Attempt Lock Notice */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold max-w-md mx-auto flex items-center justify-center gap-1.5">
                <span>Single-Attempt Enforced: This assessment cannot be retaken.</span>
              </div>

              {/* Score Cards Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Module Score</p>
                  <p className={`text-xl font-black ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {result.score}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">{result.correctCount} / {result.totalQuestions} correct</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Overall Job Grade</p>
                  <p className="text-xl font-black text-indigo-950">&ge; {result.overallPassingThreshold || overallThreshold}%</p>
                  <p className="text-[10px] text-slate-400 font-medium">Recruiter Standard</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Shortlist Eligibility</p>
                  <p className={`text-xs font-black mt-1.5 ${result.isQualifiedForShortlisting ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {result.isQualifiedForShortlisting ? '✅ 100% Qualified' : 'Additional Req.'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {result.isQualifiedForShortlisting
                      ? 'Visible for shortlisting'
                      : !result.isResumeVerified
                        ? 'Resume verification required'
                        : result.matchScore < 50
                          ? 'Match score must be ≥ 50%'
                          : !result.allAssessmentsPassed
                            ? `Requires overall grade ≥ ${overallThreshold}%`
                            : 'Score below threshold'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                {assessmentsList.length > 1 && activeModuleIndex < assessmentsList.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => handleSelectModule(activeModuleIndex + 1)}
                    className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Proceed to Next Module ({assessmentsList[activeModuleIndex + 1]?.skill || `Round ${activeModuleIndex + 2}`}) →
                  </Button>
                ) : (
                  <Button type="button" onClick={onClose} fullWidth className="font-bold bg-indigo-600 hover:bg-indigo-700">
                    Done
                  </Button>
                )}
              </div>
            </div>
          ) : isAlreadyTaken ? (
            /* ── CASE 2: ALREADY TAKEN LOCKED SCORECARD SCREEN ── */
            <div className="space-y-6 py-4 animate-fade-in text-center">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl shadow-md ${currentModule.passed ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                }`}>
                {currentModule.passed ? '✓' : '✗'}
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 rounded-full">
                  Attempt Completed (1 of 1 Allowed)
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  {currentModule.title || 'Technical Assessment'}
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  You have already completed this technical skill assessment. Recruiter assessments can only be attempted once per candidate.
                </p>
              </div>

              {/* Recorded Score Summary */}
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Your Recorded Score</p>
                  <p className={`text-2xl font-black ${currentModule.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentModule.score}%
                  </p>
                  <p className="text-xs font-bold mt-1 text-slate-600">
                    Status: {currentModule.passed ? 'Passed ✓' : 'Below Threshold ✗'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Job Pass Grade</p>
                  <p className="text-2xl font-black text-indigo-950">&ge; {overallThreshold}%</p>
                  <p className="text-xs font-semibold mt-1 text-slate-500">
                    Time Limit: {timeLimit} Mins
                  </p>
                </div>
              </div>

              <div className="pt-2 max-w-md mx-auto">
                <Button type="button" onClick={onClose} fullWidth className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                  Close Scorecard
                </Button>
              </div>
            </div>
          ) : (
            /* ── CASE 3: ACTIVE QUIZ INTERFACE WITH LIVE COUNTDOWN TIMER ── */
            <div className="space-y-5">
              {/* Header & Single Attempt + Time Limit Banner */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-200">{currentModule.title || 'Technical Assessment'}</p>
                  <p className="text-[11px] text-slate-400">Recruiter Pass Grade: &ge; {overallThreshold}% · Total Questions: {totalQuestions}</p>
                </div>

                {/* Live Countdown Timer */}
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black flex items-center gap-1.5 shadow-xs transition-all ${isTimeCritical
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isTimeWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-indigo-950 text-indigo-200 border border-indigo-500/40'
                    }`}>
                    <span>{formatTime(timeLeft)} Remaining</span>
                  </div>

                  <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-xl">
                    Q#{currentStep + 1}/{totalQuestions}
                  </span>
                </div>
              </div>

              {/* Single Attempt Notice */}
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-semibold flex items-center justify-between">
                <span>Single Attempt: Auto-submits when timer reaches 00:00.</span>
                <span className="font-bold">Allocated Time: {timeLimit} Minutes</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Module Progress</span>
                  <span>{answeredCount} of {totalQuestions} Answered ({progressPercent}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Current Question Card */}
              {currentQ && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      Skill: {currentQ.skill || currentModule.skill || 'General'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">#{currentStep + 1}</span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                    {currentQ.question}
                  </h4>

                  {/* Options */}
                  <div className="space-y-2.5 pt-1">
                    {currentQ.options.map((option, optIdx) => {
                      const isSelected = selectedAnswers[currentStep] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentStep, optIdx)}
                          className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{option}</span>
                          </div>
                          {isSelected && (
                            <span className="text-indigo-600 font-bold text-sm">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                >
                  ← Previous
                </Button>

                <div className="flex items-center gap-1.5">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentStep(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${currentStep === i
                          ? 'bg-indigo-600 text-white'
                          : selectedAnswers[i] !== undefined
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {currentStep < totalQuestions - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="font-bold bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setCurrentStep(prev => Math.min(totalQuestions - 1, prev + 1))}
                  >
                    Next Question →
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    loading={submitting}
                    className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => handleSubmit(false)}
                  >
                    Submit & Finalize Attempt ✓
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
