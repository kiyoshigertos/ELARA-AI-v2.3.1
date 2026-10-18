import React, { useState, useRef, useMemo } from 'react';
import {
  User,
  Sun,
  Moon,
  Volume2,
  Shield,
  Check,
  RotateCcw,
  Play,
  Square,
  Sparkles,
  Bot,
  Mic,
  Sliders,
  Search,
  Radio,
  Headphones,
  Zap,
  Heart,
  BookOpen,
  Scissors,
  Eye,
  Glasses,
  Palette,
} from 'lucide-react';
import {
  AppSettings,
  StudentProfile,
  VoicePersona,
  AvatarStyle,
  VoiceOption,
  HairStyle,
  FaceShape,
  EyeStyle,
  FaceMarking,
  GlassesStyle,
} from '../types';
import { ElaraAvatar } from './ElaraAvatar';
import {
  AVAILABLE_VOICES,
  AVAILABLE_AVATARS,
  AVAILABLE_HAIRSTYLES,
  AVAILABLE_FACE_SHAPES,
  AVAILABLE_EYE_STYLES,
  AVAILABLE_FACE_MARKINGS,
  AVAILABLE_GLASSES,
} from '../data/initialData';

interface SettingsViewProps {
  profile: StudentProfile;
  onUpdateProfile: (profile: StudentProfile) => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onFactoryResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  settings,
  onUpdateSettings,
  onFactoryResetAllData,
}) => {
  const [formProfile, setFormProfile] = useState<StudentProfile>(profile);
  const [subjectsText, setSubjectsText] = useState(profile.subjectsOfInterest.join(', '));
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Avatar filter state
  const [avatarCategory, setAvatarCategory] = useState<string>('All');
  const [customizerTab, setCustomizerTab] = useState<'hair' | 'face' | 'eyes' | 'markings' | 'glasses'>('hair');

  // Voice filter state
  const [voiceCategory, setVoiceCategory] = useState<string>('All');
  const [voiceGender, setVoiceGender] = useState<string>('All');
  const [voiceSearch, setVoiceSearch] = useState<string>('');

  // Audio preview & Sandbox state
  const [previewingVoiceId, setPreviewingVoiceId] = useState<VoicePersona | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isAuditioningCustom, setIsAuditioningCustom] = useState(false);
  const [auditionText, setAuditionText] = useState(
    "Hello! I am ELARA, your personal emotionally intelligent companion. Let's make today a great learning session!"
  );
  const [sandboxAvatarState, setSandboxAvatarState] = useState<'IDLE' | 'SPEAKING'>('IDLE');
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const stopAudioPreview = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setPreviewingVoiceId(null);
    setIsLoadingPreview(false);
  };

  const handlePreviewVoice = async (voice: VoiceOption) => {
    if (previewingVoiceId === voice.id) {
      stopAudioPreview();
      return;
    }

    stopAudioPreview();
    setPreviewingVoiceId(voice.id);
    setIsLoadingPreview(true);

    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          voiceName: voice.id,
          style: 'Warm, clear, natural student companion',
        }),
      });

      if (!res.ok) throw new Error('Preview TTS failed');
      const data = await res.json();

      if (!data.audioBase64) throw new Error('No audio returned');

      const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      const audio = new Audio(audioSrc);
      audio.volume = settings.volume;
      audio.playbackRate = settings.speakingRate;
      audioPreviewRef.current = audio;

      audio.onended = () => {
        setPreviewingVoiceId(null);
        setIsLoadingPreview(false);
      };
      audio.onerror = () => {
        setPreviewingVoiceId(null);
        setIsLoadingPreview(false);
      };

      setIsLoadingPreview(false);
      await audio.play();
    } catch {
      // Fallback to Web Speech API
      if ('speechSynthesis' in window) {
        setIsLoadingPreview(false);
        const utterance = new SpeechSynthesisUtterance(voice.sampleText);
        utterance.rate = settings.speakingRate;
        utterance.volume = settings.volume;
        utterance.onend = () => setPreviewingVoiceId(null);
        utterance.onerror = () => setPreviewingVoiceId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPreviewingVoiceId(null);
        setIsLoadingPreview(false);
      }
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudentProfile = {
      ...formProfile,
      subjectsOfInterest: subjectsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onUpdateProfile(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const filteredAvatars = useMemo(() => {
    if (avatarCategory === 'All') return AVAILABLE_AVATARS;
    return AVAILABLE_AVATARS.filter((a) => a.category === avatarCategory);
  }, [avatarCategory]);

  const filteredVoices = useMemo(() => {
    return AVAILABLE_VOICES.filter((v) => {
      if (voiceCategory !== 'All' && v.category !== voiceCategory) return false;
      if (voiceGender !== 'All' && v.gender !== voiceGender) return false;
      if (voiceSearch.trim()) {
        const q = voiceSearch.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesTone = v.tone.toLowerCase().includes(q);
        const matchesPersona = v.personality.toLowerCase().includes(q);
        const matchesBestFor = v.bestFor.toLowerCase().includes(q);
        if (!matchesName && !matchesTone && !matchesPersona && !matchesBestFor) return false;
      }
      return true;
    });
  }, [voiceCategory, voiceGender, voiceSearch]);

  const activeAvatar =
    AVAILABLE_AVATARS.find((a) => a.id === settings.selectedAvatar) || AVAILABLE_AVATARS[0];
  const activeVoice =
    AVAILABLE_VOICES.find((v) => v.id === settings.selectedVoice) || AVAILABLE_VOICES[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings &amp; Personalization Studio
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Customize ELARA&apos;s companion avatar styles, voice personas, speech calibration, and student learning profile.
        </p>
      </div>

      {/* ACTIVE COMPANION SUMMARY BANNER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <ElaraAvatar
              state="IDLE"
              avatarStyle={settings.selectedAvatar || 'nova'}
              hairStyle={settings.hairStyle}
              faceShape={settings.faceShape}
              eyeStyle={settings.eyeStyle}
              faceMarking={settings.faceMarking}
              glassesStyle={settings.glassesStyle}
              size="md"
              showLabel={false}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  Active Persona
                </span>
                <span className="text-xs font-mono text-slate-400">·</span>
                <span className="text-xs text-slate-500">{activeAvatar.badge}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {activeAvatar.name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Voice: <strong>{activeVoice.name}</strong> ({activeVoice.tone}) · Language:{' '}
                <strong>{profile.preferredLanguage}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePreviewVoice(activeVoice)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs"
          >
            {previewingVoiceId === activeVoice.id ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Voice Demo</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Hear {activeVoice.id}&apos;s Greeting</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: COMPANION AVATAR PERSONA STUDIO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-sky-500" />
              <span>Choose Companion Avatar Style ({AVAILABLE_AVATARS.length} Personas)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select ELARA&apos;s visual presence, aesthetic theme, and responsive companion demeanor.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {filteredAvatars.length} Showing · {AVAILABLE_AVATARS.length} Total
          </span>
        </div>

        {/* Avatar Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Cosmic & Classic', 'Nature & Wellness', 'High Energy & Tech', 'Mystic & Quiet'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setAvatarCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                avatarCategory === cat
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 11 Avatar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredAvatars.map((avatar) => {
            const isSelected = (settings.selectedAvatar || 'nova') === avatar.id;
            return (
              <div
                key={avatar.id}
                onClick={() =>
                  onUpdateSettings({
                    selectedAvatar: avatar.id,
                    hairStyle: avatar.defaultHairStyle,
                    faceShape: avatar.defaultFaceShape,
                    eyeStyle: avatar.defaultEyeStyle,
                    faceMarking: avatar.defaultFaceMarking,
                  })
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${avatar.accentColor}18`,
                        color: avatar.accentColor,
                      }}
                    >
                      {avatar.badge}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  {/* Centered Avatar Preview with Signature Hair & Face */}
                  <div className="py-2 flex justify-center">
                    <ElaraAvatar
                      state="IDLE"
                      avatarStyle={avatar.id}
                      hairStyle={isSelected ? settings.hairStyle || avatar.defaultHairStyle : avatar.defaultHairStyle}
                      faceShape={isSelected ? settings.faceShape || avatar.defaultFaceShape : avatar.defaultFaceShape}
                      eyeStyle={isSelected ? settings.eyeStyle || avatar.defaultEyeStyle : avatar.defaultEyeStyle}
                      faceMarking={isSelected ? (settings.faceMarking !== undefined ? settings.faceMarking : avatar.defaultFaceMarking) : avatar.defaultFaceMarking}
                      glassesStyle={isSelected ? settings.glassesStyle : 'none'}
                      size="md"
                      showLabel={false}
                    />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {avatar.name}
                  </h3>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {avatar.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      ✂️ {avatar.hairStyleName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      👤 {avatar.faceShapeName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {avatar.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Ideal for: </span>
                  {avatar.idealFor}
                </div>
              </div>
            );
          })}
        </div>

        {/* SUBSECTION: INTERACTIVE AVATAR FEATURES & HAIRSTYLE CUSTOMIZATION STUDIO */}
        <div className="mt-6 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-sky-500" />
                <span>Avatar Customizer — Hair, Faces, Eyes &amp; Accents</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Freely mix and match hairstyles, facial shapes, eye aesthetics, and facial markings for {activeAvatar.name}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onUpdateSettings({
                  hairStyle: activeAvatar.defaultHairStyle,
                  faceShape: activeAvatar.defaultFaceShape,
                  eyeStyle: activeAvatar.defaultEyeStyle,
                  faceMarking: activeAvatar.defaultFaceMarking,
                  glassesStyle: 'none',
                  avatarGlassesEnabled: false,
                });
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              title="Reset all facial and hair customizations to the active avatar's default style"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to {activeAvatar.name.replace('Elara ', '')}&apos;s Signature</span>
            </button>
          </div>

          {/* Interactive Live Character Customizer Stage */}
          <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="shrink-0 flex flex-col items-center">
              <ElaraAvatar
                state="IDLE"
                avatarStyle={settings.selectedAvatar || 'nova'}
                hairStyle={settings.hairStyle}
                faceShape={settings.faceShape}
                eyeStyle={settings.eyeStyle}
                faceMarking={settings.faceMarking}
                glassesStyle={settings.glassesStyle}
                size="lg"
                showLabel={true}
              />
              <span className="mt-1 text-[11px] text-slate-500 font-medium">Live Character Preview</span>
            </div>

            <div className="space-y-2.5 text-xs flex-1 w-full">
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeAvatar.accentColor }} />
                <span>Active Styled Silhouette Configuration</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Hairstyle</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {AVAILABLE_HAIRSTYLES.find((h) => h.id === (settings.hairStyle || activeAvatar.defaultHairStyle))?.name}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Face Shape</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {AVAILABLE_FACE_SHAPES.find((f) => f.id === (settings.faceShape || activeAvatar.defaultFaceShape))?.name}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Eyes &amp; Lashes</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {AVAILABLE_EYE_STYLES.find((e) => e.id === (settings.eyeStyle || activeAvatar.defaultEyeStyle))?.name}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Facial Marking</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {AVAILABLE_FACE_MARKINGS.find((m) => m.id === (settings.faceMarking !== undefined ? settings.faceMarking : activeAvatar.defaultFaceMarking))?.name}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Eyewear / Glasses</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {AVAILABLE_GLASSES.find((g) => g.id === (settings.glassesStyle || 'none'))?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Category Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCustomizerTab('hair')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                customizerTab === 'hair'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Hairstyles ({AVAILABLE_HAIRSTYLES.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomizerTab('face')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                customizerTab === 'face'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Face Shapes ({AVAILABLE_FACE_SHAPES.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomizerTab('eyes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                customizerTab === 'eyes'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Eye &amp; Lash Styles ({AVAILABLE_EYE_STYLES.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomizerTab('markings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                customizerTab === 'markings'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Face Markings ({AVAILABLE_FACE_MARKINGS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomizerTab('glasses')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                customizerTab === 'glasses'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>Eyewear &amp; Glasses ({AVAILABLE_GLASSES.length})</span>
            </button>
          </div>

          {/* Tab 1: HAIRSTYLES GRID */}
          {customizerTab === 'hair' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AVAILABLE_HAIRSTYLES.map((hair) => {
                const currentHair = settings.hairStyle || activeAvatar.defaultHairStyle;
                const isSelected = currentHair === hair.id;
                return (
                  <div
                    key={hair.id}
                    onClick={() => onUpdateSettings({ hairStyle: hair.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {hair.badge}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {hair.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {hair.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: FACE SHAPES GRID */}
          {customizerTab === 'face' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AVAILABLE_FACE_SHAPES.map((face) => {
                const currentFace = settings.faceShape || activeAvatar.defaultFaceShape;
                const isSelected = currentFace === face.id;
                return (
                  <div
                    key={face.id}
                    onClick={() => onUpdateSettings({ faceShape: face.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {face.badge}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {face.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {face.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: EYE & LASH STYLES GRID */}
          {customizerTab === 'eyes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AVAILABLE_EYE_STYLES.map((eye) => {
                const currentEye = settings.eyeStyle || activeAvatar.defaultEyeStyle;
                const isSelected = currentEye === eye.id;
                return (
                  <div
                    key={eye.id}
                    onClick={() => onUpdateSettings({ eyeStyle: eye.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {eye.badge}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {eye.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {eye.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 4: FACE MARKINGS GRID */}
          {customizerTab === 'markings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_FACE_MARKINGS.map((mark) => {
                const currentMark =
                  settings.faceMarking !== undefined
                    ? settings.faceMarking
                    : activeAvatar.defaultFaceMarking;
                const isSelected = currentMark === mark.id;
                return (
                  <div
                    key={mark.id}
                    onClick={() => onUpdateSettings({ faceMarking: mark.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {mark.badge}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {mark.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {mark.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 5: EYEWEAR & GLASSES GRID */}
          {customizerTab === 'glasses' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_GLASSES.map((glasses) => {
                const currentGlasses = settings.glassesStyle || 'none';
                const isSelected = currentGlasses === glasses.id;
                return (
                  <div
                    key={glasses.id}
                    onClick={() =>
                      onUpdateSettings({
                        glassesStyle: glasses.id,
                        avatarGlassesEnabled: glasses.id !== 'none',
                      })
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {glasses.badge}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {glasses.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {glasses.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: VOICE PERSONA & SPEECH STUDIO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-sky-500" />
              <span>Voice Personas &amp; Speech Calibration ({AVAILABLE_VOICES.length} Voices)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Listen to live previews and select the voice that best supports your study habits and focus.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Powered by Gemini TTS &amp; Live Speech
          </span>
        </div>

        {/* Filter Toolbar: Category Tabs + Gender Chips + Search Input */}
        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {['All', 'Gentle & Calming', 'Academic & Scholarly', 'Motivational & Upbeat', 'Deep & Reflective'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setVoiceCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                      voiceCategory === cat
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            {/* Voice Search Box */}
            <div className="relative min-w-[200px] shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                placeholder="Search voice or tone..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Gender Filter Chips */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
            <span className="text-slate-500 text-[11px] font-medium shrink-0">Filter by Gender:</span>
            {['All', 'Female', 'Male', 'Neutral'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => setVoiceGender(gender)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  voiceGender === gender
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {gender === 'All' ? 'All Genders' : gender}
              </button>
            ))}
            <span className="text-slate-400 text-[11px] ml-auto">
              {filteredVoices.length} of {AVAILABLE_VOICES.length} available
            </span>
          </div>
        </div>

        {/* 16 Voice Persona Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredVoices.map((voice) => {
            const isSelected = settings.selectedVoice === voice.id;
            const isPlaying = previewingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between text-left ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5 dark:bg-sky-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {voice.name}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {voice.gender}
                    </span>
                  </div>

                  <div className="inline-block text-xs font-semibold text-sky-600 dark:text-sky-400 mb-1.5">
                    {voice.tone}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {voice.personality}
                  </p>

                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Best for: </span>
                    {voice.bestFor}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePreviewVoice(voice)}
                    disabled={isLoadingPreview && previewingVoiceId === voice.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isPlaying
                        ? 'bg-amber-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Sample</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ selectedVoice: voice.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : 'text-sky-600 dark:text-sky-400 hover:underline'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Use Voice'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* INTERACTIVE VOICE & AVATAR AUDITION SANDBOX */}
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 dark:bg-sky-950/30 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-sky-500/15 pb-3">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-sky-500 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Voice &amp; Avatar Audition Sandbox
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hear {activeVoice.name} speak any custom study phrase paired with {activeAvatar.name}&apos;s visual presence.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-sky-500/30 text-sky-600 dark:text-sky-400">
                {activeAvatar.name} + {activeVoice.id}
              </span>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 text-[11px] font-medium shrink-0">Preset Phrases:</span>
            {[
              "Let's break down this complex problem step-by-step.",
              'You worked hard today. Be proud of the progress you made.',
              'Quick flashcard drill: What are the core ACID principles in databases?',
              'Take a gentle deep breath; we will tackle your deadline together.',
            ].map((phrase, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAuditionText(phrase)}
                className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-sky-500 transition-colors truncate max-w-xs"
              >
                &ldquo;{phrase.slice(0, 36)}...&rdquo;
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="shrink-0 flex items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <ElaraAvatar
                state={sandboxAvatarState}
                avatarStyle={settings.selectedAvatar || 'nova'}
                size="md"
                showLabel={true}
              />
            </div>

            <div className="flex-1 w-full space-y-2">
              <textarea
                rows={2}
                value={auditionText}
                onChange={(e) => setAuditionText(e.target.value)}
                placeholder="Type any phrase you want ELARA to say in your selected voice..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Speed: {settings.speakingRate.toFixed(2)}x · Volume: {Math.round(settings.volume * 100)}%
                </span>

                <button
                  type="button"
                  onClick={async () => {
                    if (isAuditioningCustom) {
                      stopAudioPreview();
                      setIsAuditioningCustom(false);
                      setSandboxAvatarState('IDLE');
                      return;
                    }

                    if (!auditionText.trim()) return;

                    stopAudioPreview();
                    setIsAuditioningCustom(true);
                    setSandboxAvatarState('SPEAKING');

                    try {
                      const res = await fetch('/api/gemini/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: auditionText,
                          voiceName: activeVoice.id,
                          style: activeVoice.personality,
                        }),
                      });

                      if (!res.ok) throw new Error('Audition TTS failed');
                      const data = await res.json();
                      if (!data.audioBase64) throw new Error('No audio returned');

                      const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
                      const audio = new Audio(audioSrc);
                      audio.volume = settings.volume;
                      audio.playbackRate = settings.speakingRate;
                      audioPreviewRef.current = audio;

                      audio.onended = () => {
                        setIsAuditioningCustom(false);
                        setSandboxAvatarState('IDLE');
                      };
                      audio.onerror = () => {
                        setIsAuditioningCustom(false);
                        setSandboxAvatarState('IDLE');
                      };

                      await audio.play();
                    } catch {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(auditionText);
                        utterance.rate = settings.speakingRate;
                        utterance.volume = settings.volume;
                        utterance.onend = () => {
                          setIsAuditioningCustom(false);
                          setSandboxAvatarState('IDLE');
                        };
                        utterance.onerror = () => {
                          setIsAuditioningCustom(false);
                          setSandboxAvatarState('IDLE');
                        };
                        window.speechSynthesis.speak(utterance);
                      } else {
                        setIsAuditioningCustom(false);
                        setSandboxAvatarState('IDLE');
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
                >
                  {isAuditioningCustom ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Audition</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Audition Custom Phrase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Speech Calibration Sliders */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Speech Pacing, Volume &amp; Playback Automation
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {/* Speed */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Speaking Speed
                </span>
                <span className="font-mono tabular-nums font-semibold text-sky-600 dark:text-sky-400">
                  {settings.speakingRate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={settings.speakingRate}
                onChange={(e) => onUpdateSettings({ speakingRate: parseFloat(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.75x (Gentle)</span>
                <span>1.0x (Normal)</span>
                <span>1.5x (Fast)</span>
              </div>
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Voice Volume</span>
                <span className="font-mono tabular-nums font-semibold text-sky-600 dark:text-sky-400">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.volume}
                onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>10% (Soft)</span>
                <span>50%</span>
                <span>100% (Full)</span>
              </div>
            </div>

            {/* Auto-Speak Toggle */}
            <div className="flex flex-col justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Automatic Voice Replies
              </span>
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.voiceEnabled && settings.autoSpeakReplies}
                  onChange={(e) =>
                    onUpdateSettings({
                      voiceEnabled: e.target.checked,
                      autoSpeakReplies: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-sky-600 rounded"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Speak responses aloud in Chat without manually pressing play
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: STUDENT PROFILE & DATA PRIVACY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Student Learning Profile Form (7 cols) */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-4 h-4 text-sky-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Personalized Student Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Preferred Name
              </label>
              <input
                type="text"
                value={formProfile.name}
                onChange={(e) => setFormProfile({ ...formProfile, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Preferred Language
              </label>
              <select
                value={formProfile.preferredLanguage}
                onChange={(e) =>
                  setFormProfile({
                    ...formProfile,
                    preferredLanguage: e.target.value as StudentProfile['preferredLanguage'],
                  })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="English">English</option>
                <option value="Filipino">Filipino</option>
                <option value="Bisaya/Cebuano">Bisaya / Cebuano</option>
                <option value="Taglish">Taglish</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Education Level
              </label>
              <input
                type="text"
                value={formProfile.educationLevel}
                onChange={(e) =>
                  setFormProfile({
                    ...formProfile,
                    educationLevel: e.target.value,
                  })
                }
                placeholder="e.g., Undergraduate / Senior High School"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Course or Grade Level
              </label>
              <input
                type="text"
                value={formProfile.course}
                onChange={(e) => setFormProfile({ ...formProfile, course: e.target.value })}
                placeholder="e.g., BS Information Technology — 2nd Year"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Default Explanation Style
            </label>
            <select
              value={formProfile.explanationStyle}
              onChange={(e) =>
                setFormProfile({
                  ...formProfile,
                  explanationStyle: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="Simple explanation">Simple explanation</option>
              <option value="Step-by-step explanation">Step-by-step explanation</option>
              <option value="Detailed explanation">Detailed explanation</option>
              <option value="Example-based explanation">Example-based explanation</option>
              <option value="Teach me like a beginner">Teach me like a beginner</option>
              <option value="Explain in Bisaya/Cebuano">Explain in Bisaya/Cebuano</option>
              <option value="Explain in Taglish">Explain in Taglish</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subjects of Interest (comma-separated)
            </label>
            <input
              type="text"
              value={subjectsText}
              onChange={(e) => setSubjectsText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Personal Study Goals
            </label>
            <textarea
              rows={3}
              value={formProfile.studyGoals}
              onChange={(e) => setFormProfile({ ...formProfile, studyGoals: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors"
            >
              Save Learning Profile
            </button>
            {savedNotice && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Profile preferences updated.
              </span>
            )}
          </div>
        </form>

        {/* Right: Appearance Theme & Data Storage (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interface Theme */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sun className="w-4 h-4 text-sky-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Interface Workspace Theme
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Theme Mode
                </div>
                <div className="text-[11px] text-slate-500">
                  Switch between dark and light workspaces
                </div>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                    settings.theme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                    settings.theme === 'dark'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Storage & Privacy Architecture Disclosure */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-sky-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Data Storage &amp; Privacy Transparency
              </h2>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                <strong>Browser-Local Data:</strong> Your tasks, profile, mood history, and private journals are stored locally in your browser&apos;s storage.
              </li>
              <li>
                <strong>External AI Processing:</strong> Active chat messages, academic prompts, and documents you explicitly analyze are processed securely via the server-side Gemini API proxy without exposing API keys in the browser.
              </li>
              <li>
                <strong>Zero Ad Profiling:</strong> Student data is never sold or used for advertising.
              </li>
            </ul>

            <div className="pt-2">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="px-4 py-2 rounded-lg border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-500/10 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Local App Data to Defaults</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onFactoryResetAllData();
                      setConfirmReset(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-medium"
                  >
                    Confirm Full Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
