/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO AI CAM — Intelligent Computer-Vision Fitness Coach
 * Real-time webcam pose detection, biomechanical joint angle analysis, rep counting, and form scoring.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  AthleteProfile,
  CompletedWorkoutSession,
  PageId,
} from '../types/app.ts';
import { Button } from '../design-system/components/Button.tsx';
import {
  loadMediaPipePose,
  loadMediaPipeHands,
  drawFullBodyAndHandSkeleton,
  computeVideoTransform,
  PoseSmoother,
  HandSmoother,
  ExerciseAnalyzer,
  ExerciseType,
  AI_CAM_EXERCISES,
  getExerciseConfig,
  PoseAnalysisResult,
  PostureFeedback,
  AiCamStatus,
  MovementPhase,
} from '../utils/poseDetector.ts';
import {
  Camera,
  Video,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Award,
  ShieldCheck,
  Activity,
  RefreshCw,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Target,
  Plus,
  Minus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Zap,
} from 'lucide-react';
import { generateDemoPoseFrame, DemoFrameData } from '../utils/aiCamDemoEngine.ts';

interface AiCamPageProps {
  athlete: AthleteProfile;
  onUpdateAthlete?: (updated: AthleteProfile) => void;
  onSaveWorkoutSession?: (session: CompletedWorkoutSession) => void;
  onNavigate?: (page: PageId) => void;
}

interface FormCheckItem {
  label: string;
  status: string;
  isGood: boolean;
  score: number;
}

