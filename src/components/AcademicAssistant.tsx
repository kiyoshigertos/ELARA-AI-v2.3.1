import React, { useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  Code2,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Upload,
  FileText,
} from 'lucide-react';
import { QuizAttemptSummary, StudentDocument, StudentProfile } from '../types';
import { FormattedText } from './FormattedText';

const SUBJECT_LIST = [
  'Mathematics',
  'Science',
  'English',
  'Filipino',
  'Information Technology',
  'Programming',
  'Computer Networking',
  'Database Management',
  'Research Methodology',
  'History',
  'Business',
  'Other Subject',
];

const EXPLANATION_STYLES = [
  'Simple explanation',
  'Step-by-step explanation',
  'Detailed explanation',
  'Example-based explanation',
  'Teach me like a beginner',
  'Quiz me',
  'Explain in Filipino',
  'Explain in Bisaya/Cebuano',
  'Explain in Taglish',
];

interface QuizItem {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface AcademicAssistantProps {
  profile: StudentProfile;
  documents: StudentDocument[];
  quizHistory: QuizAttemptSummary[];
  onRecordQuizAttempt: (attempt: QuizAttemptSummary) => void;
}

export const AcademicAssistant: React.FC<AcademicAssistantProps> = ({
  profile,
  documents,
  quizHistory,
  onRecordQuizAttempt,
}) => {
  const [activeTab, setActiveTab] = useState<'explain' | 'assignment' | 'problem' | 'quiz'>(
    'explain'
  );

  // Explain Any Subject state
  const [subject, setSubject] = useState(
    profile.subjectsOfInterest[0] || SUBJECT_LIST[0]
  );
  const [explanationStyle, setExplanationStyle] = useState(
    profile.explanationStyle || 'Step-by-step explanation'
  );
  const [explainQuery, setExplainQuery] = useState('');
  const [explainResult, setExplainResult] = useState('');
  const [isLoadingExplain, setIsLoadingExplain] = useState(false);

  // Assignment Assistant state
  const [assignmentPrompt, setAssignmentPrompt] = useState('');
  const [studentDraft, setStudentDraft] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [assignmentResult, setAssignmentResult] = useState('');
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);

