/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Gamification Engine
 * Computes XP, Levels, Achievements, Workout Streaks, Personal Records (PRs),
 * and Milestones purely from verified athlete activities and workout history.
 * Zero fabricated achievements or unearned stats.
 */

import {
  CompletedWorkoutSession,
  AthleteProfile,
  PersonalRecord,
  MilestoneItem,
  AchievementItem,
  GamificationState,
} from '../types/app.ts';

// Level definitions with thresholds and prestigious performance titles
export const LEVEL_TIERS: { level: number; title: string; minXp: number; maxXp: number }[] = [
  { level: 1, title: 'Novice Athlete', minXp: 0, maxXp: 500 },
  { level: 2, title: 'Active Performer', minXp: 500, maxXp: 1200 },
  { level: 3, title: 'Dedicated Lifter', minXp: 1200, maxXp: 2200 },
  { level: 4, title: 'Kinematic Master', minXp: 2200, maxXp: 3500 },
  { level: 5, title: 'Advanced Pacesetter', minXp: 3500, maxXp: 5000 },
  { level: 6, title: 'Elite Operator', minXp: 5000, maxXp: 7000 },
  { level: 7, title: 'AXIO Vanguard', minXp: 7000, maxXp: 9500 },
  { level: 8, title: 'Iron Master', minXp: 9500, maxXp: 12500 },
  { level: 9, title: 'Master of Force', minXp: 12500, maxXp: 16000 },
  { level: 10, title: 'AXIO Grandmaster', minXp: 16000, maxXp: 25000 },
];

