/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Mock Application State & Domain Data
 */

import {
  AthleteProfile,
  ScheduledWorkout,
  RecentWorkout,
  AthleteGoal,
  AiRecommendation,
  WeeklyActivityDay,
} from '../types/app.ts';

export const INITIAL_ATHLETE: AthleteProfile = {
  name: 'Alexander Vance',
  age: 26,
  heightCm: 188,
  weightKg: 86.4,
  discipline: 'Fitness & Strength Training',
  tier: 'AXIO Member',
  avatarInitials: 'AV',
  streakDays: 0,
  performanceScore: 0,
  formScore: 0,
  weeklyVolumeKg: 0,
  completedWorkoutsThisWeek: 0,
  totalWorkoutsTarget: 4,

  // Onboarding data defaults
  fitnessLevel: 'Beginner',
  activityLevel: 'Moderately Active',
  trainingExperience: 'Less than 1 year',
  goals: ['General fitness', 'Strength'],
  workoutLocation: 'Home Gym',
  availableEquipment: ['Bodyweight & Calisthenics', 'Dumbbells & Bench'],
  workoutDaysPerWeek: 4,
  workoutDurationMinutes: 45,
  dietPreference: 'Mediterranean / Balanced',
  onboardingCompleted: true,
};

export const TODAY_WORKOUT: ScheduledWorkout = {
  id: 'WO-TODAY',
  title: 'Full Body Movement & Strength Foundation',
  category: 'Full Body Foundational Training',
  durationMinutes: 45,
  estimatedLoadAu: 240,
  timeSlot: 'Today · Flexible',
  targetIntensity: 'Hypertrophy',
  completed: false,
  exercises: [
    {
      name: 'Bodyweight Air Squats',
      sets: 3,
      reps: '10 reps',
      targetWeight: 'Bodyweight',
      velocityTarget: 'Controlled Tempo',
      completed: false,
    },
    {
      name: 'Incline Push-Ups',
      sets: 3,
      reps: '8 reps',
      targetWeight: 'Bodyweight',
      velocityTarget: 'Controlled',
      completed: false,
    },
    {
      name: 'Glute Bridges',
      sets: 3,
      reps: '12 reps',
      targetWeight: 'Bodyweight',
      velocityTarget: '1s Pause at top',
      completed: false,
    },
    {
      name: 'Forearm Plank Hold',
      sets: 3,
      reps: '30 seconds',
      targetWeight: 'Bodyweight',
      velocityTarget: 'Steady Breathing',
      completed: false,
    },
  ],
};

export const WEEKLY_ACTIVITY: WeeklyActivityDay[] = [
  { day: 'Sun', date: 'Oct 4', durationMinutes: 45, loadAu: 210, performanceIndex: 88 },
  { day: 'Mon', date: 'Oct 5', durationMinutes: 40, loadAu: 190, performanceIndex: 85 },
  { day: 'Tue', date: 'Oct 6', durationMinutes: 0, loadAu: 0, performanceIndex: 0 },
  { day: 'Wed', date: 'Oct 7', durationMinutes: 45, loadAu: 220, performanceIndex: 90 },
  { day: 'Thu', date: 'Oct 8', durationMinutes: 50, loadAu: 240, performanceIndex: 89 },
  { day: 'Fri', date: 'Oct 9', durationMinutes: 30, loadAu: 150, performanceIndex: 86 },
  { day: 'Sat', date: 'Oct 10', durationMinutes: 45, loadAu: 230, isToday: true, performanceIndex: 90 },
];

export const DEMO_WEEKLY_ACTIVITY = WEEKLY_ACTIVITY;

export const RECENT_WORKOUTS: RecentWorkout[] = [
  {
    id: 'RW-DEMO-1',
    title: 'Foundational Movement & Mobility Block',
    date: 'Yesterday, 16:15',
    durationMinutes: 45,
    peakPower: 450,
    formAccuracy: 92,
    loadAu: 240,
    exercisesCount: 4,
  },
  {
    id: 'RW-DEMO-2',
    title: 'Upper Body Push & Core Endurance',
    date: 'Oct 8, 09:30',
    durationMinutes: 40,
    peakPower: 420,
    formAccuracy: 90,
    loadAu: 210,
    exercisesCount: 4,
  },
];

export const DEMO_RECENT_WORKOUTS = RECENT_WORKOUTS;

export const INITIAL_GOALS: AthleteGoal[] = [
  {
    id: 'G-1',
    title: 'Push-Up Form Mastery & Consistency',
    category: 'Kinematics',
    currentValue: 0,
    targetValue: 10,
    unit: 'strict reps',
    dueDate: 'Next Month',
    completed: false,
  },
  {
    id: 'G-2',
    title: 'Weekly Workout Consistency Target',
    category: 'Workload',
    currentValue: 0,
    targetValue: 4,
    unit: 'sessions',
    dueDate: 'This Week',
    completed: false,
  },
  {
    id: 'G-3',
    title: 'Full Depth Squat Form Symmetry',
    category: 'Biomechanics',
    currentValue: 0,
    targetValue: 90,
    unit: '%',
    dueDate: 'Rolling 7D',
    completed: false,
  },
];

export const AI_RECOMMENDATIONS: AiRecommendation[] = [
  {
    id: 'REC-1',
    category: 'Technique',
    title: 'Camera-Based Form Tracking Ready',
    insight: 'Use AI CAM to analyze your movement kinematics in real-time with camera pose detection.',
    impact: 'Get live feedback on knee depth, elbow alignment, and repetition count.',
    actionText: 'Launch AI CAM',
    actionTarget: 'live-form',
  },
  {
    id: 'REC-2',
    category: 'Progression',
    title: 'Personalized Workout Ready',
    insight: 'A full-body training session is available based on your fitness goals and available equipment.',
    impact: 'Gradual progression tailored to your pace.',
    actionText: 'View Today Workout',
    actionTarget: 'workout',
  },
  {
    id: 'REC-3',
    category: 'Recovery',
    title: 'Hydration & Nutrition Protocol',
    insight: 'Stay fueled with high-quality protein and steady hydration to support active recovery.',
    impact: 'Optimizes muscle repair and reduces soreness.',
    actionText: 'Inspect Nutrition Plan',
    actionTarget: 'nutrition',
  },
];
