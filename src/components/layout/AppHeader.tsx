/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Desktop Application Header
 */

import React, { useState, useMemo } from 'react';
import { PageId, AthleteProfile, CompletedWorkoutSession } from '../../types/app.ts';
import { Button } from '../../design-system/components/Button.tsx';
import { Bell, Play, CheckCircle2, ChevronRight, Trophy } from 'lucide-react';
import { calculateGamificationState } from '../../utils/gamification.ts';

interface AppHeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  athlete: AthleteProfile;
  workoutHistory?: CompletedWorkoutSession[];
  onStartOnboarding?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPage,
  onNavigate,
  athlete,
  workoutHistory = [],
  onStartOnboarding,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const gamification = useMemo(() => {
    return calculateGamificationState(workoutHistory, athlete);
  }, [workoutHistory, athlete]);

  const pageNames: Record<PageId, string> = {
    dashboard: 'Dashboard',
    'ai-coach': 'AI Coach',
    workout: 'Workout Routine & Logger',
    'live-form': 'AI CAM · Live Form Coach',
    recovery: 'Daily Recovery & Readiness',
    exercises: 'Exercise Biomechanics',
    nutrition: 'Performance Fueling',
    progress: 'Progress & Analytics',
    achievements: 'Achievements & Milestones',
    profile: 'Athlete Profile & Sensors',
  };

  return (
    <header className="h-16 border-b border-white/[0.08] px-6 sm:px-8 bg-[#0B0B0E]/95 backdrop-blur-md sticky top-0 z-20 hidden md:flex items-center justify-between">
      {/* Zone 1: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-400 font-sans font-medium tracking-normal">AXIO</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-white font-semibold tracking-normal">
          {pageNames[currentPage]}
        </span>
      </div>

      {/* Zone 2: Date & Status Context */}
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
          <span className="font-sans text-[11px] font-medium text-white/90">Sensor Ready</span>
        </div>
        <span aria-hidden="true" className="text-white/20">·</span>
        <span className="text-[11px] text-zinc-400 font-medium">Saturday, 10 October</span>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-3 relative">
        {/* Gamification Level & XP Quick Badge */}
        <button
          onClick={() => onNavigate('achievements')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#11131B] border border-white/[0.08] hover:border-[#0066FF]/60 hover:bg-[#151724] transition-all font-sans text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
          title="View Gamification, Level & Achievements"
        >
          <Trophy className="w-3.5 h-3.5 text-[#0066FF]" />
          <span className="font-semibold text-white">LVL {gamification.level}</span>
          <span className="text-[11px] text-zinc-400 tabular-nums">· {gamification.totalXp.toLocaleString()} XP</span>
        </button>

        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] absolute top-1.5 right-1.5" />
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 bg-[#10121A] border border-white/[0.1] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-xs font-semibold text-white">System Insights</span>
              <span className="text-[10px] font-sans text-[#0066FF] font-bold">3 NEW</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#141620] border border-white/[0.06] space-y-1">
                <div className="font-medium text-white">Target Velocity Met (+0.08 m/s)</div>
                <div className="text-[11px] text-zinc-400">Barbell back squat 75% load gate passed.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#141620] border border-white/[0.06] space-y-1">
                <div className="font-medium text-white">Recovery Score Updated</div>
                <div className="text-[11px] text-zinc-400">Parasympathetic tone optimal for explosive power.</div>
              </div>
            </div>
          </div>
        )}

        {onStartOnboarding && (
          <Button
            size="sm"
            variant="outline"
            onClick={onStartOnboarding}
            className="text-xs"
          >
            Intake Setup
          </Button>
        )}

        <Button
          size="sm"
          variant="primary"
          iconLeft={<Play className="w-3.5 h-3.5 fill-current" />}
          onClick={() => onNavigate('workout')}
        >
          Start Session
        </Button>
      </div>
    </header>
  );
};
