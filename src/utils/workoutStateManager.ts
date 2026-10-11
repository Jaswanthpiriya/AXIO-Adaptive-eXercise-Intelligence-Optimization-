/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness & Human Performance Platform
 * Workout State Manager — Shared Execution & Biometric Session Engine
 */

import {
  AthleteProfile,
  GeneratedWorkoutPlan,
  CompletedWorkoutSession,
} from '../types/app.ts';

export interface ActiveSetRecord {
  setNum: number;
  weightKg: number;
  reps: number;
  targetVelocity?: string;
  actualVelocity?: number;
  completed: boolean;
}

export interface ActiveWorkoutSessionState {
  plan: GeneratedWorkoutPlan;
  startTime: number;
  elapsedSeconds: number;
  activeExerciseIndex: number;
  setsRecords: Record<number, ActiveSetRecord[]>;
}

export const STORAGE_KEY_WORKOUT_PLAN = 'axio_current_workout_plan';
export const STORAGE_KEY_ACTIVE_SESSION = 'axio_active_workout_session';
export const STORAGE_KEY_HISTORY = 'axio_workout_history';

export const DEFAULT_WORKOUT_PLAN: GeneratedWorkoutPlan = {
  id: 'WO-DEFAULT-VBT',
  title: 'Concentric Power & Barbell Velocity',
  category: 'Velocity-Based Training (VBT)',
  targetGoal: 'Strength',
  fitnessLevel: 'Advanced',
  durationMinutes: 65,
  estimatedLoadAu: 480,
  difficulty: 'High Intensity',
  targetMusclesSummary: ['Quadriceps', 'Posterior Chain', 'Deltoids', 'Core'],
  coachingNotes:
    'Prioritize maximum concentric acceleration on every single repetition. Autoregulate if bar velocity drops > 15% from baseline.',
  exercises: [
    {
      id: 'ex-1',
      name: 'Dynamic Barbell Back Squat',
      sets: 4,
      reps: '5 reps @ 75% 1RM',
      restTime: '2-3 minutes',
      difficulty: 'High Intensity',
      targetMuscles: 'Quadriceps, Gluteus Maximus, Core Bracing',
      instructions:
        'Set up under the bar with high-rack shelf. Inhale diaphragmatically into belt, descend under strict control until femurs break parallel, then explode upward driving heels through the floor.',
      techniqueTips:
        'Spread the floor laterally to prevent knee valgus. Maintain vertical torso angle and do not allow hips to rise faster than chest.',
      targetWeight: '140 kg',
      velocityTarget: '> 0.85 m/s',
    },
    {
      id: 'ex-2',
      name: 'Power Clean from Hang',
      sets: 4,
      reps: '3 reps',
      restTime: '2 minutes',
      difficulty: 'High Intensity',
      targetMuscles: 'Traps, Posterior Chain, Glutes, Hamstrings',
      instructions:
        'Hinge barbell to just above kneecaps with flat back. Violently extend ankles, knees, and hips simultaneously, shrugging shoulders and snapping elbows forward to catch on anterior deltoids.',
      techniqueTips:
        'Ensure full triple extension before elbow bend. Receive the bar in a solid quarter-squat athletic stance.',
      targetWeight: '105 kg',
      velocityTarget: '> 1.60 m/s',
    },
    {
      id: 'ex-3',
      name: 'Incline Barbell Bench Press',
      sets: 4,
      reps: '6 reps',
      restTime: '2 minutes',
      difficulty: 'High Intensity',
      targetMuscles: 'Upper Clavicular Pectorals, Anterior Deltoids, Triceps',
      instructions:
        'Grip barbell at 1.5x biacromial shoulder width. Lower bar with controlled cadence to upper sternum, drive heels into platform and press with maximum concentric velocity.',
      techniqueTips:
        'Keep scapulae retracted and depressed. Do not allow wrists to hyperextend under load.',
      targetWeight: '100 kg',
      velocityTarget: '> 0.70 m/s',
    },
    {
      id: 'ex-4',
      name: 'Trap Bar Deadlift (High Handle)',
      sets: 3,
      reps: '5 reps',
      restTime: '3 minutes',
      difficulty: 'High Intensity',
      targetMuscles: 'Posterior Chain, Gluteals, Erectors, Trapezius',
      instructions:
        'Stand centered in hexagonal frame. Hinge back, lock lats tight, brace abdominal wall and drive through floor in synchronous hip/knee extension.',
      techniqueTips:
        'Pack the neck and push the floor away. Avoid spinal flexion during initial pull off floor.',
      targetWeight: '180 kg',
      velocityTarget: '> 0.65 m/s',
    },
  ],
};

