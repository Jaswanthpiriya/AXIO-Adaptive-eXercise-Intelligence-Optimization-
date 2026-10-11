/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO AI Voice Coach Page powered by Google Gemini API & Web Speech APIs
 * Context-aware voice and text coaching interface grounded in the athlete's stored profile.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AthleteProfile, CompletedWorkoutSession } from '../types/app.ts';
import { useAxio, ChatMessage } from '../context/AxioContext.tsx';
import { Button } from '../design-system/components/Button.tsx';
import { generateContextualCoachResponse } from '../utils/aiCoachEngine.ts';
import {
  Send,
  Bot,
  Sparkles,
  Check,
  Copy,
  AlertCircle,
  RotateCcw,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Radio,
} from 'lucide-react';

interface AiCoachPageProps {
  athlete?: AthleteProfile;
  workoutHistory?: CompletedWorkoutSession[];
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export const SUGGESTED_PROMPTS = [
  'How many push-ups do I need to do?',
  'How do I do a proper squat?',
  'What should I eat after training?',
  'How can I recover faster from soreness?',
  'Create my beginner workout.',
  'What should I train today?',
  'Analyze my progress.',
];

/**
 * Normalizes structured markdown/technical response text into clean, natural spoken English
 * suitable for the browser's SpeechSynthesis engine.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\*\*([^*]+)\*\*/g, '$1') // remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')     // remove *italic*
    .replace(/^#+\s+/gm, '')           // remove markdown headers
    .replace(/^[•*\-]\s+/gm, '')       // remove bullet characters
    .replace(/RECOMMENDATION:?/gi, 'Recommendation:')
    .replace(/COACHING TIP & BIOMECHANICS:?/gi, 'Coaching tip:')
    .replace(/COACHING TIP:?/gi, 'Coaching tip:')
    .replace(/FORM CHECK:?/gi, 'Form check:')
    .replace(/COMMON MISTAKE:?/gi, 'Common mistake:')
    .replace(/(\d+)\s*[x×]\s*(\d+)/gi, '$1 sets of $2') // e.g. 3 × 10 -> 3 sets of 10
    .replace(/(\d+)s\b/gi, '$1 seconds')                // e.g. 45s -> 45 seconds
    .replace(/(\d+)kg\b/gi, '$1 kilograms')              // e.g. 75kg -> 75 kilograms
    .replace(/(\d+)cm\b/gi, '$1 centimeters')
    .replace(/\bROM\b/g, 'range of motion')
    .replace(/\bRPE\b/g, 'rate of perceived exertion')
    .replace(/\n+/g, ' ')                                // replace newlines with natural pause
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Audio visualizer waveform component displaying animated sound bars
 */
const AudioWaveform: React.FC<{ active?: boolean; color?: string; barCount?: number }> = ({
  active = true,
  color = '#00FF66',
  barCount = 4,
}) => {
  return (
    <div className="flex items-center gap-0.5 h-3.5 px-0.5" title="Voice audio active">
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className={`w-0.5 rounded-full transition-all duration-150 ${
            active ? 'animate-pulse' : 'h-1.5 opacity-40'
          }`}
          style={{
            backgroundColor: color,
            height: active ? `${Math.sin(i * 1.3) * 6 + 10}px` : '4px',
            animationDuration: `${0.45 + (i % 3) * 0.25}s`,
            animationDelay: `${i * 120}ms`,
          }}
        />
      ))}
    </div>
  );
};

