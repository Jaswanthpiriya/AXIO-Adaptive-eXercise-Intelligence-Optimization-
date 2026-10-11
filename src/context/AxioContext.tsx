/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness Platform — Shared Athlete State & Context
 * Centralized shared user state for Dashboard, AI Coach, Workout, AICAM, Nutrition, Progress, and Achievements.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  AthleteProfile,
  CompletedWorkoutSession,
  PageId,
  ScheduledWorkout,
  DailyRecoveryCheckIn,
} from '../types/app.ts';
import { INITIAL_ATHLETE, TODAY_WORKOUT } from '../data/mockData.ts';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface AxioContextType {
  athlete: AthleteProfile;
  updateAthlete: (updated: AthleteProfile) => void;
  workoutHistory: CompletedWorkoutSession[];
  saveWorkoutSession: (session: CompletedWorkoutSession) => void;
  clearWorkoutHistory: () => void;
  todayWorkout: ScheduledWorkout;
  updateTodayWorkout: (workout: ScheduledWorkout) => void;
  coachMessages: ChatMessage[];
  addCoachMessage: (message: ChatMessage) => void;
  setCoachMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearCoachConversation: () => void;
  currentPage: PageId;
  navigateTo: (page: PageId) => void;
  goBack: () => boolean;
  isOnboarding: boolean;
  setIsOnboarding: (onboarding: boolean) => void;
  completeOnboarding: (profile: AthleteProfile) => void;
  hasRealUserData: boolean;
  recoveryCheckIns: DailyRecoveryCheckIn[];
  latestRecoveryCheckIn: DailyRecoveryCheckIn | null;
  saveRecoveryCheckIn: (checkIn: DailyRecoveryCheckIn) => void;
  assistantLanguage: 'en' | 'te' | 'auto';
  setAssistantLanguage: (lang: 'en' | 'te' | 'auto') => void;
}

const STORAGE_KEY_ATHLETE = 'axio_athlete_profile';
const STORAGE_KEY_HISTORY = 'axio_workout_history';
const STORAGE_KEY_COACH = 'axio_coach_messages';
const STORAGE_KEY_RECOVERY = 'axio_recovery_checkins';
const STORAGE_KEY_ASSISTANT_LANG = 'axio_assistant_language';

const AxioContext = createContext<AxioContextType | undefined>(undefined);