export const DEFAULT_BEGINNER_WORKOUT_PLAN: GeneratedWorkoutPlan = {
  id: 'WO-DEFAULT-BEGINNER',
  title: 'Foundational Movement & Strength Routine',
  category: 'Movement Fundamentals & Mobility',
  targetGoal: 'General fitness',
  fitnessLevel: 'Beginner',
  durationMinutes: 40,
  estimatedLoadAu: 200,
  difficulty: 'Beginner Friendly',
  targetMusclesSummary: ['Quadriceps', 'Chest', 'Core', 'Glutes'],
  coachingNotes:
    'Focus on smooth control, balanced posture, and comfortable range of motion. Rest 60 seconds between sets.',
  exercises: [
    {
      id: 'ex-beg-1',
      name: 'Bodyweight Air Squats',
      sets: 3,
      reps: '10 reps',
      restTime: '60 seconds',
      difficulty: 'Beginner',
      targetMuscles: 'Quadriceps, Glutes, Core',
      instructions:
        'Stand tall with feet shoulder-width apart. Sit hips back and down to comfortable parallel depth, then push up through mid-foot.',
      techniqueTips: 'Keep chest lifted and track knees in line with toes.',
      targetWeight: 'Bodyweight',
      velocityTarget: '2-0-1-0 Tempo',
    },
    {
      id: 'ex-beg-2',
      name: 'Incline Push-Ups (or Knee Push-Ups)',
      sets: 3,
      reps: '8 reps',
      restTime: '60 seconds',
      difficulty: 'Beginner',
      targetMuscles: 'Chest, Shoulders, Triceps',
      instructions:
        'Place hands on a sturdy elevated bench or counter. Lower chest with elbows at 45 degrees, then press back up keeping core firm.',
      techniqueTips: 'Maintain a straight plank line without hip sagging.',
      targetWeight: 'Bodyweight',
      velocityTarget: 'Controlled Tempo',
    },
    {
      id: 'ex-beg-3',
      name: 'Glute Bridges',
      sets: 3,
      reps: '12 reps',
      restTime: '45 seconds',
      difficulty: 'Beginner',
      targetMuscles: 'Gluteus Maximus, Hamstrings',
      instructions:
        'Lie on your back with knees bent and feet flat. Squeeze glutes and press hips upward until thighs align with torso.',
      techniqueTips: 'Pause for 1 second at the top contraction. Avoid arching lower back.',
      targetWeight: 'Bodyweight',
      velocityTarget: 'Controlled Pause',
    },
    {
      id: 'ex-beg-4',
      name: 'Forearm Plank Hold',
      sets: 3,
      reps: '25–30 seconds',
      restTime: '45 seconds',
      difficulty: 'Beginner',
      targetMuscles: 'Core, Abdominals',
      instructions:
        'Hold a firm straight plank on forearms and toes, breathing rhythmically into abdomen.',
      techniqueTips: 'Keep neck neutral and brace abdominals firmly.',
      targetWeight: 'Bodyweight',
      velocityTarget: 'Isometric Hold',
    },
  ],
};

/**
 * Gets the athlete's current generated or default workout plan
 */
export function getCurrentWorkoutPlan(athlete: AthleteProfile): GeneratedWorkoutPlan {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WORKOUT_PLAN);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.title && Array.isArray(parsed.exercises)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load current workout plan', e);
  }

  return athlete.fitnessLevel === 'Beginner'
    ? DEFAULT_BEGINNER_WORKOUT_PLAN
    : DEFAULT_WORKOUT_PLAN;
}

/**
 * Checks whether an active workout session is currently running
 */
export function isWorkoutActive(): boolean {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
    if (saved) {
      const parsed = JSON.parse(saved);
      return Boolean(parsed && parsed.startTime);
    }
  } catch (e) {
    console.warn('Failed to check active workout session', e);
  }
  return false;
}

/**
 * Retrieves the current active workout session state
 */
