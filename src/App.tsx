import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Heart,
  BookOpen,
  Compass,
  FileText,
  Calendar,
  History,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import {
  AppSettings,
  AvatarState,
  ConversationThread,
  JournalEntry,
  MemoryItem,
  MoodEntry,
  MoodType,
  NavSection,
  QuizAttemptSummary,
  SavedCitation,
  StudentDocument,
  StudentProfile,
  StudyTask,
} from './types';
import {
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  INITIAL_CITATIONS,
  INITIAL_CONVERSATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_JOURNALS,
  INITIAL_MEMORIES,
  INITIAL_MOODS,
  INITIAL_QUIZ_HISTORY,
  INITIAL_TASKS,
} from './data/initialData';
import { ElaraAvatar } from './components/ElaraAvatar';
import { DashboardView } from './components/DashboardView';
import { ChatWorkspace } from './components/ChatWorkspace';
import { WellnessCenter } from './components/WellnessCenter';
import { AcademicAssistant } from './components/AcademicAssistant';
import { ResearchAssistant } from './components/ResearchAssistant';
import { DocumentManager } from './components/DocumentManager';
import { StudyPlanner } from './components/StudyPlanner';
import { HistoryAndMemory } from './components/HistoryAndMemory';
import { SettingsView } from './components/SettingsView';
import { GlobalSearch } from './components/GlobalSearch';

// Ensure any legacy pre-populated sample data is permanently purged from browser storage
const SAMPLE_PURGE_VERSION = 'elara_clean_v3';

function purgeLegacySampleData() {
  try {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(SAMPLE_PURGE_VERSION) !== 'true') {
      localStorage.removeItem('elara_tasks');
      localStorage.removeItem('elara_documents');
      localStorage.removeItem('elara_moods');
      localStorage.removeItem('elara_journals');
      localStorage.removeItem('elara_citations');
      localStorage.removeItem('elara_memories');
      localStorage.removeItem('elara_quiz_history');
      localStorage.removeItem('elara_conversations');
      const savedProfile = localStorage.getItem('elara_profile');
      if (
        savedProfile &&
        (savedProfile.includes('Alex Chen') ||
          savedProfile.includes('BS Information Technology') ||
          savedProfile.includes('CS102'))
      ) {
        localStorage.removeItem('elara_profile');
      }
      localStorage.setItem(SAMPLE_PURGE_VERSION, 'true');
    }
  } catch {
    // Ignore storage quota or restricted access errors
  }
}

