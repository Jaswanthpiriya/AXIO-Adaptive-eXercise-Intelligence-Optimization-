/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO AI CAM (formerly Live Form Coach)
 * Re-exports the full AI CAM component with real-time pose estimation.
 */

import React from 'react';
import { AiCamPage } from './AiCamPage.tsx';
import { AthleteProfile, CompletedWorkoutSession, PageId } from '../types/app.ts';

interface LiveFormCoachPageProps {
  athlete?: AthleteProfile;
  onUpdateAthlete?: (updated: AthleteProfile) => void;
  onSaveWorkoutSession?: (session: CompletedWorkoutSession) => void;
  onNavigate?: (page: PageId) => void;
}

export const LiveFormCoachPage: React.FC<LiveFormCoachPageProps> = ({
  athlete,
  onUpdateAthlete,
  onSaveWorkoutSession,
  onNavigate,
}) => {
  const fallbackAthlete: AthleteProfile = athlete || {
    name: 'Alexander Vance',
    age: 26,
    heightCm: 188,
    weightKg: 86.4,
    discipline: 'Fitness & Movement Quality',
    tier: 'AXIO Member',
    avatarInitials: 'AV',
    streakDays: 0,
    performanceScore: 0,
    formScore: 0,
    weeklyVolumeKg: 0,
    completedWorkoutsThisWeek: 0,
    totalWorkoutsTarget: 4,
    fitnessLevel: 'Beginner',
    activityLevel: 'Moderately Active',
    trainingExperience: 'Less than 1 year',
    goals: ['General fitness', 'Strength'],
    workoutLocation: 'Home Gym',
    availableEquipment: ['Bodyweight & Calisthenics'],
    workoutDaysPerWeek: 4,
    workoutDurationMinutes: 45,
    dietPreference: 'Mediterranean / Balanced',
    onboardingCompleted: true,
  };

  return (
    <AiCamPage
      athlete={fallbackAthlete}
      onUpdateAthlete={onUpdateAthlete}
      onSaveWorkoutSession={onSaveWorkoutSession}
      onNavigate={onNavigate}
    />
  );
};