export function getActiveWorkoutSession(): ActiveWorkoutSessionState | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load active workout session', e);
  }
  return null;
}

/**
 * Initializes set records for a workout plan
 */
export function initSetsForPlan(plan: GeneratedWorkoutPlan): Record<number, ActiveSetRecord[]> {
  const records: Record<number, ActiveSetRecord[]> = {};
  plan.exercises.forEach((ex, idx) => {
    const count = ex.sets || 3;
    const parsedLoadMatch = ex.targetWeight?.match(/(\d+(\.\d+)?)/);
    const parsedWeight = parsedLoadMatch ? parseFloat(parsedLoadMatch[1]) : 60;
    const parsedRepsMatch = ex.reps?.match(/(\d+)/);
    const parsedReps = parsedRepsMatch ? parseInt(parsedRepsMatch[1], 10) : 8;

    records[idx] = Array.from({ length: count }, (_, sIdx) => ({
      setNum: sIdx + 1,
      weightKg: parsedWeight,
      reps: parsedReps,
      targetVelocity: ex.velocityTarget,
      completed: false,
    }));
  });
  return records;
}

/**
 * Starts an active workout session
 */
export function startWorkoutSession(
  athlete: AthleteProfile,
  customPlan?: GeneratedWorkoutPlan
): { success: boolean; plan: GeneratedWorkoutPlan } {
  const plan = customPlan || getCurrentWorkoutPlan(athlete);
  const sets = initSetsForPlan(plan);
  const sessionState: ActiveWorkoutSessionState = {
    plan,
    startTime: Date.now(),
    elapsedSeconds: 0,
    activeExerciseIndex: 0,
    setsRecords: sets,
  };

  try {
    sessionStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(sessionState));
    localStorage.setItem(STORAGE_KEY_WORKOUT_PLAN, JSON.stringify(plan));
    window.dispatchEvent(new CustomEvent('axio-workout-updated', { detail: { action: 'started', session: sessionState } }));
    return { success: true, plan };
  } catch (e) {
    console.error('Failed to start workout session', e);
    return { success: false, plan };
  }
}

/**
 * Saves active workout progress (e.g. elapsed time, completed sets)
 */
export function saveActiveWorkoutProgress(session: ActiveWorkoutSessionState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('axio-workout-updated', { detail: { action: 'progress', session } }));
  } catch (e) {
    console.warn('Failed to save active workout progress', e);
  }
}

/**
 * Finishes the current active workout session and persists to workout history
 */
