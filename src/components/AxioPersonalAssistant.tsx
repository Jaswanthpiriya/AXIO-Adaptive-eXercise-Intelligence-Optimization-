/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness & Human Performance Platform
 * AxioPersonalAssistant — Voice & Action Enabled Personal AI Assistant
 * Connected with Workout execution, Nutrition planning, Progress analytics, and App Navigation
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Mic,
  MicOff,
  Send,
  Square,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  CornerDownLeft,
  Info,
  AlertCircle,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  HelpCircle,
  Dumbbell,
  Utensils,
  TrendingUp,
  AlertTriangle,
  Play,
  Check,
  Globe,
} from 'lucide-react';
import { useAxio } from '../context/AxioContext.tsx';
import {
  AssistantVoiceState,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startAssistantSpeechRecognition,
  speakAssistantResponse,
  stopAssistantSpeech,
} from '../utils/assistantVoice.ts';
import {
  parseAssistantCommand,
  AssistantActionResult,
} from '../utils/assistantActionRegistry.ts';
import {
  AssistantLanguage,
  DetectedLanguage,
  detectMessageLanguage,
  getLocalizedActionStrings,
  SUGGESTED_COMMANDS_TELUGU,
} from '../utils/multilingualAssistant.ts';
import {
  isWorkoutActive,
  getActiveWorkoutSession,
  startWorkoutSession,
  finishWorkoutSession,
  getCurrentWorkoutPlan,
  getTodayCompletedExercises,
} from '../utils/workoutStateManager.ts';
import {
  calculateNutritionTargets,
  getTodayNutritionLog,
  markBreakfastCompleted,
  markAllMealsCompleted,
} from '../data/nutritionData.ts';

export interface AxioPersonalAssistantProps {
  className?: string;
  ariaLabel?: string;
}

export interface AssistantInteraction {
  id: string;
  sender: 'user' | 'assistant';
  commandText: string;
  actionBadge: string;
  statusMessage: string;
  isSuccess: boolean;
  isNavigation: boolean;
  spokenText?: string;
  timestamp: string;
  isConfirmationPrompt?: boolean;
}

export interface PendingConfirmationState {
  actionType: 'finish_workout' | 'complete_daily_nutrition';
  title: string;
  prompt: string;
}

export const SUGGESTED_COMMAND_GROUPS = [
  {
    category: 'Workout Actions',
    commands: [
      'Start my workout',
      'Show my workout plan',
      "Show today's completed exercises",
      'Finish my workout',
    ],
  },
  {
    category: 'Nutrition Actions',
    commands: [
      'Create my nutrition plan',
      'Open my nutrition plan',
      'Mark breakfast as completed',
      "Mark today's nutrition plan as completed",
    ],
  },
  {
    category: 'Progress & Analytics',
    commands: [
      'Show my progress',
      'Show my workout history',
    ],
  },
  {
    category: 'Navigation',
    commands: [
      'Open my dashboard',
      'Open AI Camera',
      'Go back',
    ],
  },
];