  // Step-by-Step Problem Solver state
  const [problemSubject, setProblemSubject] = useState(
    profile.subjectsOfInterest[0] || SUBJECT_LIST[0]
  );
  const [problemStatement, setProblemStatement] = useState('');
  const [problemResult, setProblemResult] = useState('');
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);

  // Quiz & Exam Prep state
  const [quizTopic, setQuizTopic] = useState('');
  const [quizType, setQuizType] = useState('Multiple-choice');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizCount, setQuizCount] = useState(5);
  const [quizDocId, setQuizDocId] = useState('');
  const [quizDocText, setQuizDocText] = useState('');
  const [loadedFileName, setLoadedFileName] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizItem[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [revealedFlashcards, setRevealedFlashcards] = useState<Record<string, boolean>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectQuizDoc = (docId: string) => {
    setQuizDocId(docId);
    if (docId) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) {
        setQuizDocText(doc.textContent);
        setLoadedFileName(doc.name);
        if (!quizTopic.trim()) {
          setQuizTopic(doc.name.replace(/\.[^/.]+$/, ''));
        }
      }
    }
  };

  const handleQuizFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadedFileName(file.name);
    if (!quizTopic.trim()) {
      setQuizTopic(file.name.replace(/\.[^/.]+$/, ''));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = (reader.result as string) || '';
      setQuizDocText(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExplainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainQuery.trim()) return;
    setIsLoadingExplain(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureType: 'explain',
          subject,
          topicOrPrompt: explainQuery,
          explanationStyle,
          language: profile.preferredLanguage,
          studentLevel: profile.educationLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate explanation');
      setExplainResult(data.result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoadingExplain(false);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const docText = documents.find((d) => d.id === selectedDocId)?.textContent || '';
    const combinedPrompt = `${assignmentPrompt}\n${docText ? `\nAttached Assignment Document:\n${docText}` : ''}`.trim();
    if (!combinedPrompt) return;

    setIsLoadingAssignment(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureType: 'assignment',
          topicOrPrompt: combinedPrompt,
          draftContent: studentDraft,
          language: profile.preferredLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze assignment');
      setAssignmentResult(data.result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoadingAssignment(false);
    }
  };

  const handleProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemStatement.trim()) return;
    setIsLoadingProblem(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureType: 'problem',
          subject: problemSubject,
          topicOrPrompt: problemStatement,
          language: profile.preferredLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to solve problem');
      setProblemResult(data.result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const sourceDoc = documents.find((d) => d.id === quizDocId);
    const effectiveSourceText = (quizDocText.trim() || sourceDoc?.textContent || '').trim();
    const effectiveTopic =
      quizTopic.trim() ||
      loadedFileName.replace(/\.[^/.]+$/, '') ||
      sourceDoc?.name ||
      'General Review';

    if (!effectiveTopic && !effectiveSourceText) {
      setErrorMsg('Please enter a lesson topic or provide a document file / notes.');
      return;
    }

    setIsGeneratingQuiz(true);
    setErrorMsg(null);
    setSubmittedQuiz(false);
    setUserAnswers({});
    setRevealedFlashcards({});

    try {
      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: effectiveTopic,
          questionType: quizType,
          difficulty: quizDifficulty,
          count: quizCount,
          language: profile.preferredLanguage,
          sourceText: effectiveSourceText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quiz generation failed');
      setQuizTitle(data.quizTitle || effectiveTopic);
      setGeneratedQuestions(Array.isArray(data.questions) ? data.questions : []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const isAnswerCorrect = (q: QuizItem, userAns: string) => {
    if (!userAns) return false;
    return userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
  };

  const handleSubmitQuizAnswers = () => {
    setSubmittedQuiz(true);
    let score = 0;
    generatedQuestions.forEach((q) => {
      if (isAnswerCorrect(q, userAnswers[q.id] || '')) {
        score += 1;
      }
    });
    onRecordQuizAttempt({
      id: `qz-${Date.now()}`,
      topic: quizTitle || quizTopic || 'Practice Assessment',
      score,
      total: generatedQuestions.length,
      difficulty: quizDifficulty,
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Academic Assistant & Exam Prep
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Multilingual subject explanations (English, Filipino, Bisaya/Cebuano, Taglish), assignment scaffolding, step-by-step STEM problem solving, and interactive quizzes.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg w-fit border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('explain')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'explain'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Explain Any Subject</span>
        </button>
        <button
          onClick={() => setActiveTab('assignment')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'assignment'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Assignment Assistant</span>
        </button>
        <button
          onClick={() => setActiveTab('problem')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'problem'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Step-by-Step Problem Solver</span>
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'quiz'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Quiz & Flashcard Generator</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* 1. EXPLAIN ANY SUBJECT */}
      {activeTab === 'explain' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleExplainSubmit}
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Customize Your Lesson Explanation
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject Area
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                {SUBJECT_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                How Should ELARA Explain It?
              </label>
              <select
                value={explanationStyle}
                onChange={(e) => setExplanationStyle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                {EXPLANATION_STYLES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Concept or Question
              </label>
              <textarea
                rows={4}
                required
                value={explainQuery}
                onChange={(e) => setExplainQuery(e.target.value)}
                placeholder="e.g., How does TCP/IP 3-way handshake work? Or explain Third Normal Form (3NF) with a real table example."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoadingExplain}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoadingExplain ? 'ELARA is preparing lesson...' : 'Explain Concept'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            {explainResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {subject} · {explanationStyle}
                  </span>
                </div>
                <FormattedText text={explainResult} />
              </div>
            ) : (
              <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6">
                <p className="text-sm text-slate-500 max-w-md">
                  Enter any topic on the left and choose your preferred explanation style (including Filipino, Bisaya/Cebuano, or Taglish) to get a clear, tailored lesson.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ASSIGNMENT ASSISTANT */}
      {activeTab === 'assignment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAssignmentSubmit}
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Assignment Breakdown & Draft Review
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ELARA breaks down requirements into manageable steps, suggests an outline, and reviews your draft so you learn the material thoroughly.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Optional: Use an Uploaded Assignment Document
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="">None selected</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assignment Instructions / Rubric
              </label>
              <textarea
                rows={4}
                value={assignmentPrompt}
                onChange={(e) => setAssignmentPrompt(e.target.value)}
                placeholder="Paste your teacher's instructions or rubric here..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Your Current Draft or Outline (Optional — for constructive review)
              </label>
              <textarea
                rows={4}
                value={studentDraft}
                onChange={(e) => setStudentDraft(e.target.value)}
                placeholder="Paste your draft answer or outline if you'd like ELARA to check for errors and suggest improvements..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoadingAssignment}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {isLoadingAssignment
                ? 'Analyzing Assignment Requirements...'
                : 'Break Down Assignment & Review'}
            </button>
          </form>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            {assignmentResult ? (
              <FormattedText text={assignmentResult} />
            ) : (
              <div className="h-full min-h-[280px] flex items-center justify-center text-center p-6">
                <p className="text-sm text-slate-500 max-w-md">
                  Paste your assignment instructions or select an uploaded document to get a step-by-step action plan, outline, and draft critique.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. STEP-BY-STEP PROBLEM SOLVER */}
      {activeTab === 'problem' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleProblemSubmit}
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Step-by-Step STEM & Code Debugger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shows intermediate steps, explains why each step is necessary, verifies calculations, and helps debug code.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Technical Subject
              </label>
              <select
                value={problemSubject}
                onChange={(e) => setProblemSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Programming & Algorithms">Programming & Algorithms</option>
                <option value="Mathematics & Calculus">Mathematics & Calculus</option>
                <option value="Database SQL & Normalization">Database SQL & Normalization</option>
                <option value="Physics & Chemistry">Physics & Chemistry</option>
                <option value="Computer Networking & Subnetting">
                  Computer Networking & Subnetting
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Problem Statement or Buggy Code
              </label>
              <textarea
                rows={6}
                required
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Paste a math problem, SQL query, or code snippet you want to understand and debug step-by-step..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoadingProblem}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {isLoadingProblem ? 'Working through steps...' : 'Walk Through Step-by-Step'}
            </button>
          </form>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            {problemResult ? (
              <FormattedText text={problemResult} />
            ) : (
              <div className="h-full min-h-[280px] flex items-center justify-center text-center p-6">
                <p className="text-sm text-slate-500 max-w-md">
                  Enter a math equation, algorithm question, or code snippet to see every intermediate step and reasoning clearly explained.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. QUIZ & EXAMINATION PREPARATION */}
      {activeTab === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <form
              onSubmit={handleGenerateQuiz}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
            >
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Generate Practice Exam or Flashcards
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Topic or Lesson
                </label>
                <input
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g., Relational Database Normalization"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Document File / Source Content Text Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Document File Content / Lesson Notes
                  </label>
                  <label className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-500 font-medium cursor-pointer flex items-center gap-1 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>Upload Document File</span>
                    <input
                      type="file"
                      accept=".txt,.md,.csv,.json,.pdf,.docx,.doc"
                      onChange={handleQuizFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={quizDocText}
                  onChange={(e) => setQuizDocText(e.target.value)}
                  placeholder="Paste your document file text, syllabus, lecture notes, or chapter excerpt here..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-mono text-[11px]"
                />
                {loadedFileName ? (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate flex items-center gap-1">
                      <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                      <strong className="text-slate-700 dark:text-slate-300">{loadedFileName}</strong>
                      {quizDocText ? ` (${quizDocText.length} characters)` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizDocText('');
                        setLoadedFileName('');
                        setQuizDocId('');
                      }}
                      className="text-rose-500 hover:underline shrink-0 text-[11px]"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Paste document text directly, or click &ldquo;Upload Document File&rdquo; to load content from a file on your device.
                  </p>
                )}
              </div>

              {documents.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Or Select from Uploaded Library
                  </label>
                  <select
                    value={quizDocId}
                    onChange={(e) => handleSelectQuizDoc(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">None (Use custom document text or general topic)</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Question Type
                  </label>
                  <select
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Multiple-choice">Multiple-choice</option>
                    <option value="True-or-False">True-or-False</option>
                    <option value="Identification">Identification</option>
                    <option value="Flashcards">Flashcards</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Number of Questions
                  </span>
                  <span className="font-mono tabular-nums">{quizCount} items</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={quizCount}
                  onChange={(e) => setQuizCount(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingQuiz}
                className="w-full py-2.5 px-4 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors"
              >
                {isGeneratingQuiz ? 'Generating Practice Questions...' : 'Generate Quiz'}
              </button>
            </form>

            {/* Progress Tracking Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Practice Scores
              </h3>
              <div className="space-y-2">
                {quizHistory.map((qh) => (
                  <div
                    key={qh.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {qh.topic}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {qh.difficulty} · {qh.date}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums shrink-0">
                      {qh.score}/{qh.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Quiz Workspace */}
          <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            {generatedQuestions.length === 0 ? (
              <div className="h-full min-h-[320px] flex items-center justify-center text-center p-6">
                <p className="text-sm text-slate-500 max-w-md">
                  Configure your topic, question type, and difficulty on the left. Answers remain hidden until you attempt the questions or flip each flashcard.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {quizTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {quizType} · {quizDifficulty} Difficulty · {generatedQuestions.length} Items
                    </p>
                  </div>
                  {submittedQuiz && (
                    <button
                      onClick={() => {
                        setSubmittedQuiz(false);
                        setUserAnswers({});
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Quiz</span>
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  {generatedQuestions.map((q, index) => {
                    const userAns = userAnswers[q.id] || '';
                    const correct = isAnswerCorrect(q, userAns);

                    if (quizType === 'Flashcards') {
                      const isFlipped = Boolean(revealedFlashcards[q.id]);
                      return (
                        <div
                          key={q.id}
                          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-3"
                        >
                          <div className="text-xs font-mono text-slate-400">
                            Flashcard {index + 1} of {generatedQuestions.length}
                          </div>
                          <p className="text-base font-medium text-slate-900 dark:text-white">
                            {q.question}
                          </p>
                          {isFlipped ? (
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                Answer: {q.correctAnswer}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {q.explanation}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setRevealedFlashcards((prev) => ({ ...prev, [q.id]: true }))
                              }
                              className="px-3 py-1.5 rounded-lg bg-sky-600/10 text-sky-600 dark:text-sky-400 text-xs font-medium"
                            >
                              Reveal Answer & Explanation
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5 tabular-nums">
                            {index + 1}.
                          </span>
                          <p className="text-sm font-medium text-slate-900 dark:text-white flex-1">
                            {q.question}
                          </p>
                        </div>

                        {Array.isArray(q.options) && q.options.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                            {q.options.map((opt) => {
                              const isChosen = userAns === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  disabled={submittedQuiz}
                                  onClick={() =>
                                    setUserAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                  }
                                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                                    isChosen
                                      ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-medium'
                                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="pl-5">
                            <input
                              type="text"
                              disabled={submittedQuiz}
                              value={userAns}
                              onChange={(e) =>
                                setUserAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                              placeholder="Type your answer..."
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        )}

                        {submittedQuiz && (
                          <div
                            className={`ml-5 p-3.5 rounded-lg border text-xs space-y-1 ${
                              correct
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              {correct ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span>Correct!</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-amber-500" />
                                  <span>Expected Answer: {q.correctAnswer}</span>
                                </>
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 pt-1">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {quizType !== 'Flashcards' && !submittedQuiz && (
                  <button
                    onClick={handleSubmitQuizAnswers}
                    className="px-5 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors"
                  >
                    Check Answers & View Explanations
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
