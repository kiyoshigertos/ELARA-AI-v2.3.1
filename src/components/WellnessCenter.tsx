import React, { useState, useEffect } from 'react';
import {
  Heart,
  BookHeart,
  Wind,
  MessageCircleHeart,
  ShieldCheck,
  Trash2,
  Edit3,
  Play,
  Pause,
  Square,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { JournalEntry, MoodEntry, MoodType } from '../types';
import { FormattedText } from './FormattedText';

const MOOD_OPTIONS: { mood: MoodType; description: string }[] = [
  { mood: 'Happy', description: 'Energized & positive' },
  { mood: 'Calm', description: 'Grounded & peaceful' },
  { mood: 'Okay', description: 'Steady & managing' },
  { mood: 'Tired', description: 'Low energy, need rest' },
  { mood: 'Stressed', description: 'High academic pressure' },
  { mood: 'Anxious', description: 'Uneasy about upcoming tasks' },
  { mood: 'Overwhelmed', description: 'Too many things at once' },
  { mood: 'Frustrated', description: 'Stuck on a problem' },
  { mood: 'Sad', description: 'Feeling down or heavy' },
];

const JOURNAL_PROMPTS = [
  'What went well today?',
  'What challenged you today?',
  'What is currently worrying you?',
  'What is one thing you are grateful for?',
  'What is one small step you can take tomorrow?',
];

interface WellnessCenterProps {
  moods: MoodEntry[];
  onAddMood: (mood: MoodType, note: string) => void;
  onDeleteMood: (id: string) => void;
  journals: JournalEntry[];
  onSaveJournal: (entry: JournalEntry) => void;
  onDeleteJournal: (id: string) => void;
  onClearAllWellnessData: () => void;
  onTalkToElaraSupport: (initialMessage: string) => void;
}

export const WellnessCenter: React.FC<WellnessCenterProps> = ({
  moods,
  onAddMood,
  onDeleteMood,
  journals,
  onSaveJournal,
  onDeleteJournal,
  onClearAllWellnessData,
  onTalkToElaraSupport,
}) => {
  const [activeTab, setActiveTab] = useState<'mood' | 'journal' | 'breathing' | 'privacy'>('mood');

  // Mood state
  const [selectedMood, setSelectedMood] = useState<MoodType>('Calm');
  const [moodNote, setMoodNote] = useState('');
  const [moodSavedNotice, setMoodSavedNotice] = useState(false);

  // Journal state
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalPrompt, setJournalPrompt] = useState(JOURNAL_PROMPTS[0]);
  const [journalContent, setJournalContent] = useState('');
  const [isReflectingId, setIsReflectingId] = useState<string | null>(null);

  // Breathing Exercise state (4-4-6 calming breath or 4-4-4-4 box breath)
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPaused, setBreathingPaused] = useState(false);
  const [breathStage, setBreathStage] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [stageSecondsLeft, setStageSecondsLeft] = useState(4);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(0);

  // Privacy confirmation state
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Breathing Timer Effect
  useEffect(() => {
    if (!breathingActive || breathingPaused) return;

    const timer = setInterval(() => {
      setTotalSessionSeconds((s) => s + 1);
      setStageSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        // Transition to next stage
        setBreathStage((current) => {
          if (current === 'Inhale') {
            setStageSecondsLeft(4);
            return 'Hold';
          }
          if (current === 'Hold') {
            setStageSecondsLeft(6);
            return 'Exhale';
          }
          if (current === 'Exhale') {
            setStageSecondsLeft(2);
            return 'Rest';
          }
          setStageSecondsLeft(4);
          return 'Inhale';
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathingActive, breathingPaused]);

  const handleLogMood = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMood(selectedMood, moodNote.trim());
    setMoodNote('');
    setMoodSavedNotice(true);
    setTimeout(() => setMoodSavedNotice(false), 2500);
  };

  const handleSaveJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) return;

    const now = new Date().toISOString();
    const existing = journals.find((j) => j.id === editingJournalId);

    const entry: JournalEntry = {
      id: existing ? existing.id : `jour-${Date.now()}`,
      title: journalTitle.trim() || `Reflection — ${new Date().toLocaleDateString()}`,
      content: journalContent.trim(),
      promptUsed: journalPrompt,
      mood: selectedMood,
      aiReflection: existing?.aiReflection,
      timestamp: existing ? existing.timestamp : now,
      updatedAt: now,
    };

    onSaveJournal(entry);
    setEditingJournalId(null);
    setJournalTitle('');
    setJournalContent('');
  };

  const handleStartEditJournal = (entry: JournalEntry) => {
    setEditingJournalId(entry.id);
    setJournalTitle(entry.title);
    setJournalPrompt(entry.promptUsed || JOURNAL_PROMPTS[0]);
    setJournalContent(entry.content);
  };

  // Explicit opt-in AI reflection on a journal entry
  const handleReflectWithElara = async (entry: JournalEntry) => {
    setIsReflectingId(entry.id);
    try {
      const res = await fetch('/api/gemini/journal-reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryContent: entry.content,
          mood: entry.mood,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reflection) {
        onSaveJournal({
          ...entry,
          aiReflection: data.reflection,
          updatedAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsReflectingId(null);
    }
  };

  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingPaused(false);
    setBreathStage('Inhale');
    setStageSecondsLeft(4);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    setBreathingPaused(false);
    setBreathStage('Inhale');
    setStageSecondsLeft(4);
    setTotalSessionSeconds(0);
  };

  // Calculate mood distribution counts for visual history
  const moodCounts = MOOD_OPTIONS.map((opt) => ({
    mood: opt.mood,
    count: moods.filter((m) => m.mood === opt.mood).length,
  })).filter((m) => m.count > 0);

  return (
    <div className="space-y-6">
      {/* Section Header & Quick Emotional Support Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mental Wellness & Balance Center
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Private mood check-ins, reflective journaling, and guided stress-relief tools.
          </p>
        </div>

        <button
          onClick={() =>
            onTalkToElaraSupport(
              "ELARA, I'd like a calm space to talk about how school and life have been feeling lately."
            )
          }
          className="px-4 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 self-start md:self-auto"
        >
          <MessageCircleHeart className="w-4 h-4" />
          <span>Talk to ELARA in Comfort Mode</span>
        </button>
      </div>

      {/* Sub-navigation Segmented Controls */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg w-fit border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('mood')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'mood'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Mood Check-In</span>
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'journal'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookHeart className="w-3.5 h-3.5" />
          <span>Private Journal</span>
        </button>
        <button
          onClick={() => setActiveTab('breathing')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'breathing'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Breathing & Grounding</span>
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Wellness Privacy & Support</span>
        </button>
      </div>

      {/* TAB 1: MOOD CHECK-IN */}
      {activeTab === 'mood' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleLogMood}
            className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                How are you feeling right now?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Check in honestly—there are no right or wrong feelings, and ELARA never labels or diagnoses you.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {MOOD_OPTIONS.map((item) => {
                const isSelected = selectedMood === item.mood;
                return (
                  <button
                    key={item.mood}
                    type="button"
                    onClick={() => setSelectedMood(item.mood)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.mood}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Optional Note (What contributed to this feeling?)
              </label>
              <textarea
                rows={3}
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="e.g., Finished my lab report early, or feeling pressured about next week's exam..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
              >
                Save Mood Check-In
              </button>
              {moodSavedNotice && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Mood entry saved privately.
                </span>
              )}
            </div>
          </form>

          {/* Mood History & Visual Distribution */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Your Mood History & Patterns
                </h2>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {moods.length} {moods.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {/* Simple Visual Bar Summary */}
              {moodCounts.length > 0 && (
                <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  {moodCounts.map((mc) => {
                    const pct = Math.round((mc.count / Math.max(1, moods.length)) * 100);
                    return (
                      <div key={mc.mood} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {mc.mood}
                          </span>
                          <span className="font-mono tabular-nums text-slate-500">
                            {mc.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Chronological Entries */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {moods.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    No mood entries recorded yet. Log your first check-in on the left.
                  </p>
                ) : (
                  moods.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {m.mood}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span className="font-mono tabular-nums text-slate-500">
                            {new Date(m.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {m.note && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">{m.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteMood(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Mood Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVATE JOURNALING */}
      {activeTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveJournalSubmit}
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {editingJournalId ? 'Edit Journal Entry' : 'Write a Private Journal Entry'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stored strictly in your browser. Never sent to AI unless you explicitly click &ldquo;Reflect with ELARA&rdquo;.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Optional Reflection Prompt
              </label>
              <select
                value={journalPrompt}
                onChange={(e) => setJournalPrompt(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                {JOURNAL_PROMPTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Entry Title
              </label>
              <input
                type="text"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                placeholder="e.g., Small wins after today's lecture"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Your Thoughts
              </label>
              <textarea
                rows={6}
                required
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder={journalPrompt}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
              >
                {editingJournalId ? 'Update Entry' : 'Save Private Entry'}
              </button>
              {editingJournalId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingJournalId(null);
                    setJournalTitle('');
                    setJournalContent('');
                  }}
                  className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Saved Journal Entries */}
          <div className="lg:col-span-7 space-y-4">
            {journals.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                <p className="text-sm text-slate-500">
                  Your private journal is empty. Write your first entry on the left whenever you want to clear your head.
                </p>
              </div>
            ) : (
              journals.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {entry.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono tabular-nums">
                          {new Date(entry.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {entry.promptUsed && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Prompt: {entry.promptUsed}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEditJournal(entry)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteJournal(entry.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>

                  {entry.aiReflection ? (
                    <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 mb-1.5">
                        ELARA&apos;s Gentle Reflection
                      </div>
                      <FormattedText text={entry.aiReflection} />
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400">
                        Private local entry. Clicking reflect transmits this entry to ELARA.
                      </span>
                      <button
                        onClick={() => handleReflectWithElara(entry)}
                        disabled={isReflectingId === entry.id}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isReflectingId === entry.id
                            ? 'Reflecting...'
                            : 'Reflect with ELARA (Opt-In)'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BREATHING & STRESS RELIEF TOOLS */}
      {activeTab === 'breathing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Animated Breathing Pacer */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-between text-center space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Guided 4-4-6 Calming Breath Exercise
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inhale 4s · Hold 4s · Exhale slowly 6s · Rest 2s. Slows heart rate before exams or heavy study sessions.
              </p>
            </div>

            {/* Visual Breathing Circle */}
            <div className="relative w-56 h-56 flex items-center justify-center my-4">
              <div
                className="w-44 h-44 rounded-full border-2 border-sky-500/40 bg-sky-500/10 flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out"
                style={{
                  transform: !breathingActive
                    ? 'scale(1)'
                    : breathStage === 'Inhale' || breathStage === 'Hold'
                    ? 'scale(1.25)'
                    : 'scale(0.82)',
                }}
              >
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {breathingActive ? breathStage : 'Ready'}
                </span>
                <span className="text-2xl font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums mt-1">
                  {breathingActive ? `${stageSecondsLeft}s` : '4-4-6'}
                </span>
              </div>
            </div>

            <div className="space-y-3 w-full max-w-xs">
              <div className="text-xs font-mono tabular-nums text-slate-500">
                Session Elapsed: {Math.floor(totalSessionSeconds / 60)}m {totalSessionSeconds % 60}s
              </div>

              <div className="flex items-center justify-center gap-2.5">
                {!breathingActive ? (
                  <button
                    onClick={startBreathing}
                    className="px-5 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Breathing</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setBreathingPaused(!breathingPaused)}
                      className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      {breathingPaused ? (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={stopBreathing}
                      className="px-4 py-2.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 5-4-3-2-1 Grounding & Study-Rest Routines */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                5-4-3-2-1 Sensory Grounding Reset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When your mind is racing over deadlines or exams, pause and notice:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li>
                  <strong className="font-mono text-sky-600 dark:text-sky-400">5</strong> things you can see around your desk right now.
                </li>
                <li>
                  <strong className="font-mono text-sky-600 dark:text-sky-400">4</strong> physical sensations you can feel (your feet on the floor, cool air).
                </li>
                <li>
                  <strong className="font-mono text-sky-600 dark:text-sky-400">3</strong> gentle sounds you can hear in the background.
                </li>
                <li>
                  <strong className="font-mono text-sky-600 dark:text-sky-400">2</strong> scents in the air or a sip of water.
                </li>
                <li>
                  <strong className="font-mono text-sky-600 dark:text-sky-400">1</strong> kind, honest statement about your effort today.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Healthy Study-Rest Rhythm
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Cognitive fatigue makes simple concepts feel impossible. Try 40 minutes of single-task study followed by a genuine 10-minute screen-free break (stretch, hydrate, look at a distant window).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WELLNESS PRIVACY & HUMAN SUPPORT RESOURCES */}
      {activeTab === 'privacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Your Wellness Data & Privacy Controls
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Mood check-ins and journal entries are treated as sensitive personal information. They are stored locally in your browser and are never used for advertising or silent AI profiling.
            </p>
            <div className="pt-2">
              {!confirmClearAll ? (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="px-4 py-2.5 rounded-lg border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-500/10 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Mood & Journal Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      onClearAllWellnessData();
                      setConfirmClearAll(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-500"
                  >
                    Confirm Permanent Deletion
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <PhoneCall className="w-4 h-4 text-sky-500" />
              <h2 className="text-base font-semibold">
                Professional & Emergency Human Support
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ELARA is an AI student companion, not a licensed mental health professional or counselor. If you are experiencing severe distress, crisis, or thoughts of self-harm, please connect with trusted human support right away:
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li>
                <strong>Campus Guidance & Counseling Office:</strong> Reach out to your university or school student wellness center.
              </li>
              <li>
                <strong>Philippines National Center for Mental Health (NCMH) Crisis Hotline:</strong>{' '}
                <span className="font-mono">1553</span> (Luzon-wide landline toll-free) or{' '}
                <span className="font-mono">0917-899-8727</span>.
              </li>
              <li>
                <strong>US & International Crisis Support:</strong> Call or text{' '}
                <span className="font-mono">988</span> (US/Canada) or contact your local emergency services.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
