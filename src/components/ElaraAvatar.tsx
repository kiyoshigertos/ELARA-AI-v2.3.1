import React, { useEffect, useState, useId } from 'react';
import {
  AvatarState,
  AvatarStyle,
  HairStyle,
  FaceShape,
  EyeStyle,
  FaceMarking,
  GlassesStyle,
} from '../types';

interface ElaraAvatarProps {
  state: AvatarState;
  avatarStyle?: AvatarStyle;
  hairStyle?: HairStyle;
  faceShape?: FaceShape;
  eyeStyle?: EyeStyle;
  faceMarking?: FaceMarking;
  glassesStyle?: GlassesStyle;
  audioAmplitude?: number; // 0 to 1 from live Web Audio API analyser
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
}

interface AvatarThemeConfig {
  name: string;
  badge: string;
  primary: string;
  secondary: string;
  glow: string;
  bgGrad: [string, string, string];
  hairBackGrad: [string, string, string];
  hairFrontGrad: [string, string, string];
  hairStrandColor: string;
  skinGrad: [string, string, string];
  jacketGrad: [string, string];
  irisOuter: string;
  irisInner: string;
  blushColor: string;
  defaultHairStyle: HairStyle;
  defaultFaceShape: FaceShape;
  defaultEyeStyle: EyeStyle;
  defaultFaceMarking: FaceMarking;
  earpieceType:
    | 'ring'
    | 'leaf'
    | 'fin'
    | 'orbital'
    | 'hex'
    | 'crystal'
    | 'moon'
    | 'crown_wing'
    | 'cyber_antenna'
    | 'sakura_petal'
    | 'geo_stud';
  coreEmblemType:
    | 'diamond'
    | 'clover'
    | 'sun'
    | 'crescent'
    | 'quantum'
    | 'starburst'
    | 'lunar'
    | 'apex_crest'
    | 'matrix_cube'
    | 'sakura_flower'
    | 'geo_shield';
}

const AVATAR_THEMES: Record<AvatarStyle, AvatarThemeConfig> = {
  nova: {
    name: 'Elara Nova',
    badge: 'Celestial Blue',
    primary: '#0ea5e9',
    secondary: '#38bdf8',
    glow: 'rgba(14, 165, 233, 0.28)',
    bgGrad: ['#0b1329', '#1e293b', '#0f172a'],
    hairBackGrad: ['#090d16', '#0f172a', '#1e3a8a'],
    hairFrontGrad: ['#0f172a', '#1e293b', '#2563eb'],
    hairStrandColor: '#38bdf8',
    skinGrad: ['#fff7ed', '#ffedd5', '#fed7aa'],
    jacketGrad: ['#1e293b', '#0f172a'],
    irisOuter: '#0284c7',
    irisInner: '#38bdf8',
    blushColor: '#fb7185',
    defaultHairStyle: 'flowing_long',
    defaultFaceShape: 'oval_classic',
    defaultEyeStyle: 'almond_sparkle',
    defaultFaceMarking: 'star_constellation',
    earpieceType: 'ring',
    coreEmblemType: 'diamond',
  },
  sage: {
    name: 'Elara Sage',
    badge: 'Mindful Emerald',
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.28)',
    bgGrad: ['#022c22', '#064e3b', '#0f291e'],
    hairBackGrad: ['#022c22', '#064e3b', '#047857'],
    hairFrontGrad: ['#064e3b', '#065f46', '#059669'],
    hairStrandColor: '#34d399',
    skinGrad: ['#fffbf5', '#fef3c7', '#fde68a'],
    jacketGrad: ['#064e3b', '#022c22'],
    irisOuter: '#059669',
    irisInner: '#34d399',
    blushColor: '#f43f5e',
    defaultHairStyle: 'side_braid',
    defaultFaceShape: 'heart_pointed',
    defaultEyeStyle: 'gentle_doe',
    defaultFaceMarking: 'blush_freckles',
    earpieceType: 'leaf',
    coreEmblemType: 'clover',
  },
  solar: {
    name: 'Elara Solar',
    badge: 'Radiant Amber',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.3)',
    bgGrad: ['#2e1005', '#451a03', '#1c0c04'],
    hairBackGrad: ['#291305', '#451a03', '#92400e'],
    hairFrontGrad: ['#451a03', '#78350f', '#d97706'],
    hairStrandColor: '#fbbf24',
    skinGrad: ['#fff7ed', '#fed7aa', '#fdba74'],
    jacketGrad: ['#451a03', '#1c0c04'],
    irisOuter: '#d97706',
    irisInner: '#fcd34d',
    blushColor: '#f87171',
    defaultHairStyle: 'high_ponytail',
    defaultFaceShape: 'square_sculpted',
    defaultEyeStyle: 'focused_sharp',
    defaultFaceMarking: 'none',
    earpieceType: 'fin',
    coreEmblemType: 'sun',
  },
  nebula: {
    name: 'Elara Nebula',
    badge: 'Cosmic Violet',
    primary: '#8b5cf6',
    secondary: '#c4b5fd',
    glow: 'rgba(139, 92, 246, 0.3)',
    bgGrad: ['#17072e', '#2e1065', '#0f0521'],
    hairBackGrad: ['#17072e', '#2e1065', '#581c87'],
    hairFrontGrad: ['#2e1065', '#4c1d95', '#7c3aed'],
    hairStrandColor: '#c4b5fd',
    skinGrad: ['#faf5ff', '#f3e8ff', '#e9d5ff'],
    jacketGrad: ['#2e1065', '#130424'],
    irisOuter: '#7c3aed',
    irisInner: '#c4b5fd',
    blushColor: '#f472b6',
    defaultHairStyle: 'space_buns',
    defaultFaceShape: 'round_soft',
    defaultEyeStyle: 'almond_sparkle',
    defaultFaceMarking: 'moon_crest',
    earpieceType: 'orbital',
    coreEmblemType: 'crescent',
  },
  pulse: {
    name: 'Elara Pulse',
    badge: 'Cyber Neon Coral',
    primary: '#ec4899',
    secondary: '#f43f5e',
    glow: 'rgba(236, 72, 153, 0.3)',
    bgGrad: ['#240311', '#500724', '#14020a'],
    hairBackGrad: ['#1f0412', '#4c0519', '#831843'],
    hairFrontGrad: ['#500724', '#881337', '#be123c'],
    hairStrandColor: '#f43f5e',
    skinGrad: ['#fff1f2', '#ffe4e6', '#fecdd3'],
    jacketGrad: ['#3b071a', '#17010a'],
    irisOuter: '#e11d48',
    irisInner: '#fb7185',
    blushColor: '#fb7185',
    defaultHairStyle: 'sleek_bob',
    defaultFaceShape: 'heart_pointed',
    defaultEyeStyle: 'cat_winged',
    defaultFaceMarking: 'cyber_lines',
    earpieceType: 'hex',
    coreEmblemType: 'quantum',
  },
  aurora: {
    name: 'Elara Aurora',
    badge: 'Northern Aurora',
    primary: '#06b6d4',
    secondary: '#2dd4bf',
    glow: 'rgba(6, 182, 212, 0.32)',
    bgGrad: ['#042f2e', '#134e4a', '#061c1b'],
    hairBackGrad: ['#042f2e', '#0f766e', '#0d9488'],
    hairFrontGrad: ['#0f766e', '#14b8a6', '#2dd4bf'],
    hairStrandColor: '#5eead4',
    skinGrad: ['#f0fdfa', '#ccfbf1', '#99f6e4'],
    jacketGrad: ['#0f766e', '#042f2e'],
    irisOuter: '#0891b2',
    irisInner: '#22d3ee',
    blushColor: '#2dd4bf',
    defaultHairStyle: 'wavy_curls',
    defaultFaceShape: 'oval_classic',
    defaultEyeStyle: 'gentle_doe',
    defaultFaceMarking: 'star_constellation',
    earpieceType: 'crystal',
    coreEmblemType: 'starburst',
  },
  luna: {
    name: 'Elara Luna',
    badge: 'Lunar Mystic',
    primary: '#6366f1',
    secondary: '#a5b4fc',
    glow: 'rgba(99, 102, 241, 0.3)',
    bgGrad: ['#0f0e26', '#1e1b4b', '#08081a'],
    hairBackGrad: ['#0f0e26', '#1e1b4b', '#312e81'],
    hairFrontGrad: ['#1e1b4b', '#3730a3', '#4f46e5'],
    hairStrandColor: '#c7d2fe',
    skinGrad: ['#f5f3ff', '#ede9fe', '#ddd6fe'],
    jacketGrad: ['#1e1b4b', '#0b0a1d'],
    irisOuter: '#4f46e5',
    irisInner: '#818cf8',
    blushColor: '#a78bfa',
    defaultHairStyle: 'twin_tails',
    defaultFaceShape: 'round_soft',
    defaultEyeStyle: 'cat_winged',
    defaultFaceMarking: 'moon_crest',
    earpieceType: 'moon',
    coreEmblemType: 'lunar',
  },
  zenith: {
    name: 'Elara Zenith',
    badge: 'Royal Apex',
    primary: '#d97706',
    secondary: '#f59e0b',
    glow: 'rgba(217, 119, 6, 0.32)',
    bgGrad: ['#2a0a0a', '#450a0a', '#1a0404'],
    hairBackGrad: ['#2b0d05', '#451a03', '#78350f'],
    hairFrontGrad: ['#451a03', '#78350f', '#b45309'],
    hairStrandColor: '#fbbf24',
    skinGrad: ['#fffbeb', '#fef3c7', '#fde68a'],
    jacketGrad: ['#450a0a', '#1f0404'],
    irisOuter: '#b45309',
    irisInner: '#f59e0b',
    blushColor: '#fb7185',
    defaultHairStyle: 'high_ponytail',
    defaultFaceShape: 'square_sculpted',
    defaultEyeStyle: 'focused_sharp',
    defaultFaceMarking: 'none',
    earpieceType: 'crown_wing',
    coreEmblemType: 'apex_crest',
  },
  cyber: {
    name: 'Elara Cyber',
    badge: 'Cyber Matrix',
    primary: '#84cc16',
    secondary: '#a3e635',
    glow: 'rgba(132, 204, 22, 0.35)',
    bgGrad: ['#021202', '#052e05', '#010a01'],
    hairBackGrad: ['#021202', '#052e05', '#166534'],
    hairFrontGrad: ['#052e05', '#166534', '#15803d'],
    hairStrandColor: '#bef264',
    skinGrad: ['#f7fee7', '#ecfccb', '#d9f99d'],
    jacketGrad: ['#052e05', '#021202'],
    irisOuter: '#4d7c0f',
    irisInner: '#84cc16',
    blushColor: '#a3e635',
    defaultHairStyle: 'short_pixie',
    defaultFaceShape: 'heart_pointed',
    defaultEyeStyle: 'focused_sharp',
    defaultFaceMarking: 'cyber_lines',
    earpieceType: 'cyber_antenna',
    coreEmblemType: 'matrix_cube',
  },
  blossom: {
    name: 'Elara Blossom',
    badge: 'Spring Blossom',
    primary: '#f43f5e',
    secondary: '#fda4af',
    glow: 'rgba(244, 63, 94, 0.28)',
    bgGrad: ['#270511', '#4c0519', '#1a030b'],
    hairBackGrad: ['#270511', '#4c0519', '#881337'],
    hairFrontGrad: ['#4c0519', '#9f1239', '#e11d48'],
    hairStrandColor: '#fecdd3',
    skinGrad: ['#fff1f2', '#ffe4e6', '#fecdd3'],
    jacketGrad: ['#4c0519', '#1e030b'],
    irisOuter: '#be123c',
    irisInner: '#fb7185',
    blushColor: '#f43f5e',
    defaultHairStyle: 'wavy_curls',
    defaultFaceShape: 'round_soft',
    defaultEyeStyle: 'gentle_doe',
    defaultFaceMarking: 'sakura_petals',
    earpieceType: 'sakura_petal',
    coreEmblemType: 'sakura_flower',
  },
  terran: {
    name: 'Elara Terran',
    badge: 'Earth Amber',
    primary: '#ea580c',
    secondary: '#ca8a04',
    glow: 'rgba(234, 88, 12, 0.28)',
    bgGrad: ['#1c1005', '#331a08', '#110a03'],
    hairBackGrad: ['#1c1005', '#38220a', '#57330d'],
    hairFrontGrad: ['#38220a', '#57330d', '#7c4613'],
    hairStrandColor: '#f59e0b',
    skinGrad: ['#fefce8', '#fef08a', '#fde047'],
    jacketGrad: ['#331a08', '#140b03'],
    irisOuter: '#9a3412',
    irisInner: '#d97706',
    blushColor: '#f97316',
    defaultHairStyle: 'sleek_bob',
    defaultFaceShape: 'square_sculpted',
    defaultEyeStyle: 'almond_sparkle',
    defaultFaceMarking: 'blush_freckles',
    earpieceType: 'geo_stud',
    coreEmblemType: 'geo_shield',
  },
};