export function finishWorkoutSession(
  athlete: AthleteProfile,
  saveSessionCallback?: (session: CompletedWorkoutSession) => void
): { success: boolean; sessionRecord: CompletedWorkoutSession | null } {
  const activeSession = getActiveWorkoutSession();
  if (!activeSession) {
    return { success: false, sessionRecord: null };
  }

  const { plan, startTime, setsRecords } = activeSession;
  const elapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
  const elapsedMin = Math.max(1, Math.round(elapsedSec / 60));

  const allRecordedSets = Object.values(setsRecords || {}).flat();
  const completedSets = allRecordedSets.filter((s) => s.completed);
  const completedSetsCount = completedSets.length;
  const totalSetsCount = allRecordedSets.length;

  const liveTotalVolume = completedSets.reduce(
    (sum, s) => sum + s.weightKg * s.reps,
    0
  );

  const completedExercisesCount = plan.exercises.filter((_, idx) => {
    const exSets = (setsRecords || {})[idx] || [];
    return exSets.length > 0 && exSets.every((s) => s.completed);
  }).length;

  const completedExerciseLogs = plan.exercises.map((ex, idx) => {
    const loggedSets = (setsRecords || {})[idx] || [];
    const isExDone = loggedSets.length > 0 && loggedSets.every((s) => s.completed);
    return {
      exerciseName: ex.name,
      targetMuscles: ex.targetMuscles,
      difficulty: ex.difficulty,
      completed: isExDone,
      sets: loggedSets.map((s) => ({
        setNum: s.setNum,
        weightKg: s.weightKg,
        reps: s.reps,
        targetVelocity: parseFloat(s.targetVelocity?.replace(/[^0-9.]/g, '') || '0.85'),
        actualVelocity: s.actualVelocity,
        completed: s.completed,
      })),
    };
  });

  const completionRate = totalSetsCount > 0 ? completedSetsCount / totalSetsCount : 1;
  const computedFormAccuracy = Math.round(88 + completionRate * 8);
  const effectiveLoadKg =
    liveTotalVolume > 0
      ? Math.min(100, Math.max(15, Math.round(liveTotalVolume / Math.max(1, completedSetsCount * 8))))
      : Math.round((athlete.weightKg || 75) * 0.55);
  const concentricVelocity = 0.72;
  const computedPeakPower = Math.round(effectiveLoadKg * 9.81 * concentricVelocity);
  const computedLoadAu = Math.round(elapsedMin * 7.4);

  const sessionRecord: CompletedWorkoutSession = {
    id: `SESSION-${Date.now()}`,
    title: plan.title,
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
    durationSeconds: elapsedSec,
    durationMinutes: elapsedMin,
    totalVolumeKg: liveTotalVolume,
    setsCompleted: completedSetsCount,
    totalSets: totalSetsCount,
    exercisesCompleted: completedExercisesCount,
    totalExercises: plan.exercises.length,
    averageFormAccuracy: computedFormAccuracy,
    peakPowerWatts: computedPeakPower,
    loadAu: computedLoadAu,
    goal: plan.targetGoal,
    fitnessLevel: plan.fitnessLevel,
    exercises: completedExerciseLogs,
  };

  // Persist to history
  try {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    const historyList: CompletedWorkoutSession[] = saved ? JSON.parse(saved) : [];
    const updatedHistory = [sessionRecord, ...historyList];
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.warn('Failed to save to localStorage history', e);
  }

  // Clear active session
  try {
    sessionStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
  } catch (e) {
    console.warn('Failed to clear active session', e);
  }

  // Invoke context callback if provided
  if (saveSessionCallback) {
    try {
      saveSessionCallback(sessionRecord);
    } catch (e) {
      console.warn('Callback failed', e);
    }
  }

  // Notify UI
  window.dispatchEvent(
    new CustomEvent('axio-workout-updated', {
      detail: { action: 'finished', sessionRecord },
    })
  );

  return { success: true, sessionRecord };
}

/**
 * Retrieves today's completed exercises across active session & completed sessions
 */
export function getTodayCompletedExercises(
  workoutHistory: CompletedWorkoutSession[]
): { name: string; setsCount: number; repsCount: number; source: string }[] {
  const results: { name: string; setsCount: number; repsCount: number; source: string }[] = [];
  const exerciseMap: Record<string, { setsCount: number; repsCount: number; source: string }> = {};

  // 1. Check active session sets
  const activeSession = getActiveWorkoutSession();
  if (activeSession && activeSession.setsRecords) {
    activeSession.plan.exercises.forEach((ex, idx) => {
      const sets = activeSession.setsRecords[idx] || [];
      const completed = sets.filter((s) => s.completed);
      if (completed.length > 0) {
        const totalReps = completed.reduce((sum, s) => sum + s.reps, 0);
        exerciseMap[ex.name] = {
          setsCount: (exerciseMap[ex.name]?.setsCount || 0) + completed.length,
          repsCount: (exerciseMap[ex.name]?.repsCount || 0) + totalReps,
          source: 'Current active workout',
        };
      }
    });
  }

  // 2. Check today's finished sessions from history
  const todayStr = new Date().toDateString();
  const todaySessions = (workoutHistory || []).filter((s) => {
    return new Date(s.timestamp).toDateString() === todayStr;
  });

  todaySessions.forEach((s) => {
    (s.exercises || []).forEach((e) => {
      const sets = e.sets || [];
      const completed = sets.filter((st) => st.completed !== false);
      if (completed.length > 0) {
        const totalReps = completed.reduce((sum, st) => sum + (st.reps || 8), 0);
        exerciseMap[e.exerciseName] = {
          setsCount: (exerciseMap[e.exerciseName]?.setsCount || 0) + completed.length,
          repsCount: (exerciseMap[e.exerciseName]?.repsCount || 0) + totalReps,
          source: `Session: ${s.title}`,
        };
      }
    });
  });

  for (const [name, stats] of Object.entries(exerciseMap)) {
    results.push({
      name,
      setsCount: stats.setsCount,
      repsCount: stats.repsCount,
      source: stats.source,
    });
  }

  return results;
}