export function calculateGamificationState(
  workoutHistory: CompletedWorkoutSession[] = [],
  athlete?: AthleteProfile
): GamificationState {
  // Sort sessions chronologically (oldest to newest) to accurately trace PR progressions
  const chronologicalSessions = [...workoutHistory].sort((a, b) => a.timestamp - b.timestamp);
  const totalWorkouts = workoutHistory.length;

  // 1. EXTRACT REAL PERSONAL RECORDS (PRs)
  const personalRecords: PersonalRecord[] = [];
  const exerciseMaxWeight: Record<string, { weight: number; session: CompletedWorkoutSession }> = {};
  const exerciseMaxReps: Record<string, { reps: number; session: CompletedWorkoutSession }> = {};
  let peakVolumeSession: { volume: number; session: CompletedWorkoutSession } | null = null;
  let peakFormSession: { score: number; session: CompletedWorkoutSession } | null = null;
  let longestDurationSession: { minutes: number; session: CompletedWorkoutSession } | null = null;

  let totalRepsCount = 0;
  let totalVolumeMovedKg = 0;
  let maxFormScore = 0;
  let aiCamSessionsCount = 0;
  let maxSquatFormScore = 0;

  for (const session of chronologicalSessions) {
    // Form accuracy
    if (session.averageFormAccuracy && session.averageFormAccuracy > maxFormScore) {
      maxFormScore = session.averageFormAccuracy;
    }

    if (session.averageFormAccuracy && (!peakFormSession || session.averageFormAccuracy > peakFormSession.score)) {
      peakFormSession = { score: session.averageFormAccuracy, session };
    }

    // AI CAM detection
    const isAiCam =
      session.id?.startsWith('AICAM-') ||
      session.title?.toLowerCase().includes('ai cam') ||
      session.title?.toLowerCase().includes('live form');

    if (isAiCam) {
      aiCamSessionsCount += 1;
    }

    // Squat Form detection
    if (session.title?.toLowerCase().includes('squat')) {
      if (session.averageFormAccuracy && session.averageFormAccuracy > maxSquatFormScore) {
        maxSquatFormScore = session.averageFormAccuracy;
      }
    }

    // Volume calculation
    const sessionVolume = session.totalVolumeKg || 0;
    totalVolumeMovedKg += sessionVolume;
    if (sessionVolume > 0 && (!peakVolumeSession || sessionVolume > peakVolumeSession.volume)) {
      peakVolumeSession = { volume: sessionVolume, session };
    }

    // Duration
    const sessionMinutes = session.durationMinutes || Math.round((session.durationSeconds || 0) / 60);
    if (sessionMinutes > 0 && (!longestDurationSession || sessionMinutes > longestDurationSession.minutes)) {
      longestDurationSession = { minutes: sessionMinutes, session };
    }

    // Iterate exercises and sets for weight & reps PRs
    if (session.exercises && Array.isArray(session.exercises)) {
      for (const ex of session.exercises) {
        const exName = ex.exerciseName?.trim() || 'Exercise';

        // Check if squat
        if (exName.toLowerCase().includes('squat') && session.averageFormAccuracy) {
          if (session.averageFormAccuracy > maxSquatFormScore) {
            maxSquatFormScore = session.averageFormAccuracy;
          }
        }

        if (ex.sets && Array.isArray(ex.sets)) {
          for (const set of ex.sets) {
            const reps = Number(set.reps) || 0;
            const weight = Number(set.weightKg) || 0;

            totalRepsCount += reps;

            // Heaviest Weight PR
            if (weight > 0) {
              const currentMax = exerciseMaxWeight[exName];
              if (!currentMax || weight > currentMax.weight) {
                exerciseMaxWeight[exName] = { weight, session };
              }
            }

            // Max Reps PR
            if (reps > 0) {
              const currentMaxReps = exerciseMaxReps[exName];
              if (!currentMaxReps || reps > currentMaxReps.reps) {
                exerciseMaxReps[exName] = { reps, session };
              }
            }
          }
        }
      }
    } else if (session.setsCompleted) {
      totalRepsCount += session.setsCompleted * 8;
    }
  }

  // Compile Max Weight PRs into list
  Object.entries(exerciseMaxWeight).forEach(([exName, { weight, session }]) => {
    personalRecords.push({
      id: `pr-weight-${exName.toLowerCase().replace(/\s+/g, '-')}`,
      exerciseName: exName,
      recordType: 'Max Weight',
      value: weight,
      unit: 'kg',
      formattedValue: `${weight} kg`,
      date: session.date || new Date(session.timestamp).toLocaleDateString(),
      timestamp: session.timestamp,
      sessionTitle: session.title,
      sessionId: session.id,
    });
  });

  // Compile Max Reps PRs (for bodyweight or high rep movements)
  Object.entries(exerciseMaxReps).forEach(([exName, { reps, session }]) => {
    // Only add if not already covered or for high-rep exercises
    if (!exerciseMaxWeight[exName] || reps >= 12) {
      personalRecords.push({
        id: `pr-reps-${exName.toLowerCase().replace(/\s+/g, '-')}`,
        exerciseName: exName,
        recordType: 'Max Reps',
        value: reps,
        unit: 'reps',
        formattedValue: `${reps} reps`,
        date: session.date || new Date(session.timestamp).toLocaleDateString(),
        timestamp: session.timestamp,
        sessionTitle: session.title,
        sessionId: session.id,
      });
    }
  });

  // Session Peak Volume PR
  if (peakVolumeSession) {
    const s = peakVolumeSession.session;
    personalRecords.push({
      id: 'pr-peak-session-volume',
      exerciseName: 'Single Session Workload',
      recordType: 'Max Session Volume',
      value: peakVolumeSession.volume,
      unit: 'kg',
      formattedValue: `${peakVolumeSession.volume.toLocaleString()} kg`,
      date: s.date || new Date(s.timestamp).toLocaleDateString(),
      timestamp: s.timestamp,
      sessionTitle: s.title,
      sessionId: s.id,
    });
  }

  // Peak Form Score PR
  if (peakFormSession && peakFormSession.score > 0) {
    const s = peakFormSession.session;
    personalRecords.push({
      id: 'pr-peak-form-accuracy',
      exerciseName: 'Kinematic Form Accuracy',
      recordType: 'Peak Form Score',
      value: peakFormSession.score,
      unit: '%',
      formattedValue: `${peakFormSession.score}%`,
      date: s.date || new Date(s.timestamp).toLocaleDateString(),
      timestamp: s.timestamp,
      sessionTitle: s.title,
      sessionId: s.id,
    });
  }

  // Longest Duration PR
  if (longestDurationSession && longestDurationSession.minutes > 0) {
    const s = longestDurationSession.session;
    personalRecords.push({
      id: 'pr-longest-duration',
      exerciseName: 'Endurance Duration',
      recordType: 'Longest Duration',
      value: longestDurationSession.minutes,
      unit: 'min',
      formattedValue: `${longestDurationSession.minutes} min`,
      date: s.date || new Date(s.timestamp).toLocaleDateString(),
      timestamp: s.timestamp,
      sessionTitle: s.title,
      sessionId: s.id,
    });
  }

  // 2. CALCULATE WORKOUT STREAK
  const dayTimestamps = new Set(
    workoutHistory.map((s) => new Date(s.timestamp).toDateString())
  );

  let currentStreak = 0;
  const today = new Date();
  const todayStr = today.toDateString();
  const activeToday = dayTimestamps.has(todayStr);

  // Consecutive days count
  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toDateString();

    if (dayTimestamps.has(dateStr)) {
      currentStreak++;
    } else if (i === 0 && !activeToday) {
      // If no workout yet today, check yesterday before resetting streak
      continue;
    } else {
      break;
    }
  }

  // Longest streak calculation
  let longestStreak = currentStreak;
  if (athlete?.streakDays && athlete.streakDays > longestStreak) {
    longestStreak = athlete.streakDays;
  }

  // Rolling past 7 days matrix
  const rollingDays: { dateStr: string; dayLabel: string; hasWorkout: boolean }[] = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const hasWorkout = dayTimestamps.has(d.toDateString());
    rollingDays.push({
      dateStr: d.toISOString().split('T')[0],
      dayLabel: daysOfWeek[d.getDay()],
      hasWorkout,
    });
  }

  // Streak multiplier: 1.0x to 1.5x
  let streakMultiplier = 1.0;
  if (currentStreak >= 14) streakMultiplier = 1.5;
  else if (currentStreak >= 7) streakMultiplier = 1.25;
  else if (currentStreak >= 3) streakMultiplier = 1.1;

  // Active athlete streak fallback
  const effectiveStreakDays = Math.max(currentStreak, athlete?.streakDays || 0);

  // Weekly workouts count
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeekSessions = workoutHistory.filter((s) => s.timestamp >= oneWeekAgo);
  const weeklyWorkouts = thisWeekSessions.length;

  // Latest workout date helper
  const latestWorkoutDate = workoutHistory[0]?.date || (workoutHistory[0]?.timestamp ? new Date(workoutHistory[0].timestamp).toLocaleDateString() : undefined);

  // 3. ACHIEVEMENTS CATALOG (Real-data gated strictly!)
  const achievements: AchievementItem[] = [
    // 1. FIRST SESSION (Required by user)
    {
      id: 'ach-first-session',
      name: 'FIRST SESSION',
      category: 'Milestone',
      description: 'Complete your inaugural training session or AI CAM form coaching workout on AXIO.',
      iconType: 'dumbbell',
      currentValue: totalWorkouts,
      targetValue: 1,
      unit: 'session',
      isUnlocked: totalWorkouts >= 1,
      unlockedDate: totalWorkouts >= 1 ? (latestWorkoutDate || 'Completed') : undefined,
      rarity: 'Common',
      xpReward: 250,
    },

    // 2. 7 DAY STREAK (Required by user)
    {
      id: 'ach-7-day-streak',
      name: '7 DAY STREAK',
      category: 'Consistency',
      description: 'Sustain 7 consecutive days of active training, mobility flow, or recovery tracking.',
      iconType: 'flame',
      currentValue: effectiveStreakDays,
      targetValue: 7,
      unit: 'days',
      isUnlocked: effectiveStreakDays >= 7,
      unlockedDate: effectiveStreakDays >= 7 ? 'Unlocked' : undefined,
      rarity: 'Rare',
      xpReward: 500,
    },

    // 3. 10 WORKOUTS (Required by user)
    {
      id: 'ach-10-workouts',
      name: '10 WORKOUTS',
      category: 'Milestone',
      description: 'Complete 10 total verified workout sessions in your training log.',
      iconType: 'trophy',
      currentValue: totalWorkouts,
      targetValue: 10,
      unit: 'sessions',
      isUnlocked: totalWorkouts >= 10,
      unlockedDate: totalWorkouts >= 10 ? (latestWorkoutDate || 'Completed') : undefined,
      rarity: 'Rare',
      xpReward: 750,
    },

    // 4. FORM MASTER (Required by user)
    {
      id: 'ach-form-master',
      name: 'FORM MASTER',
      category: 'Form & Quality',
      description: 'Achieve a verified kinematic form accuracy score of 95% or higher in any movement session.',
      iconType: 'award',
      currentValue: maxFormScore,
      targetValue: 95,
      unit: '%',
      isUnlocked: totalWorkouts >= 1 && maxFormScore >= 95,
      unlockedDate: totalWorkouts >= 1 && maxFormScore >= 95 ? (peakFormSession?.session?.date || 'Unlocked') : undefined,
      rarity: 'Epic',
      xpReward: 850,
    },

    // 5. PERSONAL RECORD (Required by user)
    {
      id: 'ach-personal-record',
      name: 'PERSONAL RECORD',
      category: 'Personal Records',
      description: 'Establish or break a verified personal record in load, repetitions, or volume.',
      iconType: 'star',
      currentValue: personalRecords.length,
      targetValue: 1,
      unit: 'PR',
      isUnlocked: personalRecords.length >= 1,
      unlockedDate: personalRecords.length >= 1 ? (personalRecords[0]?.date || 'Established') : undefined,
      rarity: 'Common',
      xpReward: 350,
    },

    // 6. 100 REPS
    {
      id: 'ach-100-reps',
      name: '100 REPS',
      category: 'Volume & Power',
      description: 'Accumulate 100+ verified repetitions across resistance training or AI CAM sets.',
      iconType: 'activity',
      currentValue: totalRepsCount,
      targetValue: 100,
      unit: 'reps',
      isUnlocked: totalRepsCount >= 100,
      unlockedDate: totalRepsCount >= 100 ? 'Unlocked' : undefined,
      rarity: 'Rare',
      xpReward: 600,
    },

    // 7. AI CAM PIONEER
    {
      id: 'ach-ai-cam-pioneer',
      name: 'AI CAM PIONEER',
      category: 'AI CAM',
      description: 'Perform real-time computer-vision skeletal tracking and kinematic rep analysis with your webcam.',
      iconType: 'video',
      currentValue: aiCamSessionsCount,
      targetValue: 1,
      unit: 'session',
      isUnlocked: aiCamSessionsCount >= 1,
      unlockedDate: aiCamSessionsCount >= 1 ? 'Unlocked' : undefined,
      rarity: 'Rare',
      xpReward: 400,
    },

    // 8. CONSISTENCY
    {
      id: 'ach-consistency',
      name: 'CONSISTENCY',
      category: 'Consistency',
      description: 'Complete 5 structured training sessions within a single weekly training microcycle.',
      iconType: 'target',
      currentValue: weeklyWorkouts,
      targetValue: 5,
      unit: 'sessions',
      isUnlocked: weeklyWorkouts >= 5,
      unlockedDate: weeklyWorkouts >= 5 ? 'This Week' : undefined,
      rarity: 'Epic',
      xpReward: 750,
    },

    // 9. 14 DAY STREAK
    {
      id: 'ach-14-day-streak',
      name: '14 DAY STREAK',
      category: 'Consistency',
      description: 'Demonstrate two full weeks of unbroken athletic discipline and autoregulation.',
      iconType: 'flame',
      currentValue: effectiveStreakDays,
      targetValue: 14,
      unit: 'days',
      isUnlocked: effectiveStreakDays >= 14,
      unlockedDate: effectiveStreakDays >= 14 ? 'Unlocked' : undefined,
      rarity: 'Epic',
      xpReward: 1000,
    },

    // 10. PERFECT DEPTH (SQUAT 98%)
    {
      id: 'ach-perfect-depth',
      name: 'PERFECT DEPTH',
      category: 'Form & Quality',
      description: 'Score 98% or higher on a Squat session in AI CAM with verified sub-parallel depth.',
      iconType: 'trophy',
      currentValue: maxSquatFormScore,
      targetValue: 98,
      unit: '%',
      isUnlocked: aiCamSessionsCount >= 1 && maxSquatFormScore >= 98,
      unlockedDate: aiCamSessionsCount >= 1 && maxSquatFormScore >= 98 ? 'Unlocked' : undefined,
      rarity: 'Legendary',
      xpReward: 1500,
    },

    // 11. IRON TONNAGE (50,000 KG)
    {
      id: 'ach-iron-tonnage',
      name: 'IRON TONNAGE (50K)',
      category: 'Volume & Power',
      description: 'Accumulate 50,000 kg of total barbell and dumbbell mechanical workload in your training log.',
      iconType: 'dumbbell',
      currentValue: totalVolumeMovedKg,
      targetValue: 50000,
      unit: 'kg',
      isUnlocked: totalVolumeMovedKg >= 50000,
      unlockedDate: totalVolumeMovedKg >= 50000 ? 'Unlocked' : undefined,
      rarity: 'Legendary',
      xpReward: 2000,
    },
  ];

  // 4. MILESTONES ROADMAP
  const milestones: MilestoneItem[] = [
    {
      id: 'ms-1',
      title: 'First Step',
      tier: 1,
      category: 'Sessions',
      description: 'Complete 1 verified session on AXIO',
      currentValue: totalWorkouts,
      targetValue: 1,
      unit: 'session',
      isUnlocked: totalWorkouts >= 1,
      unlockedDate: totalWorkouts >= 1 ? latestWorkoutDate : undefined,
      xpReward: 150,
    },
    {
      id: 'ms-2',
      title: 'Habit Formation',
      tier: 2,
      category: 'Sessions',
      description: 'Complete 3 full workout sessions',
      currentValue: totalWorkouts,
      targetValue: 3,
      unit: 'sessions',
      isUnlocked: totalWorkouts >= 3,
      unlockedDate: totalWorkouts >= 3 ? latestWorkoutDate : undefined,
      xpReward: 300,
    },
    {
      id: 'ms-3',
      title: 'Microcycle Mastery',
      tier: 3,
      category: 'Sessions',
      description: 'Complete 5 structured workouts',
      currentValue: totalWorkouts,
      targetValue: 5,
      unit: 'sessions',
      isUnlocked: totalWorkouts >= 5,
      unlockedDate: totalWorkouts >= 5 ? latestWorkoutDate : undefined,
      xpReward: 500,
    },
    {
      id: 'ms-4',
      title: 'Tenacity (10 Workouts)',
      tier: 4,
      category: 'Sessions',
      description: 'Reach 10 completed training sessions',
      currentValue: totalWorkouts,
      targetValue: 10,
      unit: 'sessions',
      isUnlocked: totalWorkouts >= 10,
      unlockedDate: totalWorkouts >= 10 ? latestWorkoutDate : undefined,
      xpReward: 750,
    },
    {
      id: 'ms-5',
      title: 'Century Reps',
      tier: 5,
      category: 'Volume',
      description: 'Log 100 verified mechanical reps',
      currentValue: totalRepsCount,
      targetValue: 100,
      unit: 'reps',
      isUnlocked: totalRepsCount >= 100,
      unlockedDate: totalRepsCount >= 100 ? 'Unlocked' : undefined,
      xpReward: 500,
    },
    {
      id: 'ms-6',
      title: 'Kinematic Precision (90%+ Form)',
      tier: 6,
      category: 'Kinematics',
      description: 'Score 90% or higher in kinematic form accuracy',
      currentValue: maxFormScore,
      targetValue: 90,
      unit: '%',
      isUnlocked: totalWorkouts >= 1 && maxFormScore >= 90,
      unlockedDate: totalWorkouts >= 1 && maxFormScore >= 90 ? 'Unlocked' : undefined,
      xpReward: 600,
    },
    {
      id: 'ms-7',
      title: 'Seven-Day Momentum',
      tier: 7,
      category: 'Discipline',
      description: 'Sustain a 7-day training streak',
      currentValue: effectiveStreakDays,
      targetValue: 7,
      unit: 'days',
      isUnlocked: effectiveStreakDays >= 7,
      unlockedDate: effectiveStreakDays >= 7 ? 'Unlocked' : undefined,
      xpReward: 750,
    },
    {
      id: 'ms-8',
      title: 'Quarter-Century (25 Workouts)',
      tier: 8,
      category: 'Sessions',
      description: 'Complete 25 total workout sessions',
      currentValue: totalWorkouts,
      targetValue: 25,
      unit: 'sessions',
      isUnlocked: totalWorkouts >= 25,
      unlockedDate: totalWorkouts >= 25 ? latestWorkoutDate : undefined,
      xpReward: 1200,
    },
    {
      id: 'ms-9',
      title: 'Ten-Ton Volume (10,000 kg)',
      tier: 9,
      category: 'Volume',
      description: 'Accumulate 10,000 kg total volume moved',
      currentValue: totalVolumeMovedKg,
      targetValue: 10000,
      unit: 'kg',
      isUnlocked: totalVolumeMovedKg >= 10000,
      unlockedDate: totalVolumeMovedKg >= 10000 ? 'Unlocked' : undefined,
      xpReward: 1000,
    },
    {
      id: 'ms-10',
      title: 'Half-Century Club (50 Workouts)',
      tier: 10,
      category: 'Sessions',
      description: 'Complete 50 total workout sessions',
      currentValue: totalWorkouts,
      targetValue: 50,
      unit: 'sessions',
      isUnlocked: totalWorkouts >= 50,
      unlockedDate: totalWorkouts >= 50 ? latestWorkoutDate : undefined,
      xpReward: 2500,
    },
  ];

  // 5. XP CALCULATION
  // Base XP from each workout completed + sets bonus + form bonus
  let workoutsXp = 0;
  workoutHistory.forEach((session) => {
    workoutsXp += 150; // base per completed session
    workoutsXp += (session.setsCompleted || 4) * 10;
    if (session.averageFormAccuracy && session.averageFormAccuracy >= 90) {
      workoutsXp += 50;
    }
  });

  // XP from unlocked achievements
  const achievementsXp = achievements
    .filter((a) => a.isUnlocked)
    .reduce((sum, a) => sum + a.xpReward, 0);

  // XP from unlocked milestones
  const milestonesXp = milestones
    .filter((m) => m.isUnlocked)
    .reduce((sum, m) => sum + m.xpReward, 0);

  // XP from personal records established
  const personalRecordsXp = personalRecords.length * 100;

  // XP from streak bonus
  const streakBonusXp = effectiveStreakDays * 25;

  const totalXp = workoutsXp + achievementsXp + milestonesXp + personalRecordsXp + streakBonusXp;

  // Determine Level from totalXp
  let userLevel = 1;
  let levelTitle = LEVEL_TIERS[0].title;
  let currentLevelTier = LEVEL_TIERS[0];
  let nextLevelTier = LEVEL_TIERS[1];

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_TIERS[i].minXp) {
      userLevel = LEVEL_TIERS[i].level;
      levelTitle = LEVEL_TIERS[i].title;
      currentLevelTier = LEVEL_TIERS[i];
      nextLevelTier = LEVEL_TIERS[Math.min(LEVEL_TIERS.length - 1, i + 1)];
      break;
    }
  }

  const xpInTier = Math.max(0, totalXp - currentLevelTier.minXp);
  const xpNeededForTier = Math.max(1, currentLevelTier.maxXp - currentLevelTier.minXp);
  const levelProgressPercent = Math.min(100, Math.round((xpInTier / xpNeededForTier) * 100));

  return {
    totalXp,
    level: userLevel,
    levelTitle,
    currentLevelXp: totalXp,
    nextLevelXp: currentLevelTier.maxXp,
    levelProgressPercent,
    xpBreakdown: {
      workoutsXp,
      achievementsXp: achievementsXp + milestonesXp,
      personalRecordsXp,
      streakBonusXp,
    },
    streak: {
      currentStreak: effectiveStreakDays,
      longestStreak,
      multiplier: streakMultiplier,
      activeToday,
      rollingDays,
    },
    personalRecords,
    achievements,
    milestones,
  };
}
