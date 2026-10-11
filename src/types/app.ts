/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Application Data Models & Type Definitions
 */

export type PageId =
  | 'dashboard'
  | 'ai-coach'
  | 'workout'
  | 'live-form'
  | 'recovery'
  | 'exercises'
  | 'nutrition'
  | 'progress'
  | 'achievements'
  | 'profile';

export interface RecoveryContributingFactor {
  factor: string;
  impact: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface DailyRecoveryCheckIn {
  id: string;
  date: string;
  timestamp: number;
  sleepHours: number;
  energyLevel: number; // 1-5
  muscleSoreness: number; // 1-5 (1 = None, 5 = Severe)
  stressLevel: number; // 1-5 (1 = Very Low, 5 = Very High)
  readinessScore: number; // 0-100
  recommendedIntensity: 'High Intensity' | 'Moderate Intensity' | 'Active Recovery / Light';
  contributingFactors: RecoveryContributingFactor[];
  summaryExplanation: string;
}

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  recordType: 'Max Weight' | 'Max Reps' | 'Max Session Volume' | 'Peak Form Score' | 'Longest Duration';
  value: number;
  unit: string;
  formattedValue: string;
  previousValue?: number;
  date: string;
  timestamp: number;
  sessionTitle: string;
  sessionId: string;
}

export interface MilestoneItem {
  id: string;
  title: string;
  tier: number;
  category: 'Sessions' | 'Volume' | 'Kinematics' | 'Discipline';
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  xpReward: number;
}

export interface AchievementItem {
  id: string;
  name: string;
  category: 'Milestone' | 'Consistency' | 'Form & Quality' | 'Volume & Power' | 'AI CAM' | 'Personal Records';
  description: string;
  iconType: 'trophy' | 'flame' | 'award' | 'activity' | 'video' | 'dumbbell' | 'target' | 'star';
  currentValue: number;
  targetValue: number;
  unit: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  xpReward: number;
}

export interface GamificationState {
  totalXp: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  levelProgressPercent: number;
  xpBreakdown: {
    workoutsXp: number;
    achievementsXp: number;
    personalRecordsXp: number;
    streakBonusXp: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    multiplier: number;
    activeToday: boolean;
    rollingDays: { dateStr: string; dayLabel: string; hasWorkout: boolean }[];
  };
  personalRecords: PersonalRecord[];
  achievements: AchievementItem[];
  milestones: MilestoneItem[];
}

export type FitnessGoal =
  | 'Weight loss'
  | 'Muscle gain'
  | 'Strength'
  | 'Endurance'
  | 'Flexibility'
  | 'General fitness'
  | 'Sports performance';

export type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite Athlete';
export type ActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Elite Training';
export type TrainingExperience = 'Less than 1 year' | '1 - 3 years' | '3 - 5 years' | '5+ years';
export type WorkoutLocation = 'Commercial Gym' | 'Home Gym' | 'Outdoors' | 'Hybrid / Multi-facility';
export type AvailableEquipment =
  | 'Full Barbell & Racks'
  | 'Dumbbells & Bench'
  | 'Kettlebells & Free Weights'
  | 'Machines & Cables'
  | 'Bodyweight & Calisthenics'
  | 'Cardio Ergometers';
export type DietPreference =
  | 'High Protein Omnivore'
  | 'Plant-Based / Vegan'
  | 'Vegetarian'
  | 'Ketogenic / Low-Carb'
  | 'Mediterranean / Balanced';

export interface AthleteProfile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  discipline: string;
  tier: string;
  avatarInitials: string;
  streakDays: number;
  performanceScore: number; // 0-100
  formScore: number; // 0-100
  weeklyVolumeKg: number;
  completedWorkoutsThisWeek: number;
  totalWorkoutsTarget: number;

  // Onboarding detailed information
  fitnessLevel: FitnessLevel;
  activityLevel: ActivityLevel;
  trainingExperience: TrainingExperience;
  goals: FitnessGoal[];
  workoutLocation: WorkoutLocation;
  availableEquipment: AvailableEquipment[];
  workoutDaysPerWeek: number;
  workoutDurationMinutes: number;
  dietPreference: DietPreference;
  onboardingCompleted: boolean;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  targetWeight: string;
  velocityTarget?: string;
  completed?: boolean;
}

export interface GeneratedWorkoutExercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  difficulty: string;
  targetMuscles: string;
  instructions: string;
  techniqueTips: string;
  targetWeight?: string;
  velocityTarget?: string;
}

export interface GeneratedWorkoutPlan {
  id: string;
  title: string;
  category: string;
  targetGoal: string;
  fitnessLevel: string;
  durationMinutes: number;
  estimatedLoadAu: number;
  difficulty: string;
  targetMusclesSummary?: string[];
  coachingNotes: string;
  exercises: GeneratedWorkoutExercise[];
  createdAt?: string;
}

export interface CompletedSetLog {
  setNum: number;
  weightKg: number;
  reps: number;
  targetVelocity?: number;
  actualVelocity?: number;
  completed: boolean;
}

export interface CompletedExerciseLog {
  exerciseName: string;
  targetMuscles: string;
  difficulty: string;
  sets: CompletedSetLog[];
  completed: boolean;
}

export interface CompletedWorkoutSession {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  durationSeconds: number;
  durationMinutes: number;
  totalVolumeKg: number;
  setsCompleted: number;
  totalSets: number;
  exercisesCompleted: number;
  totalExercises: number;
  averageFormAccuracy: number;
  peakPowerWatts: number;
  loadAu: number;
  goal: string;
  fitnessLevel: string;
  exercises: CompletedExerciseLog[];
}

export interface ScheduledWorkout {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  estimatedLoadAu: number;
  timeSlot: string;
  targetIntensity: 'High Velocity' | 'Max Force' | 'Hypertrophy' | 'Regeneration';
  exercises: WorkoutExercise[];
  completed: boolean;
}

export interface RecentWorkout {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  peakPower: number; // Watts
  formAccuracy: number; // %
  loadAu: number;
  exercisesCount: number;
}

export interface AthleteGoal {
  id: string;
  title: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  dueDate: string;
  completed: boolean;
}

export interface AiRecommendation {
  id: string;
  category: 'Recovery' | 'Technique' | 'Progression' | 'Pacing';
  title: string;
  insight: string;
  impact: string;
  actionText: string;
  actionTarget: PageId;
}

export interface WeeklyActivityDay {
  day: string;
  date: string;
  durationMinutes: number;
  loadAu: number;
  isToday?: boolean;
  performanceIndex: number;
}