purgeLegacySampleData();

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && key === 'elara_documents') {
      return (parsed.filter((d: { isSample?: boolean }) => !d.isSample) as unknown) as T;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [initialChatPrompt, setInitialChatPrompt] = useState<string>('');
  const [focusedDocId, setFocusedDocId] = useState<string>('');
  const [focusedTaskId, setFocusedTaskId] = useState<string>('');

  // Persistent local states
  const [profile, setProfile] = useState<StudentProfile>(() =>
    loadFromStorage('elara_profile', DEFAULT_PROFILE)
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage('elara_settings', DEFAULT_SETTINGS)
  );
  const [conversations, setConversations] = useState<ConversationThread[]>(() =>
    loadFromStorage('elara_conversations', INITIAL_CONVERSATIONS)
  );
  const [activeConversationId, setActiveConversationId] = useState<string>(
    () => conversations[0]?.id || 'conv-welcome'
  );
  const [tasks, setTasks] = useState<StudyTask[]>(() =>
    loadFromStorage('elara_tasks', INITIAL_TASKS)
  );
  const [documents, setDocuments] = useState<StudentDocument[]>(() =>
    loadFromStorage('elara_documents', INITIAL_DOCUMENTS)
  );
  const [moods, setMoods] = useState<MoodEntry[]>(() =>
    loadFromStorage('elara_moods', INITIAL_MOODS)
  );
  const [journals, setJournals] = useState<JournalEntry[]>(() =>
    loadFromStorage('elara_journals', INITIAL_JOURNALS)
  );
  const [citations, setCitations] = useState<SavedCitation[]>(() =>
    loadFromStorage('elara_citations', INITIAL_CITATIONS)
  );
  const [memories, setMemories] = useState<MemoryItem[]>(() =>
    loadFromStorage('elara_memories', INITIAL_MEMORIES)
  );
  const [quizHistory, setQuizHistory] = useState<QuizAttemptSummary[]>(() =>
    loadFromStorage('elara_quiz_history', INITIAL_QUIZ_HISTORY)
  );

  // Sync dark/light class on root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('elara_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('elara_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('elara_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('elara_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('elara_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('elara_moods', JSON.stringify(moods));
  }, [moods]);

  useEffect(() => {
    localStorage.setItem('elara_journals', JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem('elara_citations', JSON.stringify(citations));
  }, [citations]);

  useEffect(() => {
    localStorage.setItem('elara_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('elara_quiz_history', JSON.stringify(quizHistory));
  }, [quizHistory]);

  const handleNavigate = (section: NavSection, chatPrompt?: string) => {
    if (chatPrompt) {
      setInitialChatPrompt(chatPrompt);
    }
    setActiveNav(section);
    setMobileMenuOpen(false);
  };

  const handleNewConversation = () => {
    const newThread: ConversationThread = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation with ELARA',
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Hi ${profile.name}! I'm ready whenever you are. Would you like to work through a study topic, plan your assignments, or talk about how your day is going?`,
          timestamp: new Date().toISOString(),
          detectedEmotion: 'Calm',
          activeMode: 'Comfort Mode',
          avatarState: 'IDLE',
        },
      ],
    };
    setConversations((prev) => [newThread, ...prev]);
    setActiveConversationId(newThread.id);
    setActiveNav('chat');
  };

  const handleUpdateConversation = (updated: ConversationThread) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === updated.id);
      if (!exists) return [updated, ...prev];
      return prev.map((c) => (c.id === updated.id ? updated : c));
    });
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        return INITIAL_CONVERSATIONS;
      }
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleFactoryReset = () => {
    localStorage.clear();
    localStorage.setItem(SAMPLE_PURGE_VERSION, 'true');
    setProfile(DEFAULT_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    setConversations(INITIAL_CONVERSATIONS);
    setActiveConversationId(INITIAL_CONVERSATIONS[0].id);
    setTasks(INITIAL_TASKS);
    setDocuments(INITIAL_DOCUMENTS);
    setMoods(INITIAL_MOODS);
    setJournals(INITIAL_JOURNALS);
    setCitations(INITIAL_CITATIONS);
    setMemories(INITIAL_MEMORIES);
    setQuizHistory(INITIAL_QUIZ_HISTORY);
  };

  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'chat', label: 'Chat with ELARA', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'wellness', label: 'Mental Wellness', icon: <Heart className="w-4 h-4" /> },
    { id: 'academic', label: 'Academic Assistant', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'research', label: 'Research Assistant', icon: <Compass className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'planner', label: 'Study Planner', icon: <Calendar className="w-4 h-4" /> },
    { id: 'history', label: 'Conversation History', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 font-display"
        >
          ELARA AI
        </a>

        {/* Zone 2: 4–5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('dashboard');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'dashboard' ? 'text-sky-600 dark:text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Dashboard
          </a>
          <a
            href="#wellness"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('wellness');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'wellness' ? 'text-sky-600 dark:text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Wellness
          </a>
          <a
            href="#academic"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('academic');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'academic' ? 'text-sky-600 dark:text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Academics
          </a>
          <a
            href="#documents"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('documents');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'documents' ? 'text-sky-600 dark:text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Documents
          </a>
        </nav>

        {/* Zone 3: Global Search & Primary Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <GlobalSearch
            documents={documents}
            tasks={tasks}
            conversations={conversations}
            onSelectDocument={(docId) => {
              setFocusedDocId(docId);
              setActiveNav('documents');
            }}
            onSelectTask={(taskId) => {
              setFocusedTaskId(taskId);
              setActiveNav('planner');
            }}
            onSelectConversation={(convId) => {
              setActiveConversationId(convId);
              setActiveNav('chat');
            }}
          />

          <button
            onClick={() => handleNavigate('chat')}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
          >
            Talk to ELARA
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Container: Sidebar + Content Viewport */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar Navigation (9 sections) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-sky-600/10 text-sky-600 dark:text-sky-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Bottom Companion Dock */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 px-2">
            <ElaraAvatar
              state={avatarState}
              avatarStyle={settings.selectedAvatar || 'nova'}
              hairStyle={settings.hairStyle}
              faceShape={settings.faceShape}
              eyeStyle={settings.eyeStyle}
              faceMarking={settings.faceMarking}
              glassesStyle={settings.glassesStyle}
              size="sm"
              showLabel={false}
              onClick={() => handleNavigate('chat')}
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {profile.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {profile.preferredLanguage} · Companion Ready
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between z-50">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium ${
                      activeNav === item.id
                        ? 'bg-sky-600/10 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Section Viewport */}
        <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 pb-20 lg:pb-8 max-w-7xl mx-auto w-full">
          {activeNav === 'dashboard' && (
            <DashboardView
              profile={profile}
              avatarState={avatarState}
              avatarStyle={settings.selectedAvatar || 'nova'}
              settings={settings}
              tasks={tasks}
              onToggleTask={(id) =>
                setTasks((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
                )
              }
              documents={documents}
              conversations={conversations}
              moods={moods}
              quizHistory={quizHistory}
              onNavigate={handleNavigate}
            />
          )}

          {activeNav === 'chat' && (
            <ChatWorkspace
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onNewConversation={handleNewConversation}
              onUpdateConversation={handleUpdateConversation}
              profile={profile}
              memories={memories}
              documents={documents}
              settings={settings}
              onUpdateSettings={(partial) =>
                setSettings((prev) => ({ ...prev, ...partial }))
              }
              avatarState={avatarState}
              onAvatarStateChange={setAvatarState}
              initialPrompt={initialChatPrompt}
              onClearInitialPrompt={() => setInitialChatPrompt('')}
            />
          )}

          {activeNav === 'wellness' && (
            <WellnessCenter
              moods={moods}
              onAddMood={(mood: MoodType, note: string) =>
                setMoods((prev) => [
                  {
                    id: `mood-${Date.now()}`,
                    mood,
                    note,
                    timestamp: new Date().toISOString(),
                  },
                  ...prev,
                ])
              }
              onDeleteMood={(id) => setMoods((prev) => prev.filter((m) => m.id !== id))}
              journals={journals}
              onSaveJournal={(entry) =>
                setJournals((prev) => {
                  const exists = prev.some((j) => j.id === entry.id);
                  if (!exists) return [entry, ...prev];
                  return prev.map((j) => (j.id === entry.id ? entry : j));
                })
              }
              onDeleteJournal={(id) =>
                setJournals((prev) => prev.filter((j) => j.id !== id))
              }
              onClearAllWellnessData={() => {
                setMoods([]);
                setJournals([]);
              }}
              onTalkToElaraSupport={(msg) => handleNavigate('chat', msg)}
            />
          )}

          {activeNav === 'academic' && (
            <AcademicAssistant
              profile={profile}
              documents={documents}
              quizHistory={quizHistory}
              onRecordQuizAttempt={(attempt) =>
                setQuizHistory((prev) => [attempt, ...prev])
              }
            />
          )}

          {activeNav === 'research' && (
            <ResearchAssistant
              citations={citations}
              onSaveCitation={(cit) => setCitations((prev) => [cit, ...prev])}
              onDeleteCitation={(id) =>
                setCitations((prev) => prev.filter((c) => c.id !== id))
              }
            />
          )}

          {activeNav === 'documents' && (
            <DocumentManager
              documents={documents}
              initialSelectedDocId={focusedDocId}
              onAddDocument={(doc) => setDocuments((prev) => [doc, ...prev])}
              onRenameDocument={(id, newName) =>
                setDocuments((prev) =>
                  prev.map((d) => (d.id === id ? { ...d, name: newName } : d))
                )
              }
              onDeleteDocument={(id) =>
                setDocuments((prev) => prev.filter((d) => d.id !== id))
              }
            />
          )}

          {activeNav === 'planner' && (
            <StudyPlanner
              tasks={tasks}
              highlightedTaskId={focusedTaskId}
              onSaveTask={(task) =>
                setTasks((prev) => {
                  const exists = prev.some((t) => t.id === task.id);
                  if (!exists) return [task, ...prev];
                  return prev.map((t) => (t.id === task.id ? task : t));
                })
              }
              onToggleTask={(id) =>
                setTasks((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
                )
              }
              onDeleteTask={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
            />
          )}

          {activeNav === 'history' && (
            <HistoryAndMemory
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                setActiveConversationId(id);
                setActiveNav('chat');
              }}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              onClearAllConversations={() => {
                setConversations(INITIAL_CONVERSATIONS);
                setActiveConversationId(INITIAL_CONVERSATIONS[0].id);
              }}
              memories={memories}
              memoryEnabled={settings.memoryEnabled}
              onToggleMemoryEnabled={() =>
                setSettings((prev) => ({
                  ...prev,
                  memoryEnabled: !prev.memoryEnabled,
                }))
              }
              onAddMemory={(category, content) =>
                setMemories((prev) => [
                  {
                    id: `mem-${Date.now()}`,
                    category,
                    content,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ])
              }
              onUpdateMemory={(id, content) =>
                setMemories((prev) =>
                  prev.map((m) => (m.id === id ? { ...m, content } : m))
                )
              }
              onDeleteMemory={(id) =>
                setMemories((prev) => prev.filter((m) => m.id !== id))
              }
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              profile={profile}
              onUpdateProfile={setProfile}
              settings={settings}
              onUpdateSettings={(partial) =>
                setSettings((prev) => ({ ...prev, ...partial }))
              }
              onFactoryResetAllData={handleFactoryReset}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Thumb-zone navigation on screens below lg) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-14 px-1"
      >
        {(
          [
            { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'chat', label: 'ELARA AI', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'wellness', label: 'Wellness', icon: <Heart className="w-4 h-4" /> },
            { id: 'academic', label: 'Study', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'planner', label: 'Planner', icon: <Calendar className="w-4 h-4" /> },
          ] as { id: NavSection; label: string; icon: React.ReactNode }[]
        ).map((tab) => {
          const isActive = activeNav === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleNavigate(tab.id)}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