export const AxioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [pageHistory, setPageHistory] = useState<PageId[]>(['dashboard']);

  // Load workout sessions history - default to empty array (No fake data!)
  const [workoutHistory, setWorkoutHistory] = useState<CompletedWorkoutSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load workout history from localStorage', e);
    }
    return [];
  });

  // Calculate actual computed stats from real sessions
  const computedStats = useMemo(() => {
    if (workoutHistory.length === 0) {
      return {
        streakDays: 0,
        weeklyVolumeKg: 0,
        completedWorkoutsThisWeek: 0,
        formScore: 0,
        performanceScore: 0,
      };
    }

    const now = Date.now();
    const oneWeekAgo = now - 7 * 86400 * 1000;
    const thisWeekSessions = workoutHistory.filter((s) => s.timestamp >= oneWeekAgo);

    const weeklyVolume = thisWeekSessions.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);

    const formAccuracies = workoutHistory
      .map((s) => s.averageFormAccuracy)
      .filter((score): score is number => typeof score === 'number' && score > 0);
    const avgForm = formAccuracies.length > 0
      ? Math.round(formAccuracies.reduce((a, b) => a + b, 0) / formAccuracies.length)
      : 0;

    // Calculate streak from session dates (consecutive days with activity)
    const dayTimestamps = new Set(
      workoutHistory.map((s) => new Date(s.timestamp).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      if (dayTimestamps.has(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    const performanceScore = avgForm > 0
      ? Math.min(100, Math.round(avgForm * 0.9 + Math.min(10, thisWeekSessions.length * 2)))
      : 0;

    return {
      streakDays: streak,
      weeklyVolumeKg: weeklyVolume,
      completedWorkoutsThisWeek: thisWeekSessions.length,
      formScore: avgForm,
      performanceScore,
    };
  }, [workoutHistory]);

  // Load athlete profile
  const [athlete, setAthlete] = useState<AthleteProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATHLETE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_ATHLETE,
          ...parsed,
        };
      }
    } catch (e) {
      console.warn('Failed to load athlete profile from localStorage', e);
    }
    // Default initial profile without fabricated statistics
    return {
      ...INITIAL_ATHLETE,
      streakDays: 0,
      weeklyVolumeKg: 0,
      completedWorkoutsThisWeek: 0,
      formScore: 0,
      performanceScore: 0,
    };
  });

  // Keep athlete statistics synced with actual workout history
  useEffect(() => {
    setAthlete((prev) => ({
      ...prev,
      streakDays: computedStats.streakDays,
      weeklyVolumeKg: computedStats.weeklyVolumeKg,
      completedWorkoutsThisWeek: computedStats.completedWorkoutsThisWeek,
      formScore: computedStats.formScore,
      performanceScore: computedStats.performanceScore,
    }));
  }, [computedStats]);

  // Scheduled / Active workout state
  const [todayWorkout, setTodayWorkout] = useState<ScheduledWorkout>(() => ({
    ...TODAY_WORKOUT,
    durationMinutes: athlete.workoutDurationMinutes || 60,
  }));

  // Initial welcome message for coach
  const getInitialCoachMessage = (ath: AthleteProfile): ChatMessage => ({
    id: 'welcome-msg',
    sender: 'ai',
    text: `Hello ${ath.name.split(' ')[0]}! I am your AXIO AI Coach.

I have your profile loaded:
- Level: ${ath.fitnessLevel || 'Beginner'}
- Goal: ${ath.goals?.join(', ') || 'General Fitness'}
- Equipment: ${ath.availableEquipment?.join(', ') || 'Bodyweight'}
- Location: ${ath.workoutLocation || 'Home Gym'}

Ask me anything about your training, exercise form (like push-ups or squats), recovery, or nutrition. What would you like to focus on today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Coach conversation history state (persisted for the session)
  const [coachMessages, setCoachMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_COACH);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load coach messages from sessionStorage', e);
    }
    return [getInitialCoachMessage(athlete)];
  });

  // Save coach messages to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_COACH, JSON.stringify(coachMessages));
    } catch (e) {
      console.warn('Failed to save coach messages to sessionStorage', e);
    }
  }, [coachMessages]);

  const addCoachMessage = (message: ChatMessage) => {
    setCoachMessages((prev) => [...prev, message]);
  };

  const clearCoachConversation = () => {
    const welcome = getInitialCoachMessage(athlete);
    setCoachMessages([welcome]);
    try {
      sessionStorage.setItem(STORAGE_KEY_COACH, JSON.stringify([welcome]));
    } catch (e) {
      console.warn('Failed to clear coach messages in sessionStorage', e);
    }
  };

  // Check if onboarding is needed
  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATHLETE);
      if (!saved) return false; // Default to direct access for existing apps
      const parsed = JSON.parse(saved);
      return parsed.onboardingCompleted === false;
    } catch (e) {
      return false;
    }
  });

  const navigateTo = (page: PageId) => {
    setPageHistory((prev) => (prev[prev.length - 1] === page ? prev : [...prev, page]));
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = (): boolean => {
    if (pageHistory.length > 1) {
      const nextHistory = [...pageHistory];
      nextHistory.pop(); // remove current page
      const prevPage = nextHistory[nextHistory.length - 1];
      setPageHistory(nextHistory);
      setCurrentPage(prevPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    return false;
  };

  const updateAthlete = (updated: AthleteProfile) => {
    setAthlete(updated);
    try {
      localStorage.setItem(STORAGE_KEY_ATHLETE, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist athlete profile', e);
    }
  };

  const saveWorkoutSession = (newSession: CompletedWorkoutSession) => {
    setWorkoutHistory((prev) => {
      // Prevent accidental double-saving of the same session ID
      if (prev.some((s) => s.id === newSession.id)) {
        return prev;
      }
      const updated = [newSession, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist workout history', e);
      }
      return updated;
    });
  };

  const clearWorkoutHistory = () => {
    setWorkoutHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (e) {
      console.warn('Failed to clear workout history', e);
    }
  };

  const updateTodayWorkout = (workout: ScheduledWorkout) => {
    setTodayWorkout(workout);
  };

  const completeOnboarding = (completedProfile: AthleteProfile) => {
    updateAthlete(completedProfile);
    setIsOnboarding(false);
    navigateTo('dashboard');
  };

  const hasRealUserData = workoutHistory.length > 0;

  // Recovery Check-in history state
  const [recoveryCheckIns, setRecoveryCheckIns] = useState<DailyRecoveryCheckIn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECOVERY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load recovery check-ins from localStorage', e);
    }
    return [];
  });

  const latestRecoveryCheckIn = useMemo(() => {
    return recoveryCheckIns.length > 0 ? recoveryCheckIns[0] : null;
  }, [recoveryCheckIns]);

  const saveRecoveryCheckIn = (checkIn: DailyRecoveryCheckIn) => {
    setRecoveryCheckIns((prev) => {
      // Filter out existing check-in for the same date if any, prepend latest
      const filtered = prev.filter((item) => item.date !== checkIn.date);
      const updated = [checkIn, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEY_RECOVERY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist recovery check-ins', e);
      }
      return updated;
    });
  };

  // Assistant Multilingual Preference ('en' | 'te' | 'auto')
  const [assistantLanguage, setAssistantLanguageState] = useState<'en' | 'te' | 'auto'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSISTANT_LANG);
      if (saved === 'en' || saved === 'te' || saved === 'auto') {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load assistant language preference', e);
    }
    return 'auto';
  });

  const setAssistantLanguage = (lang: 'en' | 'te' | 'auto') => {
    setAssistantLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_ASSISTANT_LANG, lang);
    } catch (e) {
      console.warn('Failed to persist assistant language preference', e);
    }
  };

  return (
    <AxioContext.Provider
      value={{
        athlete,
        updateAthlete,
        workoutHistory,
        saveWorkoutSession,
        clearWorkoutHistory,
        todayWorkout,
        updateTodayWorkout,
        coachMessages,
        addCoachMessage,
        setCoachMessages,
        clearCoachConversation,
        currentPage,
        navigateTo,
        goBack,
        isOnboarding,
        setIsOnboarding,
        completeOnboarding,
        hasRealUserData,
        recoveryCheckIns,
        latestRecoveryCheckIn,
        saveRecoveryCheckIn,
        assistantLanguage,
        setAssistantLanguage,
      }}
    >
      {children}
    </AxioContext.Provider>
  );
};

export const useAxio = (): AxioContextType => {
  const context = useContext(AxioContext);
  if (!context) {
    throw new Error('useAxio must be used within an AxioProvider');
  }
  return context;
};
