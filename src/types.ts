export type NavSection =
  | 'dashboard'
  | 'chat'
  | 'wellness'
  | 'academic'
  | 'research'
  | 'documents'
  | 'planner'
  | 'history'
  | 'settings';

export type ResponseMode =
  | 'Auto'
  | 'Comfort Mode'
  | 'Listening Mode'
  | 'Reflection Mode'
  | 'Study Mode'
  | 'Explanation Mode'
  | 'Research Mode'
  | 'Motivation Mode'
  | 'Planning Mode'
  | 'Problem-Solving Mode'
  | 'Celebration Mode'
  | 'Casual Conversation Mode';

export type AvatarState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'COMFORTING'
  | 'EXCITED'
  | 'SERIOUS';

export type MoodType =
  | 'Happy'
  | 'Calm'
  | 'Okay'
  | 'Stressed'
  | 'Anxious'
  | 'Sad'
  | 'Frustrated'
  | 'Overwhelmed'
  | 'Tired';

export interface MoodEntry {
  id: string;
  mood: MoodType;
  note: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  promptUsed?: string;
  mood?: MoodType;
  aiReflection?: string;
  timestamp: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  detectedEmotion?: string;
  activeMode?: string;
  avatarState?: AvatarState;
  suggestedFollowUps?: string[];
  attachedDocumentName?: string;
}

export interface ConversationThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface StudentDocument {
  id: string;
  name: string;
  type: string; // 'pdf' | 'txt' | 'csv' | 'docx' | 'image' | 'md'
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  textContent: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  isSample?: boolean;
  lastSummary?: string;
}

export interface StudyTask {
  id: string;
  title: string;
  category: 'Study Session' | 'Exam Prep' | 'Assignment Deadline' | 'Project Milestone' | 'Review Schedule';
  subject: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  notes?: string;
}

export interface SavedCitation {
  id: string;
  title: string;
  authors: string;
  year: string;
  sourceOrJournal: string;
  urlOrDoi: string;
  format: 'APA' | 'MLA' | 'IEEE' | 'Chicago';
  formattedReference: string;
  inTextCitation: string;
  missingFields: string[];
  createdAt: string;
}

export interface MemoryItem {
  id: string;
  category:
    | 'Learning Preferences'
    | 'Preferred Language'
    | 'Ongoing Academic Projects'
    | 'Student-Selected Goals'
    | 'Important Study Context'
    | 'User-Approved Preferences';
  content: string;
  createdAt: string;
}

export interface StudentProfile {
  name: string;
  educationLevel: string;
  course: string;
  subjectsOfInterest: string[];
  explanationStyle: string;
  preferredLanguage: 'English' | 'Filipino' | 'Bisaya/Cebuano' | 'Taglish';
  studyGoals: string;
}

export type VoicePersona =
  | 'Kore'
  | 'Aoede'
  | 'Puck'
  | 'Charon'
  | 'Fenrir'
  | 'Zephyr'
  | 'Leda'
  | 'Orus'
  | 'Calliope'
  | 'Thalia'
  | 'Apollo'
  | 'Hestia'
  | 'Hermes'
  | 'Selene'
  | 'Athena'
  | 'Atlas';

export type AvatarStyle =
  | 'nova'
  | 'sage'
  | 'solar'
  | 'nebula'
  | 'pulse'
  | 'aurora'
  | 'luna'
  | 'zenith'
  | 'cyber'
  | 'blossom'
  | 'terran';

export type HairStyle =
  | 'flowing_long'
  | 'sleek_bob'
  | 'high_ponytail'
  | 'wavy_curls'
  | 'twin_tails'
  | 'short_pixie'
  | 'space_buns'
  | 'side_braid';

export type FaceShape =
  | 'oval_classic'
  | 'heart_pointed'
  | 'round_soft'
  | 'square_sculpted';

export type EyeStyle =
  | 'almond_sparkle'
  | 'cat_winged'
  | 'gentle_doe'
  | 'focused_sharp';

export type FaceMarking =
  | 'none'
  | 'star_constellation'
  | 'blush_freckles'
  | 'cyber_lines'
  | 'sakura_petals'
  | 'moon_crest';

export type GlassesStyle = 'none' | 'round_wire' | 'cat_eye' | 'half_rim' | 'reading';

export interface VoiceOption {
  id: VoicePersona;
  name: string;
  tone: string;
  gender: 'Female' | 'Male' | 'Neutral';
  personality: string;
  bestFor: string;
  sampleText: string;
  category?: 'Gentle & Calming' | 'Academic & Scholarly' | 'Motivational & Upbeat' | 'Deep & Reflective';
}

export interface AvatarOption {
  id: AvatarStyle;
  name: string;
  title: string;
  accentColor: string;
  secondaryColor: string;
  badge: string;
  description: string;
  idealFor: string;
  category?: 'Cosmic & Classic' | 'Nature & Wellness' | 'High Energy & Tech' | 'Mystic & Quiet';
  defaultHairStyle: HairStyle;
  defaultFaceShape: FaceShape;
  defaultEyeStyle: EyeStyle;
  defaultFaceMarking: FaceMarking;
  hairStyleName: string;
  faceShapeName: string;
  eyeStyleName: string;
  faceMarkingName: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  voiceEnabled: boolean;
  autoSpeakReplies: boolean;
  selectedVoice: VoicePersona;
  selectedAvatar: AvatarStyle;
  hairStyle?: HairStyle;
  faceShape?: FaceShape;
  eyeStyle?: EyeStyle;
  faceMarking?: FaceMarking;
  speakingRate: number; // 0.75 to 1.5
  volume: number; // 0 to 1
  memoryEnabled: boolean;
  wellnessPrivateMode: boolean;
  avatarGlassesEnabled?: boolean;
  glassesStyle?: GlassesStyle;
}

export interface QuizAttemptSummary {
  id: string;
  topic: string;
  score: number;
  total: number;
  difficulty: string;
  date: string;
}