export const AxioPersonalAssistant: React.FC<AxioPersonalAssistantProps> = ({
  className = '',
  ariaLabel = 'Ask AXI',
}) => {
  const {
    athlete,
    workoutHistory,
    saveWorkoutSession,
    currentPage,
    navigateTo,
    goBack,
    assistantLanguage,
    setAssistantLanguage,
  } = useAxio();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState<boolean>(true);
  const [detectedLang, setDetectedLang] = useState<DetectedLanguage>('en');
  const [autoSendVoiceCommands, setAutoSendVoiceCommands] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('axio_auto_send_voice_commands');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [latestInteraction, setLatestInteraction] = useState<AssistantInteraction | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmationState | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const orbButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionInstanceRef = useRef<any>(null);
  const autoSendRef = useRef(autoSendVoiceCommands);
  const handleSendCommandRef = useRef<(cmd: string) => void>(() => {});

  useEffect(() => {
    autoSendRef.current = autoSendVoiceCommands;
  }, [autoSendVoiceCommands]);

  const toggleAutoSendVoiceCommands = useCallback(() => {
    setAutoSendVoiceCommands((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('axio_auto_send_voice_commands', String(next));
      } catch {}
      return next;
    });
  }, []);

  const hasSpeechRec = isSpeechRecognitionSupported();
  const hasSpeechSynth = isSpeechSynthesisSupported();

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        orbButtonRef.current &&
        !orbButtonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Clean up any speech recognition or speech synthesis on unmount or panel close
  useEffect(() => {
    return () => {
      if (recognitionInstanceRef.current) {
        try {
          recognitionInstanceRef.current.cancel();
        } catch {
          // ignore
        }
        recognitionInstanceRef.current = null;
      }
      stopAssistantSpeech();
    };
  }, []);

  // Stop active speech playback
  const handleStopSpeaking = useCallback(() => {
    stopAssistantSpeech();
    setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
  }, []);

  // Stop speech recognition and cancel capture (no unintended command submitted)
  const cancelListening = useCallback(() => {
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.cancel();
      } catch {
        // ignore
      }
      recognitionInstanceRef.current = null;
    }
    setLiveTranscript('');
    setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
  }, []);

  // Stop speech recognition and finalize whatever was spoken
  const stopListeningAndSubmit = useCallback(() => {
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.stop();
      } catch {
        // ignore
      }
      recognitionInstanceRef.current = null;
    }
    setLiveTranscript('');
    setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
  }, []);

  const stopListening = useCallback(() => {
    cancelListening();
  }, [cancelListening]);

  // Execute spoken readout of response text
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!isVoiceOutputEnabled || !hasSpeechSynth) return;

      stopAssistantSpeech();
      setVoiceState('speaking');

      const isTe =
        assistantLanguage === 'te' ||
        (assistantLanguage === 'auto' &&
          (detectedLang === 'te' || detectedLang === 'tenglish')) ||
        /[\u0C00-\u0C7F]/.test(textToSpeak);

      speakAssistantResponse(textToSpeak, {
        lang: isTe ? 'te-IN' : 'en-US',
        onStart: () => {
          setVoiceState('speaking');
        },
        onEnd: () => {
          setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
        },
        onError: () => {
          setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
        },
      });
    },
    [isVoiceOutputEnabled, hasSpeechSynth, assistantLanguage, detectedLang]
  );

  // Start speech recognition explicitly on user click
  const startListening = useCallback(() => {
    stopAssistantSpeech();
    setVoiceError(null);
    setLiveTranscript('');

    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.cancel();
      } catch {
        // ignore
      }
      recognitionInstanceRef.current = null;
    }

    const speechLang =
      assistantLanguage === 'te'
        ? 'te-IN'
        : assistantLanguage === 'auto' && detectedLang === 'te'
        ? 'te-IN'
        : 'en-US';

    const recognition = startAssistantSpeechRecognition({
      continuous: true,
      silenceTimeoutMs: 1500,
      lang: speechLang,
      onStart: () => {
        setVoiceState('listening');
        setVoiceError(null);
      },
      onInterim: (_interimText, fullTranscript) => {
        setLiveTranscript(fullTranscript);
        setInputValue(fullTranscript);
        if (assistantLanguage === 'auto' && fullTranscript.trim()) {
          const l = detectMessageLanguage(fullTranscript, 'auto');
          setDetectedLang(l.detectedLanguage);
        }
      },
      onResult: (transcriptText) => {
        setLiveTranscript(transcriptText);
        setInputValue(transcriptText);
        if (assistantLanguage === 'auto' && transcriptText.trim()) {
          const l = detectMessageLanguage(transcriptText, 'auto');
          setDetectedLang(l.detectedLanguage);
        }
      },
      onFinalUtterance: (finalTranscript) => {
        const cleaned = finalTranscript.trim();
        if (!cleaned) return;

        setLiveTranscript('');
        setInputValue(cleaned);
        if (assistantLanguage === 'auto') {
          const l = detectMessageLanguage(cleaned, 'auto');
          setDetectedLang(l.detectedLanguage);
        }

        if (autoSendRef.current) {
          // Automatically submit the completed voice command to existing command-processing flow
          handleSendCommandRef.current(cleaned);
        } else {
          // Auto-send disabled: place transcript in the input field without auto-submitting
          setVoiceState('idle');
        }
      },
      onError: (errorMsg) => {
        setVoiceError(errorMsg);
        setVoiceState('error');
        setLiveTranscript('');
        recognitionInstanceRef.current = null;
      },
      onEnd: () => {
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
        setLiveTranscript('');
        recognitionInstanceRef.current = null;
      },
    });

    if (recognition) {
      recognitionInstanceRef.current = recognition;
    } else {
      setVoiceState('error');
    }
  }, [assistantLanguage, detectedLang]);

  const toggleListening = useCallback(() => {
    if (voiceState === 'listening') {
      cancelListening();
    } else {
      startListening();
    }
  }, [voiceState, cancelListening, startListening]);

  // Execute confirmation of a pending consequential action
  const executeConfirmedAction = useCallback(
    (confirmationType: 'finish_workout' | 'complete_daily_nutrition') => {
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setPendingConfirmation(null);

      const isTe =
        assistantLanguage === 'te' ||
        (assistantLanguage === 'auto' &&
          (detectedLang === 'te' || detectedLang === 'tenglish'));

      if (confirmationType === 'finish_workout') {
        const finishResult = finishWorkoutSession(athlete, saveWorkoutSession);
        if (finishResult.success && finishResult.sessionRecord) {
          const rec = finishResult.sessionRecord;
          const strings = getLocalizedActionStrings(
            'finish_workout',
            {
              sessionRecord: rec,
              actionBadge: 'Workout Finished',
              statusMessage: `Workout session finished and recorded to training history: "${rec.title}" (${rec.durationMinutes} min, ${rec.totalVolumeKg.toLocaleString()} kg volume, ${rec.setsCompleted} sets).`,
              spokenMessage: `Workout finished! Your session has been recorded into your training history with ${rec.durationMinutes} minutes and ${rec.totalVolumeKg} kilograms of volume.`,
            },
            isTe ? 'te' : 'en'
          );

          const interaction: AssistantInteraction = {
            id: String(Date.now()),
            sender: 'assistant',
            commandText: isTe ? 'వర్కౌట్ ముగింపు నిర్ధారణ' : 'Confirm Finish Workout',
            actionBadge: strings.actionBadge,
            statusMessage: strings.statusMessage,
            isSuccess: true,
            isNavigation: false,
            spokenText: strings.spokenMessage,
            timestamp: timeString,
          };
          setLatestInteraction(interaction);
          speakText(strings.spokenMessage);
        } else {
          const statusMessage = isTe
            ? 'వర్కౌట్ ముగించడం సాధ్యం కాలేదు: యాక్టివ్ వర్కౌట్ సెషన్ కనుగొనబడలేదు.'
            : 'Unable to finish workout: No active workout session found.';
          const spokenMessage = isTe
            ? 'యాక్టివ్ సెషన్ లేకపోవడం వల్ల వర్కౌట్ ముగించలేకపోయాము.'
            : 'Unable to finish workout because no active session was found.';
          const interaction: AssistantInteraction = {
            id: String(Date.now()),
            sender: 'assistant',
            commandText: isTe ? 'వర్కౌట్ ముగింపు' : 'Confirm Finish Workout',
            actionBadge: isTe ? 'ముగింపు విఫలమైంది' : 'Finish Failed',
            statusMessage,
            isSuccess: false,
            isNavigation: false,
            spokenText: spokenMessage,
            timestamp: timeString,
          };
          setLatestInteraction(interaction);
          speakText(spokenMessage);
        }
      } else if (confirmationType === 'complete_daily_nutrition') {
        const result = markAllMealsCompleted(athlete);
        if (result.success) {
          const strings = getLocalizedActionStrings(
            'mark_all_nutrition_completed',
            {
              mealsCount: result.mealsCount,
              actionBadge: 'Nutrition Completed',
              statusMessage: `Marked today's nutrition plan as completed: All ${result.mealsCount} scheduled meals logged (${result.totalCalories.toLocaleString()} kcal, ${result.totalProtein}g protein).`,
              spokenMessage: `Today's complete nutrition plan marked as completed. All ${result.mealsCount} scheduled meals have been logged.`,
            },
            isTe ? 'te' : 'en'
          );

          const interaction: AssistantInteraction = {
            id: String(Date.now()),
            sender: 'assistant',
            commandText: isTe ? 'న్యూట్రిషన్ ప్లాన్ పూర్తి నిర్ధారణ' : 'Confirm Complete Nutrition Plan',
            actionBadge: strings.actionBadge,
            statusMessage: strings.statusMessage,
            isSuccess: true,
            isNavigation: false,
            spokenText: strings.spokenMessage,
            timestamp: timeString,
          };
          setLatestInteraction(interaction);
          speakText(strings.spokenMessage);
        } else {
          const statusMessage = isTe
            ? 'న్యూట్రిషన్ ప్లాన్ అప్‌డేట్ చేయడం విఫలమైంది.'
            : 'Failed to mark nutrition plan complete.';
          const spokenMessage = isTe
            ? 'ప్రస్తుతం న్యూట్రిషన్ ప్లాన్ అప్‌డేట్ చేయడం సాధ్యం కాలేదు.'
            : 'Unable to update nutrition plan at this time.';
          const interaction: AssistantInteraction = {
            id: String(Date.now()),
            sender: 'assistant',
            commandText: isTe ? 'న్యూట్రిషన్ ప్లాన్ పూర్తి' : 'Confirm Complete Nutrition Plan',
            actionBadge: isTe ? 'అప్‌డేట్ విఫలమైంది' : 'Update Failed',
            statusMessage,
            isSuccess: false,
            isNavigation: false,
            spokenText: spokenMessage,
            timestamp: timeString,
          };
          setLatestInteraction(interaction);
          speakText(spokenMessage);
        }
      }
    },
    [athlete, saveWorkoutSession, speakText, assistantLanguage, detectedLang]
  );

  // Cancel a pending confirmation
  const cancelPendingAction = useCallback(() => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPendingConfirmation(null);
    const isTe =
      assistantLanguage === 'te' ||
      (assistantLanguage === 'auto' &&
        (detectedLang === 'te' || detectedLang === 'tenglish'));
    const strings = getLocalizedActionStrings(
      'cancellation',
      {
        actionBadge: 'Action Cancelled',
        statusMessage: 'Operation cancelled by user. No data was modified.',
        spokenMessage: 'Action cancelled. No changes were made.',
      },
      isTe ? 'te' : 'en'
    );

    const interaction: AssistantInteraction = {
      id: String(Date.now()),
      sender: 'assistant',
      commandText: isTe ? 'రద్దు చర్య' : 'Cancel Action',
      actionBadge: strings.actionBadge,
      statusMessage: strings.statusMessage,
      isSuccess: false,
      isNavigation: false,
      spokenText: strings.spokenMessage,
      timestamp: timeString,
    };
    setLatestInteraction(interaction);
    speakText(strings.spokenMessage);
  }, [speakText, assistantLanguage, detectedLang]);

  // Main command processing pipeline
  const handleSendCommand = useCallback(
    (commandText: string) => {
      const trimmed = commandText.trim();
      if (!trimmed) return;

      if (voiceState === 'listening') {
        stopListening();
      }

      setVoiceState('processing');
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Check if user is confirming or cancelling an active pending confirmation
      if (pendingConfirmation) {
        const parseResult = parseAssistantCommand(trimmed, true, assistantLanguage);
        if (parseResult.type === 'confirmation') {
          executeConfirmedAction(pendingConfirmation.actionType);
          setInputValue('');
          return;
        } else if (parseResult.type === 'cancellation') {
          cancelPendingAction();
          setInputValue('');
          return;
        }
      }

      // 1. Parse command through typed action registry with language preference
      const parseResult = parseAssistantCommand(trimmed, false, assistantLanguage);
      const effLang = parseResult.effectiveLanguage || (assistantLanguage === 'te' ? 'te' : 'en');
      if (parseResult.detectedLanguage) {
        setDetectedLang(parseResult.detectedLanguage);
      }

      let actionBadge = '';
      let statusMessage = '';
      let spokenMessage = '';
      let isSuccess = false;
      let isNavigation = false;
      let isConfirmationPrompt = false;

      switch (parseResult.type) {
        // --- WORKOUT ACTIONS ---
        case 'start_workout': {
          const workoutRes = startWorkoutSession(athlete);
          if (workoutRes.success) {
            navigateTo('workout');
            const strings = getLocalizedActionStrings(
              'start_workout',
              {
                title: workoutRes.plan.title,
                duration: workoutRes.plan.durationMinutes,
                exercisesCount: workoutRes.plan.exercises.length,
                actionBadge: 'Started Workout',
                statusMessage: `Started active workout session: "${workoutRes.plan.title}" (${workoutRes.plan.durationMinutes} min, ${workoutRes.plan.difficulty}). ${workoutRes.plan.exercises.length} exercises queued.`,
                spokenMessage: `Starting your workout: ${workoutRes.plan.title}. ${workoutRes.plan.exercises.length} exercises queued. Let's get moving!`,
              },
              effLang
            );
            actionBadge = strings.actionBadge;
            statusMessage = strings.statusMessage;
            spokenMessage = strings.spokenMessage;
            isSuccess = true;
            isNavigation = true;
          } else {
            actionBadge = effLang === 'te' ? 'వర్కౌట్ ప్రారంభం విఫలమైంది' : 'Workout Start Failed';
            statusMessage = effLang === 'te' ? 'యాక్టివ్ వర్కౌట్ సెషన్ ప్రారంభించడం సాధ్యం కాలేదు.' : 'Could not initialize active workout session.';
            spokenMessage = effLang === 'te' ? 'వర్కౌట్ సెషన్ ప్రారంభించడం సాధ్యం కాలేదు.' : 'Unable to start workout session.';
            isSuccess = false;
          }
          break;
        }

        case 'show_workout_plan': {
          navigateTo('workout');
          const plan = getCurrentWorkoutPlan(athlete);
          const exNames = plan.exercises.map((e) => e.name).join(', ');
          const strings = getLocalizedActionStrings(
            'show_workout_plan',
            {
              title: plan.title,
              duration: plan.durationMinutes,
              exerciseNames: exNames,
              exercisesCount: plan.exercises.length,
              actionBadge: 'Workout Plan',
              statusMessage: `Workout Plan: "${plan.title}" (${plan.durationMinutes} min, ${plan.difficulty}). Exercises: ${exNames}.`,
              spokenMessage: `Here is your workout plan: ${plan.title}, consisting of ${plan.exercises.length} exercises: ${plan.exercises.slice(0, 2).map((e) => e.name).join(', ')}.`,
            },
            effLang
          );
          actionBadge = strings.actionBadge;
          statusMessage = strings.statusMessage;
          spokenMessage = strings.spokenMessage;
          isSuccess = true;
          isNavigation = true;
          break;
        }

        case 'finish_workout': {
          // Check if workout is actually running
          if (!isWorkoutActive()) {
            const strings = getLocalizedActionStrings(
              'finish_workout',
              {
                noActiveWorkout: true,
                actionBadge: 'No Active Workout',
                statusMessage: 'There is currently no active workout session running. Say "Start my workout" when you are ready to train.',
                spokenMessage: 'There is currently no active workout session to finish. Say "Start my workout" when you are ready to train.',
              },
              effLang
            );
            actionBadge = strings.actionBadge;
            statusMessage = strings.statusMessage;
            spokenMessage = strings.spokenMessage;
            isSuccess = false;
            isNavigation = false;
          } else {
            const strings = getLocalizedActionStrings(
              'finish_workout',
              { isConfirmation: true },
              effLang
            );
            // Require user confirmation before ending and logging session
            setPendingConfirmation({
              actionType: 'finish_workout',
              title: effLang === 'te' ? 'యాక్టివ్ వర్కౌట్ సెషన్‌ను ముగించాలా?' : 'Finish Active Workout Session?',
              prompt: effLang === 'te'
                ? 'మీరు మీ యాక్టివ్ వర్కౌట్ సెషన్‌ను ఇప్పుడే ముగించాలనుకుంటున్నారా? ప్రస్తుత సెట్లు మీ శిక్షణ చరిత్రలో భద్రపరచబడతాయి.'
                : (parseResult.confirmationPrompt || 'Are you sure you want to finish your active workout session now? Current sets and training load will be saved to your history.'),
            });
            actionBadge = strings.actionBadge;
            statusMessage = strings.statusMessage;
            spokenMessage = strings.spokenMessage;
            isSuccess = true;
            isNavigation = false;
            isConfirmationPrompt = true;
          }
          break;
        }

        case 'show_completed_exercises': {
          const completedExercises = getTodayCompletedExercises(workoutHistory);
          if (completedExercises.length > 0) {
            const summary = completedExercises
              .map((e) => `${e.name} (${e.setsCount} set${e.setsCount > 1 ? 's' : ''})`)
              .join(', ');
            const strings = getLocalizedActionStrings(
              'show_completed_exercises',
              {
                count: completedExercises.length,
                summary,
                actionBadge: `Completed Exercises (${completedExercises.length})`,
                statusMessage: `Today's completed exercises: ${summary}.`,
                spokenMessage: `Today you have completed ${completedExercises.length} exercise${completedExercises.length > 1 ? 's' : ''}: ${summary}.`,
              },
              effLang
            );
            actionBadge = strings.actionBadge;
            statusMessage = strings.statusMessage;
            spokenMessage = strings.spokenMessage;
            isSuccess = true;
            isNavigation = false;
          } else {
            const strings = getLocalizedActionStrings(
              'show_completed_exercises',
              {
                count: 0,
                actionBadge: 'No Exercises Completed',
                statusMessage: 'You haven\'t completed any exercises yet today. Say "Start my workout" to begin your training session!',
                spokenMessage: 'You haven\'t completed any exercises yet today. Say "Start my workout" to begin!',
              },
              effLang
            );
            actionBadge = strings.actionBadge;
            statusMessage = strings.statusMessage;
            spokenMessage = strings.spokenMessage;
            isSuccess = true;
            isNavigation = false;
          }
          break;
        }

        // --- NUTRITION ACTIONS ---
        case 'create_nutrition_plan': {
          const targets = calculateNutritionTargets(athlete);
          getTodayNutritionLog(); // ensure today's log initialized
          navigateTo('nutrition');
          const strings = getLocalizedActionStrings(
            'create_nutrition_plan',
            {
              calories: targets.targetCalories,
              protein: targets.targetProtein,
              water: targets.targetWaterMl,
              diet: athlete.dietPreference || 'High Protein Omnivore',
              actionBadge: 'Created Nutrition Plan',
              statusMessage: `Created personalized nutrition plan for ${athlete.dietPreference || 'High Protein Omnivore'} (${athlete.goals?.[0] || 'Strength'}). Daily targets: ${targets.targetCalories} kcal, ${targets.targetProtein}g protein, ${targets.targetWaterMl}ml hydration.`,
              spokenMessage: `Created your personalized nutrition plan: calibrated for ${athlete.dietPreference || 'High Protein Omnivore'}, targeting ${targets.targetCalories} calories and ${targets.targetProtein} grams of protein.`,
            },
            effLang
          );
          actionBadge = strings.actionBadge;
          statusMessage = strings.statusMessage;
          spokenMessage = strings.spokenMessage;
          isSuccess = true;
          isNavigation = true;
          break;
        }

        case 'open_nutrition_plan': {
          const targets = calculateNutritionTargets(athlete);
          navigateTo('nutrition');
          const strings = getLocalizedActionStrings(
            'open_nutrition_plan',
            {
              calories: targets.targetCalories,
              protein: targets.targetProtein,
              actionBadge: 'Opened Nutrition Plan',
              statusMessage: `Opened nutrition plan. Current diet preference: ${athlete.dietPreference || 'High Protein Omnivore'}. Targets: ${targets.targetCalories} kcal, ${targets.targetProtein}g protein.`,
              spokenMessage: `Opening your nutrition plan for ${athlete.dietPreference || 'High Protein Omnivore'}. Caloric target: ${targets.targetCalories} calories and ${targets.targetProtein} grams of protein.`,
            },
            effLang
          );
          actionBadge = strings.actionBadge;
          statusMessage = strings.statusMessage;
          spokenMessage = strings.spokenMessage;
          isSuccess = true;
          isNavigation = true;
          break;
        }

        case 'mark_breakfast_completed': {
          const res = markBreakfastCompleted(athlete);
          const strings = getLocalizedActionStrings(
            'mark_breakfast_completed',
            {
              alreadyCompleted: res.alreadyCompleted,
              mealTitle: res.mealTitle,
              calories: res.calories,
              protein: res.protein,
              actionBadge: res.alreadyCompleted ? 'Breakfast Already Logged' : 'Breakfast Completed',
              statusMessage: res.alreadyCompleted
                ? `Breakfast was already recorded as completed today at ${res.timestamp} (${res.mealTitle}).`
                : `Marked breakfast as completed: "${res.mealTitle}" (${res.calories} kcal, ${res.protein}g protein logged at ${res.timestamp}).`,
              spokenMessage: res.alreadyCompleted
                ? `Breakfast was already marked as completed today at ${res.timestamp}.`
                : `Marked breakfast as completed: ${res.mealTitle}. Logged ${res.calories} calories and ${res.protein} grams of protein.`,
            },
            effLang
          );
          if (res.alreadyCompleted || res.success) {
            actionBadge = strings.actionBadge;
            statusMessage = strings.statusMessage;
            spokenMessage = strings.spokenMessage;
            isSuccess = true;
            isNavigation = false;
          } else {
            actionBadge = effLang === 'te' ? 'లాగింగ్ విఫలమైంది' : 'Logging Failed';
            statusMessage = effLang === 'te' ? 'నేటి న్యూట్రిషన్ ప్లాన్‌లో అల్పాహారం కనుగొనబడలేదు.' : 'Could not locate breakfast item in today\'s nutrition plan.';
            spokenMessage = effLang === 'te' ? 'మీ ప్రస్తుత ప్లాన్ కోసం అల్పాహారాన్ని లాగ్ చేయడం సాధ్యం కాలేదు.' : 'Unable to log breakfast for your current plan.';
            isSuccess = false;
          }
          break;
        }

        case 'mark_all_nutrition_completed': {
          const strings = getLocalizedActionStrings(
            'mark_all_nutrition_completed',
            { isConfirmation: true },
            effLang
          );
          // Consequential change: require user confirmation
          setPendingConfirmation({
            actionType: 'complete_daily_nutrition',
            title: effLang === 'te' ? 'ఈరోజు న్యూట్రిషన్ ప్లాన్‌ను పూర్తి చేయాలా?' : "Complete Today's Nutrition Plan?",
            prompt: effLang === 'te'
              ? 'ఈరోజు న్యూట్రిషన్ ప్లాన్‌లోని అన్ని భోజనాలను పూర్తయినట్లు మార్క్ చేయాలనుకుంటున్నారా?'
              : (parseResult.confirmationPrompt || 'Are you sure you want to mark all meals in today\'s nutrition plan as completed? All scheduled meals will be logged.'),
          });
          actionBadge = strings.actionBadge;
          statusMessage = strings.statusMessage;
          spokenMessage = strings.spokenMessage;
          isSuccess = true;
          isNavigation = false;
          isConfirmationPrompt = true;
          break;
        }

        // --- PROGRESS ACTIONS ---
        case 'show_progress': {
          navigateTo('progress');
          const strings = getLocalizedActionStrings(
            'show_progress',
            {
              count: workoutHistory?.length || 0,
              volumeKg: athlete.weeklyVolumeKg.toLocaleString(),
              streakDays: athlete.streakDays,
              actionBadge: workoutHistory && workoutHistory.length > 0 ? 'Opened Progress' : 'Opened Progress (0 Sessions)',
              statusMessage: workoutHistory && workoutHistory.length > 0
                ? `Opened progress analytics. ${workoutHistory.length} completed sessions recorded with ${athlete.weeklyVolumeKg.toLocaleString()} kg weekly volume and a ${athlete.streakDays}-day streak.`
                : 'Opened progress analytics. You haven\'t recorded any completed workouts yet. Start a workout session to build your training history.',
              spokenMessage: workoutHistory && workoutHistory.length > 0
                ? `Opening your progress. You have completed ${workoutHistory.length} session${workoutHistory.length > 1 ? 's' : ''} with ${athlete.weeklyVolumeKg.toLocaleString()} kilograms of volume this week.`
                : 'Opening your progress. You haven\'t recorded any completed workouts yet. Say "Start my workout" to log your first session!',
            },
            effLang
          );
          actionBadge = strings.actionBadge;
          statusMessage = strings.statusMessage;
          spokenMessage = strings.spokenMessage;
          isSuccess = true;
          isNavigation = true;
          break;
        }

        case 'show_workout_history': {
          navigateTo('progress');
          const recent = workoutHistory && workoutHistory.length > 0 ? workoutHistory[0] : null;
          const strings = getLocalizedActionStrings(
            'show_workout_history',
            {
              count: workoutHistory?.length || 0,
              recentTitle: recent?.title,
              recentDuration: recent?.durationMinutes,
              recentVolume: recent?.totalVolumeKg,
              actionBadge: workoutHistory && workoutHistory.length > 0 ? `Workout History (${workoutHistory.length})` : 'Workout History Empty',
              statusMessage: workoutHistory && workoutHistory.length > 0
                ? `Workout history: ${workoutHistory.length} verified sessions. Most recent: "${recent?.title}" on ${recent?.date} (${recent?.durationMinutes} min, ${recent?.totalVolumeKg.toLocaleString()} kg volume).`
                : 'Your workout history is currently empty. No sessions have been logged yet. Say "Start my workout" to record your first session!',
              spokenMessage: workoutHistory && workoutHistory.length > 0
                ? `Opening workout history. You have ${workoutHistory.length} logged session${workoutHistory.length > 1 ? 's' : ''}. Most recent: ${recent?.title} on ${recent?.date}.`
                : 'Your workout history is currently empty. No sessions have been logged yet. Say "Start my workout" to begin!',
            },
            effLang
          );
          actionBadge = strings.actionBadge;
          statusMessage = strings.statusMessage;
          spokenMessage = strings.spokenMessage;
          isSuccess = true;
          isNavigation = true;
          break;
        }

        // --- NAVIGATION & ROUTER ACTIONS ---
        case 'navigate': {
          if (parseResult.targetPageId) {
            const targetPage = parseResult.targetPageId;
            const targetLabel = parseResult.targetLabel || targetPage;
            if (currentPage === targetPage) {
              actionBadge = effLang === 'te' ? `ఇప్పటికే ${targetLabel} లో ఉన్నారు` : `Already on ${targetLabel}`;
              statusMessage = effLang === 'te' ? `మీరు ప్రస్తుతం ${targetLabel} పేజీలో ఉన్నారు.` : `You are currently on the ${targetLabel} page.`;
              spokenMessage = effLang === 'te' ? `మీరు ఇప్పటికే ${targetLabel} లో ఉన్నారు.` : `You are already viewing ${targetLabel}.`;
            } else {
              navigateTo(targetPage);
              const strings = getLocalizedActionStrings(
                'navigate',
                {
                  targetLabel,
                  actionBadge: `Opened ${targetLabel}`,
                  statusMessage: `Successfully navigated to ${targetLabel}.`,
                  spokenMessage: `Navigated to ${targetLabel}.`,
                },
                effLang
              );
              actionBadge = strings.actionBadge;
              statusMessage = strings.statusMessage;
              spokenMessage = strings.spokenMessage;
            }
            isSuccess = true;
            isNavigation = true;
          }
          break;
        }

        case 'go_back': {
          const didGoBack = goBack();
          if (didGoBack) {
            const strings = getLocalizedActionStrings(
              'go_back',
              {
                actionBadge: 'Navigated Back',
                statusMessage: 'Returned to previous page in history.',
                spokenMessage: 'Returned to previous page.',
              },
              effLang
            );
            actionBadge = strings.actionBadge;
            statusMessage = strings.statusMessage;
            spokenMessage = strings.spokenMessage;
            isSuccess = true;
            isNavigation = true;
          } else {
            actionBadge = effLang === 'te' ? 'ప్రారంభ పేజీలో ఉన్నారు' : 'At Initial Page';
            statusMessage = effLang === 'te' ? 'ఇప్పటికే ప్రారంభ పేజీలో ఉన్నారు. చరిత్రలో మునుపటి పేజీ లేదు.' : 'Already at the initial page. No previous page in history.';
            spokenMessage = effLang === 'te' ? 'ఇప్పటికే ప్రారంభ పేజీలో ఉన్నారు.' : 'Already at the initial page.';
            isSuccess = false;
            isNavigation = true;
          }
          break;
        }

        case 'ambiguous': {
          actionBadge = effLang === 'te' ? 'స్పష్టత అవసరం' : 'Clarification Needed';
          statusMessage = parseResult.clarificationQuestion || parseResult.feedbackSpeech;
          spokenMessage = parseResult.feedbackSpeech;
          isSuccess = false;
          isNavigation = false;
          break;
        }

        case 'question': {
          const strings = getLocalizedActionStrings(
            'question',
            {
              actionBadge: 'Question Detected',
              statusMessage: parseResult.actionText + ' ' + parseResult.feedbackSpeech,
              spokenMessage: parseResult.feedbackSpeech,
            },
            effLang
          );
          actionBadge = strings.actionBadge;
          statusMessage = strings.statusMessage;
          spokenMessage = strings.spokenMessage;
          isSuccess = false;
          isNavigation = false;
          break;
        }

        default: {
          actionBadge = effLang === 'te' ? 'మద్దతు లేని కమాండ్' : 'Unsupported Command';
          statusMessage = parseResult.feedbackSpeech;
          spokenMessage = parseResult.feedbackSpeech;
          isSuccess = false;
          isNavigation = false;
          break;
        }
      }

      const interaction: AssistantInteraction = {
        id: String(Date.now()),
        sender: 'user',
        commandText: trimmed,
        actionBadge,
        statusMessage,
        isSuccess,
        isNavigation,
        spokenText: spokenMessage,
        timestamp: timeString,
        isConfirmationPrompt,
      };

      setLatestInteraction(interaction);
      setInputValue('');
      setVoiceError(null);

      // Announce outcome only AFTER execution verifies result
      if (isVoiceOutputEnabled && hasSpeechSynth && spokenMessage) {
        speakText(spokenMessage);
      } else {
        setVoiceState('idle');
      }
    },
    [
      voiceState,
      stopListening,
      pendingConfirmation,
      executeConfirmedAction,
      cancelPendingAction,
      athlete,
      workoutHistory,
      saveWorkoutSession,
      currentPage,
      navigateTo,
      goBack,
      isVoiceOutputEnabled,
      hasSpeechSynth,
      speakText,
      assistantLanguage,
    ]
  );

  useEffect(() => {
    handleSendCommandRef.current = handleSendCommand;
  }, [handleSendCommand]);

  const handleSelectSuggestedCommand = useCallback(
    (commandText: string) => {
      setInputValue(commandText);
      handleSendCommand(commandText);
    },
    [handleSendCommand]
  );

  const handleReplaySpeech = useCallback(() => {
    if (latestInteraction?.spokenText) {
      speakText(latestInteraction.spokenText);
    }
  }, [latestInteraction, speakText]);

  return (
    <>
      {/* 1. COMPACT INTERACTION PANEL */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby="axio-assistant-heading"
          aria-modal="false"
          className="fixed z-50 bottom-24 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-[420px] rounded-2xl bg-[#0B0B0D] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(0,255,102,0.15)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              </div>
              <div>
                <h2
                  id="axio-assistant-heading"
                  className="text-sm font-bold text-white tracking-tight"
                >
                  AXI
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Your Personal AI
                  </span>
                  <span className="text-zinc-600 text-[10px]">·</span>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        voiceState === 'listening'
                          ? 'bg-[#00FF66] animate-ping'
                          : voiceState === 'speaking'
                          ? 'bg-[#0066FF] animate-pulse'
                          : voiceState === 'processing'
                          ? 'bg-amber-400 animate-spin'
                          : 'bg-[#00FF66]'
                      }`}
                    />
                    <span className="capitalize font-mono">
                      {voiceState === 'idle'
                        ? 'Ready'
                        : voiceState === 'listening'
                        ? 'AXI is listening…'
                        : voiceState === 'speaking'
                        ? 'Speaking'
                        : voiceState === 'processing'
                        ? 'AXI is thinking…'
                        : 'Error'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Spoken Voice Output Toggle */}
              {hasSpeechSynth && (
                <button
                  type="button"
                  onClick={() => {
                    if (voiceState === 'speaking') {
                      stopAssistantSpeech();
                    }
                    setIsVoiceOutputEnabled((prev) => !prev);
                  }}
                  title={isVoiceOutputEnabled ? 'Mute spoken AI responses' : 'Enable spoken AI responses'}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FF66]"
                >
                  {isVoiceOutputEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#00FF66]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-zinc-500" />
                  )}
                </button>
              )}

              {/* Close Panel Button */}
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  stopAssistantSpeech();
                  setIsOpen(false);
                }}
                aria-label="Close assistant panel"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FF66]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Bar: Language Selector & Auto-Send */}
          <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex flex-col gap-2 text-xs">
            {/* Language Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Globe className="w-3.5 h-3.5 text-[#00FF66]" />
                <span className="font-medium text-white text-[11px]">Language</span>
                {assistantLanguage === 'auto' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">
                    Auto: {detectedLang === 'te' ? 'తెలుగు' : detectedLang === 'tenglish' ? 'Tenglish' : 'English'}
                  </span>
                )}
              </div>
              <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setAssistantLanguage('auto')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    assistantLanguage === 'auto'
                      ? 'bg-[#00FF66] text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Automatic language detection (English, Telugu, Tenglish)"
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setAssistantLanguage('en')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    assistantLanguage === 'en'
                      ? 'bg-[#00FF66] text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="English mode"
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setAssistantLanguage('te')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    assistantLanguage === 'te'
                      ? 'bg-[#00FF66] text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="తెలుగు (Telugu) mode"
                >
                  తెలుగు
                </button>
              </div>
            </div>

            {/* Auto-send Voice Commands Setting Bar */}
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
                <span className="font-medium text-white text-[11px]">Auto-send voice commands</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoSendVoiceCommands}
                onClick={toggleAutoSendVoiceCommands}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00FF66] ${
                  autoSendVoiceCommands ? 'bg-[#00FF66]' : 'bg-zinc-700'
                }`}
                title={
                  autoSendVoiceCommands
                    ? 'Auto-send enabled: completed speech submits automatically'
                    : 'Auto-send disabled: transcript placed in input for review'
                }
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                    autoSendVoiceCommands ? 'translate-x-4 bg-black' : 'translate-x-0 bg-zinc-300'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="p-4 space-y-3.5 max-h-[460px] overflow-y-auto font-sans">
            {/* Welcome Greeting */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs leading-relaxed text-zinc-300">
              <p className="font-semibold text-white mb-0.5">
                {assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                  ? 'హలో, నేను AXI. నేను మీకు ఎలా సహాయపడగలను?'
                  : "Hey, I'm AXI. What can I do for you?"}
              </p>
              <p className="text-zinc-400 text-[11px]">
                {assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                  ? 'మాట్లాడండి లేదా టైప్ చేయండి: వర్కౌట్ ప్రారంభించడం, ప్లాన్లు చూడడం, మీల్స్ లాగ్ చేయడం లేదా మీ పురోగతిని తనిఖీ చేయడం.'
                  : 'Speak or type actions: start workouts, view workout & nutrition plans, log meals, or check your progress.'}
              </p>
            </div>

            {/* Error Banner */}
            {voiceError && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px] leading-tight">{voiceError}</div>
                <button
                  type="button"
                  onClick={() => setVoiceError(null)}
                  className="text-red-400 hover:text-white shrink-0 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Listening Indicator */}
            {voiceState === 'listening' && (
              <div className="p-3 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[#00FF66]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                    <span className="font-bold">AXI is listening…</span>
                    <span className="text-[10px] text-zinc-400">
                      {autoSendVoiceCommands ? '(auto-submits when done)' : '(places speech in input)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={cancelListening}
                      className="px-2 py-0.5 rounded text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={stopListeningAndSubmit}
                      className="px-2.5 py-0.5 rounded bg-[#00FF66] text-black text-[11px] font-bold hover:bg-[#00e65c] transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
                {liveTranscript ? (
                  <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-mono">
                    "{liveTranscript}"
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 italic">
                    Speak clearly. Pause when finished to auto-submit...
                  </p>
                )}
              </div>
            )}

            {/* Processing Indicator */}
            {voiceState === 'processing' && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
                  <span className="font-semibold">AXI is thinking…</span>
                </div>
                <span className="text-[10px] text-amber-400/80 font-mono">Executing</span>
              </div>
            )}

            {/* Stop Speaking Button */}
            {voiceState === 'speaking' && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0066FF]/15 border border-[#0066FF]/40 text-xs text-[#0066FF] animate-in fade-in">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <Volume2 className="w-3.5 h-3.5 text-[#0066FF] animate-pulse" />
                  Speaking response...
                </span>
                <button
                  type="button"
                  onClick={handleStopSpeaking}
                  className="px-2.5 py-1 rounded-lg bg-[#0066FF] hover:bg-[#0055EE] text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  Stop Speaking
                </button>
              </div>
            )}

            {/* PENDING CONFIRMATION CARD (For consequential actions like Finish Workout or Complete Nutrition) */}
            {pendingConfirmation && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <span className="font-bold text-white block">
                      {pendingConfirmation.title}
                    </span>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {pendingConfirmation.prompt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={cancelPendingAction}
                    className="px-3 py-1.5 rounded-lg border border-white/20 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => executeConfirmedAction(pendingConfirmation.actionType)}
                    className="px-3 py-1.5 rounded-lg bg-[#00FF66] hover:bg-[#00e65c] text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(0,255,102,0.4)] cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {/* Latest Interaction & Feedback */}
            {latestInteraction && (
              <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-[10px] font-sans font-semibold text-zinc-400 uppercase tracking-wider">
                  <span>Recognized Action</span>
                  <span className="text-zinc-500 font-mono">{latestInteraction.timestamp}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111217] border border-white/10 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-white break-words">
                      "{latestInteraction.commandText}"
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 border ${
                        latestInteraction.isSuccess
                          ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30'
                          : latestInteraction.actionBadge.includes('Question') || latestInteraction.actionBadge.includes('Clarification')
                          ? 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/30'
                          : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                      }`}
                    >
                      {latestInteraction.actionBadge}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
                    <div className="flex items-start gap-1.5 text-[11px] leading-snug">
                      {latestInteraction.isSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66] shrink-0 mt-0.5" />
                      ) : latestInteraction.actionBadge.includes('Question') || latestInteraction.actionBadge.includes('Clarification') ? (
                        <HelpCircle className="w-3.5 h-3.5 text-[#0066FF] shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          latestInteraction.isSuccess
                            ? 'text-zinc-200'
                            : latestInteraction.actionBadge.includes('Question')
                            ? 'text-zinc-300'
                            : 'text-zinc-400'
                        }
                      >
                        {latestInteraction.statusMessage}
                      </span>
                    </div>

                    {/* Replay Spoken Audio Button */}
                    {hasSpeechSynth && isVoiceOutputEnabled && latestInteraction.spokenText && (
                      <button
                        type="button"
                        onClick={handleReplaySpeech}
                        title="Replay spoken announcement"
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-[#00FF66]" />
                        <span>Replay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Supported Commands by Category */}
            <div className="space-y-3 pt-1 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-[10px] font-sans font-semibold text-zinc-400 uppercase tracking-wider">
                <span>
                  {assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                    ? 'మద్దతు ఉన్న ఆదేశాలు'
                    : 'Supported Voice Actions'}
                </span>
                <span className="text-zinc-500 font-mono text-[9px]">
                  {assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                    ? 'నొక్కండి లేదా మాట్లాడండి'
                    : 'Tap or Speak'}
                </span>
              </div>

              {(assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                ? SUGGESTED_COMMANDS_TELUGU
                : SUGGESTED_COMMAND_GROUPS
              ).map((group) => (
                <div key={group.category} className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium block">
                    {group.category}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {group.commands.map((cmd) => (
                      <button
                        key={cmd}
                        type="button"
                        onClick={() => handleSelectSuggestedCommand(cmd)}
                        className="text-left px-2.5 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#00FF66]/40 text-[11px] text-zinc-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FF66]"
                      >
                        <span className="truncate">{cmd}</span>
                        <CornerDownLeft className="w-3 h-3 text-zinc-500 group-hover:text-[#00FF66] transition-colors shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Footer: Mic, Text Input, Send Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCommand(inputValue);
            }}
            className="p-3 border-t border-white/[0.08] bg-white/[0.02] flex items-center gap-2"
          >
            {/* Microphone Button (SpeechRecognition) */}
            <button
              type="button"
              onClick={toggleListening}
              aria-label={voiceState === 'listening' ? 'Stop voice input' : 'Talk to AXI'}
              title={
                voiceState === 'listening'
                  ? 'Listening... click to stop'
                  : hasSpeechRec
                  ? 'Talk to AXI'
                  : 'Speech recognition unavailable in this browser'
              }
              className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF66] cursor-pointer ${
                voiceState === 'listening'
                  ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.6)] animate-pulse'
                  : 'bg-[#121318] hover:bg-[#181A22] text-zinc-300 hover:text-[#00FF66] border-white/10 hover:border-[#00FF66]/40'
              }`}
            >
              {voiceState === 'listening' ? (
                <MicOff className="w-4 h-4 text-black" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Text Input (Displays recognized speech and allows manual typing/editing) */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (assistantLanguage === 'auto' && e.target.value.trim()) {
                  const l = detectMessageLanguage(e.target.value, 'auto');
                  setDetectedLang(l.detectedLanguage);
                }
              }}
              placeholder={
                voiceState === 'listening'
                  ? assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                    ? 'AXI వింటోంది…'
                    : 'AXI is listening…'
                  : voiceState === 'processing'
                  ? assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                    ? 'AXI ఆలోచిస్తోంది…'
                    : 'AXI is thinking…'
                  : pendingConfirmation
                  ? assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                    ? 'ధృవీకరించడానికి "అవును" లేదా రద్దు చేయడానికి "వద్దు" అని టైప్ చేయండి...'
                    : 'Type "yes" to confirm or "no" to cancel...'
                  : assistantLanguage === 'te' || (assistantLanguage === 'auto' && (detectedLang === 'te' || detectedLang === 'tenglish'))
                  ? 'AXI ని ఏదైనా అడగండి... (ఉదా: "వర్కౌట్ ప్రారంభించండి")'
                  : 'Ask AXI anything…'
              }
              className="flex-1 bg-[#121318] border border-white/10 focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] text-white text-xs rounded-xl px-3 py-2.5 placeholder:text-zinc-500 focus:outline-none transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              aria-label="Send action"
              className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF66] ${
                inputValue.trim()
                  ? 'bg-[#00FF66] hover:bg-[#00e65c] text-black border-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.4)] cursor-pointer'
                  : 'bg-white/5 text-zinc-600 border-white/5 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 2. PERSISTENT FLOATING ORB IN BOTTOM-RIGHT CORNER */}
      <div
        className={`fixed z-40 bottom-6 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 ${className}`}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          ref={orbButtonRef}
          type="button"
          onClick={() => {
            setIsOpen((prev) => {
              if (prev) {
                stopListening();
                stopAssistantSpeech();
              }
              return !prev;
            });
          }}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title="Ask AXI"
          className="relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full cursor-pointer transition-transform duration-300 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00FF66]/50"
        >
          {/* Tooltip on hover when panel is closed: "Ask AXI" */}
          {!isOpen && (
            <span
              role="tooltip"
              className="pointer-events-none absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#12141A] border border-white/15 text-xs font-semibold text-white tracking-wide shadow-[0_4px_20px_rgba(0,0,0,0.8)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out translate-x-2 group-hover:translate-x-0 z-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
              Ask AXI
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-[#12141A]" />
            </span>
          )}
          {/* Outer glowing pulsing halo */}
          <span
            className="absolute inset-0 rounded-full bg-[#00FF66] opacity-35 blur-md pointer-events-none transition-opacity duration-300 group-hover:opacity-75"
            style={{
              animation: 'axio-orb-breathe 3.5s ease-in-out infinite',
            }}
          />

          {/* Electric-lime orbital perimeter ring */}
          <span
            className="absolute -inset-0.5 rounded-full border border-[#00FF66]/80 pointer-events-none shadow-[0_0_16px_rgba(0,255,102,0.6)]"
            style={{
              animation: 'axio-orb-glow-pulse 4s ease-in-out infinite alternate',
            }}
          />

          {/* Obsidian dark core sphere */}
          <span
            className="relative flex items-center justify-center w-full h-full rounded-full bg-[#0B0B0D] border border-white/20 shadow-[inset_0_2px_8px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.8)] overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #1a1e24 0%, #0B0B0D 70%, #050507 100%)',
            }}
          >
            {/* Energy shimmer overlay */}
            <span
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[#00FF66]/20 to-transparent opacity-60 pointer-events-none"
              style={{
                animation: 'axio-orb-shimmer 6s linear infinite',
              }}
            />

            {/* Glowing nucleus center */}
            <span className="relative z-10 flex items-center justify-center">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#00FF66] to-[#00CC52] shadow-[0_0_12px_#00FF66,0_0_24px_rgba(0,255,102,0.8)] flex items-center justify-center">
                {voiceState === 'listening' ? (
                  <Mic className="w-3.5 h-3.5 text-black animate-pulse" />
                ) : voiceState === 'speaking' ? (
                  <Volume2 className="w-3.5 h-3.5 text-black animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white opacity-95 shadow-[0_0_4px_#ffffff]" />
                )}
              </span>
            </span>
          </span>
        </button>
      </div>
    </>
  );
};
