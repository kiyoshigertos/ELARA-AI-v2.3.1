import React from 'react';
import {
  MessageSquare,
  BookOpen,
  FileText,
  Compass,
  Heart,
  Calendar,
  Award,
  ClipboardList,
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  AvatarState,
  AvatarStyle,
  ConversationThread,
  MoodEntry,
  NavSection,
  QuizAttemptSummary,
  StudentDocument,
  StudentProfile,
  StudyTask,
  AppSettings,
} from '../types';
import { ElaraAvatar } from './ElaraAvatar';

interface DashboardViewProps {
  profile: StudentProfile;
  avatarState: AvatarState;
  avatarStyle?: AvatarStyle;
  settings?: AppSettings;
  tasks: StudyTask[];
  onToggleTask: (id: string) => void;
  documents: StudentDocument[];
  conversations: ConversationThread[];
  moods: MoodEntry[];
  quizHistory: QuizAttemptSummary[];
  onNavigate: (section: NavSection, initialChatPrompt?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  avatarState,
  avatarStyle = 'nova',
  settings,
  tasks,
  onToggleTask,
  documents,
  conversations,
  moods,
  quizHistory,
  onNavigate,
}) => {
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const latestMood = moods[0];

  const quickActions: {
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[] = [
    {
      label: 'Talk to ELARA',
      subtitle: 'Voice or text companion',
      icon: <MessageSquare className="w-4 h-4 text-sky-500" />,
      onClick: () => onNavigate('chat'),
    },
    {
      label: 'Help Me Study',
      subtitle: 'Subject explanations',
      icon: <BookOpen className="w-4 h-4 text-sky-500" />,
      onClick: () => onNavigate('academic'),
    },
    {
      label: 'Analyze a Document',
      subtitle: 'Summaries & Q&A',
      icon: <FileText className="w-4 h-4 text-sky-500" />,
      onClick: () => onNavigate('documents'),
    },
    {
      label: 'Start a Research Project',
      subtitle: 'Topics, search & APA citations',
      icon: <Compass className="w-4 h-4 text-sky-500" />,
      onClick: () => onNavigate('research'),
    },
    {
      label: 'Check My Mood',
      subtitle: 'Wellness & breathing',
      icon: <Heart className="w-4 h-4 text-sky-500" />,
      onClick: () => onNavigate('wellness'),
    },
    {
      label: 'Plan My Week',
      subtitle: 'Schedule & milestones',
      icon: <Calendar className="w-4 h-4 text-sky-500" />,
      onClick: () => onNavigate('planner'),
    },
    {
      label: 'Generate a Quiz',
      subtitle: 'Flashcards & practice exams',
      icon: <Award className="w-4 h-4 text-sky-500" />,
      onClick: () => onNavigate('academic'),
    },
    {
      label: 'Help Me With an Assignment',
      subtitle: 'Step-by-step breakdown',
      icon: <ClipboardList className="w-4 h-4 text-sky-500" />,
      onClick: () => onNavigate('academic'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner with Animated ELARA Avatar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-[10px] uppercase tracking-wider border border-sky-500/20">
                🌐 Student Companion Web App
              </span>
              <span aria-hidden="true">·</span>
              <span>E.L.A.R.A. — Enhance Learning, Analysis, and Reasoning Assistance</span>
              <span aria-hidden="true">·</span>
              <span>{profile.preferredLanguage}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              Welcome back, {profile.name}. Don&apos;t let ELARA fool you—let ELARA solve you.
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              &ldquo;Understand the student. Support the learner. Help them move forward.&rdquo; You have{' '}
              <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                {pendingTasks.length}
              </strong>{' '}
              upcoming academic tasks. Whether you feel energized or overwhelmed today, we can take things one manageable step at a time.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  onNavigate(
                    'chat',
                    "ELARA, I'm overwhelmed. I have an assignment due tomorrow, a research paper to finish, and an examination next week."
                  )
                }
                className="px-4 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>Help Me Prioritize My Workload</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('wellness')}
                className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Take a 1-Minute Breathing Reset
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0">
            <ElaraAvatar
              state={avatarState}
              avatarStyle={settings?.selectedAvatar || avatarStyle}
              hairStyle={settings?.hairStyle}
              faceShape={settings?.faceShape}
              eyeStyle={settings?.eyeStyle}
              faceMarking={settings?.faceMarking}
              glassesStyle={settings?.glassesStyle}
              size="md"
              showLabel={true}
              onClick={() => onNavigate('chat')}
            />
            <span className="mt-1 text-[11px] text-slate-400">
              Click ELARA to start voice or text conversation
            </span>
          </div>
        </div>
      </div>

      {/* 8 Real Quick-Action Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Quick Companion Actions
          </h2>
          <span className="text-xs text-slate-500">All 4 Pillars Connected</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              onClick={qa.onClick}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/60 transition-colors text-left flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {qa.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {qa.subtitle}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 shrink-0">
                {qa.icon}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Tasks & Upcoming Deadlines (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Upcoming Deadlines &amp; Study Tasks
              </h2>
              <p className="text-xs text-slate-500">
                {completedTasks.length} of {tasks.length} tasks completed
              </p>
            </div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
            >
              Open Full Planner →
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No upcoming tasks or deadlines.
                </p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="mt-2 text-xs text-sky-600 dark:text-sky-400 font-medium hover:underline"
                >
                  + Add your first task in Study Planner
                </button>
              </div>
            ) : (
              tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-sky-500 shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-semibold truncate ${
                          task.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span>{task.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span>{task.priority} Priority</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Documents, Wellness Status & Recent Conversations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Wellness & Study Progress Snapshot */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Wellness &amp; Study Snapshot
              </h2>
              <button
                onClick={() => onNavigate('wellness')}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
              >
                Check In →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">Latest Mood Check-In</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {latestMood ? latestMood.mood : 'Not logged yet'}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">Practice Quizzes Taken</div>
                <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {quizHistory.length} completed
                </div>
              </div>
            </div>
          </div>

          {/* Recent Documents & Conversations */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Recent Study Materials
              </h2>
              <button
                onClick={() => onNavigate('documents')}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
              >
                Manage Files →
              </button>
            </div>

            <div className="space-y-2">
              {documents.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No study documents uploaded yet.
                  </p>
                  <button
                    onClick={() => onNavigate('documents')}
                    className="mt-1.5 text-xs text-sky-600 dark:text-sky-400 font-medium hover:underline"
                  >
                    + Upload a file for analysis
                  </button>
                </div>
              ) : (
                documents.slice(0, 2).map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onNavigate('documents')}
                    className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {doc.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0 uppercase">
                      {doc.type}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Active Thread: {conversations[0]?.title}
              </span>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
              >
                History →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
