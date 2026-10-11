/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO — Universal Fitness & Human Performance Platform
 * Core Application Engine, Shared State Architecture & Multi-Page Navigation Structure
 */

import React from 'react';
import { PageId } from './types/app.ts';
import { AxioProvider, useAxio } from './context/AxioContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { MobileNav } from './components/layout/MobileNav.tsx';
import { AppHeader } from './components/layout/AppHeader.tsx';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow.tsx';
import { AxioPersonalAssistant } from './components/AxioPersonalAssistant.tsx';

// Main Application Pages
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AiCoachPage } from './pages/AiCoachPage.tsx';
import { WorkoutPage } from './pages/WorkoutPage.tsx';
import { LiveFormCoachPage } from './pages/LiveFormCoachPage.tsx';
import { RecoveryPage } from './pages/RecoveryPage.tsx';
import { ExercisesPage } from './pages/ExercisesPage.tsx';
import { NutritionPage } from './pages/NutritionPage.tsx';
import { ProgressPage } from './pages/ProgressPage.tsx';
import { AchievementsPage } from './pages/AchievementsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';

function AppLayout() {
  const {
    athlete,
    updateAthlete,
    workoutHistory,
    saveWorkoutSession,
    currentPage,
    navigateTo,
    isOnboarding,
    setIsOnboarding,
    completeOnboarding,
  } = useAxio();

  // If user is currently running the onboarding flow
  if (isOnboarding) {
    return (
      <OnboardingFlow
        initialProfile={athlete}
        onComplete={completeOnboarding}
        onCancel={() => setIsOnboarding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#FFFFFF] font-sans selection:bg-[#0066FF] selection:text-white flex flex-col md:flex-row antialiased">
      {/* 1. Desktop Premium Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        athlete={athlete}
      />

      {/* 2. Mobile Responsive Navigation (Header + Bottom Bar + Drawer) */}
      <MobileNav
        currentPage={currentPage}
        onNavigate={navigateTo}
        athlete={athlete}
      />

      {/* 3. Main Application Canvas */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Desktop Top Header Bar */}
        <AppHeader
          currentPage={currentPage}
          onNavigate={navigateTo}
          athlete={athlete}
          workoutHistory={workoutHistory}
          onStartOnboarding={() => setIsOnboarding(true)}
        />

        {/* Viewport Router Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              athlete={athlete}
              onNavigate={navigateTo}
              workoutHistory={workoutHistory}
            />
          )}

          {currentPage === 'ai-coach' && (
            <AiCoachPage
              athlete={athlete}
              workoutHistory={workoutHistory}
            />
          )}

          {currentPage === 'workout' && (
            <WorkoutPage
              athlete={athlete}
              onUpdateAthlete={updateAthlete}
              workoutHistory={workoutHistory}
              onSaveWorkoutSession={saveWorkoutSession}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'live-form' && (
            <LiveFormCoachPage
              athlete={athlete}
              onUpdateAthlete={updateAthlete}
              onSaveWorkoutSession={saveWorkoutSession}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'recovery' && (
            <RecoveryPage
              athlete={athlete}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'exercises' && (
            <ExercisesPage onNavigate={navigateTo} />
          )}

          {currentPage === 'nutrition' && (
            <NutritionPage
              athlete={athlete}
              onUpdateAthlete={updateAthlete}
            />
          )}

          {currentPage === 'progress' && (
            <ProgressPage
              workoutHistory={workoutHistory}
              athlete={athlete}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'achievements' && (
            <AchievementsPage
              athlete={athlete}
              workoutHistory={workoutHistory}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'profile' && (
            <ProfilePage
              athlete={athlete}
              onUpdateAthlete={updateAthlete}
              onRetakeOnboarding={() => setIsOnboarding(true)}
            />
          )}
        </main>
      </div>

      {/* 4. AXI — Your Personal AI Floating Assistant Orb */}
      <AxioPersonalAssistant />
    </div>
  );
}

export default function App() {
  return (
    <AxioProvider>
      <AppLayout />
    </AxioProvider>
  );
}