export const ElaraAvatar: React.FC<ElaraAvatarProps> = ({
  state,
  avatarStyle = 'nova',
  hairStyle,
  faceShape,
  eyeStyle,
  faceMarking,
  glassesStyle,
  audioAmplitude = 0,
  size = 'md',
  showLabel = true,
  onClick,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const [isBlinking, setIsBlinking] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const [synthMouthCycle, setSynthMouthCycle] = useState(0);

  const theme = AVATAR_THEMES[avatarStyle] || AVATAR_THEMES.nova;
  const effectiveHairStyle: HairStyle = hairStyle || theme.defaultHairStyle || 'flowing_long';
  const effectiveFaceShape: FaceShape = faceShape || theme.defaultFaceShape || 'oval_classic';
  const effectiveEyeStyle: EyeStyle = eyeStyle || theme.defaultEyeStyle || 'almond_sparkle';
  const effectiveFaceMarking: FaceMarking =
    faceMarking !== undefined ? faceMarking : theme.defaultFaceMarking || 'none';
  const effectiveGlasses: GlassesStyle = glassesStyle || 'none';

  // Natural blinking with occasional double-blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 130);
    }, 3600);
    return () => clearInterval(blinkInterval);
  }, []);

  // Gentle breathing and head motion cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setBreathPhase((prev) => (prev + 1) % 120);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Fallback speaking mouth cadence when state === 'SPEAKING'
  useEffect(() => {
    if (state !== 'SPEAKING') {
      setSynthMouthCycle(0);
      return;
    }
    const mouthInterval = setInterval(() => {
      setSynthMouthCycle(Math.random() * 0.65 + 0.18);
    }, 95);
    return () => clearInterval(mouthInterval);
  }, [state]);

  const dimensions = {
    xs: 'w-9 h-9',
    sm: 'w-12 h-12',
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    lg: 'w-32 h-32 sm:w-40 sm:h-40',
    xl: 'w-44 h-44 sm:w-52 sm:h-52',
    responsive: 'w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44',
  }[size];

  // Smooth compositor-safe transforms
  const angle = (breathPhase / 120) * Math.PI * 2;
  const breathOffset = Math.sin(angle) * (state === 'EXCITED' ? 3.2 : 1.8);
  const headTilt =
    state === 'LISTENING'
      ? -2.8
      : state === 'COMFORTING'
      ? 2.4
      : state === 'SPEAKING'
      ? Math.sin(angle * 2) * 1.6
      : Math.cos(angle) * 0.8;

  const effectiveOpenness =
    state === 'SPEAKING'
      ? Math.max(audioAmplitude, synthMouthCycle)
      : state === 'EXCITED'
      ? 0.35
      : 0;

  // State-specific colors combined with the avatar's custom theme
  const stateAccent = {
    IDLE: {
      primary: theme.primary,
      secondary: theme.secondary,
      glow: theme.glow,
      label: `${theme.name} · Ready`,
    },
    LISTENING: {
      primary: '#10b981',
      secondary: '#34d399',
      glow: 'rgba(16, 185, 129, 0.32)',
      label: `${theme.name} · Listening`,
    },
    THINKING: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.3)',
      label: `${theme.name} · Thinking`,
    },
    SPEAKING: {
      primary: theme.primary,
      secondary: theme.secondary,
      glow: theme.glow,
      label: `${theme.name} · Speaking`,
    },
    COMFORTING: {
      primary: '#14b8a6',
      secondary: '#2dd4bf',
      glow: 'rgba(20, 184, 166, 0.3)',
      label: `${theme.name} · Comfort Mode`,
    },
    EXCITED: {
      primary: '#f59e0b',
      secondary: '#fcd34d',
      glow: 'rgba(245, 158, 11, 0.35)',
      label: `${theme.name} · Celebrating`,
    },
    SERIOUS: {
      primary: theme.primary,
      secondary: theme.secondary,
      glow: theme.glow,
      label: `${theme.name} · Focused`,
    },
  }[state];

  const eyeScaleY = isBlinking
    ? 0.08
    : state === 'COMFORTING'
    ? 0.86
    : state === 'EXCITED'
    ? 1.1
    : 1;

  // Equalizer bars for speaking/listening visual feedback
  const waveBars = [0.45, 0.85, 1.0, 0.75, 0.5];

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`relative ${dimensions} aspect-square shrink-0 rounded-full flex items-center justify-center transition-transform duration-200 ${
          onClick
            ? 'cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-sky-500'
            : ''
        }`}
        style={{
          background: `radial-gradient(circle at 50% 42%, ${stateAccent.glow} 0%, transparent 72%)`,
        }}
        title={`ELARA AI — ${theme.name} (${stateAccent.label})`}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full block"
          aria-label={`${theme.name} animated avatar in ${state} state`}
        >
          <defs>
            <clipPath id={`avatarClip-${uid}`}>
              <circle cx="100" cy="100" r="88" />
            </clipPath>
            <linearGradient id={`bgGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.bgGrad[0]} />
              <stop offset="55%" stopColor={theme.bgGrad[1]} />
              <stop offset="100%" stopColor={theme.bgGrad[2]} />
            </linearGradient>
            <linearGradient id={`hairBackGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.hairBackGrad[0]} />
              <stop offset="50%" stopColor={theme.hairBackGrad[1]} />
              <stop offset="100%" stopColor={theme.hairBackGrad[2]} />
            </linearGradient>
            <linearGradient id={`hairFrontGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.hairFrontGrad[0]} />
              <stop offset="60%" stopColor={theme.hairFrontGrad[1]} />
              <stop offset="100%" stopColor={theme.hairFrontGrad[2]} />
            </linearGradient>
            <linearGradient id={`skinGrad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.skinGrad[0]} />
              <stop offset="65%" stopColor={theme.skinGrad[1]} />
              <stop offset="100%" stopColor={theme.skinGrad[2]} />
            </linearGradient>
            <linearGradient id={`jacketGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.jacketGrad[0]} />
              <stop offset="100%" stopColor={theme.jacketGrad[1]} />
            </linearGradient>
          </defs>

          {/* Outer Dynamic Audio/Status Halo Ring */}
          <circle
            cx="100"
            cy="100"
            r="93"
            fill="none"
            stroke={stateAccent.primary}
            strokeWidth={state === 'SPEAKING' || state === 'LISTENING' ? '2.5' : '1.5'}
            strokeDasharray={
              state === 'THINKING'
                ? '14 8'
                : state === 'LISTENING'
                ? '6 6'
                : 'none'
            }
            opacity={state === 'IDLE' ? 0.45 : 0.85}
            style={{
              transformOrigin: '100px 100px',
              transform: `scale(${1 + effectiveOpenness * 0.045}) rotate(${
                state === 'THINKING' ? breathPhase * 3 : 0
              }deg)`,
            }}
          />

          {/* Secondary subtle pulse ring when speaking or listening */}
          {(state === 'SPEAKING' || state === 'LISTENING') && (
            <circle
              cx="100"
              cy="100"
              r={95 + effectiveOpenness * 4}
              fill="none"
              stroke={stateAccent.secondary}
              strokeWidth="1"
              opacity={0.35 + effectiveOpenness * 0.4}
            />
          )}

          {/* Circular Avatar Stage */}
          <g clipPath={`url(#avatarClip-${uid})`}>
            {/* Stage Backdrop */}
            <circle cx="100" cy="100" r="88" fill={`url(#bgGrad-${uid})`} />

            {/* Ambient Halo Glow behind head */}
            <circle
              cx="100"
              cy="88"
              r="58"
              fill={stateAccent.primary}
              opacity={0.16 + effectiveOpenness * 0.14}
            />

            {/* Animated Character Container */}
            <g
              style={{
                transformOrigin: '100px 120px',
                transform: `translateY(${breathOffset}px) rotate(${headTilt}deg)`,
                transition: 'transform 100ms ease-out',
              }}
            >
              {/* Back Hair Styles (8 Varied Silhouettes) */}
              {effectiveHairStyle === 'flowing_long' && (
                <path
                  d="M44 82 C40 32, 160 32, 156 82 C160 122, 166 154, 148 175 C124 185, 76 185, 52 175 C34 154, 40 122, 44 82 Z"
                  fill={`url(#hairBackGrad-${uid})`}
                />
              )}
              {effectiveHairStyle === 'sleek_bob' && (
                <path
                  d="M46 80 C44 38, 156 38, 154 80 C154 116, 146 138, 132 144 C112 148, 88 148, 68 144 C54 138, 46 116, 46 80 Z"
                  fill={`url(#hairBackGrad-${uid})`}
                />
              )}
              {effectiveHairStyle === 'high_ponytail' && (
                <g>
                  {/* High Ponytail Arched Tail Sweeping Behind */}
                  <path
                    d="M106 38 C122 12, 150 16, 170 42 C180 66, 174 98, 154 124 C164 96, 160 58, 140 40 C128 30, 114 34, 106 38 Z"
                    fill={`url(#hairBackGrad-${uid})`}
                  />
                  {/* Glowing Energy Ribbon / Scrunchie */}
                  <ellipse
                    cx="112"
                    cy="38"
                    rx="6"
                    ry="3.5"
                    fill={stateAccent.secondary}
                    stroke={stateAccent.primary}
                    strokeWidth="1.2"
                    transform="rotate(-25 112 38)"
                  />
                  {/* Base Nape Cap */}
                  <path
                    d="M48 78 C46 44, 154 44, 152 78 C152 108, 144 122, 134 128 C116 132, 84 132, 66 128 C56 122, 48 108, 48 78 Z"
                    fill={`url(#hairBackGrad-${uid})`}
                  />
                </g>
              )}
              {effectiveHairStyle === 'wavy_curls' && (
                <g>
                  <path
                    d="M38 78 C34 32, 166 32, 162 78 C170 105, 172 130, 162 152 C154 168, 144 180, 130 184 C114 187, 86 187, 70 184 C56 180, 46 168, 38 152 C28 130, 30 105, 38 78 Z"
                    fill={`url(#hairBackGrad-${uid})`}
                  />
                  {/* Bouncy layered curl side waves */}
                  <path
                    d="M36 100 Q26 122 36 142 Q44 160 56 172"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="1.8"
                    opacity="0.6"
                  />
                  <path
                    d="M164 100 Q174 122 164 142 Q156 160 144 172"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="1.8"
                    opacity="0.6"
                  />
                </g>
              )}
              {effectiveHairStyle === 'twin_tails' && (
                <g>
                  {/* Left Flowing Pigtail */}
                  <path
                    d="M46 66 C24 70, 14 94, 18 126 C22 150, 32 172, 42 182 C34 158, 32 132, 36 108 C38 90, 42 76, 46 66 Z"
                    fill={`url(#hairBackGrad-${uid})`}
                  />
                  {/* Right Flowing Pigtail */}
                  <path
                    d="M154 66 C176 70, 186 94, 182 126 C178 150, 168 172, 158 182 C166 158, 168 132, 164 108 C162 90, 158 76, 154 66 Z"
                    fill={`url(#hairBackGrad-${uid})`}
                  />
                  {/* Left Twin-Tail Glowing Ribbon */}
                  <ellipse
                    cx="44"
                    cy="68"
                    rx="4.5"
                    ry="2.8"
                    fill={stateAccent.secondary}
                    stroke={stateAccent.primary}
                    strokeWidth="1"
                    transform="rotate(-20 44 68)"
                  />
                  {/* Right Twin-Tail Glowing Ribbon */}
                  <ellipse
                    cx="156"
                    cy="68"
                    rx="4.5"
                    ry="2.8"
                    fill={stateAccent.secondary}
                    stroke={stateAccent.primary}
                    strokeWidth="1"
                    transform="rotate(20 156 68)"
                  />
                  {/* Base Head Cap */}
                  <path
                    d="M48 78 C46 44, 154 44, 152 78 C152 108, 142 122, 132 128 C114 132, 86 132, 68 128 C58 122, 48 108, 48 78 Z"
                    fill={`url(#hairBackGrad-${uid})`}
                  />
                </g>
              )}
              {effectiveHairStyle === 'short_pixie' && (
                <path
                  d="M48 76 C46 40, 154 40, 152 76 C152 98, 144 116, 130 124 C112 128, 88 128, 70 124 C56 116, 48 98, 48 76 Z"
                  fill={`url(#hairBackGrad-${uid})`}
                />
              )}
              {effectiveHairStyle === 'space_buns' && (
                <g>
                  {/* Left Space Bun Sphere */}
                  <circle cx="48" cy="40" r="16" fill={`url(#hairBackGrad-${uid})`} />
                  <ellipse
                    cx="48"
                    cy="40"
                    rx="14"
                    ry="6"
                    fill="none"
                    stroke={stateAccent.secondary}
                    strokeWidth="1.2"
                    transform="rotate(-25 48 40)"
                  />
                  {/* Right Space Bun Sphere */}
                  <circle cx="152" cy="40" r="16" fill={`url(#hairBackGrad-${uid})`} />
                  <ellipse
                    cx="152"
                    cy="40"
                    rx="14"
                    ry="6"
                    fill="none"
                    stroke={stateAccent.secondary}
                    strokeWidth="1.2"
                    transform="rotate(25 152 40)"
                  />
                  {/* Base Head Cap */}
                  <path
                    d="M48 78 C46 44, 154 44, 152 78 C152 110, 142 126, 130 132 C112 136, 88 136, 70 132 C58 126, 48 110, 48 78 Z"
                    fill={`url(#hairBackGrad-${uid})`}
                  />
                </g>
              )}
              {effectiveHairStyle === 'side_braid' && (
                <g>
                  {/* Base Cap */}
                  <path
                    d="M46 78 C44 42, 156 42, 154 78 C154 114, 148 138, 136 150 C128 160, 118 174, 122 188 C112 184, 104 172, 106 158 C100 152, 80 148, 66 142 C52 134, 46 112, 46 78 Z"
                    fill={`url(#hairBackGrad-${uid})`}
                  />
                  {/* Interlocking Woven Braid Segments Over Shoulder */}
                  <ellipse cx="120" cy="154" rx="7" ry="5.5" fill={`url(#hairFrontGrad-${uid})`} transform="rotate(30 120 154)" />
                  <ellipse cx="126" cy="164" rx="6.5" ry="5" fill={`url(#hairBackGrad-${uid})`} transform="rotate(-25 126 164)" />
                  <ellipse cx="124" cy="174" rx="6" ry="4.5" fill={`url(#hairFrontGrad-${uid})`} transform="rotate(20 124 174)" />
                  <circle cx="123" cy="182" r="3" fill={stateAccent.secondary} />
                </g>
              )}

              {/* Neck & Shadow */}
              <rect x="86" y="132" width="28" height="28" rx="10" fill="#fdba74" />
              <path d="M86 136 Q100 146 114 136 L114 146 L86 146 Z" fill="#f97316" opacity="0.22" />

              {/* Futuristic Student Academy Jacket & Collar */}
              <path
                d="M36 196 C44 156, 70 148, 100 148 C130 148, 156 156, 164 196 Z"
                fill={`url(#jacketGrad-${uid})`}
                stroke={stateAccent.primary}
                strokeWidth="1.8"
              />
              {/* Inner Shirt & Glowing Companion Core */}
              <path d="M80 148 L100 174 L120 148 Z" fill="#f8fafc" />

              {/* Custom Persona Core Emblem */}
              {theme.coreEmblemType === 'diamond' && (
                <>
                  <polygon points="100,156 108,166 100,176 92,166" fill={stateAccent.primary} />
                  <polygon points="100,159 104,166 100,173 96,166" fill="#ffffff" opacity="0.75" />
                </>
              )}
              {theme.coreEmblemType === 'clover' && (
                <g transform="translate(100, 166) scale(0.85)">
                  <circle cx="-4" cy="-4" r="3.5" fill={stateAccent.primary} />
                  <circle cx="4" cy="-4" r="3.5" fill={stateAccent.primary} />
                  <circle cx="-4" cy="4" r="3.5" fill={stateAccent.primary} />
                  <circle cx="4" cy="4" r="3.5" fill={stateAccent.primary} />
                  <circle cx="0" cy="0" r="2.2" fill="#ffffff" opacity="0.8" />
                </g>
              )}
              {theme.coreEmblemType === 'sun' && (
                <g transform="translate(100, 166) scale(0.9)">
                  <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill={stateAccent.primary} />
                  <circle cx="0" cy="0" r="3" fill="#ffffff" opacity="0.8" />
                </g>
              )}
              {theme.coreEmblemType === 'crescent' && (
                <g transform="translate(100, 166) scale(0.85)">
                  <path d="M-5 -6 A6 6 0 1 0 5 6 A5 5 0 1 1 -5 -6 Z" fill={stateAccent.primary} />
                  <polygon points="3,-2 4,1 1,2 2,-1" fill="#ffffff" opacity="0.85" />
                </g>
              )}
              {theme.coreEmblemType === 'quantum' && (
                <g transform="translate(100, 166) scale(0.85)">
                  <polygon points="-6,-3 0,-7 6,-3 6,4 0,8 -6,4" fill={stateAccent.primary} />
                  <polygon points="-3,-1 0,-3 3,-1 3,2 0,4 -3,2" fill="#ffffff" opacity="0.85" />
                </g>
              )}
              {theme.coreEmblemType === 'starburst' && (
                <g transform="translate(100, 166) scale(0.85)">
                  <polygon points="0,-9 2.5,-3 8.5,-3 4,1 6,7 0,3.5 -6,7 -4,1 -8.5,-3 -2.5,-3" fill={stateAccent.primary} />
                  <circle cx="0" cy="0" r="2.8" fill="#ffffff" opacity="0.9" />
                </g>
              )}
              {theme.coreEmblemType === 'lunar' && (
                <g transform="translate(100, 166) scale(0.85)">
                  <circle cx="0" cy="0" r="6.5" fill="none" stroke={stateAccent.primary} strokeWidth="1.5" />
                  <circle cx="-1" cy="0" r="4.5" fill={stateAccent.secondary} />
                  <circle cx="1" cy="-1" r="1.5" fill="#ffffff" opacity="0.9" />
                </g>
              )}
              {theme.coreEmblemType === 'apex_crest' && (
                <g transform="translate(100, 166) scale(0.85)">
                  <polygon points="0,-8 7,-4 5,5 0,8 -5,5 -7,-4" fill={stateAccent.primary} stroke="#ffffff" strokeWidth="0.8" />
                  <polygon points="0,-5 4,-2 3,3 0,5 -3,3 -4,-2" fill={theme.secondary} />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>
              )}
              {theme.coreEmblemType === 'matrix_cube' && (
                <g transform="translate(100, 166) scale(0.85)">
                  <polygon points="0,-7 6,-3.5 0,0 -6,-3.5" fill={stateAccent.secondary} opacity="0.9" />
                  <polygon points="-6,-3.5 0,0 0,7 -6,3.5" fill={stateAccent.primary} />
                  <polygon points="6,-3.5 0,0 0,7 6,3.5" fill={stateAccent.primary} opacity="0.75" />
                  <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
                </g>
              )}
              {theme.coreEmblemType === 'sakura_flower' && (
                <g transform="translate(100, 166) scale(0.85)">
                  {[0, 72, 144, 216, 288].map((rot) => (
                    <ellipse
                      key={rot}
                      cx="0"
                      cy="-4.5"
                      rx="2.6"
                      ry="4"
                      fill={stateAccent.primary}
                      transform={`rotate(${rot})`}
                    />
                  ))}
                  <circle cx="0" cy="0" r="2.8" fill="#ffffff" />
                  <circle cx="0" cy="0" r="1.4" fill={theme.blushColor} />
                </g>
              )}
              {theme.coreEmblemType === 'geo_shield' && (
                <g transform="translate(100, 166) scale(0.85)">
                  <polygon points="0,-7 6,-3.5 6,3.5 0,7 -6,3.5 -6,-3.5" fill={stateAccent.primary} />
                  <polygon points="0,-4 3.5,-2 3.5,2 0,4 -3.5,2 -3.5,-2" fill="#ffffff" opacity="0.8" />
                </g>
              )}

              {/* Jacket Lapel Accent Lines */}
              <path
                d="M66 156 L84 186 M134 156 L116 186"
                stroke={stateAccent.secondary}
                strokeWidth="1.5"
                opacity="0.6"
                strokeLinecap="round"
              />

              {/* Custom Transceivers / Headset based on Persona */}
              {theme.earpieceType === 'ring' && (
                <g>
                  <rect x="42" y="86" width="10" height="26" rx="5" fill="#1e293b" stroke={stateAccent.primary} strokeWidth="1.8" />
                  <circle cx="47" cy="99" r="2.5" fill={stateAccent.secondary} opacity={state === 'LISTENING' || state === 'SPEAKING' ? 1 : 0.6} />
                  <rect x="148" y="86" width="10" height="26" rx="5" fill="#1e293b" stroke={stateAccent.primary} strokeWidth="1.8" />
                  <circle cx="153" cy="99" r="2.5" fill={stateAccent.secondary} opacity={state === 'LISTENING' || state === 'SPEAKING' ? 1 : 0.6} />
                </g>
              )}
              {theme.earpieceType === 'leaf' && (
                <g>
                  <path d="M42 90 C36 84, 38 108, 48 102 Z" fill="#047857" stroke={stateAccent.primary} strokeWidth="1.4" />
                  <circle cx="46" cy="96" r="2.5" fill={theme.secondary} />
                  <path d="M158 90 C164 84, 162 108, 152 102 Z" fill="#047857" stroke={stateAccent.primary} strokeWidth="1.4" />
                  <circle cx="154" cy="96" r="2.5" fill={theme.secondary} />
                </g>
              )}
              {theme.earpieceType === 'fin' && (
                <g>
                  <polygon points="40,84 48,92 48,106 38,98" fill="#78350f" stroke={stateAccent.primary} strokeWidth="1.6" />
                  <polygon points="160,84 152,92 152,106 162,98" fill="#78350f" stroke={stateAccent.primary} strokeWidth="1.6" />
                </g>
              )}
              {theme.earpieceType === 'orbital' && (
                <g>
                  <ellipse cx="46" cy="98" rx="6" ry="12" fill="none" stroke={stateAccent.primary} strokeWidth="1.6" />
                  <circle cx="46" cy="92" r="2" fill={theme.secondary} />
                  <ellipse cx="154" cy="98" rx="6" ry="12" fill="none" stroke={stateAccent.primary} strokeWidth="1.6" />
                  <circle cx="154" cy="92" r="2" fill={theme.secondary} />
                </g>
              )}
              {theme.earpieceType === 'hex' && (
                <g>
                  <polygon points="41,90 49,86 49,106 41,102" fill="#881337" stroke={stateAccent.primary} strokeWidth="1.6" />
                  <line x1="43" y1="94" x2="47" y2="94" stroke="#ffffff" strokeWidth="1.2" />
                  <line x1="43" y1="98" x2="47" y2="98" stroke="#ffffff" strokeWidth="1.2" />
                  <polygon points="159,90 151,86 151,106 159,102" fill="#881337" stroke={stateAccent.primary} strokeWidth="1.6" />
                  <line x1="157" y1="94" x2="153" y2="94" stroke="#ffffff" strokeWidth="1.2" />
                  <line x1="157" y1="98" x2="153" y2="98" stroke="#ffffff" strokeWidth="1.2" />
                </g>
              )}
              {theme.earpieceType === 'crystal' && (
                <g>
                  <polygon points="41,88 47,82 49,102 43,106" fill="#0f766e" stroke={stateAccent.primary} strokeWidth="1.5" />
                  <circle cx="45" cy="94" r="2" fill="#ffffff" />
                  <polygon points="159,88 153,82 151,102 157,106" fill="#0f766e" stroke={stateAccent.primary} strokeWidth="1.5" />
                  <circle cx="155" cy="94" r="2" fill="#ffffff" />
                </g>
              )}
              {theme.earpieceType === 'moon' && (
                <g>
                  <path d="M42 90 A6 6 0 0 0 46 104 A5 5 0 0 1 42 90 Z" fill={stateAccent.secondary} stroke={stateAccent.primary} strokeWidth="1.2" />
                  <circle cx="45" cy="88" r="2" fill="#ffffff" />
                  <path d="M158 90 A6 6 0 0 1 154 104 A5 5 0 0 0 158 90 Z" fill={stateAccent.secondary} stroke={stateAccent.primary} strokeWidth="1.2" />
                  <circle cx="155" cy="88" r="2" fill="#ffffff" />
                </g>
              )}
              {theme.earpieceType === 'crown_wing' && (
                <g>
                  <polygon points="38,84 48,88 46,104 36,96" fill="#78350f" stroke={stateAccent.primary} strokeWidth="1.6" />
                  <circle cx="43" cy="94" r="2.2" fill="#fbbf24" />
                  <polygon points="162,84 152,88 154,104 164,96" fill="#78350f" stroke={stateAccent.primary} strokeWidth="1.6" />
                  <circle cx="157" cy="94" r="2.2" fill="#fbbf24" />
                </g>
              )}
              {theme.earpieceType === 'cyber_antenna' && (
                <g>
                  <line x1="48" y1="96" x2="38" y2="82" stroke={stateAccent.primary} strokeWidth="2" strokeLinecap="round" />
                  <circle cx="38" cy="82" r="3" fill={stateAccent.secondary} />
                  <line x1="152" y1="96" x2="162" y2="82" stroke={stateAccent.primary} strokeWidth="2" strokeLinecap="round" />
                  <circle cx="162" cy="82" r="3" fill={stateAccent.secondary} />
                </g>
              )}
              {theme.earpieceType === 'sakura_petal' && (
                <g>
                  <ellipse cx="44" cy="95" rx="5" ry="3.5" fill="#fda4af" stroke={stateAccent.primary} strokeWidth="1.2" transform="rotate(-25 44 95)" />
                  <circle cx="46" cy="94" r="1.8" fill="#ffffff" />
                  <ellipse cx="156" cy="95" rx="5" ry="3.5" fill="#fda4af" stroke={stateAccent.primary} strokeWidth="1.2" transform="rotate(25 156 95)" />
                  <circle cx="154" cy="94" r="1.8" fill="#ffffff" />
                </g>
              )}
              {theme.earpieceType === 'geo_stud' && (
                <g>
                  <polygon points="42,92 48,88 48,102 42,98" fill="#9a3412" stroke={stateAccent.primary} strokeWidth="1.5" />
                  <polygon points="158,92 152,88 152,102 158,98" fill="#9a3412" stroke={stateAccent.primary} strokeWidth="1.5" />
                </g>
              )}

              {/* Face Contour Shapes (4 Expressive Facial Silhouettes) */}
              {effectiveFaceShape === 'oval_classic' && (
                <path
                  d="M55 78 C55 44, 145 44, 145 78 C145 114, 124 140, 100 140 C76 140, 55 114, 55 78 Z"
                  fill={`url(#skinGrad-${uid})`}
                />
              )}
              {effectiveFaceShape === 'heart_pointed' && (
                <path
                  d="M54 74 C54 42, 146 42, 146 74 C148 104, 120 134, 100 143 C80 134, 52 104, 54 74 Z"
                  fill={`url(#skinGrad-${uid})`}
                />
              )}
              {effectiveFaceShape === 'round_soft' && (
                <path
                  d="M52 82 C52 46, 148 46, 148 82 C148 116, 130 138, 100 138 C70 138, 52 116, 52 82 Z"
                  fill={`url(#skinGrad-${uid})`}
                />
              )}
              {effectiveFaceShape === 'square_sculpted' && (
                <path
                  d="M54 76 C54 44, 146 44, 146 76 C146 110, 136 128, 116 139 C106 142, 94 142, 84 139 C64 128, 54 110, 54 76 Z"
                  fill={`url(#skinGrad-${uid})`}
                />
              )}

              {/* Warm Cheek Blushes */}
              <ellipse
                cx="70"
                cy={effectiveFaceShape === 'round_soft' ? 108 : 106}
                rx={effectiveFaceShape === 'round_soft' ? 9.5 : 8}
                ry="4.5"
                fill={theme.blushColor}
                opacity={state === 'COMFORTING' || state === 'EXCITED' ? 0.3 : 0.18}
              />
              <ellipse
                cx="130"
                cy={effectiveFaceShape === 'round_soft' ? 108 : 106}
                rx={effectiveFaceShape === 'round_soft' ? 9.5 : 8}
                ry="4.5"
                fill={theme.blushColor}
                opacity={state === 'COMFORTING' || state === 'EXCITED' ? 0.3 : 0.18}
              />

              {/* Face Markings & Celestial Accents */}
              {effectiveFaceMarking === 'star_constellation' && (
                <g opacity="0.85">
                  {/* Left cheek stardust */}
                  <polygon points="63,101 64,103 66,104 64,105 63,107 62,105 60,104 62,103" fill={theme.secondary} />
                  <polygon points="69,96 70,98 72,99 70,100 69,102 68,100 66,99 68,98" fill={theme.hairStrandColor} />
                  <circle cx="73" cy="105" r="1" fill="#ffffff" />
                  {/* Right cheek stardust */}
                  <polygon points="137,101 138,103 140,104 138,105 137,107 136,105 134,104 136,103" fill={theme.secondary} />
                  <polygon points="131,96 132,98 134,99 132,100 131,102 130,100 128,99 130,98" fill={theme.hairStrandColor} />
                  <circle cx="127" cy="105" r="1" fill="#ffffff" />
                </g>
              )}
              {effectiveFaceMarking === 'blush_freckles' && (
                <g fill="#ea580c" opacity="0.45">
                  <circle cx="68" cy="105" r="0.9" />
                  <circle cx="72" cy="103" r="0.8" />
                  <circle cx="75" cy="106" r="0.9" />
                  <circle cx="94" cy="102" r="0.8" />
                  <circle cx="98" cy="100.5" r="0.9" />
                  <circle cx="102" cy="101" r="0.8" />
                  <circle cx="106" cy="102.5" r="0.8" />
                  <circle cx="125" cy="106" r="0.9" />
                  <circle cx="128" cy="103" r="0.8" />
                  <circle cx="132" cy="105" r="0.9" />
                </g>
              )}
              {effectiveFaceMarking === 'cyber_lines' && (
                <g stroke={theme.secondary} strokeWidth="1" fill="none" opacity="0.8">
                  {/* Left Temple Conduits */}
                  <path d="M62 95 L57 98 L57 106 L53 108" />
                  <circle cx="53" cy="108" r="1.5" fill={theme.secondary} />
                  {/* Right Temple Conduits */}
                  <path d="M138 95 L143 98 L143 106 L147 108" />
                  <circle cx="147" cy="108" r="1.5" fill={theme.secondary} />
                </g>
              )}
              {effectiveFaceMarking === 'sakura_petals' && (
                <g transform="translate(68, 102) scale(0.85)">
                  {/* Soft blossom petals under left eye */}
                  <path
                    d="M0 0 C-3 -3, -4 -6, 0 -8 C4 -6, 3 -3, 0 0 Z"
                    fill="#fda4af"
                    stroke="#f43f5e"
                    strokeWidth="0.6"
                    transform="rotate(35)"
                  />
                  <circle cx="3" cy="4" r="1.2" fill="#f43f5e" opacity="0.8" />
                </g>
              )}
              {effectiveFaceMarking === 'moon_crest' && (
                <g transform="translate(100, 68)">
                  {/* Celestial Crescent Bindi on forehead */}
                  <path
                    d="M0 -5 A5 5 0 0 0 0 5 A4 4 0 0 1 0 -5 Z"
                    fill={theme.secondary}
                    stroke={theme.primary}
                    strokeWidth="0.8"
                  />
                  <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
                </g>
              )}

              {/* Nose Contour */}
              <path
                d="M100 95 L98 104 L103 104"
                fill="none"
                stroke="#ea580c"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.35"
              />

              {/* Expressive Eyebrows */}
              <g
                style={{
                  transform:
                    state === 'THINKING'
                      ? 'translateY(-2px)'
                      : state === 'SERIOUS'
                      ? 'translateY(1.5px)'
                      : 'translateY(0px)',
                  transition: 'transform 150ms ease-out',
                }}
              >
                {/* Left Eyebrow */}
                <path
                  d={
                    state === 'COMFORTING'
                      ? 'M68 76 Q78 72 88 77'
                      : state === 'THINKING'
                      ? 'M68 79 Q78 76 88 74'
                      : state === 'SERIOUS'
                      ? 'M68 75 Q78 78 88 80'
                      : 'M68 76 Q78 74 88 77'
                  }
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                {/* Right Eyebrow */}
                <path
                  d={
                    state === 'COMFORTING'
                      ? 'M112 77 Q122 72 132 76'
                      : state === 'THINKING'
                      ? 'M112 74 Q122 76 132 79'
                      : state === 'SERIOUS'
                      ? 'M112 80 Q122 78 132 75'
                      : 'M112 77 Q122 74 132 76'
                  }
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>

              {/* Eyes with 4 Distinct Styling Archetypes */}
              <g
                style={{
                  transformOrigin: '100px 92px',
                  transform: `scaleY(${eyeScaleY})`,
                  transition: 'transform 60ms ease-out',
                }}
              >
                {/* Left Eye */}
                <g>
                  {/* Sclera */}
                  <ellipse cx="78" cy="92" rx="9.5" ry="8" fill="#ffffff" />
                  {/* Theme Iris */}
                  <circle cx="78.5" cy="92" r="5.8" fill={theme.irisOuter} />
                  <circle cx="78.5" cy="92" r="3.8" fill={theme.irisInner} />
                  <circle cx="78.5" cy="92" r={effectiveEyeStyle === 'gentle_doe' ? '2.8' : '2.2'} fill="#0f172a" />
                  {/* Catchlights */}
                  <circle cx="76.8" cy="89.8" r="1.6" fill="#ffffff" />
                  <circle cx="80.2" cy="93.4" r="0.8" fill="#ffffff" />
                  {effectiveEyeStyle === 'almond_sparkle' && (
                    <circle cx="75.5" cy="93.8" r="0.6" fill="#ffffff" />
                  )}

                  {/* Lash Line Variations */}
                  {effectiveEyeStyle === 'almond_sparkle' && (
                    <path
                      d="M68 91 Q78 83 88 91"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                  {effectiveEyeStyle === 'cat_winged' && (
                    <g>
                      <path
                        d="M66 91 Q77 82 88 91"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2.2"
                      />
                      {/* Wing flick */}
                      <path
                        d="M68 91 Q63 88 59 86"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                  {effectiveEyeStyle === 'gentle_doe' && (
                    <g>
                      <path
                        d="M68 91 Q78 83 88 91"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      {/* Soft Lower Lash line */}
                      <path
                        d="M72 97 Q78 99.5 84 97"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeLinecap="round"
                        opacity="0.75"
                      />
                    </g>
                  )}
                  {effectiveEyeStyle === 'focused_sharp' && (
                    <g>
                      <path
                        d="M68 89.5 L88 90.5"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>

                {/* Right Eye */}
                <g>
                  {/* Sclera */}
                  <ellipse cx="122" cy="92" rx="9.5" ry="8" fill="#ffffff" />
                  {/* Theme Iris */}
                  <circle cx="121.5" cy="92" r="5.8" fill={theme.irisOuter} />
                  <circle cx="121.5" cy="92" r="3.8" fill={theme.irisInner} />
                  <circle cx="121.5" cy="92" r={effectiveEyeStyle === 'gentle_doe' ? '2.8' : '2.2'} fill="#0f172a" />
                  {/* Catchlights */}
                  <circle cx="119.8" cy="89.8" r="1.6" fill="#ffffff" />
                  <circle cx="123.2" cy="93.4" r="0.8" fill="#ffffff" />
                  {effectiveEyeStyle === 'almond_sparkle' && (
                    <circle cx="118.5" cy="93.8" r="0.6" fill="#ffffff" />
                  )}

                  {/* Lash Line Variations */}
                  {effectiveEyeStyle === 'almond_sparkle' && (
                    <path
                      d="M112 91 Q122 83 132 91"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                  {effectiveEyeStyle === 'cat_winged' && (
                    <g>
                      <path
                        d="M112 91 Q123 82 134 91"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2.2"
                      />
                      {/* Wing flick */}
                      <path
                        d="M132 91 Q137 88 141 86"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                  {effectiveEyeStyle === 'gentle_doe' && (
                    <g>
                      <path
                        d="M112 91 Q122 83 132 91"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      {/* Soft Lower Lash line */}
                      <path
                        d="M116 97 Q122 99.5 128 97"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeLinecap="round"
                        opacity="0.75"
                      />
                    </g>
                  )}
                  {effectiveEyeStyle === 'focused_sharp' && (
                    <g>
                      <path
                        d="M112 90.5 L132 89.5"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              </g>

              {/* Optional Futuristic Visor for Cyber Persona */}
              {avatarStyle === 'cyber' && (
                <g>
                  <path
                    d="M60 88 C72 84, 128 84, 140 88 L138 98 C126 94, 74 94, 62 98 Z"
                    fill="rgba(132, 204, 22, 0.25)"
                    stroke="#84cc16"
                    strokeWidth="1.2"
                  />
                  <line x1="64" y1="93" x2="136" y2="93" stroke="#a3e635" strokeWidth="0.8" opacity="0.8" />
                </g>
              )}

              {/* Academic Eyewear & Glasses Styles */}
              {effectiveGlasses === 'round_wire' && (
                <g>
                  {/* Left Wire Lens */}
                  <circle cx="78" cy="92" r="12.5" fill="none" stroke="#94a3b8" strokeWidth="1.4" />
                  {/* Right Wire Lens */}
                  <circle cx="122" cy="92" r="12.5" fill="none" stroke="#94a3b8" strokeWidth="1.4" />
                  {/* Wire Bridge */}
                  <path d="M90.5 91 Q100 87 109.5 91" fill="none" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
                  {/* Subtle Glass Lens Glint */}
                  <line x1="72" y1="84" x2="77" y2="81" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                  <line x1="116" y1="84" x2="121" y2="81" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                </g>
              )}
              {effectiveGlasses === 'cat_eye' && (
                <g>
                  {/* Winged Rim Frames */}
                  <path
                    d="M64 88 C70 82, 86 82, 92 88 L90 98 C84 103, 72 103, 66 98 Z"
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="1.8"
                  />
                  <path
                    d="M108 88 C114 82, 130 82, 136 88 L134 98 C128 103, 116 103, 110 98 Z"
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="1.8"
                  />
                  <path d="M92 88 Q100 85 108 88" fill="none" stroke={theme.primary} strokeWidth="1.6" />
                </g>
              )}
              {effectiveGlasses === 'half_rim' && (
                <g>
                  {/* Modern Half-Rim Frames */}
                  <path d="M66 89 Q78 84 90 89" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M110 89 Q122 84 134 89" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="90" y1="89" x2="110" y2="89" stroke="#475569" strokeWidth="1.6" />
                  <path d="M66 89 C67 98, 89 98, 90 89" fill="none" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
                  <path d="M110 89 C111 98, 133 98, 134 89" fill="none" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
                </g>
              )}
              {effectiveGlasses === 'reading' && (
                <g>
                  {/* Low Bridge Rectangular Lenses */}
                  <rect x="66" y="88" width="24" height="12" rx="2" fill="none" stroke="#334155" strokeWidth="1.5" />
                  <rect x="110" y="88" width="24" height="12" rx="2" fill="none" stroke="#334155" strokeWidth="1.5" />
                  <line x1="90" y1="92" x2="110" y2="92" stroke="#334155" strokeWidth="1.5" />
                </g>
              )}

              {/* Expressive Audio-Reactive Mouth */}
              {state === 'SPEAKING' ? (
                <g>
                  <ellipse
                    cx="100"
                    cy="119"
                    rx={6 + effectiveOpenness * 6.5}
                    ry={3.5 + effectiveOpenness * 8.5}
                    fill="#be123c"
                  />
                  <ellipse
                    cx="100"
                    cy={117.5 + effectiveOpenness * 3.5}
                    rx={4 + effectiveOpenness * 4.5}
                    ry={2 + effectiveOpenness * 4}
                    fill="#fb7185"
                  />
                  <path
                    d={`M${93 - effectiveOpenness * 4} 118 Q100 115.5 ${107 + effectiveOpenness * 4} 118`}
                    fill="none"
                    stroke="#881337"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </g>
              ) : state === 'COMFORTING' ? (
                <path
                  d="M93 118 Q100 124 107 118"
                  fill="none"
                  stroke="#be123c"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              ) : state === 'EXCITED' ? (
                <path
                  d="M91 117 Q100 126 109 117 Z"
                  fill="#be123c"
                  stroke="#881337"
                  strokeWidth="1.5"
                />
              ) : state === 'THINKING' ? (
                <path
                  d="M94 120 Q100 118 106 119"
                  fill="none"
                  stroke="#9f1239"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M93 118 Q100 122 107 118"
                  fill="none"
                  stroke="#be123c"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              )}

              {/* Front Bangs & Framing Hair (8 Distinct Hairstyle Silhouettes) */}
              {effectiveHairStyle === 'flowing_long' && (
                <g>
                  {/* Swept Layered Front Bangs */}
                  <path
                    d="M46 80 C52 40, 96 36, 118 54 C96 48, 70 56, 54 84 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  <path
                    d="M154 80 C146 42, 108 38, 88 52 C112 48, 134 58, 146 84 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  {/* Soft Center Hair Strand with Theme Color Highlight */}
                  <path
                    d="M96 44 Q102 60 95 74"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </g>
              )}

              {effectiveHairStyle === 'sleek_bob' && (
                <g>
                  {/* Sharp Asymmetrical Parting Bangs */}
                  <path
                    d="M48 76 C52 44, 88 40, 106 50 C90 48, 62 58, 52 118 C50 114, 46 88, 48 76 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  <path
                    d="M152 76 C148 44, 112 40, 94 50 C110 48, 138 58, 148 118 C150 114, 154 88, 152 76 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  {/* Sleek Crown Geometric Sheen */}
                  <path
                    d="M82 46 Q100 42 118 46"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </g>
              )}

              {effectiveHairStyle === 'high_ponytail' && (
                <g>
                  {/* Swept Back Athletic Crown Hairline */}
                  <path
                    d="M48 74 C54 46, 86 40, 100 46 C114 40, 146 46, 152 74 C146 54, 120 50, 100 52 C80 50, 54 54, 48 74 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  {/* Soft Wispy Temple Strands */}
                  <path
                    d="M54 75 Q52 94 56 106"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <path
                    d="M146 75 Q148 94 144 106"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </g>
              )}

              {effectiveHairStyle === 'wavy_curls' && (
                <g>
                  {/* Romantic Curtain Curls */}
                  <path
                    d="M46 76 C52 44, 82 40, 96 58 C84 52, 64 56, 52 92 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  <path
                    d="M154 76 C148 44, 118 40, 104 58 C116 52, 136 56, 148 92 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  {/* Spiral Wave Highlight */}
                  <path
                    d="M92 46 Q106 58 100 76"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </g>
              )}

              {effectiveHairStyle === 'twin_tails' && (
                <g>
                  {/* Neat Anime Arched Bangs */}
                  <path
                    d="M48 76 C54 44, 96 42, 100 52 C104 42, 146 44, 152 76 C144 56, 126 52, 100 52 C74 52, 56 56, 48 76 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  {/* Framing Side Locks */}
                  <polygon points="50,72 50,110 56,102 54,72" fill={`url(#hairFrontGrad-${uid})`} />
                  <polygon points="150,72 150,110 144,102 146,72" fill={`url(#hairFrontGrad-${uid})`} />
                  {/* Highlight Fringe */}
                  <path
                    d="M84 48 Q100 46 116 48"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </g>
              )}

              {effectiveHairStyle === 'short_pixie' && (
                <g>
                  {/* Textured Feathered Fringe Crop */}
                  <path
                    d="M48 74 C54 40, 110 36, 146 54 C120 48, 86 52, 60 78 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  {/* Angled Layer Flick */}
                  <path
                    d="M72 48 C94 40, 128 44, 144 64 C130 58, 104 56, 88 66 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  <path
                    d="M78 50 Q106 48 134 58"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </g>
              )}

              {effectiveHairStyle === 'space_buns' && (
                <g>
                  {/* Parted Center Fringe with Two Floating Wisps */}
                  <path
                    d="M50 74 C56 46, 92 42, 98 54 C88 50, 68 56, 56 80 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  <path
                    d="M150 74 C144 46, 108 42, 102 54 C112 50, 132 56, 144 80 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  {/* Floating Long Wisps Framing Cheeks */}
                  <path
                    d="M54 78 Q50 102 56 122"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <path
                    d="M146 78 Q150 102 144 122"
                    fill="none"
                    stroke={theme.hairStrandColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </g>
              )}

              {effectiveHairStyle === 'side_braid' && (
                <g>
                  {/* Romantic Side-Swept Waves */}
                  <path
                    d="M48 76 C56 42, 102 38, 130 52 C108 48, 76 54, 58 84 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  <path
                    d="M152 76 C144 46, 120 42, 100 50 C118 48, 140 56, 148 84 Z"
                    fill={`url(#hairFrontGrad-${uid})`}
                  />
                  {/* Botanical Leaf/Flower Accent on Right Temple */}
                  <ellipse cx="144" cy="56" rx="4" ry="2.5" fill={stateAccent.secondary} transform="rotate(35 144 56)" />
                  <ellipse cx="148" cy="60" rx="4" ry="2.5" fill={stateAccent.primary} transform="rotate(-30 148 60)" />
                  <circle cx="146" cy="58" r="1.5" fill="#ffffff" />
                </g>
              )}
            </g>

            {/* Bottom Audio Equalizer Waveform Overlay inside stage when speaking/listening */}
            {(state === 'SPEAKING' || state === 'LISTENING') && (
              <g transform="translate(80, 174)">
                {waveBars.map((mult, idx) => {
                  const activeAmp =
                    state === 'SPEAKING'
                      ? Math.max(0.25, effectiveOpenness * mult)
                      : 0.3 + Math.sin(angle + idx) * 0.2;
                  const barHeight = Math.max(4, activeAmp * 16);
                  return (
                    <rect
                      key={idx}
                      x={idx * 9}
                      y={10 - barHeight / 2}
                      width="4.5"
                      height={barHeight}
                      rx="2.2"
                      fill={stateAccent.secondary}
                    />
                  );
                })}
              </g>
            )}
          </g>
        </svg>
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center justify-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: stateAccent.primary }}
            />
            <span>{stateAccent.label}</span>
          </div>
        </div>
      )}
    </div>
  );
};