export const AiCoachPage: React.FC<AiCoachPageProps> = ({
  athlete: propAthlete,
  workoutHistory: propWorkoutHistory,
}) => {
  const context = useAxio();
  const athlete = propAthlete || context.athlete;
  const workoutHistory = propWorkoutHistory || context.workoutHistory;
  const messages = context.coachMessages;
  const addCoachMessage = context.addCoachMessage;
  const clearCoachConversation = context.clearCoachConversation;

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // AI VOICE COACH STATE & CONTROLS
  // --------------------------------------------------------------------------
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('axio_voice_output_enabled') !== 'false';
    } catch (e) {
      return true;
    }
  });
  const [currentlySpeakingMessageId, setCurrentlySpeakingMessageId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);

  // Browser API availability flags
  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const isSpeechSynthesisSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-scroll chat to latest turn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, voiceState]);

  // Save voice output preference
  const toggleVoiceOutput = () => {
    setIsVoiceOutputEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('axio_voice_output_enabled', String(next));
      } catch (e) {}
      if (!next && voiceState === 'speaking') {
        stopSpeech();
      }
      return next;
    });
  };

  // --------------------------------------------------------------------------
  // SPEECH SYNTHESIS ENGINE (Spoken AI Responses)
  // --------------------------------------------------------------------------
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
    setCurrentlySpeakingMessageId(null);
    setIsSpeechPaused(false);
  }, []);

  const pauseSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      } catch (e) {}
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      } catch (e) {}
    }
  }, []);

  const togglePauseResume = useCallback(() => {
    if (isSpeechPaused) {
      resumeSpeech();
    } else {
      pauseSpeech();
    }
  }, [isSpeechPaused, resumeSpeech, pauseSpeech]);

  const speakMessage = useCallback((text: string, messageId: string) => {
    if (!isSpeechSynthesisSupported || typeof window === 'undefined') {
      return;
    }

    try {
      // Prevent multiple responses from speaking simultaneously
      window.speechSynthesis.cancel();
      setIsSpeechPaused(false);

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1.05; // Brisk, energetic performance coaching tempo
      utterance.pitch = 1.0;

      const isTelugu = /[\u0C00-\u0C7F]/.test(cleaned);
      utterance.lang = isTelugu ? 'te-IN' : 'en-US';

      // Pick high-fidelity voice if available
      const voices = window.speechSynthesis.getVoices();
      let preferredVoice: SpeechSynthesisVoice | undefined;

      if (isTelugu) {
        preferredVoice =
          voices.find(
            (v) =>
              v.lang === 'te-IN' ||
              v.lang.startsWith('te') ||
              v.name.toLowerCase().includes('telugu')
          ) ||
          voices.find((v) => v.lang.startsWith('en-IN')) ||
          voices.find((v) => v.lang.startsWith('en'));
      } else {
        preferredVoice =
          voices.find(
            (v) =>
              (v.lang.startsWith('en-US') || v.lang.startsWith('en')) &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('Daniel') ||
                v.name.includes('Aaron'))
          ) || voices.find((v) => v.lang.startsWith('en'));
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setVoiceState('speaking');
        setCurrentlySpeakingMessageId(messageId);
        setIsSpeechPaused(false);
      };

      utterance.onpause = () => {
        setIsSpeechPaused(true);
      };

      utterance.onresume = () => {
        setIsSpeechPaused(false);
      };

      utterance.onend = () => {
        setVoiceState('idle');
        setCurrentlySpeakingMessageId(null);
        setIsSpeechPaused(false);
      };

      utterance.onerror = (e: any) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech synthesis playback error:', e);
        }
        setVoiceState('idle');
        setCurrentlySpeakingMessageId(null);
        setIsSpeechPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis call failed:', err);
      setVoiceState('idle');
      setCurrentlySpeakingMessageId(null);
    }
  }, [isSpeechSynthesisSupported]);

  const replaySpeech = useCallback((text: string, messageId: string) => {
    stopSpeech();
    speakMessage(text, messageId);
  }, [stopSpeech, speakMessage]);

  // --------------------------------------------------------------------------
  // SPEECH RECOGNITION ENGINE (Voice Input via Microphone)
  // --------------------------------------------------------------------------
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
  }, []);

  const startListening = useCallback(() => {
    // 1. Cancel any active speech output
    stopSpeech();
    setVoiceError(null);

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceError(
        'Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.'
      );
      setVoiceState('error');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-US';
      recognition.continuous = false; // Single utterance for focused fitness questions
      recognition.interimResults = true; // Displays live transcription in input box
      recognition.maxAlternatives = 1;

      // Never claim to be listening until recognition has genuinely started
      recognition.onstart = () => {
        setVoiceState('listening');
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          // Show recognized speech directly in the chat input so user can inspect and edit
          setInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Please tap the mic and try asking your question again.');
        } else if (event.error === 'audio-capture') {
          setVoiceError('No microphone hardware detected on this device.');
        } else if (event.error === 'network') {
          setVoiceError('Speech recognition network error. Please check your internet connection.');
        } else {
          setVoiceError(`Voice recognition error: ${event.error}`);
        }
        setVoiceState('error');
      };

      recognition.onend = () => {
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start SpeechRecognition:', err);
      setVoiceError('Could not initialize microphone: ' + (err?.message || 'Access error'));
      setVoiceState('error');
    }
  }, [stopSpeech]);

  const toggleListening = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  // Clean up all speech recognition and synthesis listeners on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --------------------------------------------------------------------------
  // SEND QUERY & RECEIVE AI RESPONSE
  // --------------------------------------------------------------------------
  const handleSend = async (messageText?: string) => {
    const query = (messageText || input).trim();
    if (!query || isLoading) return;

    // Stop microphone if currently listening
    stopListening();
    // Stop any ongoing speech playback
    stopSpeech();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addCoachMessage(userMessage);
    if (!messageText) setInput('');
    setIsLoading(true);
    setVoiceState('processing');
    setApiError(null);
    setVoiceError(null);

    // Format prior conversation memory (last 10 turns)
    const historyPayload = messages.slice(-10).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    // Real factual recent history
    let recentHistoryPayload: any = undefined;
    if (workoutHistory && workoutHistory.length > 0) {
      const lastSession = workoutHistory[0];
      recentHistoryPayload = {
        lastWorkout: lastSession.title,
        peakPower: lastSession.peakPowerWatts || undefined,
        formAccuracy: lastSession.averageFormAccuracy || undefined,
        completedCount: workoutHistory.length,
      };
    }

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          conversationHistory: historyPayload,
          athleteProfile: {
            name: athlete.name,
            age: athlete.age,
            heightCm: athlete.heightCm,
            weightKg: athlete.weightKg,
            discipline: athlete.discipline,
            tier: athlete.tier,
            fitnessLevel: athlete.fitnessLevel,
            activityLevel: athlete.activityLevel,
            trainingExperience: athlete.trainingExperience,
            goals: athlete.goals,
            workoutLocation: athlete.workoutLocation,
            availableEquipment: athlete.availableEquipment,
            workoutDaysPerWeek: athlete.workoutDaysPerWeek,
            workoutDurationMinutes: athlete.workoutDurationMinutes,
            dietPreference: athlete.dietPreference,
            performanceScore: athlete.performanceScore,
            formScore: athlete.formScore,
            streakDays: athlete.streakDays,
          },
          recentHistory: recentHistoryPayload,
        }),
      });

      const data = await response.json();
      const aiText = data.text || 'Unable to generate coaching response.';
      const newMsgId = `ai-${Date.now()}`;

      addCoachMessage({
        id: newMsgId,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: false,
      });

      // Automatically read response aloud if Voice output is enabled
      if (isVoiceOutputEnabled && isSpeechSynthesisSupported) {
        speakMessage(aiText, newMsgId);
      } else {
        setVoiceState('idle');
      }
    } catch (err: any) {
      console.error('Error contacting AI coach backend:', err);
      // Fallback message using deterministic sports science intelligence
      const fallbackText = generateContextualCoachResponse(
        query,
        {
          name: athlete.name,
          age: athlete.age,
          heightCm: athlete.heightCm,
          weightKg: athlete.weightKg,
          discipline: athlete.discipline,
          tier: athlete.tier,
          fitnessLevel: athlete.fitnessLevel,
          activityLevel: athlete.activityLevel,
          trainingExperience: athlete.trainingExperience,
          goals: athlete.goals,
          workoutLocation: athlete.workoutLocation,
          availableEquipment: athlete.availableEquipment,
          workoutDaysPerWeek: athlete.workoutDaysPerWeek,
          workoutDurationMinutes: athlete.workoutDurationMinutes,
          dietPreference: athlete.dietPreference,
          performanceScore: athlete.performanceScore,
          formScore: athlete.formScore,
          streakDays: athlete.streakDays,
        },
        recentHistoryPayload,
        historyPayload
      );

      const fallbackMsgId = `ai-fallback-${Date.now()}`;
      addCoachMessage({
        id: fallbackMsgId,
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: false,
      });

      if (isVoiceOutputEnabled && isSpeechSynthesisSupported) {
        speakMessage(fallbackText, fallbackMsgId);
      } else {
        setVoiceState('idle');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper to format inline bold text (**text**)
   */
  const renderInlineFormatted = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  /**
   * Formats structured text with highlighted headers, workout steps, bullet lists, and coaching tips
   */
  const renderStructuredContent = (rawText: string) => {
    const lines = rawText.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          if (trimmed === 'RECOMMENDATION' || trimmed === 'RECOMMENDATION:') {
            return (
              <div
                key={idx}
                className="font-sans text-[11px] tracking-normal text-[#0066FF] font-semibold pt-1"
              >
                RECOMMENDATION
              </div>
            );
          }

          if (trimmed.startsWith("Today's Focus:") || trimmed.startsWith('Todays Focus:')) {
            return (
              <div key={idx} className="bg-white/5 p-2 rounded-lg border border-white/5 my-1.5">
                <span className="text-[10px] font-sans text-[#6B7280] uppercase block font-semibold">
                  Today's Focus
                </span>
                <span className="font-semibold text-white text-sm">
                  {trimmed.replace(/Today'?s Focus:\s*/i, '')}
                </span>
              </div>
            );
          }

          if (
            trimmed === 'Workout:' ||
            trimmed === 'Workout / Protocol:' ||
            trimmed.startsWith('Workout:')
          ) {
            return (
              <div
                key={idx}
                className="font-semibold text-white text-xs tracking-normal pt-2 text-[#0066FF]"
              >
                {trimmed}
              </div>
            );
          }

          if (/^\d+\.\s+/.test(trimmed)) {
            return (
              <div
                key={idx}
                className="pl-3 py-1.5 font-sans text-xs text-white border-l-2 border-[#0066FF] bg-[#141620] rounded-r my-1"
              >
                {renderInlineFormatted(trimmed)}
              </div>
            );
          }

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const bulletText = trimmed.startsWith('• ') ? trimmed.slice(2) : trimmed.slice(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 text-zinc-300">
                <span className="text-[#0066FF] font-bold mt-0.5">•</span>
                <span className="flex-1">{renderInlineFormatted(bulletText)}</span>
              </div>
            );
          }

          if (trimmed.startsWith('COACHING TIP:') || trimmed === 'COACHING TIP') {
            return (
              <div
                key={idx}
                className="mt-3 p-3 rounded-lg bg-[#0066FF]/10 border border-[#0066FF]/30 space-y-1"
              >
                <div className="text-[10px] font-sans font-semibold uppercase text-[#0066FF] tracking-normal">
                  COACHING TIP &amp; BIOMECHANICS
                </div>
                <div className="text-xs text-white/90">
                  {renderInlineFormatted(trimmed.replace(/^COACHING TIP:?\s*/i, ''))}
                </div>
              </div>
            );
          }

          if (trimmed.startsWith('FORM CHECK:') || trimmed === 'FORM CHECK') {
            return (
              <div
                key={idx}
                className="mt-2 text-[11px] font-sans font-semibold uppercase text-[#00FF66] tracking-wide"
              >
                FORM CHECK
              </div>
            );
          }

          if (trimmed.startsWith('COMMON MISTAKE:') || trimmed === 'COMMON MISTAKE') {
            return (
              <div
                key={idx}
                className="mt-2 text-[11px] font-sans font-semibold uppercase text-amber-400 tracking-wide"
              >
                COMMON MISTAKE
              </div>
            );
          }

          return (
            <p key={idx} className="text-zinc-300">
              {renderInlineFormatted(line)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Page Header with AI Voice Coach Status & Athlete Synchronization */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
            <Sparkles className="w-4 h-4" />
            <span>Context-Aware AI Voice Coach · Personal Sports Scientist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-white mt-1">
            AXIO AI Voice Coach
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-normal">
            Speak or type your questions for personalized exercise technique, workouts, recovery, and nutrition.
          </p>
        </div>

        {/* Action Pills: Voice Status, Auto-Speech Toggle & Profile Sync */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dynamic Voice State Pill */}
          {voiceState === 'listening' ? (
            <div className="bg-[#00FF66]/15 border border-[#00FF66]/40 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping shrink-0" />
              <span className="font-semibold text-[11px]">LISTENING...</span>
              <AudioWaveform active={true} color="#00FF66" barCount={4} />
              <button
                type="button"
                onClick={stopListening}
                className="p-1 hover:bg-[#00FF66]/20 rounded text-[#00FF66]"
                title="Stop microphone"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            </div>
          ) : voiceState === 'speaking' ? (
            <div className="bg-[#0066FF]/20 border border-[#0066FF]/50 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-white shadow-[0_0_12px_rgba(0,102,255,0.25)]">
              <AudioWaveform active={!isSpeechPaused} color="#0066FF" barCount={4} />
              <span className="font-semibold text-[11px] text-[#0066FF]">
                {isSpeechPaused ? 'PAUSED' : 'COACH SPEAKING'}
              </span>
              <div className="flex items-center gap-1 ml-1 pl-1 border-l border-white/10">
                <button
                  type="button"
                  onClick={togglePauseResume}
                  className="p-1 text-zinc-300 hover:text-white rounded"
                  title={isSpeechPaused ? 'Resume speaking' : 'Pause speaking'}
                >
                  {isSpeechPaused ? (
                    <Play className="w-3 h-3 fill-current text-[#0066FF]" />
                  ) : (
                    <Pause className="w-3 h-3 text-[#0066FF]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={stopSpeech}
                  className="p-1 text-zinc-300 hover:text-red-400 rounded"
                  title="Stop voice playback"
                >
                  <Square className="w-3 h-3 fill-current text-zinc-400" />
                </button>
              </div>
            </div>
          ) : voiceState === 'processing' ? (
            <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-[#0066FF]">
              <div className="w-3 h-3 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="font-semibold text-[11px]">ANALYZING...</span>
            </div>
          ) : voiceState === 'error' ? (
            <div className="bg-amber-950/40 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-[11px]">VOICE ERROR</span>
            </div>
          ) : (
            <div className="bg-[#121318] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
              <span className="font-sans text-[11px] font-medium text-zinc-300">VOICE ACTIVE</span>
            </div>
          )}

          {/* Voice Response Auto-Read Toggle */}
          {isSpeechSynthesisSupported && (
            <button
              type="button"
              onClick={toggleVoiceOutput}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-sans transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                isVoiceOutputEnabled
                  ? 'bg-[#0066FF]/15 border-[#0066FF]/40 text-[#0066FF]'
                  : 'bg-[#121318] border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title={
                isVoiceOutputEnabled
                  ? 'Voice response is ON (Click to mute)'
                  : 'Voice response is OFF (Click to enable audio reading)'
              }
            >
              {isVoiceOutputEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="font-medium text-[11px] hidden sm:inline">Voice ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="font-medium text-[11px] hidden sm:inline">Voice OFF</span>
                </>
              )}
            </button>
          )}

          {/* Profile Sync Pill */}
          <div className="bg-[#121318] border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
            <div className="font-sans text-[11px] text-white font-medium">
              <span className="text-[#0066FF] font-semibold">{athlete.name.split(' ')[0]}</span>
              <span className="text-zinc-400 ml-1">
                ({athlete.fitnessLevel || 'Beginner'} · {athlete.workoutLocation || 'Home'})
              </span>
            </div>
          </div>

          {/* Reset Conversation */}
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              stopListening();
              clearCoachConversation();
            }}
            className="p-2 text-zinc-400 hover:text-white bg-[#121318] border border-white/10 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Prompt Buttons */}
      <div className="space-y-2">
        <span className="text-[11px] font-sans text-zinc-400 font-semibold block tracking-normal">
          Suggested Questions &amp; Commands (Speak or Click)
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {SUGGESTED_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              disabled={isLoading || voiceState === 'listening'}
              onClick={() => handleSend(promptText)}
              className="text-xs bg-[#11131B] hover:bg-[#161824] active:bg-[#0066FF] active:text-white text-zinc-300 hover:text-white border border-white/[0.07] hover:border-white/[0.15] px-3 py-1.5 rounded-lg transition-all duration-150 ease-out font-sans text-left disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Viewport */}
      <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-4 sm:p-6 min-h-[500px] flex flex-col justify-between space-y-6 shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
        {/* Messages List */}
        <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">
                <Bot className="w-6 h-6 text-[#0066FF]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">AXIO AI Voice Coach Ready</h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Tap the microphone button to ask with your voice, or type a question to receive real-time sports science guidance.
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            const isThisSpeaking = currentlySpeakingMessageId === m.id;

            return (
              <div
                key={m.id}
                className={`flex gap-3.5 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-[#0066FF]/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 sm:p-5 space-y-3 relative group ${
                    isAi
                      ? 'bg-[#0B0C10] border border-white/[0.08] text-white rounded-bl-none shadow-md'
                      : 'bg-gradient-to-r from-[#0066FF] to-[#0055EE] text-white rounded-br-none shadow-[0_2px_8px_rgba(0,102,255,0.25)]'
                  }`}
                >
                  {/* Message Meta Header */}
                  <div className="flex items-center justify-between gap-4 text-[10px] font-sans opacity-70 border-b border-white/10 pb-1.5 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{isAi ? 'AXIO AI VOICE COACH' : athlete.name}</span>
                      {isThisSpeaking && (
                        <span className="flex items-center gap-1 text-[#0066FF] font-semibold bg-[#0066FF]/10 px-1.5 py-0.2 rounded border border-[#0066FF]/30">
                          <AudioWaveform active={!isSpeechPaused} color="#0066FF" barCount={3} />
                          <span>{isSpeechPaused ? 'PAUSED' : 'PLAYING'}</span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono tabular-nums">{m.timestamp}</span>
                  </div>

                  {/* Message Content */}
                  {isAi ? (
                    renderStructuredContent(m.text)
                  ) : (
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">{m.text}</p>
                  )}

                  {/* Quick Actions: Spoken Playback Controls & Copy */}
                  {isAi && (
                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans text-zinc-400">
                      <span className="text-[10px]">
                        {athlete.fitnessLevel} · {athlete.goals?.[0] || 'Fitness'}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Voice Response Controls (Play, Pause, Stop, Replay) */}
                        {isSpeechSynthesisSupported && (
                          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 border border-white/5">
                            {isThisSpeaking ? (
                              <>
                                <button
                                  type="button"
                                  onClick={togglePauseResume}
                                  className="inline-flex items-center gap-1 text-[#0066FF] hover:text-blue-300 px-2 py-0.5 rounded transition-colors"
                                  title={isSpeechPaused ? 'Resume reading' : 'Pause speech'}
                                >
                                  {isSpeechPaused ? (
                                    <>
                                      <Play className="w-3 h-3 fill-current" />
                                      <span className="text-[10px]">Resume</span>
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="w-3 h-3" />
                                      <span className="text-[10px]">Pause</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={stopSpeech}
                                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 px-2 py-0.5 rounded transition-colors"
                                  title="Stop speaking"
                                >
                                  <Square className="w-3 h-3 fill-current" />
                                  <span className="text-[10px]">Stop</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => speakMessage(m.text, m.id)}
                                  className="inline-flex items-center gap-1 text-zinc-300 hover:text-white px-2 py-0.5 rounded transition-colors"
                                  title="Read this response aloud"
                                >
                                  <Volume2 className="w-3 h-3 text-[#0066FF]" />
                                  <span className="text-[10px]">Listen</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => replaySpeech(m.text, m.id)}
                                  className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded transition-colors"
                                  title="Replay from start"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(m.text, m.id)}
                          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] rounded px-1.5 py-0.5"
                          title="Copy message"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                              <span className="text-[#0066FF]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-lg bg-[#181A22] border border-white/10 flex items-center justify-center text-white shrink-0 mt-1 font-sans text-xs font-semibold">
                    {athlete.avatarInitials || 'AV'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-zinc-400 font-sans pl-11">
              <div className="w-4 h-4 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
              <span>Analyzing question &amp; coaching context with Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Microphone & Text Submission */}
        <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
          {/* Active Listening Audio Banner */}
          {voiceState === 'listening' && (
            <div className="bg-[#00FF66]/10 border border-[#00FF66]/30 px-3 py-2 rounded-xl flex items-center justify-between text-xs text-[#00FF66] animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping shrink-0" />
                <span className="font-semibold text-[11px]">MICROPHONE ACTIVE:</span>
                <span className="text-zinc-300 font-sans text-xs">
                  Speak clearly. Speech updates input below live for your review.
                </span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="text-[11px] font-sans font-semibold underline text-[#00FF66] hover:text-white ml-2 shrink-0"
              >
                Finish Speaking
              </button>
            </div>
          )}

          {/* Voice / Recognition Error Banner */}
          {voiceError && (
            <div className="text-xs text-amber-300 flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{voiceError}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                className="text-[11px] text-zinc-400 hover:text-white underline ml-3 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* API Backend Error Banner */}
          {apiError && (
            <div className="text-xs text-amber-400 flex items-center gap-1.5 p-2 rounded-lg bg-amber-950/20 border border-amber-900/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 sm:gap-3"
          >
            {/* Microphone Button (SpeechRecognition) */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF66] ${
                voiceState === 'listening'
                  ? 'bg-[#00FF66] text-black shadow-[0_0_16px_rgba(0,255,102,0.5)] ring-2 ring-[#00FF66]/60 animate-pulse'
                  : 'bg-[#121318] hover:bg-[#181A22] text-zinc-300 hover:text-[#00FF66] border border-white/10 hover:border-[#00FF66]/40'
              }`}
              title={
                voiceState === 'listening'
                  ? 'Listening now. Click to stop voice input.'
                  : isSpeechRecognitionSupported
                  ? 'Start voice input (Speak your question)'
                  : 'Speech recognition unavailable in this browser'
              }
              aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start voice input'}
            >
              {voiceState === 'listening' ? (
                <Radio className="w-4 h-4 text-black animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Text Input with Live Transcription Display */}
            <input
              type="text"
              placeholder={
                voiceState === 'listening'
                  ? 'Listening... Speak now (you can edit text before sending)'
                  : `Ask Coach anything: "How many push-ups do I need to do?", squat form, nutrition...`
              }
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#0A0B0E] text-white text-sm px-4 py-3 rounded-xl border border-white/[0.08] hover:border-white/[0.14] focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/40 focus:outline-none transition-all placeholder:text-zinc-500"
            />

            {/* Send Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !input.trim()}
              isLoading={isLoading}
              iconLeft={<Send className="w-4 h-4" />}
            >
              Ask Coach
            </Button>
          </form>

          {/* Browser Fallback & Accessibility Hint */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-sans">
            <span>
              {isSpeechRecognitionSupported
                ? 'Tap mic to dictate in English · Edit text anytime before sending'
                : 'Microphone recognition unsupported in this browser · Text chat fully active'}
            </span>
            <span className="hidden sm:inline">
              {isSpeechSynthesisSupported
                ? 'Audio response playback enabled'
                : 'Audio playback unsupported'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