export const AiCamPage: React.FC<AiCamPageProps> = ({
  athlete,
  onUpdateAthlete,
  onSaveWorkoutSession,
  onNavigate,
}) => {
  // Selected Exercise: Squat, Push-up, Bicep Curl, Lunge
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squat');

  // Target Repetitions (default 15, configurable)
  const [targetReps, setTargetReps] = useState<number>(15);

  // Active Mode: 'live' (real webcam) or 'demo' (presentation kinematic simulation)
  const [camMode, setCamMode] = useState<'live' | 'demo'>('live');

  // Demo Mode Playback & Telemetry State
  const [demoIsPlaying, setDemoIsPlaying] = useState<boolean>(true);
  const [demoSimulateError, setDemoSimulateError] = useState<boolean>(false);
  const [demoSpeed, setDemoSpeed] = useState<'1x' | '0.5x'>('1x');
  const [demoRepCount, setDemoRepCount] = useState<number>(0);
  const [demoSeconds, setDemoSeconds] = useState<number>(0);
  const [demoAnalysisResult, setDemoAnalysisResult] = useState<DemoFrameData>(() =>
    generateDemoPoseFrame('squat', 0, false)
  );

  // Demo synchronization refs for zero-lag 60fps animation loop
  const demoIsPlayingRef = useRef<boolean>(true);
  const demoSimulateErrorRef = useRef<boolean>(false);
  const demoSpeedRef = useRef<'1x' | '0.5x'>('1x');
  const demoRepCountRef = useRef<number>(0);
  const demoProgressRef = useRef<number>(0);
  const demoLastTimestampRef = useRef<number>(0);
  const demoAnimFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    demoIsPlayingRef.current = demoIsPlaying;
  }, [demoIsPlaying]);
  useEffect(() => {
    demoSimulateErrorRef.current = demoSimulateError;
  }, [demoSimulateError]);
  useEffect(() => {
    demoSpeedRef.current = demoSpeed;
  }, [demoSpeed]);
  useEffect(() => {
    demoRepCountRef.current = demoRepCount;
  }, [demoRepCount]);

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<{
    type: 'denied' | 'unavailable' | 'notfound' | 'general';
    message: string;
  } | null>(null);

  // Facing mode: 'user' (selfie) or 'environment'
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Audio cues toggle
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<PoseAnalysisResult>({
    exercise: 'squat',
    exerciseName: 'SQUAT',
    repCount: 0,
    movementPhase: 'STANDING',
    overallFormScore: 0,
    aiStatus: 'READY',
    primaryFeedback: 'Position camera so full body is visible in the frame',
    formBreakdown: {
      metric1Name: 'KNEE ALIGNMENT',
      metric1Score: 0,
      metric2Name: 'DEPTH',
      metric2Score: 0,
      metric3Name: 'POSTURE',
      metric3Score: 0,
    },
    keyAngles: [
      { label: 'Knee Angle', angle: 180 },
      { label: 'Hip Angle', angle: 180 },
      { label: 'Ankle Angle', angle: 90 },
      { label: 'Torso Incline', angle: 0 },
    ],
  });

  // Session duration timer
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isSessionRunning, setIsSessionRunning] = useState<boolean>(false);

  // Completed workout session summary modal
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<{
    exerciseName: string;
    totalReps: number;
    averageForm: number;
    bestForm: number;
    durationSeconds: number;
    keyFeedback: string[];
  } | null>(null);

  // Accidental double-saving prevention
  const [isSavingWorkout, setIsSavingWorkout] = useState<boolean>(false);
  const hasSavedWorkoutRef = useRef<boolean>(false);

  // Rep completion celebration animation state ("+1 / 1+" animation on center of AI CAM)
  const [repAnimation, setRepAnimation] = useState<{
    id: number;
    repNumber: number;
  } | null>(null);
  const repAnimationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectedRepCountRef = useRef<number>(0);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseDetectorRef = useRef<any>(null);
  const handsDetectorRef = useRef<any>(null);
  const latestPoseLandmarksRef = useRef<any>(null);
  const latestHandsLandmarksRef = useRef<any>(null);
  const latestHandednessRef = useRef<any>(null);
  const latestPostureFeedbackRef = useRef<PostureFeedback | null>(null);
  const poseSmootherRef = useRef<PoseSmoother>(new PoseSmoother());
  const handSmootherRef = useRef<HandSmoother>(new HandSmoother());
  const analyzerRef = useRef<ExerciseAnalyzer>(new ExerciseAnalyzer('squat'));
  const animationFrameIdRef = useRef<number | null>(null);
  const isAnalyzingFrameRef = useRef<boolean>(false);
  const lastSpokenFeedbackRef = useRef<string>('');

  // Format seconds to mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Optional synthetic audio chime on rep completion
  const playRepCompletedChime = useCallback(() => {
    if (!audioFeedback || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1 (D5: 587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2 (A5: 880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08);
      gain2.gain.setValueAtTime(0.16, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch (e) {
      // AudioContext could be blocked by browser autoplay policy
    }
  }, [audioFeedback]);

  // Trigger glowing green 1+ rep animation in center of AI CAM
  const triggerRepAnimation = useCallback((repNumber: number) => {
    if (repAnimationTimerRef.current) {
      clearTimeout(repAnimationTimerRef.current);
    }
    setRepAnimation({
      id: Date.now(),
      repNumber,
    });
    playRepCompletedChime();

    repAnimationTimerRef.current = setTimeout(() => {
      setRepAnimation(null);
    }, 1350);
  }, [playRepCompletedChime]);

  // Optional voice coach cues using Web Speech Synthesis API
  const speakCue = (text: string) => {
    if (!audioFeedback || typeof window === 'undefined' || !window.speechSynthesis) return;
    if (text === lastSpokenFeedbackRef.current) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
      lastSpokenFeedbackRef.current = text;
    } catch (e) {
      // Ignore audio synthesis errors on unsupported browsers
    }
  };

  // Manual rep simulation / count trigger
  const handleManualAddRep = () => {
    const newCount = analyzerRef.current.incrementRep();
    setAnalysisResult((prev) => ({
      ...prev,
      repCount: newCount,
    }));
    lastDetectedRepCountRef.current = newCount;
    triggerRepAnimation(newCount);
  };

  // Reset active session repetitions, timer, and tracking state
  const handleResetSession = () => {
    setSessionSeconds(0);
    analyzerRef.current.resetSession();
    hasSavedWorkoutRef.current = false;
    setIsSavingWorkout(false);
    lastDetectedRepCountRef.current = 0;
    if (repAnimationTimerRef.current) {
      clearTimeout(repAnimationTimerRef.current);
    }
    setRepAnimation(null);
    poseSmootherRef.current.reset();
    handSmootherRef.current.reset();
    latestPostureFeedbackRef.current = null;
    const config = getExerciseConfig(selectedExercise);
    setAnalysisResult((prev) => ({
      ...prev,
      repCount: 0,
      movementPhase: 'READY',
      overallFormScore: 0,
      aiStatus: 'READY',
      primaryFeedback: `Ready for ${config.name}. ${config.cameraGuidance}.`,
      formBreakdown: {
        metric1Name: config.formChecks[0].label,
        metric1Score: 0,
        metric2Name: config.formChecks[1].label,
        metric2Score: 0,
        metric3Name: config.formChecks[2].label,
        metric3Score: 0,
      },
      postureFeedback: null,
    }));
  };

  // Start / Stop camera stream
  const startCamera = async (targetFacingMode?: 'user' | 'environment') => {
    setCameraLoading(true);
    setCameraError(null);
    const activeFacing = targetFacingMode || facingMode;

    // Starting a fresh session initializes its repetition state, timer, and tracking status
    if (!isCameraActive) {
      setSessionSeconds(0);
      analyzerRef.current.resetSession();
      hasSavedWorkoutRef.current = false;
      setIsSavingWorkout(false);
      const config = getExerciseConfig(selectedExercise);
      setAnalysisResult((prev) => ({
        ...prev,
        repCount: 0,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: `Ready for ${config.name}. ${config.cameraGuidance}.`,
      }));
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported by your browser environment.');
      }

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: activeFacing,
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          renderSkeleton();
        };
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setIsSessionRunning(true);
      setCameraLoading(false);
    } catch (err: any) {
      console.error('Error starting camera stream:', err);
      let errType: 'denied' | 'unavailable' | 'notfound' | 'general' = 'general';
      let message = 'Could not access camera. Please check browser permissions and device settings.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errType = 'denied';
        message = 'Camera permission was denied. Please allow camera access in your browser settings to use AXIO AI CAM.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errType = 'notfound';
        message = 'No video capture device was found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errType = 'unavailable';
        message = 'Camera is currently in use by another application or hardware tab.';
      }

      setCameraError({ type: errType, message });
      setIsCameraActive(false);
      setIsSessionRunning(false);
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (repAnimationTimerRef.current) {
      clearTimeout(repAnimationTimerRef.current);
    }
    setRepAnimation(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isAnalyzingFrameRef.current = false;
    latestPoseLandmarksRef.current = null;
    latestHandsLandmarksRef.current = null;
    latestHandednessRef.current = null;
    latestPostureFeedbackRef.current = null;
    poseSmootherRef.current.reset();
    handSmootherRef.current.reset();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsCameraActive(false);
    setIsSessionRunning(false);
  };

  // Component unmount cleanup: guarantees camera tracks and animation frames stop
  useEffect(() => {
    return () => {
      stopCamera();
      if (demoAnimFrameIdRef.current) {
        cancelAnimationFrame(demoAnimFrameIdRef.current);
        demoAnimFrameIdRef.current = null;
      }
    };
  }, []);

  // Change exercise handler
  const handleSelectExercise = (ex: ExerciseType) => {
    setSelectedExercise(ex);
    latestPostureFeedbackRef.current = null;
    lastDetectedRepCountRef.current = 0;
    if (repAnimationTimerRef.current) {
      clearTimeout(repAnimationTimerRef.current);
    }
    setRepAnimation(null);
    poseSmootherRef.current.reset();
    handSmootherRef.current.reset();
    analyzerRef.current.setExercise(ex);
    const config = getExerciseConfig(ex);
    setTargetReps(config.defaultTargetReps);

    if (camMode === 'demo') {
      demoProgressRef.current = 0;
      demoRepCountRef.current = 0;
      setDemoRepCount(0);
      setDemoSeconds(0);
      const initialFrame = generateDemoPoseFrame(ex, 0, demoSimulateErrorRef.current);
      setDemoAnalysisResult(initialFrame);
      renderDemoFrame(initialFrame);
    }

    setAnalysisResult((prev) => ({
      ...prev,
      exercise: ex,
      exerciseName: config.name,
      repCount: 0,
      movementPhase: 'STANDING',
      overallFormScore: 0,
      aiStatus: 'READY',
      primaryFeedback: `Ready for ${config.name}. ${config.cameraGuidance}.`,
      formBreakdown: {
        metric1Name: config.formChecks[0].label,
        metric1Score: 0,
        metric2Name: config.formChecks[1].label,
        metric2Score: 0,
        metric3Name: config.formChecks[2].label,
        metric3Score: 0,
      },
      keyAngles: config.kinematics.primaryAngles.map((a) => ({
        label: a.label,
        angle: 0,
      })),
      postureFeedback: null,
    }));
  };

  // Stop session & show workout summary
  const handleStopSession = () => {
    stopCamera();

    const metrics = analyzerRef.current.getSessionMetrics();
    const duration = Math.max(1, sessionSeconds);

    setSummaryData({
      exerciseName: selectedExercise.toUpperCase().replace('-', ' '),
      totalReps: metrics.totalReps,
      averageForm: metrics.averageForm,
      bestForm: metrics.bestForm,
      durationSeconds: duration,
      keyFeedback:
        metrics.keyFeedback.length > 0
          ? metrics.keyFeedback
          : ['Controlled movement cadence', 'Maintained athletic posture'],
    });

    setShowSummaryModal(true);
  };

  // Save workout to history and user's progress
  const handleSaveWorkout = () => {
    if (!summaryData || camMode === 'demo') {
      if (camMode === 'demo') {
        console.warn('Demo sessions cannot be saved to user workout history or athlete profile.');
      }
      return;
    }

    const actualDurationMinutes = Math.max(1, Math.round(summaryData.durationSeconds / 60));
    const config = getExerciseConfig(selectedExercise);
    const estimatedWeightKg = config.estimatedWeightKg || 30;
    const computedVolume = summaryData.totalReps * estimatedWeightKg;

    const sessionRecord: CompletedWorkoutSession = {
      id: `AICAM-${Date.now()}`,
      title: `AI CAM: ${summaryData.exerciseName} Technique Session`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      durationSeconds: summaryData.durationSeconds,
      durationMinutes: actualDurationMinutes,
      totalVolumeKg: computedVolume,
      setsCompleted: 1,
      totalSets: 1,
      exercisesCompleted: 1,
      totalExercises: 1,
      averageFormAccuracy: summaryData.averageForm,
      peakPowerWatts: Math.round(estimatedWeightKg * 9.81 * 0.72),
      loadAu: Math.round(actualDurationMinutes * 7.2),
      goal: 'Movement Quality & Technique',
      fitnessLevel: athlete.fitnessLevel,
      exercises: [
        {
          exerciseName: summaryData.exerciseName,
          targetMuscles: 'Full Body Kinetic Chain',
          difficulty: 'AI Tracked',
          completed: true,
          sets: [
            {
              setNum: 1,
              weightKg: estimatedWeightKg,
              reps: summaryData.totalReps,
              completed: true,
              actualVelocity: 0.88,
            },
          ],
        },
      ],
    };

    if (onSaveWorkoutSession) {
      onSaveWorkoutSession(sessionRecord);
    } else {
      try {
        const history = JSON.parse(localStorage.getItem('axio_workout_history') || '[]');
        localStorage.setItem('axio_workout_history', JSON.stringify([sessionRecord, ...history]));
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
    }

    if (onUpdateAthlete) {
      onUpdateAthlete({
        ...athlete,
        streakDays: athlete.streakDays + 1,
        weeklyVolumeKg: athlete.weeklyVolumeKg + computedVolume,
        completedWorkoutsThisWeek: athlete.completedWorkoutsThisWeek + 1,
        formScore: Math.round((athlete.formScore + summaryData.averageForm) / 2),
      });
    }

    setShowSummaryModal(false);
    if (onNavigate) {
      onNavigate('progress');
    }
  };

  // Stopwatch interval for live camera
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSessionRunning && camMode === 'live') {
      interval = setInterval(() => {
        setSessionSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionRunning, camMode]);

  // Stopwatch interval for presentation Demo Mode
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (camMode === 'demo' && demoIsPlaying) {
      interval = setInterval(() => {
        setDemoSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [camMode, demoIsPlaying]);

  // Canvas rendering callback for presentation Demo Mode
  const renderDemoFrame = useCallback(
    (frameData: DemoFrameData) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const container = canvas.parentElement;
      const displayWidth = Math.max(1, Math.round(container?.clientWidth || canvas.clientWidth || 640));
      const displayHeight = Math.max(1, Math.round(container?.clientHeight || canvas.clientHeight || 480));
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      const targetBufferWidth = Math.round(displayWidth * dpr);
      const targetBufferHeight = Math.round(displayHeight * dpr);

      if (canvas.width !== targetBufferWidth || canvas.height !== targetBufferHeight) {
        canvas.width = targetBufferWidth;
        canvas.height = targetBufferHeight;
      }
      if (canvas.style.width !== `${displayWidth}px` || canvas.style.height !== `${displayHeight}px`) {
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // In demo mode, standard 1:1 contain transform without selfie flip:
      const transform = computeVideoTransform(
        displayWidth,
        displayHeight,
        displayWidth,
        displayHeight,
        false,
        'contain'
      );

      // Draw Unified Anatomical Body & Hand Skeleton with posture-based coloring
      drawFullBodyAndHandSkeleton(
        ctx,
        frameData.landmarks,
        null,
        null,
        displayWidth,
        displayHeight,
        undefined,
        handSmootherRef.current,
        frameData.postureFeedback,
        transform
      );

      ctx.restore();
    },
    []
  );

  // Demo Kinematics Animation Loop (Continuous, smooth, 60fps)
  useEffect(() => {
    if (camMode !== 'demo') {
      if (demoAnimFrameIdRef.current) {
        cancelAnimationFrame(demoAnimFrameIdRef.current);
        demoAnimFrameIdRef.current = null;
      }
      return;
    }

    let isRunning = true;
    demoLastTimestampRef.current = performance.now();

    const loop = (now: number) => {
      if (!isRunning) return;

      const deltaMs = Math.min(100, Math.max(0, now - demoLastTimestampRef.current));
      demoLastTimestampRef.current = now;

      if (demoIsPlayingRef.current) {
        // Natural rep duration ~2800ms; in 0.5x slow-motion ~5600ms
        const repDurationMs = demoSpeedRef.current === '0.5x' ? 5600 : 2800;
        let nextProgress = demoProgressRef.current + deltaMs / repDurationMs;

        if (nextProgress >= 1.0) {
          nextProgress = nextProgress % 1.0;
          demoRepCountRef.current += 1;
          setDemoRepCount(demoRepCountRef.current);
          triggerRepAnimation(demoRepCountRef.current);
          if (audioFeedback) {
            speakCue(`Rep ${demoRepCountRef.current}`);
          }
        }
        demoProgressRef.current = nextProgress;
      }

      // Generate the current kinematic frame data
      const frameData = generateDemoPoseFrame(
        selectedExercise,
        demoProgressRef.current,
        demoSimulateErrorRef.current
      );

      renderDemoFrame(frameData);
      setDemoAnalysisResult(frameData);

      demoAnimFrameIdRef.current = requestAnimationFrame(loop);
    };

    demoAnimFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (demoAnimFrameIdRef.current) {
        cancelAnimationFrame(demoAnimFrameIdRef.current);
        demoAnimFrameIdRef.current = null;
      }
    };
  }, [camMode, selectedExercise, audioFeedback, triggerRepAnimation, renderDemoFrame]);

  // Mode switching handler
  const handleSwitchMode = (targetMode: 'live' | 'demo') => {
    if (targetMode === camMode) return;
    if (targetMode === 'demo') {
      stopCamera();
      if (demoAnimFrameIdRef.current) {
        cancelAnimationFrame(demoAnimFrameIdRef.current);
        demoAnimFrameIdRef.current = null;
      }
      setCamMode('demo');
      demoLastTimestampRef.current = performance.now();
      setDemoIsPlaying(true);
      demoIsPlayingRef.current = true;
      const initialFrame = generateDemoPoseFrame(selectedExercise, demoProgressRef.current, demoSimulateError);
      setDemoAnalysisResult(initialFrame);
    } else {
      if (demoAnimFrameIdRef.current) {
        cancelAnimationFrame(demoAnimFrameIdRef.current);
        demoAnimFrameIdRef.current = null;
      }
      setDemoIsPlaying(false);
      demoIsPlayingRef.current = false;
      setCamMode('live');
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  // Immediate toggle for posture error simulation
  const handleToggleSimulateError = () => {
    const nextVal = !demoSimulateError;
    setDemoSimulateError(nextVal);
    demoSimulateErrorRef.current = nextVal;
    if (camMode === 'demo') {
      const updatedFrame = generateDemoPoseFrame(selectedExercise, demoProgressRef.current, nextVal);
      setDemoAnalysisResult(updatedFrame);
      renderDemoFrame(updatedFrame);
    }
  };

  // Reset demo session statistics
  const handleResetDemo = () => {
    demoProgressRef.current = 0;
    demoRepCountRef.current = 0;
    setDemoRepCount(0);
    setDemoSeconds(0);
    setDemoIsPlaying(false);
    demoIsPlayingRef.current = false;
    setRepAnimation(null);
    if (repAnimationTimerRef.current) {
      clearTimeout(repAnimationTimerRef.current);
    }
    const initialFrame = generateDemoPoseFrame(selectedExercise, 0, demoSimulateErrorRef.current);
    setDemoAnalysisResult(initialFrame);
    renderDemoFrame(initialFrame);
  };

  // Canvas rendering callback for unified body and hand tracking with exact video alignment
  const renderSkeleton = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get exact rendered bounding box of the video display element
    const rect = video.getBoundingClientRect();
    const displayWidth = Math.max(1, Math.round(rect.width || canvas.clientWidth || 640));
    const displayHeight = Math.max(1, Math.round(rect.height || canvas.clientHeight || 480));
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    // High-DPI support: scale buffer by device pixel ratio for crisp lines
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const targetBufferWidth = Math.round(displayWidth * dpr);
    const targetBufferHeight = Math.round(displayHeight * dpr);

    if (canvas.width !== targetBufferWidth || canvas.height !== targetBufferHeight) {
      canvas.width = targetBufferWidth;
      canvas.height = targetBufferHeight;
    }
    if (canvas.style.width !== `${displayWidth}px` || canvas.style.height !== `${displayHeight}px`) {
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    }

    ctx.save();
    // Scale coordinate space to match CSS display pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Compute exact video-to-canvas coordinate transform accounting for
    // CSS object-cover cropping/scaling and selfie camera horizontal mirroring
    const transform = computeVideoTransform(
      displayWidth,
      displayHeight,
      videoWidth,
      videoHeight,
      facingMode === 'user',
      'cover'
    );

    // Draw Unified Anatomical Body & Hand Skeleton with posture-based coloring
    drawFullBodyAndHandSkeleton(
      ctx,
      latestPoseLandmarksRef.current,
      latestHandsLandmarksRef.current,
      latestHandednessRef.current,
      displayWidth,
      displayHeight,
      undefined,
      handSmootherRef.current,
      latestPostureFeedbackRef.current,
      transform
    );

    ctx.restore();
  }, [facingMode]);

  // Keep video and canvas display dimensions synchronized on viewport resize or layout changes
  useEffect(() => {
    const handleResize = () => {
      renderSkeleton();
    };

    window.addEventListener('resize', handleResize);

    const videoEl = videoRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && videoEl) {
      observer = new ResizeObserver(() => {
        renderSkeleton();
      });
      observer.observe(videoEl);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [renderSkeleton]);

  // Initialize MediaPipe Pose and Hands Models
  useEffect(() => {
    let isCancelled = false;

    async function initVisionModels() {
      // 1. Initialize Pose
      try {
        const PoseClass = await loadMediaPipePose();
        if (!isCancelled && PoseClass) {
          const pose = new PoseClass({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          pose.onResults((results: any) => {
            const rawLandmarks = results.poseLandmarks || null;
            const smoothed = poseSmootherRef.current.smooth(rawLandmarks);
            latestPoseLandmarksRef.current = smoothed;

            if (smoothed && smoothed.length > 0) {
              const res = analyzerRef.current.analyze(smoothed);
              setAnalysisResult(res);
              latestPostureFeedbackRef.current = res.postureFeedback || null;

              // Check if rep was completed
              if (res.repCount > lastDetectedRepCountRef.current) {
                triggerRepAnimation(res.repCount);
              }
              lastDetectedRepCountRef.current = res.repCount;

              if (res.primaryFeedback && res.movementPhase === 'BOTTOM') {
                speakCue(res.primaryFeedback);
              }
            } else {
              latestPostureFeedbackRef.current = null;
            }

            renderSkeleton();
          });

          poseDetectorRef.current = pose;
        }
      } catch (e) {
        console.error('Error initializing MediaPipe Pose:', e);
      }

      // 2. Initialize Hands
      try {
        const HandsClass = await loadMediaPipeHands();
        if (!isCancelled && HandsClass) {
          const hands = new HandsClass({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
          });

          hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          hands.onResults((results: any) => {
            latestHandsLandmarksRef.current = results.multiHandLandmarks || null;
            latestHandednessRef.current = results.multiHandedness || null;
            renderSkeleton();
          });

          handsDetectorRef.current = hands;
        }
      } catch (e) {
        console.error('Error initializing MediaPipe Hands:', e);
      }
    }

    initVisionModels();

    return () => {
      isCancelled = true;
      if (poseDetectorRef.current) {
        try { poseDetectorRef.current.close?.(); } catch (e) {}
        poseDetectorRef.current = null;
      }
      if (handsDetectorRef.current) {
        try { handsDetectorRef.current.close?.(); } catch (e) {}
        handsDetectorRef.current = null;
      }
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    let frameId: number;

    const processFrame = async () => {
      if (!isCameraActive) return;

      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        !isAnalyzingFrameRef.current
      ) {
        try {
          isAnalyzingFrameRef.current = true;
          const video = videoRef.current;

          if (poseDetectorRef.current && isCameraActive) {
            await poseDetectorRef.current.send({ image: video });
          }

          if (handsDetectorRef.current && isCameraActive) {
            await handsDetectorRef.current.send({ image: video });
          }
        } catch (e) {
          // Frame skip handling
        } finally {
          isAnalyzingFrameRef.current = false;
        }
      }

      if (isCameraActive) {
        frameId = requestAnimationFrame(processFrame);
        animationFrameIdRef.current = frameId;
      }
    };

    if (isCameraActive) {
      frameId = requestAnimationFrame(processFrame);
      animationFrameIdRef.current = frameId;
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      animationFrameIdRef.current = null;
    };
  }, [isCameraActive]);

  // Flip camera (User <-> Environment)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isCameraActive) {
      startCamera(nextMode);
    }
  };

  // Helper colors for status
  const getStatusColor = (status: AiCamStatus) => {
    switch (status) {
      case 'GOOD FORM':
        return 'text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/30';
      case 'IMPROVE FORM':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'ANALYZING':
        return 'text-[#0066FF] bg-[#0066FF]/10 border-[#0066FF]/30';
      case 'CAMERA ERROR':
        return 'text-[#FF3344] bg-[#FF3344]/10 border-[#FF3344]/30';
      default:
        return 'text-[#7E8B9B] bg-white/5 border-white/10';
    }
  };

  // Helper to format individual form checks based on active exercise and posture
  const individualFormChecks: FormCheckItem[] = useMemo(() => {
    if (!isCameraActive || analysisResult.aiStatus === 'READY' || analysisResult.aiStatus === 'CAMERA ERROR') {
      switch (selectedExercise) {
        case 'squat':
          return [
            { label: 'KNEE ALIGNMENT', status: 'READY', isGood: true, score: 0 },
            { label: 'BACK POSITION', status: 'READY', isGood: true, score: 0 },
            { label: 'DEPTH', status: 'READY', isGood: true, score: 0 },
          ];
        case 'pushup':
          return [
            { label: 'BACK POSITION', status: 'READY', isGood: true, score: 0 },
            { label: 'DEPTH', status: 'READY', isGood: true, score: 0 },
            { label: 'ARM POSITION', status: 'READY', isGood: true, score: 0 },
          ];
        case 'bicep-curl':
          return [
            { label: 'ELBOW POSITION', status: 'READY', isGood: true, score: 0 },
            { label: 'RANGE OF MOTION', status: 'READY', isGood: true, score: 0 },
            { label: 'EXTENSION', status: 'READY', isGood: true, score: 0 },
          ];
        case 'lunge':
          return [
            { label: 'KNEE ALIGNMENT', status: 'READY', isGood: true, score: 0 },
            { label: 'BACK POSITION', status: 'READY', isGood: true, score: 0 },
            { label: 'DEPTH', status: 'READY', isGood: true, score: 0 },
          ];
        default: {
          const cfg = getExerciseConfig(selectedExercise);
          return [
            { label: cfg.formChecks[0].label, status: 'READY', isGood: true, score: 0 },
            { label: cfg.formChecks[1].label, status: 'READY', isGood: true, score: 0 },
            { label: cfg.formChecks[2].label, status: 'READY', isGood: true, score: 0 },
          ];
        }
      }
    }

    const pf = analysisResult.postureFeedback;
    const bd = analysisResult.formBreakdown;
    const phase = analysisResult.movementPhase;

    switch (selectedExercise) {
      case 'squat': {
        // Knee Alignment
        const kneeGood = !pf?.kneeAlignmentIssue && bd.metric1Score >= 80;
        const kneeStatus = kneeGood ? 'GOOD' : 'KEEP ALIGNED';

        // Back Position (Posture / Lean)
        const backGood = !pf?.torsoLeanIssue && !pf?.torsoIssue && bd.metric3Score >= 80;
        const backStatus = backGood ? 'GOOD' : 'KEEP UPRIGHT';

        // Depth
        const depthGood = !pf?.depthIssue && (bd.metric2Score >= 85 || (phase !== 'BOTTOM' && bd.metric2Score >= 75));
        const depthStatus = depthGood
          ? (phase === 'BOTTOM' ? 'OPTIMAL' : 'GOOD')
          : 'GO LOWER';

        return [
          { label: 'KNEE ALIGNMENT', status: kneeStatus, isGood: kneeGood, score: bd.metric1Score },
          { label: 'BACK POSITION', status: backStatus, isGood: backGood, score: bd.metric3Score },
          { label: 'DEPTH', status: depthStatus, isGood: depthGood, score: bd.metric2Score },
        ];
      }

      case 'pushup': {
        // Back Position (Spine & Core)
        const backGood = !pf?.spineAlignmentIssue && !pf?.torsoIssue && bd.metric2Score >= 80;
        const backStatus = backGood ? 'GOOD' : 'STRAIGHTEN CORE';

        // Depth
        const depthGood = !pf?.depthIssue && bd.metric1Score >= 80;
        const depthStatus = depthGood
          ? (phase === 'BOTTOM' ? 'OPTIMAL' : 'GOOD')
          : 'GO LOWER';

        // Arm Position
        const armGood = !pf?.leftArmIssue && !pf?.rightArmIssue && bd.metric3Score >= 80;
        const armStatus = armGood ? 'GOOD' : 'TUCK ELBOWS';

        return [
          { label: 'BACK POSITION', status: backStatus, isGood: backGood, score: bd.metric2Score },
          { label: 'DEPTH', status: depthStatus, isGood: depthGood, score: bd.metric1Score },
          { label: 'ARM POSITION', status: armStatus, isGood: armGood, score: bd.metric3Score },
        ];
      }

      case 'bicep-curl': {
        // Elbow Position / Stability
        const elbowGood = !pf?.armStabilityIssue && !pf?.leftArmIssue && !pf?.rightArmIssue && bd.metric2Score >= 80;
        const elbowStatus = elbowGood ? 'GOOD' : 'PIN ELBOWS';

        // Range of Motion / Peak Flexion
        const peakGood = bd.metric1Score >= 80;
        const peakStatus = peakGood
          ? (phase === 'PEAK' ? 'FULL PEAK' : 'GOOD')
          : 'SQUEEZE HIGHER';

        // Extension
        const extGood = bd.metric3Score >= 80;
        const extStatus = extGood ? 'GOOD' : 'FULL EXTENSION';

        return [
          { label: 'ELBOW POSITION', status: elbowStatus, isGood: elbowGood, score: bd.metric2Score },
          { label: 'RANGE OF MOTION', status: peakStatus, isGood: peakGood, score: bd.metric1Score },
          { label: 'EXTENSION', status: extStatus, isGood: extGood, score: bd.metric3Score },
        ];
      }

      case 'lunge': {
        // Knee Alignment
        const kneeGood = !pf?.leftLegIssue && !pf?.rightLegIssue && bd.metric3Score >= 80;
        const kneeStatus = kneeGood ? 'GOOD' : 'STABILIZE KNEE';

        // Back Position
        const backGood = !pf?.torsoLeanIssue && !pf?.torsoIssue && bd.metric2Score >= 80;
        const backStatus = backGood ? 'GOOD' : 'KEEP UPRIGHT';

        // Depth
        const depthGood = !pf?.depthIssue && bd.metric1Score >= 80;
        const depthStatus = depthGood
          ? (phase === 'BOTTOM' ? 'OPTIMAL' : 'GOOD')
          : 'GO LOWER';

        return [
          { label: 'KNEE ALIGNMENT', status: kneeStatus, isGood: kneeGood, score: bd.metric3Score },
          { label: 'BACK POSITION', status: backStatus, isGood: backGood, score: bd.metric2Score },
          { label: 'DEPTH', status: depthStatus, isGood: depthGood, score: bd.metric1Score },
        ];
      }

      case 'shoulder-press': {
        const lockoutGood = bd.metric1Score >= 80;
        const lockoutStatus = lockoutGood ? (phase === 'TOP' ? 'LOCKED' : 'GOOD') : 'LOCK OUT';

        const pathGood = !pf?.leftArmIssue && !pf?.rightArmIssue && bd.metric2Score >= 80;
        const pathStatus = pathGood ? 'ALIGNED' : 'TUCK IN FRONT';

        const coreGood = !pf?.torsoIssue && bd.metric3Score >= 80;
        const coreStatus = coreGood ? 'STABLE' : 'BRACE CORE';

        return [
          { label: 'OVERHEAD LOCKOUT', status: lockoutStatus, isGood: lockoutGood, score: bd.metric1Score },
          { label: 'ELBOW PATH', status: pathStatus, isGood: pathGood, score: bd.metric2Score },
          { label: 'CORE STABILITY', status: coreStatus, isGood: coreGood, score: bd.metric3Score },
        ];
      }

      case 'jumping-jack': {
        const reachGood = bd.metric1Score >= 80;
        const reachStatus = reachGood ? (phase === 'PEAK' ? 'FULL REACH' : 'GOOD') : 'REACH HIGHER';

        const stanceGood = bd.metric2Score >= 80;
        const stanceStatus = stanceGood ? (phase === 'PEAK' ? 'WIDE STANCE' : 'GOOD') : 'STEP WIDER';

        const rhythmGood = bd.metric3Score >= 80;
        const rhythmStatus = rhythmGood ? 'IN RHYTHM' : 'SOFT LANDINGS';

        return [
          { label: 'OVERHEAD REACH', status: reachStatus, isGood: reachGood, score: bd.metric1Score },
          { label: 'STANCE WIDTH', status: stanceStatus, isGood: stanceGood, score: bd.metric2Score },
          { label: 'RHYTHM & TEMPO', status: rhythmStatus, isGood: rhythmGood, score: bd.metric3Score },
        ];
      }

      case 'calf-raise': {
        const heelGood = bd.metric1Score >= 80;
        const heelStatus = heelGood ? (phase === 'PEAK' ? 'FULL HEIGHT' : 'GOOD') : 'PUSH HIGHER';

        const kneeGood = !pf?.leftLegIssue && !pf?.rightLegIssue && bd.metric2Score >= 80;
        const kneeStatus = kneeGood ? 'LOCKED' : 'KEEP LEGS STRAIGHT';

        const tempoGood = bd.metric3Score >= 80;
        const tempoStatus = tempoGood ? 'CONTROLLED' : 'SLOW DOWN';

        return [
          { label: 'HEEL ELEVATION', status: heelStatus, isGood: heelGood, score: bd.metric1Score },
          { label: 'KNEE EXTENSION', status: kneeStatus, isGood: kneeGood, score: bd.metric2Score },
          { label: 'TEMPO CONTROL', status: tempoStatus, isGood: tempoGood, score: bd.metric3Score },
        ];
      }

      case 'lateral-raise': {
        const heightGood = bd.metric1Score >= 80;
        const heightStatus = heightGood ? (phase === 'PEAK' ? 'PARALLEL' : 'GOOD') : 'LIFT TO PARALLEL';

        const swayGood = !pf?.torsoIssue && bd.metric2Score >= 80;
        const swayStatus = swayGood ? 'STABLE' : 'NO MOMENTUM';

        const leadGood = bd.metric3Score >= 80;
        const leadStatus = leadGood ? 'ALIGNED' : 'LEAD WITH ELBOWS';

        return [
          { label: 'PARALLEL HEIGHT', status: heightStatus, isGood: heightGood, score: bd.metric1Score },
          { label: 'TORSO STABILITY', status: swayStatus, isGood: swayGood, score: bd.metric2Score },
          { label: 'ELBOW LEAD', status: leadStatus, isGood: leadGood, score: bd.metric3Score },
        ];
      }

      case 'high-knees': {
        const heightGood = bd.metric1Score >= 80;
        const heightStatus = heightGood ? (phase === 'PEAK' ? 'PARALLEL' : 'GOOD') : 'DRIVE HIGHER';

        const postureGood = !pf?.torsoIssue && bd.metric2Score >= 80;
        const postureStatus = postureGood ? 'UPRIGHT' : 'LEAN FORWARD';

        const cadenceGood = bd.metric3Score >= 80;
        const cadenceStatus = cadenceGood ? 'EXPLOSIVE' : 'FASTER TURNOVER';

        return [
          { label: 'KNEE HEIGHT', status: heightStatus, isGood: heightGood, score: bd.metric1Score },
          { label: 'UPRIGHT POSTURE', status: postureStatus, isGood: postureGood, score: bd.metric2Score },
          { label: 'QUICK CADENCE', status: cadenceStatus, isGood: cadenceGood, score: bd.metric3Score },
        ];
      }

      case 'glute-bridge': {
        const lockoutGood = bd.metric1Score >= 80;
        const lockoutStatus = lockoutGood ? (phase === 'PEAK' ? 'FULL EXTENSION' : 'GOOD') : 'BRIDGE HIGHER';

        const squeezeGood = bd.metric2Score >= 80;
        const squeezeStatus = squeezeGood ? (phase === 'PEAK' ? 'PEAK SQUEEZE' : 'GOOD') : 'SQUEEZE GLUTES';

        const footGood = bd.metric3Score >= 80;
        const footStatus = footGood ? 'STABLE BASE' : 'PLANT HEELS';

        return [
          { label: 'HIP EXTENSION', status: lockoutStatus, isGood: lockoutGood, score: bd.metric1Score },
          { label: 'APEX SQUEEZE', status: squeezeStatus, isGood: squeezeGood, score: bd.metric2Score },
          { label: 'FOOT PLACEMENT', status: footStatus, isGood: footGood, score: bd.metric3Score },
        ];
      }

      default: {
        const cfg = getExerciseConfig(selectedExercise);
        return [
          { label: cfg.formChecks[0].label, status: 'READY', isGood: true, score: bd.metric1Score },
          { label: cfg.formChecks[1].label, status: 'READY', isGood: true, score: bd.metric2Score },
          { label: cfg.formChecks[2].label, status: 'READY', isGood: true, score: bd.metric3Score },
        ];
      }
    }
  }, [selectedExercise, isCameraActive, analysisResult]);

  // Adjust target reps safely
  const adjustTargetReps = (delta: number) => {
    setTargetReps((prev) => Math.min(50, Math.max(5, prev + delta)));
  };

  // Synchronize dynamic telemetry across modes
  const isDemo = camMode === 'demo';
  const activeExerciseName = isDemo ? `${getExerciseConfig(selectedExercise).name} (DEMO)` : analysisResult.exerciseName;
  const activeMovementPhase = isDemo ? demoAnalysisResult.phase : analysisResult.movementPhase;
  const activeAiStatus = isDemo ? demoAnalysisResult.status : analysisResult.aiStatus;
  const activeFormScore = isDemo ? demoAnalysisResult.formScore : analysisResult.overallFormScore;
  const activeRepCount = isDemo ? demoRepCount : analysisResult.repCount;
  const activeFeedback = isDemo ? demoAnalysisResult.feedbackMessage : analysisResult.primaryFeedback;
  const activePostureFeedback = isDemo ? demoAnalysisResult.postureFeedback : analysisResult.postureFeedback;
  const activeFormChecks = isDemo ? demoAnalysisResult.formChecks : individualFormChecks;
  const activeElapsedSeconds = isDemo ? demoSeconds : sessionSeconds;
  const isTrackingActive = isDemo ? demoIsPlaying : isCameraActive;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & EXERCISE CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
            <Video className="w-4 h-4" />
            <span>Biomechanical Kinematics Pipeline · MediaPipe Neural Vision</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-white mt-1 flex items-center gap-3">
            <span>AI CAM</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#0066FF]/15 border border-[#0066FF]/30 text-[#0066FF] font-sans tracking-normal font-semibold">
              Live Form Coach
            </span>
            {isDemo && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] font-mono font-bold uppercase tracking-wider">
                Demo Mode
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-normal">
            Real-time anatomical landmark tracking, dynamic angle verification, and autoregulated technique cues
          </p>
        </div>

        {/* Global Controls & Mode Switcher Bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mode Switcher: Live Camera vs Demo Mode */}
          <div className="flex items-center p-1 bg-[#101218] border border-white/[0.08] rounded-xl shadow-inner">
            <button
              onClick={() => handleSwitchMode('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                camMode === 'live'
                  ? 'bg-[#0066FF] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>
            <button
              onClick={() => handleSwitchMode('demo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                camMode === 'demo'
                  ? 'bg-[#00FF66] text-black shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo Mode</span>
            </button>
          </div>

          {/* Audio Feedback Toggle */}
          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            className="p-2.5 rounded-xl bg-[#101218] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
            title={audioFeedback ? 'Voice Coach On' : 'Voice Coach Muted'}
          >
            {audioFeedback ? (
              <Volume2 className="w-4 h-4 text-[#0066FF]" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Flip Camera (Live Mode only) */}
          {camMode === 'live' && (
            <button
              onClick={toggleFacingMode}
              className="p-2.5 rounded-xl bg-[#101218] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
              title="Switch Camera (Front / Rear)"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}

          {/* Target Reps Stepper */}
          <div className="flex items-center bg-[#101218] border border-white/[0.08] rounded-xl px-2 py-1 text-xs font-mono">
            <span className="text-[10px] text-zinc-400 uppercase mr-2 font-medium">Target:</span>
            <button
              onClick={() => adjustTargetReps(-1)}
              className="p-1 hover:text-white text-zinc-400 transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
              title="Decrease Target Reps"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 font-bold text-white tabular-nums">{targetReps}</span>
            <button
              onClick={() => adjustTargetReps(1)}
              className="p-1 hover:text-white text-zinc-400 transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
              title="Increase Target Reps"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Live Mode: Start / Stop Camera */}
          {camMode === 'live' && (
            !isCameraActive ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => startCamera()}
                isLoading={cameraLoading}
                iconLeft={<Camera className="w-4 h-4" />}
              >
                Start AI CAM
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleStopSession}
                iconLeft={<Pause className="w-4 h-4" />}
              >
                Stop &amp; Review
              </Button>
            )
          )}

          {/* Demo Mode Action Buttons */}
          {camMode === 'demo' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={demoIsPlaying ? 'secondary' : 'primary'}
                onClick={() => setDemoIsPlaying(!demoIsPlaying)}
                iconLeft={demoIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              >
                {demoIsPlaying
                  ? 'Pause Demo'
                  : demoSeconds === 0 && demoRepCount === 0 && demoProgressRef.current === 0
                  ? 'Start Demo'
                  : 'Resume Demo'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetDemo}
                iconLeft={<RotateCcw className="w-4 h-4" />}
              >
                Reset Demo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Presentation Notice & Guided Judge Quick-Start Bar in Demo Mode */}
      {isDemo && (
        <div className="bg-[#101218] border border-[#00FF66]/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                SIMULATED DEMO — NOT LIVE CAMERA ANALYSIS
              </span>
              <span className="text-xs text-[#00FF66] font-semibold tracking-wide">
                Presentation-Ready Pose Kinematics
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
              Experience AXIO AI CAM without camera permissions. Observe smooth 33-point anatomical pose tracking, automatic rep detection with the green +1 celebration, and toggle posture faults to test real-time red joint alerts.
            </p>
          </div>

          {/* Interactive Demo Posture Quality Toggle & Speed Stepper */}
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {/* Speed Switcher */}
            <div className="flex items-center bg-[#0B0C10] border border-white/[0.08] rounded-xl p-1 text-xs font-mono">
              <button
                onClick={() => setDemoSpeed('1x')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  demoSpeed === '1x' ? 'bg-white/10 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
                title="1x Natural Execution Pace"
              >
                1x Speed
              </button>
              <button
                onClick={() => setDemoSpeed('0.5x')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  demoSpeed === '0.5x' ? 'bg-white/10 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
                title="0.5x Slow-Motion Biomechanical Analysis"
              >
                0.5x Slow-Mo
              </button>
            </div>

            {/* Posture Fault Simulation Toggle */}
            <button
              onClick={handleToggleSimulateError}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                demoSimulateError
                  ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                  : 'bg-[#00FF66]/15 border-[#00FF66]/40 text-[#00FF66] hover:bg-[#00FF66]/25'
              }`}
            >
              {demoSimulateError ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#FF3344] shadow-[0_0_8px_#FF3344] animate-ping" />
                  <span>Simulating Posture Error (Red)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Simulate Posture Error (Test Alert)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. EXERCISE SELECTION CHIPS */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-sans text-zinc-400 font-semibold mr-2 hidden sm:inline">
          Active Movement:
        </span>
        {AI_CAM_EXERCISES.map((config) => {
          const isSelected = selectedExercise === config.id;
          return (
            <button
              key={config.id}
              onClick={() => handleSelectExercise(config.id)}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border font-sans text-xs font-semibold tracking-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                isSelected
                  ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-lg shadow-[#0066FF]/25'
                  : 'bg-[#101218] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              {config.name}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE GRID: CAMERA VIEWPORT & TELEMETRY FEEDBACK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================== */}
        {/* LEFT COLUMN: LIVE WEBCAM & SKELETON OVERLAY CANVAS (COL 7) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 bg-[#0B0C10] border border-white/[0.08] rounded-2xl overflow-hidden relative shadow-2xl min-h-[460px] sm:min-h-[540px] flex flex-col justify-center items-center">
          {/* Top Overlaid Camera HUD */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
            {/* Live Tracking Status */}
            <div className="flex items-center gap-2 bg-[#0B0C10]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isTrackingActive ? 'bg-[#00FF66] animate-pulse' : 'bg-zinc-500'
                }`}
              />
              <span className="text-white font-medium">
                {isDemo
                  ? `${activeExerciseName} KINEMATICS`
                  : isCameraActive
                  ? `${analysisResult.exerciseName} ACTIVE`
                  : 'CAMERA STANDBY'}
              </span>
            </div>

            {/* Live Telemetry Pill & Timer */}
            <div className="flex items-center gap-2.5">
              {isTrackingActive && (
                <div className="flex items-center gap-3 bg-[#0B0C10]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-[10px]">REPS:</span>
                    <strong className="text-white tabular-nums">
                      {activeRepCount} / {targetReps}
                    </strong>
                  </div>
                  <span className="text-white/20">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-[10px]">FORM:</span>
                    <strong
                      className={`tabular-nums ${
                        activeFormScore >= 85
                          ? 'text-[#00FF66]'
                          : activeFormScore >= 70
                          ? 'text-[#0066FF]'
                          : 'text-amber-400'
                      }`}
                    >
                      {activeFormScore > 0 ? `${activeFormScore}%` : '--'}
                    </strong>
                  </div>
                </div>
              )}

              {/* Session Duration Badge */}
              <div className="bg-[#0B0C10]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-white">
                <span className="text-zinc-400 mr-1">TIME:</span>
                <strong className="text-white tabular-nums">{formatTime(activeElapsedSeconds)}</strong>
              </div>
            </div>
          </div>

          {/* Active Posture Issue Alert Badge (if any segment is red) */}
          {isTrackingActive &&
            activePostureFeedback &&
            activePostureFeedback.activeIssues.length > 0 && (
              <div className="absolute top-16 left-4 right-4 z-20 pointer-events-none flex justify-center">
                <div className="bg-red-950/90 border border-red-500/40 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono font-semibold text-red-200 shadow-xl shadow-red-950/40 animate-in fade-in slide-in-from-top-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF3344] shrink-0 shadow-[0_0_8px_#FF3344] animate-ping" />
                  <span>
                    {isDemo ? 'Simulated Fault' : 'Segment Issue'}: {activePostureFeedback.activeIssues.join(' · ')}
                  </span>
                </div>
              </div>
            )}

          {/* Biomechanics Studio Grid Stage for Demo Mode */}
          {isDemo && (
            <div className="absolute inset-0 bg-[#07080B] bg-[radial-gradient(#1E2333_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none flex flex-col justify-end">
              <div className="w-full h-20 bg-gradient-to-t from-[#0066FF]/8 to-transparent border-t border-white/[0.08] flex items-center justify-between px-6 pb-2">
                <span className="text-[10px] font-mono text-zinc-400">GROUND PLANE · 0° BASELINE</span>
                <span className="text-[10px] font-mono text-[#00FF66]">SIMULATED KINEMATICS ENGINE</span>
              </div>
            </div>
          )}

          {/* Under-the-hood Video Element (Live Camera Mode only) */}
          {camMode === 'live' && (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${
                isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Canvas Element with GREEN / RED Posture Skeleton */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none z-10"
          />

          {/* CENTER OF AI CAM: GREEN 1+ REP COMPLETION CELEBRATION ANIMATION */}
          {repAnimation && (
            <div
              key={repAnimation.id}
              data-testid="rep-completion-animation"
              aria-label="1+ rep completed"
              data-rep-count={repAnimation.repNumber}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden"
            >
              {/* Expanding Shockwave Rings in Axio Neon Green */}
              <div className="absolute w-44 h-44 sm:w-64 sm:h-64 rounded-full border-2 border-[#00FF66] shadow-[0_0_35px_#00FF66] animate-axio-rep-shockwave" />
              <div
                className="absolute w-44 h-44 sm:w-64 sm:h-64 rounded-full border border-[#00FF66]/60 shadow-[0_0_55px_rgba(0,255,102,0.4)] animate-axio-rep-shockwave"
                style={{ animationDelay: '0.12s' }}
              />

              {/* Sparkle Particles Radiating Outward */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[
                  { x: '-70px', y: '-60px', delay: '0s' },
                  { x: '70px', y: '-60px', delay: '0.04s' },
                  { x: '-85px', y: '15px', delay: '0.02s' },
                  { x: '85px', y: '15px', delay: '0.06s' },
                  { x: '-45px', y: '70px', delay: '0.03s' },
                  { x: '45px', y: '70px', delay: '0.05s' },
                  { x: '0px', y: '-80px', delay: '0.01s' },
                  { x: '0px', y: '80px', delay: '0.04s' },
                ].map((p, idx) => (
                  <span
                    key={idx}
                    className="absolute w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_12px_#00FF66] animate-axio-rep-particle"
                    style={
                      {
                        '--tx': p.x,
                        '--ty': p.y,
                        animationDelay: p.delay,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>

              {/* Central Glowing 1+ Badge with Upward Float & Pop In */}
              <div className="relative flex flex-col items-center justify-center animate-axio-rep-pop">
                {/* Radiant Ambient Green Glow Behind Badge */}
                <div className="absolute -inset-8 bg-[#00FF66]/35 rounded-full blur-2xl pointer-events-none" />

                {/* Glass Container */}
                <div className="relative bg-[#0B0C10]/92 backdrop-blur-xl border-2 border-[#00FF66] rounded-3xl px-8 py-5 sm:px-12 sm:py-7 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(0,255,102,0.55),inset_0_0_24px_rgba(0,255,102,0.25)]">
                  {/* Main Glowing +1 Text */}
                  <div className="flex items-center justify-center gap-1.5 leading-none">
                    <span className="text-6xl sm:text-8xl font-black font-mono text-[#00FF66] tracking-tighter drop-shadow-[0_0_32px_#00FF66] select-none">
                      +1
                    </span>
                    <span className="sr-only">1+ rep counted</span>
                  </div>

                  {/* Rep Count Subtitle Pill */}
                  <div className="mt-2.5 flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/40 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-ping" />
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-[#00FF66] uppercase">
                      REP {repAnimation.repNumber} COMPLETED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Camera Idle / Placeholder Display (Live Mode only) */}
          {camMode === 'live' && !isCameraActive && !cameraLoading && !cameraError && (
            <div className="text-center p-8 space-y-4 max-w-md z-10">
              <div className="w-16 h-16 rounded-full bg-[#101218] border border-white/[0.08] flex items-center justify-center mx-auto text-[#0066FF] shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Launch Live AXIO AI CAM
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Allow camera permissions to begin computer vision pose tracking. Your joints and anatomical connections will be visualized in real-time (Green = correct movement, Red = form correction).
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => startCamera()}
                  iconLeft={<Play className="w-4 h-4 fill-current" />}
                >
                  Allow Camera &amp; Start Coach
                </Button>
                <button
                  onClick={() => handleSwitchMode('demo')}
                  className="px-4 py-2 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] text-xs font-semibold hover:bg-[#00FF66]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Try Presentation Demo Mode</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Loading Display */}
          {cameraLoading && (
            <div className="text-center p-8 space-y-3 z-10 font-sans">
              <div className="w-10 h-10 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs text-white font-medium">Connecting to video feed...</div>
              <div className="text-[11px] text-zinc-400">
                Booting MediaPipe Neural Vision Model
              </div>
            </div>
          )}

          {/* Camera Error Display */}
          {cameraError && (
            <div className="text-center p-8 space-y-4 max-w-md z-10 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Camera Access Required
                </h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {cameraError.message}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => startCamera()}
                  iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Camera
                </Button>
              </div>
            </div>
          )}

          {/* BOTTOM OVERLAID REAL-TIME CORRECTION & STATUS BANNER */}
          {isTrackingActive && (
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
              <div className="bg-[#0B0C10]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-4 shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 transition-colors duration-300 ${
                      activeAiStatus === 'GOOD FORM'
                        ? 'bg-[#00FF66] shadow-[0_0_10px_#00FF66]'
                        : activeAiStatus === 'IMPROVE FORM'
                        ? 'bg-amber-400 shadow-[0_0_10px_#F59E0B]'
                        : 'bg-[#0066FF] shadow-[0_0_10px_#0066FF]'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-sans uppercase tracking-normal text-zinc-400 block font-semibold">
                      {isDemo ? 'SIMULATED TECHNIQUE CUE' : 'REAL-TIME CORRECTION MESSAGE'}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate block">
                      "{activeFeedback}"
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 text-xs hidden sm:block">
                  <span className="text-zinc-400 block text-[10px] font-sans uppercase font-medium">PHASE</span>
                  <span className="text-[#0066FF] font-semibold tracking-normal font-sans">
                    {activeMovementPhase}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SKELETON POSTURE COLOR LEGEND */}
          {isTrackingActive && (
            <div className="absolute bottom-20 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-3 bg-[#0B0C10]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-sans text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
                <span className="text-[#00FF66] font-medium">CORRECT MOVEMENT</span>
              </span>
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3344]" />
                <span className="text-[#FF3344] font-medium">
                  {isDemo ? 'SIMULATED FAULT' : 'FORM ISSUE'}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: DEDICATED AI CAM FEEDBACK & FORM CHECKS (COL 5) */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. EXERCISE NAME, REPS, FORM SCORE, MOVEMENT STATUS */}
          <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-5 space-y-5">
            {/* Header: Exercise Name & Movement Status */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal block font-semibold">
                  {isDemo ? 'SIMULATED EXERCISE' : 'EXERCISE NAME'}
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight mt-0.5 font-sans">
                  {activeExerciseName}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal block font-semibold">
                  CURRENT MOVEMENT STATUS
                </span>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isTrackingActive && activeAiStatus === 'GOOD FORM'
                        ? 'bg-[#00FF66] animate-pulse'
                        : isTrackingActive && activeAiStatus === 'IMPROVE FORM'
                        ? 'bg-amber-400 animate-pulse'
                        : isTrackingActive
                        ? 'bg-[#0066FF] animate-pulse'
                        : 'bg-zinc-500'
                    }`}
                  />
                  <span className="text-xs font-sans font-bold text-[#0066FF] bg-[#0066FF]/10 border border-[#0066FF]/30 px-2.5 py-1 rounded-md tracking-normal">
                    {activeMovementPhase}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Metrics Grid: FORM SCORE & REPS */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* FORM SCORE */}
              <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal font-semibold block">
                    {isDemo ? 'SIMULATED FORM SCORE' : 'FORM SCORE'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span
                      className={`text-4xl font-black font-mono tabular-nums tracking-tight transition-colors duration-300 ${
                        !isTrackingActive || activeFormScore === 0
                          ? 'text-zinc-500'
                          : activeFormScore >= 85
                          ? 'text-[#00FF66]'
                          : activeFormScore >= 70
                          ? 'text-[#0066FF]'
                          : 'text-amber-400'
                      }`}
                    >
                      {isTrackingActive && activeFormScore > 0
                        ? activeFormScore
                        : '--'}
                    </span>
                    {isTrackingActive && activeFormScore > 0 && (
                      <span className="text-sm font-mono text-zinc-400 font-bold">%</span>
                    )}
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      activeFormScore >= 85
                        ? 'bg-[#00FF66]'
                        : activeFormScore >= 70
                        ? 'bg-[#0066FF]'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.max(0, activeFormScore)}%` }}
                  />
                </div>
              </div>

              {/* LIVE / DEMO REP COUNTER */}
              <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal font-semibold block">
                      {isDemo ? 'DEMO REPS' : 'REPS'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans text-zinc-400 font-medium">
                        TARGET: {targetReps}
                      </span>
                      {!isDemo && (
                        <button
                          onClick={handleManualAddRep}
                          className="px-2 py-0.5 rounded-md bg-[#00FF66]/10 hover:bg-[#00FF66]/20 border border-[#00FF66]/30 text-[#00FF66] text-[10px] font-mono font-bold flex items-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FF66] cursor-pointer"
                          title="Count +1 Rep (Test Animation)"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+1 Rep</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-4xl font-black font-mono text-white tabular-nums tracking-tight">
                      {activeRepCount}
                    </span>
                    <span className="text-lg font-mono text-zinc-400 font-medium">
                      / {targetReps}
                    </span>
                  </div>
                </div>

                {/* Reps Progress Bar */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-[#0066FF] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (activeRepCount / targetReps) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. INDIVIDUAL FORM CHECKS */}
          <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal block font-semibold">
                  TECHNIQUE VERIFICATION
                </span>
                <h4 className="text-base font-bold text-white mt-0.5 font-sans">
                  {isDemo ? 'Kinematic Technique Verification' : 'Individual Form Checks'}
                </h4>
              </div>
              <span className="text-[10px] font-sans text-[#0066FF] bg-[#0066FF]/10 border border-[#0066FF]/30 px-2.5 py-0.5 rounded font-bold">
                {isDemo ? 'SIMULATED AUDIT' : 'REAL-TIME AUDIT'}
              </span>
            </div>

            {/* Individual Form Check Items */}
            <div className="space-y-2.5">
              {activeFormChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#0B0C10] border border-white/[0.06] flex items-center justify-between transition-all duration-300"
                >
                  <div>
                    <span className="text-xs font-sans font-semibold uppercase tracking-normal text-white block">
                      {check.label}
                    </span>
                    <span className="text-[11px] font-sans text-zinc-400 mt-0.5 block">
                      {isTrackingActive && check.status !== 'READY'
                        ? `${isDemo ? 'Kinematic Accuracy' : 'Live Accuracy'}: ${check.score}%`
                        : 'Awaiting Movement Cycle'}
                    </span>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-lg border font-sans text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                      !isTrackingActive || check.status === 'READY'
                        ? 'bg-white/5 border-white/10 text-zinc-400'
                        : check.isGood
                        ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66]'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {isTrackingActive && check.status !== 'READY' && (
                      check.isGood ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      )
                    )}
                    <span>{check.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. REAL-TIME CORRECTION MESSAGE CARD */}
          <div
            className={`p-4 rounded-xl border transition-all duration-300 ${
              !isTrackingActive
                ? 'bg-[#101218] border-white/[0.08]'
                : activeAiStatus === 'GOOD FORM'
                ? 'bg-[#00FF66]/[0.05] border-[#00FF66]/25 shadow-[0_0_20px_rgba(0,255,102,0.06)]'
                : activeAiStatus === 'IMPROVE FORM'
                ? 'bg-amber-500/[0.05] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                : 'bg-[#0066FF]/[0.05] border-[#0066FF]/25'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans uppercase tracking-normal font-semibold text-zinc-400">
                  {isDemo ? 'SIMULATED CORRECTION MESSAGE' : 'REAL-TIME CORRECTION MESSAGE'}
                </span>
                {isTrackingActive && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeAiStatus === 'GOOD FORM'
                        ? 'bg-[#00FF66] animate-pulse'
                        : activeAiStatus === 'IMPROVE FORM'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-[#0066FF] animate-pulse'
                    }`}
                  />
                )}
              </div>

              {audioFeedback && (
                <span className="text-[10px] font-sans text-[#0066FF] flex items-center gap-1 font-semibold">
                  <Volume2 className="w-3 h-3" />
                  <span>VOICE ACTIVE</span>
                </span>
              )}
            </div>

            <p className="text-base font-bold text-white tracking-tight leading-snug">
              "{activeFeedback}"
            </p>
          </div>

          {/* 4. MEASURED JOINT ANGLES & TECHNIQUE SAFETY */}
          {(isDemo ? demoAnalysisResult.keyAngles : analysisResult.keyAngles).length > 0 && (
            <div className="p-4 rounded-xl bg-[#101218] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal font-semibold block">
                  {isDemo ? 'SIMULATED JOINT ANGLES' : 'MEASURED JOINT ANGLES'}
                </span>
                <span className="text-[9px] font-sans text-zinc-400">
                  Kinematic Geometry
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                {(isDemo ? demoAnalysisResult.keyAngles : analysisResult.keyAngles).map((ang, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[#0B0C10] border border-white/[0.06] flex items-center justify-between"
                  >
                    <span className="text-[11px] text-zinc-400">{ang.label}</span>
                    <strong className="text-white font-bold tabular-nums">
                      {ang.angle}°
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biomechanical Guidance Notice */}
          <div className="p-3.5 rounded-xl bg-[#0B0C10] border border-white/[0.06] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              AXIO AI CAM provides real-time fitness technique feedback based exclusively on detected pose landmarks. For personal safety, maintain controlled form and consult a professional trainer if needed.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. SESSION SUMMARY MODAL (WHEN STOPPED) */}
      {/* ============================================================== */}
      {showSummaryModal && summaryData && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0D]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121318] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/40 text-[#0066FF] flex items-center justify-center mx-auto shadow-lg shadow-[#0066FF]/25">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <div className="text-[10px] font-sans text-[#0066FF] uppercase font-bold tracking-normal">
                AI COMPUTER VISION SESSION SUMMARY
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight mt-1 font-sans">
                Workout Summary
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-sans">
                Recorded technique metrics for {summaryData.exerciseName}
              </p>
            </div>

            {/* Performance Ledger Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#0B0C10] rounded-xl border border-white/5 text-xs text-left">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase block font-sans font-semibold">EXERCISE</span>
                <span className="text-sm font-bold text-white mt-0.5 block font-sans">
                  {summaryData.exerciseName}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase block font-sans font-semibold">TOTAL REPS</span>
                <span className="text-sm font-bold text-[#0066FF] mt-0.5 block font-mono tabular-nums">
                  {summaryData.totalReps} / {targetReps}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase block font-sans font-semibold">AVERAGE FORM</span>
                <span className="text-sm font-bold text-white mt-0.5 block font-mono tabular-nums">
                  {summaryData.averageForm}%
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase block font-sans font-semibold">BEST FORM PEAK</span>
                <span className="text-sm font-bold text-[#00FF66] mt-0.5 block font-mono tabular-nums">
                  {summaryData.bestForm}%
                </span>
              </div>

              <div className="col-span-2 pt-1 border-t border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase block font-sans font-semibold">DURATION</span>
                <span className="text-sm font-bold text-white mt-0.5 block font-mono tabular-nums">
                  {formatTime(summaryData.durationSeconds)}
                </span>
              </div>
            </div>

            {/* Key Feedback Points */}
            <div className="text-left space-y-2">
              <span className="text-xs font-sans text-zinc-400 font-semibold block">
                Key AI Kinematic Feedback:
              </span>
              <div className="space-y-1.5">
                {summaryData.keyFeedback.map((fb, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-zinc-300 bg-[#0B0C10] p-2.5 rounded-lg border border-white/5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                    <span>{fb}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowSummaryModal(false);
                  setSummaryData(null);
                }}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSaveWorkout}
              >
                SAVE WORKOUT
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
