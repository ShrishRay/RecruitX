import { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const POPULAR_SUBJECTS = [
  'React',
  'Node.js',
  'Python',
  'TypeScript',
  'System Design',
  'SQL & Databases',
  'Data Structures & Algorithms',
  'Docker & Cloud',
  'Machine Learning'
];

export default function CandidateMockTestModal({ isOpen, onClose }) {
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState('config'); // 'config' | 'test' | 'results'
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Config State
  const [subject, setSubject] = useState('React');
  const [customSubject, setCustomSubject] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(5);

  // Active Test State
  const [testData, setTestData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Results State
  const [resultData, setResultData] = useState(null);

  const activeSubject = customSubject.trim() || subject;

  const handleGenerateTest = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/candidate/mock-test/generate', {
        subject: activeSubject,
        difficulty,
        questionCount: Number(questionCount)
      });

      const generated = res.data.test;
      // Stored full questions with explanations from server payload
      const fullQuestions = res.data._serverPayload?.questions || generated.questions;
      setTestData({ ...generated, fullQuestions });
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setStep('test');
      showSuccess(`Generated ${generated.questions.length} personalized ${difficulty} questions on ${activeSubject}!`);
    } catch (err) {
      console.error('Generate mock test error:', err);
      showError(err.response?.data?.message || 'Failed to generate mock test');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (qIdx, optIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const handleSubmitTest = async () => {
    const questions = testData?.questions || [];
    const unanswered = questions.some((_, i) => selectedAnswers[i] === undefined);

    if (unanswered) {
      showError('Please answer all questions before submitting your mock test.');
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = questions.map((_, i) => selectedAnswers[i]);
      const res = await api.post('/candidate/mock-test/submit', {
        subject: testData.subject,
        difficulty: testData.difficulty,
        answers: answersArray,
        questions: testData.fullQuestions || testData.questions
      });

      setResultData(res.data);
      setStep('results');
      showSuccess(`Mock Test Completed! You scored ${res.data.score}% (${res.data.performanceTier}).`);
    } catch (err) {
      console.error('Submit mock test error:', err);
      showError('Failed to evaluate mock test');
    } finally {
      setSubmitting(false);
    }
  };

  const resetToConfig = () => {
    setStep('config');
    setTestData(null);
    setResultData(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  if (!isOpen) return null;

  const questions = testData?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'config' 
          ? 'AI Personalized Mock Test Generator' 
          : step === 'test' 
            ? `${testData?.subject} Mock Test (${testData?.difficulty})` 
            : `Mock Test Evaluation: ${resultData?.subject}`
      }
      size="xl"
    >
      {/* ── STEP 1: CONFIGURATION SCREEN ── */}
      {step === 'config' && (
        <div className="space-y-6 py-2 animate-fade-in">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Open-Source LLM Practice Engine</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-400/30">
                  Qwen 2.5 7B
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-lg">
                Generate tailored technical mock tests with customizable question counts, subjects, and difficulty levels with detailed explanations.
              </p>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              1. Choose Practice Subject or Technology
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SUBJECTS.map(subj => {
                const isSelected = !customSubject && subject === subj;
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => { setSubject(subj); setCustomSubject(''); }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-xs scale-102' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70'
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Or type custom topic (e.g. GraphQL, Kubernetes, Rust, System Design)..."
                className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Difficulty & Question Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                2. Select Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'beginner', label: 'Beginner', color: 'emerald' },
                  { key: 'intermediate', label: 'Intermediate', color: 'indigo' },
                  { key: 'advanced', label: 'Advanced', color: 'purple' }
                ].map(diff => (
                  <button
                    key={diff.key}
                    type="button"
                    onClick={() => setDifficulty(diff.key)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center capitalize transition-all cursor-pointer ${
                      difficulty === diff.key 
                        ? 'bg-indigo-600 text-white shadow-xs font-black' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                3. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      questionCount === cnt 
                        ? 'bg-indigo-600 text-white shadow-xs font-black' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={generating}
              onClick={handleGenerateTest}
              className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-6 shadow-sm"
            >
              Generate {questionCount}-Question Mock Test
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: ACTIVE TEST TAKING SCREEN ── */}
      {step === 'test' && currentQ && (
        <div className="space-y-5 animate-fade-in">
          {/* Header & Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 text-white rounded-xl shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">{testData?.subject}</span>
              <span className="text-xs font-bold capitalize bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/30">
                {testData?.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-slate-400">
                Question {currentQuestionIndex + 1} of {totalQ}
              </span>
              <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded">
                {answeredCount}/{totalQ} Answered
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                Question #{currentQuestionIndex + 1}
              </span>
              <span className="text-xs font-bold text-slate-400">Single Choice</span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h4>

            {/* Options */}
            <div className="space-y-2.5 pt-1">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
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

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            >
              ← Previous
            </Button>

            <div className="flex flex-wrap items-center gap-1.5 max-w-xs justify-center">
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentQuestionIndex === i 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : selectedAnswers[i] !== undefined 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex < totalQ - 1 ? (
              <Button
                size="sm"
                className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQ - 1, prev + 1))}
              >
                Next →
              </Button>
            ) : (
              <Button
                size="sm"
                loading={submitting}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={handleSubmitTest}
              >
                Submit Mock Test ✓
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: RESULTS & AI FEEDBACK SCREEN ── */}
      {step === 'results' && resultData && (
        <div className="space-y-6 py-2 animate-fade-in max-h-[75vh] overflow-y-auto pr-1">
          {/* Performance Hero Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white text-center space-y-3 shadow-md">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-black shadow-md ${
              resultData.score >= 70 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              {resultData.score}%
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">
                {resultData.performanceTier}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                You answered <strong>{resultData.correctCount} out of {resultData.totalQuestions}</strong> questions correctly in {resultData.subject} ({resultData.difficulty} level).
              </p>
            </div>

            <div className="p-3 bg-white/10 rounded-xl max-w-lg mx-auto text-xs text-slate-200 font-medium">
              {resultData.aiRecommendations}
            </div>
          </div>

          {/* Question Breakdown with Explanations */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Detailed Question-by-Question AI Analysis:
            </h4>

            {resultData.feedback?.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-3 ${
                  item.isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Question #{idx + 1}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    item.isCorrect ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {item.isCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-slate-900">{item.question}</p>

                {/* Option List */}
                <div className="space-y-1.5 text-xs">
                  {item.options.map((opt, optIdx) => {
                    const isCandidateSelected = item.selectedOption === optIdx;
                    const isCorrectAnswer = item.correctOption === optIdx;

                    let optClass = 'bg-white border-slate-200 text-slate-700';
                    if (isCorrectAnswer) optClass = 'bg-emerald-100/90 border-emerald-300 text-emerald-950 font-bold';
                    else if (isCandidateSelected && !isCorrectAnswer) optClass = 'bg-rose-100/90 border-rose-300 text-rose-950 font-bold line-through';

                    return (
                      <div key={optIdx} className={`p-2.5 rounded-lg border flex items-center justify-between ${optClass}`}>
                        <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                        {isCorrectAnswer && <span className="font-bold text-emerald-700">✓ Correct Answer</span>}
                        {isCandidateSelected && !isCorrectAnswer && <span className="font-bold text-rose-700">Your Choice ✗</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Detailed AI Explanation */}
                <div className="p-3 bg-white/90 rounded-lg border border-slate-200/90 text-xs text-slate-700 space-y-0.5">
                  <p className="font-bold text-indigo-900 text-[11px]">Explanation:</p>
                  <p className="text-slate-600 leading-relaxed font-medium">{item.explanation}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={resetToConfig} className="font-bold">
              ← Configure New Mock Test
            </Button>
            <Button onClick={onClose} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
              Done Practicing
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
