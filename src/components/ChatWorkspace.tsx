import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  Plus,
  Sparkles,
  Radio,
  PhoneOff,
  Square,
  Sliders,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Play,
  Check,
  Bot,
  Palette,
  Zap,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  AvatarState,
  ChatMessage,
  ConversationThread,
  MemoryItem,
  ResponseMode,
  StudentDocument,
  StudentProfile,
  AppSettings,
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
import { FormattedText } from './FormattedText';
import {
  AVAILABLE_VOICES,
  AVAILABLE_AVATARS,
  AVAILABLE_HAIRSTYLES,
  AVAILABLE_FACE_SHAPES,
  AVAILABLE_EYE_STYLES,
  AVAILABLE_FACE_MARKINGS,
  AVAILABLE_GLASSES,
} from '../data/initialData';

const RESPONSE_MODES: ResponseMode[] = [
  'Auto',
  'Comfort Mode',
  'Listening Mode',
  'Reflection Mode',
  'Study Mode',
  'Explanation Mode',
  'Research Mode',
  'Motivation Mode',
  'Planning Mode',
  'Problem-Solving Mode',
  'Celebration Mode',
  'Casual Conversation Mode',
];

interface ChatWorkspaceProps {
  conversations: ConversationThread[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onUpdateConversation: (thread: ConversationThread) => void;
  profile: StudentProfile;
  memories: MemoryItem[];
  documents: StudentDocument[];
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  avatarState: AvatarState;
  onAvatarStateChange: (state: AvatarState) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  conversations,
  activeConversationId,
  onNewConversation,
  onUpdateConversation,
  profile,
  memories,
  documents,
  settings,
  onUpdateSettings,
  avatarState,
  onAvatarStateChange,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const activeThread =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState<ResponseMode>('Auto');
  const [attachedDocId, setAttachedDocId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [customizerTab, setCustomizerTab] = useState<'hair' | 'face' | 'eyes' | 'markings' | 'glasses'>('hair');

  // Mobile/Tablet View Switcher: allows seamless toggling between Chat Stream and Full Talking Avatar Stage on small screens
  const [mobileViewMode, setMobileViewMode] = useState<'chat' | 'voiceStage'>('chat');
  const [mobileControlsExpanded, setMobileControlsExpanded] = useState(false);

  // Voice recording & TTS playback state
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);

  // Gemini Live Real-Time Session state
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Disconnected');
  const [liveTranscriptUser, setLiveTranscriptUser] = useState<string>('');
  const [liveTranscriptElara, setLiveTranscriptElara] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Refs for Gemini Live WebSocket
  const liveWsRef = useRef<WebSocket | null>(null);
  const liveInputCtxRef = useRef<AudioContext | null>(null);
  const liveOutputCtxRef = useRef<AudioContext | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, isSending]);

  // Stop any current TTS speech (supports student interruption!)
  const stopCurrentSpeech = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsSpeakingTTS(false);
    setAudioAmplitude(0);
    onAvatarStateChange('IDLE');
  }, [onAvatarStateChange]);

  // Speak ELARA's reply automatically when voiceEnabled & autoSpeakReplies are true
  const speakReply = useCallback(
    async (text: string, emotionalState?: AvatarState) => {
      if (!settings.voiceEnabled || !settings.autoSpeakReplies) {
        onAvatarStateChange(emotionalState || 'IDLE');
        return;
      }

      stopCurrentSpeech();
      setIsSpeakingTTS(true);
      onAvatarStateChange('SPEAKING');

      try {
        const res = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceName: settings.selectedVoice,
            style:
              emotionalState === 'COMFORTING'
                ? 'Gentle, calm, unhurried, and empathetic'
                : emotionalState === 'EXCITED'
                ? 'Warm, enthusiastic, and encouraging'
                : 'Warm, clear, natural student companion',
          }),
        });

        if (!res.ok) {
          throw new Error('Server TTS fallback');
        }

        const data = await res.json();
        if (!data.audioBase64) {
          throw new Error('Empty TTS audio');
        }

        const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.volume = settings.volume;
        audio.playbackRate = settings.speakingRate;
        currentAudioRef.current = audio;

        // Web Audio Analyser for real audio-reactive mouth synchronization
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);
          analyser.connect(ctx.destination);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAmplitude = () => {
            if (!currentAudioRef.current || currentAudioRef.current.paused) {
              setAudioAmplitude(0);
              return;
            }
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length / 255;
            setAudioAmplitude(Math.min(1, avg * 2.4));
            animFrameRef.current = requestAnimationFrame(updateAmplitude);
          };

          audio.onplay = () => {
            updateAmplitude();
          };
        } catch {
          // If MediaElementSource fails, avatar falls back to its internal speaking rhythm
        }

        audio.onended = () => {
          setIsSpeakingTTS(false);
          setAudioAmplitude(0);
          onAvatarStateChange('IDLE');
        };

        audio.onerror = () => {
          setIsSpeakingTTS(false);
          setAudioAmplitude(0);
          onAvatarStateChange('IDLE');
        };

        await audio.play();
      } catch {
        // Fallback to Web Speech API if server TTS is unavailable
        if ('speechSynthesis' in window) {
          const clean = text.replace(/[*#_~`]/g, '');
          const utterance = new SpeechSynthesisUtterance(clean);
          utterance.rate = settings.speakingRate;
          utterance.volume = settings.volume;
          utterance.onend = () => {
            setIsSpeakingTTS(false);
            setAudioAmplitude(0);
            onAvatarStateChange('IDLE');
          };
          utterance.onerror = () => {
            setIsSpeakingTTS(false);
            setAudioAmplitude(0);
            onAvatarStateChange('IDLE');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeakingTTS(false);
          onAvatarStateChange('IDLE');
        }
      }
    },
    [
      settings.voiceEnabled,
      settings.autoSpeakReplies,
      settings.selectedVoice,
      settings.volume,
      settings.speakingRate,
      stopCurrentSpeech,
      onAvatarStateChange,
    ]
  );

  // Send a message to ELARA (with Ultra-Fast Streaming SSE response)
  const handleSendMessage = useCallback(
    async (overrideText?: string) => {
      const textToSend = (overrideText !== undefined ? overrideText : inputText).trim();
      if (!textToSend || isSending) return;

      // Support interruption: if ELARA is currently speaking, stop her immediately
      if (isSpeakingTTS) {
        stopCurrentSpeech();
      }

      setErrorMessage(null);
      if (overrideText === undefined) {
        setInputText('');
      }

      const attachedDoc = documents.find((d) => d.id === attachedDocId) || null;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: textToSend,
        timestamp: new Date().toISOString(),
        attachedDocumentName: attachedDoc?.name,
      };

      const updatedMessages = [...activeThread.messages, userMsg];
      const updatedTitle =
        activeThread.messages.length <= 1
          ? textToSend.slice(0, 46) + (textToSend.length > 46 ? '...' : '')
          : activeThread.title;

      // Create an optimistic placeholder for the streaming assistant response
      const assistantMsgId = `msg-${Date.now() + 1}-elara`;
      const initialAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        detectedEmotion: 'Calm',
        activeMode: selectedMode,
        avatarState: 'THINKING',
      };

      onUpdateConversation({
        ...activeThread,
        title: updatedTitle,
        updatedAt: new Date().toISOString(),
        messages: [...updatedMessages, initialAssistantMsg],
      });

      setIsSending(true);
      onAvatarStateChange('THINKING');

      try {
        const streamRes = await fetch('/api/gemini/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            mode: selectedMode,
            profile,
            memories: settings.memoryEnabled ? memories : [],
            attachedDocument: attachedDoc
              ? { name: attachedDoc.name, content: attachedDoc.textContent }
              : null,
            responseSpeed: settings.chatSpeed || 'turbo',
          }),
        });

        if (!streamRes.ok || !streamRes.body) {
          throw new Error('Streaming failed, fallback to standard');
        }

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamedText = '';
        let hasStartedSpeaking = false;
        let finalMeta: {
          detectedEmotion?: string;
          activeMode?: string;
          avatarState?: AvatarState;
          suggestedFollowUps?: string[];
        } = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'chunk' && data.text) {
                if (!hasStartedSpeaking) {
                  hasStartedSpeaking = true;
                  onAvatarStateChange('SPEAKING');
                }
                streamedText += data.text;
                onUpdateConversation({
                  ...activeThread,
                  title: updatedTitle,
                  updatedAt: new Date().toISOString(),
                  messages: [
                    ...updatedMessages,
                    {
                      ...initialAssistantMsg,
                      content: streamedText,
                      avatarState: 'SPEAKING',
                    },
                  ],
                });
              } else if (data.type === 'replace_full_text' && data.text !== undefined) {
                streamedText = data.text;
                onUpdateConversation({
                  ...activeThread,
                  title: updatedTitle,
                  updatedAt: new Date().toISOString(),
                  messages: [
                    ...updatedMessages,
                    {
                      ...initialAssistantMsg,
                      content: streamedText,
                      avatarState: 'SPEAKING',
                    },
                  ],
                });
              } else if (data.type === 'done') {
                if (data.reply) streamedText = data.reply;
                finalMeta = {
                  detectedEmotion: data.detectedEmotion,
                  activeMode: data.activeMode,
                  avatarState: data.avatarState as AvatarState,
                  suggestedFollowUps: data.suggestedFollowUps,
                };
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Chat stream error');
              }
            } catch {
              // Ignore line parse error
            }
          }
        }

        const finalReplyText = streamedText || 'I am right here with you. How can we break this down together?';
        const finalAssistantMsg: ChatMessage = {
          ...initialAssistantMsg,
          content: finalReplyText,
          detectedEmotion: finalMeta.detectedEmotion || 'Calm',
          activeMode: (finalMeta.activeMode as ResponseMode) || selectedMode,
          avatarState: finalMeta.avatarState || 'COMFORTING',
          suggestedFollowUps: finalMeta.suggestedFollowUps || [],
        };

        onUpdateConversation({
          ...activeThread,
          title: updatedTitle,
          updatedAt: new Date().toISOString(),
          messages: [...updatedMessages, finalAssistantMsg],
        });

        // Immediately unlock user input for rapid conversation
        setIsSending(false);

        // Speak reply in background without stalling input field or chat UI
        speakReply(finalAssistantMsg.content, finalAssistantMsg.avatarState).catch(() => {});
      } catch (err: unknown) {
        // Fallback to standard endpoint
        try {
          const res = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: updatedMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              mode: selectedMode,
              profile,
              memories: settings.memoryEnabled ? memories : [],
              attachedDocument: attachedDoc
                ? { name: attachedDoc.name, content: attachedDoc.textContent }
                : null,
              responseSpeed: settings.chatSpeed || 'turbo',
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to reach ELARA AI');
          }

          const assistantMsg: ChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: data.reply || 'I am here with you. How can we break this down together?',
            timestamp: new Date().toISOString(),
            detectedEmotion: data.detectedEmotion || 'Calm',
            activeMode: data.activeMode || selectedMode,
            avatarState: (data.avatarState as AvatarState) || 'COMFORTING',
            suggestedFollowUps: Array.isArray(data.suggestedFollowUps)
              ? data.suggestedFollowUps
              : [],
          };

          onUpdateConversation({
            ...activeThread,
            title: updatedTitle,
            updatedAt: new Date().toISOString(),
            messages: [...updatedMessages, assistantMsg],
          });

          setIsSending(false);
          speakReply(assistantMsg.content, assistantMsg.avatarState).catch(() => {});
        } catch (fallbackErr: unknown) {
          const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Connection error';
          setErrorMessage(msg);
          setIsSending(false);
          onAvatarStateChange('IDLE');
        }
      }
    },
    [
      inputText,
      isSending,
      isSpeakingTTS,
      stopCurrentSpeech,
      documents,
      attachedDocId,
      activeThread,
      onUpdateConversation,
      onAvatarStateChange,
      selectedMode,
      profile,
      settings.memoryEnabled,
      settings.chatSpeed,
      memories,
      speakReply,
    ]
  );

  // Handle initial prompt passed from Dashboard quick actions
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      const promptToRun = initialPrompt;
      onClearInitialPrompt?.();
      handleSendMessage(promptToRun);
    }
  }, [initialPrompt, onClearInitialPrompt, handleSendMessage]);

  // Microphone Recording -> Gemini 3.5 Transcribe -> Auto-Send
  const toggleMicRecording = async () => {
    // If ELARA is speaking, pressing the mic interrupts her immediately
    if (isSpeakingTTS) {
      stopCurrentSpeech();
    }

    if (isRecordingMic) {
      mediaRecorderRef.current?.stop();
      setIsRecordingMic(false);
      return;
    }

    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 200) {
          onAvatarStateChange('IDLE');
          return;
        }

        onAvatarStateChange('THINKING');
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            const res = await fetch('/api/gemini/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64data,
                mimeType: 'audio/webm',
              }),
            });
            const data = await res.json();
            if (res.ok && data.transcript) {
              await handleSendMessage(data.transcript);
            } else {
              setErrorMessage(data.error || 'Could not transcribe audio clearly.');
              onAvatarStateChange('IDLE');
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch {
          setErrorMessage('Failed to process voice recording.');
          onAvatarStateChange('IDLE');
        }
      };

      mediaRecorder.start();
      setIsRecordingMic(true);
      onAvatarStateChange('LISTENING');
    } catch {
      setErrorMessage(
        'Microphone access was denied or is unavailable. Please check browser permissions.'
      );
      onAvatarStateChange('IDLE');
    }
  };

  // Real-Time Gemini Live API Session (Full-duplex WebSocket audio streaming)
  const stopLiveSession = useCallback(() => {
    if (liveWsRef.current) {
      liveWsRef.current.close();
      liveWsRef.current = null;
    }
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
    }
    if (liveInputCtxRef.current) {
      liveInputCtxRef.current.close().catch(() => {});
      liveInputCtxRef.current = null;
    }
    if (liveOutputCtxRef.current) {
      liveOutputCtxRef.current.close().catch(() => {});
      liveOutputCtxRef.current = null;
    }
    activeSourcesRef.current = [];
    setIsLiveActive(false);
    setLiveStatus('Disconnected');
    setAudioAmplitude(0);
    onAvatarStateChange('IDLE');
  }, [onAvatarStateChange]);

  const startLiveSession = async () => {
    stopCurrentSpeech();
    setErrorMessage(null);
    setLiveTranscriptUser('');
    setLiveTranscriptElara('');
    setLiveStatus('Connecting to Gemini Live...');
    setMobileViewMode('voiceStage');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      liveStreamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(
        settings.selectedVoice
      )}&lang=${encodeURIComponent(profile.preferredLanguage)}`;

      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      const outputCtx = new AudioContext({ sampleRate: 24000 });
      liveOutputCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            setIsLiveActive(true);
            setLiveStatus('Live Voice Active — Speak naturally');
            onAvatarStateChange('LISTENING');

            // Start streaming 16kHz PCM mic input
            const inputCtx = new AudioContext({ sampleRate: 16000 });
            liveInputCtxRef.current = inputCtx;
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);

            source.connect(processor);
            processor.connect(inputCtx.destination);

            processor.onaudioprocess = (e) => {
              if (!liveWsRef.current || liveWsRef.current.readyState !== WebSocket.OPEN) return;
              const float32Data = e.inputBuffer.getChannelData(0);
              const int16Data = new Int16Array(float32Data.length);
              for (let i = 0; i < float32Data.length; i++) {
                const s = Math.max(-1, Math.min(1, float32Data[i]));
                int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
              }
              const uint8Data = new Uint8Array(int16Data.buffer);
              let binary = '';
              for (let i = 0; i < uint8Data.byteLength; i++) {
                binary += String.fromCharCode(uint8Data[i]);
              }
              const base64Audio = btoa(binary);
              liveWsRef.current.send(JSON.stringify({ audio: base64Audio }));
            };
          } else if (msg.type === 'audio' && msg.audio) {
            onAvatarStateChange('SPEAKING');
            // Decode 24kHz 16-bit PCM little-endian
            const binaryStr = atob(msg.audio);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            const int16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(int16.length);
            let sumAmp = 0;
            for (let i = 0; i < int16.length; i++) {
              float32[i] = int16[i] / 32768.0;
              sumAmp += Math.abs(float32[i]);
            }
            const avgAmp = Math.min(1, (sumAmp / float32.length) * 4);
            setAudioAmplitude(avgAmp);

            const audioBuffer = outputCtx.createBuffer(1, float32.length, 24000);
            audioBuffer.getChannelData(0).set(float32);

            const sourceNode = outputCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(outputCtx.destination);

            const currentTime = outputCtx.currentTime;
            const startTime = Math.max(currentTime, nextStartTimeRef.current);
            sourceNode.start(startTime);
            nextStartTimeRef.current = startTime + audioBuffer.duration;
            activeSourcesRef.current.push(sourceNode);

            sourceNode.onended = () => {
              activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== sourceNode);
              if (activeSourcesRef.current.length === 0) {
                setAudioAmplitude(0);
                onAvatarStateChange('LISTENING');
              }
            };
          } else if (msg.type === 'inputTranscription' && msg.text) {
            setLiveTranscriptUser((prev) => `${prev} ${msg.text}`.trim());
          } else if (msg.type === 'outputTranscription' && msg.text) {
            setLiveTranscriptElara((prev) => `${prev} ${msg.text}`.trim());
          } else if (msg.type === 'interrupted') {
            // Student interrupted ELARA in real-time: immediately stop queued audio chunks
            activeSourcesRef.current.forEach((s) => {
              try {
                s.stop();
              } catch {
                // ignore
              }
            });
            activeSourcesRef.current = [];
            nextStartTimeRef.current = outputCtx.currentTime;
            setAudioAmplitude(0);
            onAvatarStateChange('LISTENING');
          } else if (msg.type === 'error') {
            setErrorMessage(msg.message || 'Live voice session error');
            stopLiveSession();
          } else if (msg.type === 'closed') {
            stopLiveSession();
          }
        } catch {
          // ignore malformed ws message
        }
      };

      ws.onerror = () => {
        setErrorMessage('Could not connect to Gemini Live WebSocket.');
        stopLiveSession();
      };
    } catch {
      setErrorMessage('Microphone permission is required for Gemini Live voice conversation.');
      stopLiveSession();
    }
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
      stopCurrentSpeech();
    };
  }, [stopLiveSession, stopCurrentSpeech]);

  const lastAssistantMessage = [...(activeThread?.messages || [])]
    .reverse()
    .find((m) => m.role === 'assistant');

  const activeAvatar =
    AVAILABLE_AVATARS.find((a) => a.id === (settings.selectedAvatar || 'nova')) ||
    AVAILABLE_AVATARS[0];

  return (
    <div className="flex flex-col space-y-3 lg:space-y-0">
      {/* MOBILE & TABLET COMPACT COMPANION BAR (Visible below lg breakpoint) */}
      <div className="lg:hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2.5">
          {/* Mini Animated Avatar + Live State */}
          <div className="flex items-center gap-2.5 min-w-0">
            <ElaraAvatar
              state={avatarState}
              avatarStyle={settings.selectedAvatar || 'nova'}
              audioAmplitude={audioAmplitude}
              size="sm"
              showLabel={false}
              onClick={() =>
                setMobileViewMode(mobileViewMode === 'chat' ? 'voiceStage' : 'chat')
              }
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  ELARA AI
                </span>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 truncate">
                  {isLiveActive
                    ? 'Live Voice'
                    : isSpeakingTTS
                    ? 'Speaking'
                    : isRecordingMic
                    ? 'Listening'
                    : selectedMode === 'Auto'
                    ? 'Adaptive'
                    : selectedMode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {AVAILABLE_AVATARS.find((a) => a.id === (settings.selectedAvatar || 'nova'))?.name} · {settings.selectedVoice} voice
              </p>
            </div>
          </div>

          {/* Mobile Mode Switcher (Chat vs Talking AI Stage) */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setMobileViewMode('chat')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[34px] ${
                  mobileViewMode === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('voiceStage')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[34px] ${
                  mobileViewMode === 'voiceStage'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Talking AI</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileControlsExpanded(!mobileControlsExpanded)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Toggle Companion Controls"
            >
              {mobileControlsExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Quick Mode & Voice Controls on Mobile */}
        {mobileControlsExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Avatar Style Quick Select */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400 shrink-0">Avatar:</span>
              <select
                value={settings.selectedAvatar || 'nova'}
                onChange={(e) =>
                  onUpdateSettings({
                    selectedAvatar: e.target.value as AppSettings['selectedAvatar'],
                  })
                }
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs truncate"
              >
                {AVAILABLE_AVATARS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Persona Quick Select */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400 shrink-0">Voice:</span>
              <select
                value={settings.selectedVoice || 'Kore'}
                onChange={(e) =>
                  onUpdateSettings({
                    selectedVoice: e.target.value as AppSettings['selectedVoice'],
                  })
                }
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs truncate"
              >
                {AVAILABLE_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.tone})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400 shrink-0">Response Mode:</span>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as ResponseMode)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              >
                {RESPONSE_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m === 'Auto' ? 'Auto-Detect' : m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    voiceEnabled: !settings.voiceEnabled,
                    autoSpeakReplies: !settings.voiceEnabled ? true : settings.autoSpeakReplies,
                  })
                }
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 border ${
                  settings.voiceEnabled
                    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                }`}
              >
                {settings.voiceEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Auto-Speak On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Silent Mode</span>
                  </>
                )}
              </button>

              {isSpeakingTTS && (
                <button
                  type="button"
                  onClick={stopCurrentSpeech}
                  className="py-1.5 px-3 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1 shrink-0"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MAIN RESPONSIVE GRID: 2-Column on Desktop (lg:grid-cols-12), Tab-Switched on Mobile/Tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[580px]">
        {/* LEFT COLUMN / TALKING AI STAGE (Always visible on lg+, or when mobileViewMode === 'voiceStage') */}
        <div
          className={`${
            mobileViewMode === 'voiceStage' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-4 flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 overflow-y-auto`}
        >
          <div className="space-y-4">
            {/* Stage Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  ELARA Talking Companion
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Interactive Voice &amp; Emotional Presence
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAvatarCustomizer(!showAvatarCustomizer);
                    if (!showAvatarCustomizer) setShowVoiceSettings(false);
                  }}
                  className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
                    showAvatarCustomizer
                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Customize Avatar Hairstyles, Face Shapes, Eyes & Accents"
                >
                  <Palette className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVoiceSettings(!showVoiceSettings);
                    if (!showVoiceSettings) setShowAvatarCustomizer(false);
                  }}
                  className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
                    showVoiceSettings
                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Voice Persona & Audio Settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Responsive Centered Avatar Stage */}
            <div className="py-3 sm:py-5 flex flex-col items-center justify-center rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 px-4">
              <ElaraAvatar
                state={avatarState}
                avatarStyle={settings.selectedAvatar || 'nova'}
                hairStyle={settings.hairStyle}
                faceShape={settings.faceShape}
                eyeStyle={settings.eyeStyle}
                faceMarking={settings.faceMarking}
                glassesStyle={settings.glassesStyle}
                audioAmplitude={audioAmplitude}
                size="responsive"
                showLabel={true}
              />

              {/* Quick Face & Hair Customizer Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setShowAvatarCustomizer(!showAvatarCustomizer);
                  if (!showAvatarCustomizer) setShowVoiceSettings(false);
                }}
                className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
                  showAvatarCustomizer
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-sky-500" />
                <span>{showAvatarCustomizer ? 'Close Customizer' : 'Customize Face & Hair'}</span>
              </button>

              {/* Quick Avatar Switching Pill Bar */}
              <div className="mt-3 w-full">
                <div className="flex items-center justify-between text-[11px] mb-1.5 px-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Avatar Persona:</span>
                  <span className="text-sky-600 dark:text-sky-400 font-medium">
                    {activeAvatar.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
                  {AVAILABLE_AVATARS.map((av) => {
                    const isCur = (settings.selectedAvatar || 'nova') === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            selectedAvatar: av.id,
                            hairStyle: av.defaultHairStyle,
                            faceShape: av.defaultFaceShape,
                            eyeStyle: av.defaultEyeStyle,
                            faceMarking: av.defaultFaceMarking,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 border ${
                          isCur
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                        title={`${av.title} — ${av.description}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: av.accentColor }}
                        />
                        <span>{av.name.replace('Elara ', '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE AVATAR CUSTOMIZER IN-STAGE PANEL */}
              {showAvatarCustomizer && (
                <div className="mt-3.5 w-full p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-sky-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {activeAvatar.name} Style Studio
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            hairStyle: activeAvatar.defaultHairStyle,
                            faceShape: activeAvatar.defaultFaceShape,
                            eyeStyle: activeAvatar.defaultEyeStyle,
                            faceMarking: activeAvatar.defaultFaceMarking,
                            glassesStyle: 'none',
                            avatarGlassesEnabled: false,
                          })
                        }
                        className="p-1 text-[11px] text-slate-500 hover:text-sky-600 flex items-center gap-1"
                        title="Reset to persona default style"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden sm:inline">Reset</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAvatarCustomizer(false)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label="Close Customizer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {(
                      [
                        { id: 'hair', label: '✂️ Hair (8)' },
                        { id: 'face', label: '👤 Face (4)' },
                        { id: 'eyes', label: '👁️ Eyes (4)' },
                        { id: 'markings', label: '✨ Marks (6)' },
                        { id: 'glasses', label: '👓 Glasses (5)' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCustomizerTab(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                          customizerTab === t.id
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: Hairstyles (8 styles) */}
                  {customizerTab === 'hair' && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_HAIRSTYLES.map((h) => {
                        const isCur =
                          (settings.hairStyle || activeAvatar.defaultHairStyle) === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => onUpdateSettings({ hairStyle: h.id })}
                            className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border ${
                              isCur
                                ? 'bg-sky-500/10 border-sky-500/40 text-sky-900 dark:text-sky-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold truncate">{h.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                  {h.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {h.description}
                              </p>
                            </div>
                            {isCur && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tab 2: Face Shapes (4 shapes) */}
                  {customizerTab === 'face' && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_FACE_SHAPES.map((f) => {
                        const isCur =
                          (settings.faceShape || activeAvatar.defaultFaceShape) === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => onUpdateSettings({ faceShape: f.id })}
                            className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border ${
                              isCur
                                ? 'bg-sky-500/10 border-sky-500/40 text-sky-900 dark:text-sky-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold truncate">{f.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                  {f.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {f.description}
                              </p>
                            </div>
                            {isCur && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tab 3: Eyes & Iris (4 styles) */}
                  {customizerTab === 'eyes' && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_EYE_STYLES.map((e) => {
                        const isCur =
                          (settings.eyeStyle || activeAvatar.defaultEyeStyle) === e.id;
                        return (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => onUpdateSettings({ eyeStyle: e.id })}
                            className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border ${
                              isCur
                                ? 'bg-sky-500/10 border-sky-500/40 text-sky-900 dark:text-sky-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold truncate">{e.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                  {e.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {e.description}
                              </p>
                            </div>
                            {isCur && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tab 4: Face Markings (6 markings) */}
                  {customizerTab === 'markings' && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_FACE_MARKINGS.map((m) => {
                        const isCur =
                          (settings.faceMarking !== undefined
                            ? settings.faceMarking
                            : activeAvatar.defaultFaceMarking) === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => onUpdateSettings({ faceMarking: m.id })}
                            className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border ${
                              isCur
                                ? 'bg-sky-500/10 border-sky-500/40 text-sky-900 dark:text-sky-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold truncate">{m.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                  {m.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {m.description}
                              </p>
                            </div>
                            {isCur && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tab 5: Eyewear (5 options) */}
                  {customizerTab === 'glasses' && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_GLASSES.map((g) => {
                        const isCur = (settings.glassesStyle || 'none') === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() =>
                              onUpdateSettings({
                                glassesStyle: g.id,
                                avatarGlassesEnabled: g.id !== 'none',
                              })
                            }
                            className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border ${
                              isCur
                                ? 'bg-sky-500/10 border-sky-500/40 text-sky-900 dark:text-sky-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold truncate">{g.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                  {g.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {g.description}
                              </p>
                            </div>
                            {isCur && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Live Caption / Last Spoken Message Preview on Mobile Stage */}
              <div className="mt-3 w-full max-w-sm text-center">
                {isLiveActive && (liveTranscriptUser || liveTranscriptElara) ? (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 text-xs space-y-1.5 text-left border border-slate-200 dark:border-slate-800 max-h-32 overflow-y-auto">
                    {liveTranscriptUser && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <strong>You:</strong> {liveTranscriptUser}
                      </p>
                    )}
                    {liveTranscriptElara && (
                      <p className="text-sky-700 dark:text-sky-300">
                        <strong>ELARA:</strong> {liveTranscriptElara}
                      </p>
                    )}
                  </div>
                ) : (
                  lastAssistantMessage && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 px-2 italic">
                      &ldquo;
                      {lastAssistantMessage.content
                        .replace(/[*#_~`]/g, '')
                        .slice(0, 160)}
                      {lastAssistantMessage.content.length > 160 ? '...' : ''}&rdquo;
                    </p>
                  )
                )}
              </div>

              {/* Primary Touch-Friendly Voice Controls */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  type="button"
                  onClick={toggleMicRecording}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px] whitespace-nowrap shrink-0 ${
                    isRecordingMic
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                >
                  {isRecordingMic ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>Tap to Send Voice</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Hold / Tap to Speak</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      voiceEnabled: !settings.voiceEnabled,
                      autoSpeakReplies: !settings.voiceEnabled ? true : settings.autoSpeakReplies,
                    })
                  }
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px] whitespace-nowrap shrink-0 ${
                    settings.voiceEnabled
                      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {settings.voiceEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Auto-Voice On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Silent Mode</span>
                    </>
                  )}
                </button>

                {isSpeakingTTS && (
                  <button
                    type="button"
                    onClick={stopCurrentSpeech}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 hover:bg-amber-500/25 transition-colors min-h-[44px] whitespace-nowrap shrink-0"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Interrupt</span>
                  </button>
                )}
              </div>

              {/* Real-Time Full-Duplex Gemini Live Session Button */}
              <div className="mt-3 w-full pt-3 border-t border-slate-200/70 dark:border-slate-800">
                {!isLiveActive ? (
                  <button
                    type="button"
                    onClick={startLiveSession}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap shrink-0"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Start Real-Time Gemini Live Voice</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {liveStatus}
                    </div>
                    <button
                      type="button"
                      onClick={stopLiveSession}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap shrink-0"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>End Live Voice Session</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible Voice & Speed Settings */}
            {showVoiceSettings && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-slate-700 dark:text-slate-300">
                      ELARA Voice Persona ({AVAILABLE_VOICES.length} Voices)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const curVoice = AVAILABLE_VOICES.find((v) => v.id === settings.selectedVoice);
                        if (curVoice) {
                          speakReply(curVoice.sampleText);
                        }
                      }}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                      title="Hear short greeting in selected voice"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Hear Sample</span>
                    </button>
                  </div>
                  <select
                    value={settings.selectedVoice}
                    onChange={(e) =>
                      onUpdateSettings({
                        selectedVoice: e.target.value as AppSettings['selectedVoice'],
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  >
                    {AVAILABLE_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender} · {v.tone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Speaking Speed</span>
                    <span className="font-mono tabular-nums">
                      {settings.speakingRate.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.4"
                    step="0.05"
                    value={settings.speakingRate}
                    onChange={(e) =>
                      onUpdateSettings({ speakingRate: parseFloat(e.target.value) })
                    }
                    className="w-full accent-sky-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Voice Volume</span>
                    <span className="font-mono tabular-nums">
                      {Math.round(settings.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.volume}
                    onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full accent-sky-600"
                  />
                </div>

                {/* Quick Hairstyle Selector */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Hairstyle</span>
                    <span className="text-[10px] text-slate-400">8 Styles</span>
                  </div>
                  <select
                    value={
                      settings.hairStyle ||
                      AVAILABLE_AVATARS.find((a) => a.id === (settings.selectedAvatar || 'nova'))
                        ?.defaultHairStyle ||
                      'flowing_long'
                    }
                    onChange={(e) => onUpdateSettings({ hairStyle: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  >
                    {AVAILABLE_HAIRSTYLES.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Face Shape Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Face Shape</span>
                    <span className="text-[10px] text-slate-400">4 Shapes</span>
                  </div>
                  <select
                    value={
                      settings.faceShape ||
                      AVAILABLE_AVATARS.find((a) => a.id === (settings.selectedAvatar || 'nova'))
                        ?.defaultFaceShape ||
                      'oval_classic'
                    }
                    onChange={(e) => onUpdateSettings({ faceShape: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  >
                    {AVAILABLE_FACE_SHAPES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.badge})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Adaptive Response Mode Selector */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="response-mode-select"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Adaptive Response Mode
              </label>
              <span className="text-xs text-slate-500">11 Modes</span>
            </div>
            <select
              id="response-mode-select"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as ResponseMode)}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            >
              {RESPONSE_MODES.map((m) => (
                <option key={m} value={m}>
                  {m === 'Auto' ? 'Auto-Detect (Emotionally Adaptive)' : m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RIGHT COLUMN / CONVERSATION STREAM (Always visible on lg+, or when mobileViewMode === 'chat') */}
        <div
          className={`${
            mobileViewMode === 'chat' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-8 flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden h-[calc(100dvh-14.5rem)] sm:h-[calc(100dvh-13rem)] lg:h-full min-h-[420px]`}
        >
          {/* Conversation Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                {activeThread?.title || 'Conversation with ELARA'}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                <span>Language: {profile.preferredLanguage}</span>
                <span aria-hidden="true">·</span>
                <span>Memory: {settings.memoryEnabled ? 'Active' : 'Paused'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    chatSpeed: (settings.chatSpeed || 'turbo') === 'turbo' ? 'standard' : 'turbo',
                  })
                }
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors whitespace-nowrap min-h-[36px] ${
                  (settings.chatSpeed || 'turbo') === 'turbo'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title={
                  (settings.chatSpeed || 'turbo') === 'turbo'
                    ? 'Ultra-Fast Turbo Speed is ON: Instant response streaming powered by lightweight low-latency model'
                    : 'Standard Speed is ON: Detailed in-depth reasoning'
                }
              >
                <Zap className={`w-3.5 h-3.5 ${(settings.chatSpeed || 'turbo') === 'turbo' ? 'fill-current text-amber-500' : ''}`} />
                <span className="hidden sm:inline">
                  {(settings.chatSpeed || 'turbo') === 'turbo' ? '⚡ Turbo Fast (<1s)' : 'Standard'}
                </span>
                <span className="sm:hidden">
                  {(settings.chatSpeed || 'turbo') === 'turbo' ? '⚡ Fast' : 'Std'}
                </span>
              </button>

              <button
                type="button"
                onClick={onNewConversation}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Scrollable Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {activeThread?.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isUser ? profile.name || 'You' : 'ELARA'}
                    </span>
                    {!isUser && msg.activeMode && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-sky-600 dark:text-sky-400">{msg.activeMode}</span>
                      </>
                    )}
                    {!isUser && msg.detectedEmotion && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Context: {msg.detectedEmotion}</span>
                      </>
                    )}
                    {isUser && msg.attachedDocumentName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-sky-600 dark:text-sky-400 truncate max-w-[200px]">
                          Grounded: {msg.attachedDocumentName}
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    className={`max-w-[92%] sm:max-w-2xl rounded-2xl p-3.5 sm:p-4 ${
                      isUser
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    ) : (
                      <FormattedText text={msg.content} />
                    )}
                  </div>

                  {/* Suggested Follow-Ups */}
                  {!isUser &&
                    msg.suggestedFollowUps &&
                    msg.suggestedFollowUps.length > 0 &&
                    msg.id ===
                      activeThread.messages[activeThread.messages.length - 1]?.id && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-full sm:max-w-2xl">
                        {msg.suggestedFollowUps.map((followUp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(followUp)}
                            disabled={isSending}
                            className="text-left text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <Sparkles className="w-4 h-4 text-sky-500 animate-spin shrink-0" />
                <span>ELARA is understanding context and preparing a response...</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold">Communication Notice</p>
                  <p className="mt-0.5 break-words">{errorMessage}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2 shrink-0">
            {/* Document Grounding Selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={attachedDocId}
                  onChange={(e) => setAttachedDocId(e.target.value)}
                  aria-label="Ground conversation in an uploaded document"
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 max-w-full truncate"
                >
                  <option value="">No document attached (General Companion)</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Ground in: {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              {isRecordingMic && (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                  Recording... Tap mic to send
                </span>
              )}
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={toggleMicRecording}
                className={`p-3 rounded-xl border transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isRecordingMic
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={
                  isRecordingMic
                    ? 'Stop Recording & Transcribe'
                    : 'Speak to ELARA (Voice Input)'
                }
              >
                {isRecordingMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask ELARA anything or talk through your day..."
                className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 min-h-[44px] max-h-28"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isSending}
                className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
