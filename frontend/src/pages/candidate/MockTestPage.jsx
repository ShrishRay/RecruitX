import { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';

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

export default function MockTestPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState('config'); // 'config' | 'test' | 'results'
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Configuration State
  const [selectedSubject, setSelectedSubject] = useState('React');
  const [customSubject, setCustomSubject] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(5);

  // Active Quiz State
  const [testData, setTestData] = useState(null);
  const [answers, setAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
  const [currentIdx, setCurrentIdx] = useState(0);

  // Result State
  const [resultData, setResultData] = useState(null);

  const activeSubject = customSubject.trim() || selectedSubject;

  const handleGenerateTest = async () => {
    if (!activeSubject) {
      showError('Please choose or enter a subject for your mock test.');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/candidate/mock-test/generate', {
        subject: activeSubject,
        difficulty,
        questionCount: Number(questionCount)
      });

      const generated = res.data.test;
      const fullQuestions = res.data._serverPayload?.questions || generated.questions;
      
      setTestData({
        ...generated,
        fullQuestions
      });
      setAnswers({});
      setCurrentIdx(0);
      setStep('test');
      showSuccess(`✨ Generated ${generated.questions.length} ${difficulty} questions on ${activeSubject}!`);
    } catch (err) {
      console.error('Generate mock test error:', err);
      showError(err.response?.data?.message || 'Failed to generate mock test');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (qIndex, optIndex) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: optIndex
    }));
  };

  const handleSubmitTest = async () => {
    const questions = testData?.questions || [];
    const unanswered = questions.some((_, i) => answers[i] === undefined);

    if (unanswered) {
      showError('Please answer all questions before submitting your mock test.');
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = questions.map((_, i) => answers[i]);
      const res = await api.post('/candidate/mock-test/submit', {
        subject: testData.subject,
        difficulty: testData.difficulty,
        answers: answersArray,
        questions: testData.fullQuestions || testData.questions
      });

      setResultData(res.data);
      setStep('results');
      showSuccess(`Mock Test Completed! Score: ${res.data.score}% (${res.data.performanceTier})`);
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
    setAnswers({});
    setCurrentIdx(0);
  };

  const questions = testData?.questions || [];
  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* ── SCREEN 1: TEST BUILDER / CONFIGURATION ── */}
      {step === 'config' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                AI Technical Mock Test
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                Qwen 2.5 LLM
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Select your domain, difficulty, and question volume. Generate a personalized technical test with instant AI conceptual evaluations.
            </p>
          </div>

          {/* Configuration Card */}
          <Card hover={false} className="p-6 space-y-6 shadow-sm border border-slate-200">
            {/* Step 1: Subject Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Select Subject or Engineering Domain
                </label>
                {user?.skills?.length > 0 && (
                  <span className="text-xs text-indigo-600 font-semibold">
                    Matching your profile skills
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {POPULAR_SUBJECTS.map((subj) => {
                  const isSelected = !customSubject && selectedSubject === subj;
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(subj);
                        setCustomSubject('');
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm scale-102 font-black'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
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
                  placeholder="Or type custom topic (e.g. GraphQL, Kubernetes, Rust, Microservices, Cybersecurity)..."
                  className="w-full px-4 py-3 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Step 2 & 3: Difficulty & Question Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              {/* Difficulty */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  2. Select Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'beginner', label: 'Beginner', desc: 'Fundamentals & Syntax' },
                    { key: 'intermediate', label: 'Intermediate', desc: 'Real-world Architecture' },
                    { key: 'advanced', label: 'Advanced', desc: 'Internals & High Scale' }
                  ].map((diff) => (
                    <button
                      key={diff.key}
                      type="button"
                      onClick={() => setDifficulty(diff.key)}
                      className={`p-3 rounded-xl text-xs font-bold text-center capitalize transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        difficulty === diff.key
                          ? 'bg-indigo-600 text-white shadow-sm font-black'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span>{diff.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  3. Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-indigo-600 text-white shadow-sm font-black'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500 font-medium">
                Target: <strong className="text-indigo-900">{activeSubject}</strong> · <strong className="capitalize text-indigo-900">{difficulty}</strong> · <strong className="text-indigo-900">{questionCount} Questions</strong>
              </p>

              <Button
                loading={generating}
                onClick={handleGenerateTest}
                size="lg"
                className="w-full sm:w-auto font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-8 shadow-md"
              >
                ✨ Generate Personalized AI Mock Test
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── SCREEN 2: ACTIVE TEST TAKING ── */}
      {step === 'test' && currentQ && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-extrabold text-white">{testData?.subject}</span>
              <span className="text-xs font-bold capitalize bg-indigo-900/80 text-indigo-200 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                {testData?.difficulty} Level
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-slate-400">
                Question {currentIdx + 1} of {totalQuestions}
              </span>
              <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg">
                {answeredCount} / {totalQuestions} Answered
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Question Card */}
          <Card hover={false} className="p-6 space-y-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                Question #{currentIdx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-400">Single Choice Answer</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Answer Options */}
            <div className="space-y-3 pt-1">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = answers[currentIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentIdx, optIdx)}
                    className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{option}</span>
                    </div>
                    {isSelected && <span className="text-indigo-600 font-bold text-base">✓</span>}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Question Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              className="font-bold"
            >
              ← Previous
            </Button>

            {/* Question Quick Jump Bubbles */}
            <div className="flex flex-wrap items-center gap-1.5 justify-center max-w-sm">
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentIdx === i
                      ? 'bg-indigo-600 text-white shadow-xs scale-105'
                      : answers[i] !== undefined
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentIdx < totalQuestions - 1 ? (
              <Button
                size="md"
                className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
              >
                Next →
              </Button>
            ) : (
              <Button
                size="md"
                loading={submitting}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                onClick={handleSubmitTest}
              >
                Submit Mock Test ✓
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── SCREEN 3: TEST RESULTS & COMPREHENSIVE AI EXPLANATIONS ── */}
      {step === 'results' && resultData && (
        <div className="space-y-6 animate-fade-in">
          {/* Performance Hero Banner */}
          <Card
            hover={false}
            className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-4 text-center"
          >
            <div
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black shadow-lg ${
                resultData.score >= 70
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {resultData.score}%
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">
                {resultData.performanceTier}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1">
                You answered <strong>{resultData.correctCount} out of {resultData.totalQuestions}</strong> questions correctly in {resultData.subject} ({resultData.difficulty} level).
              </p>
            </div>

            <div className="p-3.5 bg-white/10 rounded-xl max-w-xl mx-auto text-xs text-slate-200 font-medium">
              💡 {resultData.aiRecommendations}
            </div>
          </Card>

          {/* Detailed Question Explanations List */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Comprehensive Question Breakdown & AI Explanations
            </h3>

            {resultData.feedback?.map((item, idx) => (
              <Card
                key={idx}
                hover={false}
                className={`p-5 space-y-3 border ${
                  item.isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Question #{idx + 1}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-black ${
                      item.isCorrect
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {item.isCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-900">{item.question}</p>

                {/* Options List */}
                <div className="space-y-2 text-xs">
                  {item.options.map((opt, optIdx) => {
                    const isCandidateSelected = item.selectedOption === optIdx;
                    const isCorrectAnswer = item.correctOption === optIdx;

                    let optClass = 'bg-white border-slate-200 text-slate-700';
                    if (isCorrectAnswer)
                      optClass = 'bg-emerald-100/90 border-emerald-300 text-emerald-950 font-bold';
                    else if (isCandidateSelected && !isCorrectAnswer)
                      optClass = 'bg-rose-100/90 border-rose-300 text-rose-950 font-bold line-through';

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-lg border flex items-center justify-between ${optClass}`}
                      >
                        <span>
                          {String.fromCharCode(65 + optIdx)}. {opt}
                        </span>
                        {isCorrectAnswer && (
                          <span className="font-bold text-emerald-700">✓ Correct Answer</span>
                        )}
                        {isCandidateSelected && !isCorrectAnswer && (
                          <span className="font-bold text-rose-700">Your Choice ✗</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Conceptual AI Explanation */}
                <div className="p-3.5 bg-white/90 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-extrabold text-indigo-900 text-xs">🧠 Conceptual Breakdown:</p>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {item.explanation}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button variant="secondary" size="md" onClick={resetToConfig} className="font-bold">
              ← Configure New Mock Test
            </Button>
            <Button
              size="md"
              onClick={resetToConfig}
              className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Practice Another Subject →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
