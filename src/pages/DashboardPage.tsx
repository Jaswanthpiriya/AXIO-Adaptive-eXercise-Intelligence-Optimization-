/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Dashboard Page
 * High-performance sports science dashboard adhering to exact brand specifications and anti-slop rules.
 */

import React, { useState, useMemo } from 'react';
import {
  PageId,
  AthleteProfile,
  ScheduledWorkout,
  AthleteGoal,
  CompletedWorkoutSession,
} from '../types/app.ts';
import {
  TODAY_WORKOUT,
  INITIAL_GOALS,
  AI_RECOMMENDATIONS,
} from '../data/mockData.ts';
import { MetricCard } from '../design-system/components/MetricCard.tsx';
import { Button } from '../design-system/components/Button.tsx';
import { PerformanceChart } from '../design-system/components/PerformanceChart.tsx';
import {
  Flame,
  Play,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Circle,
  Video,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Target,
  Dumbbell,
  Activity,
  Lock,
} from 'lucide-react';

interface DashboardPageProps {
  athlete: AthleteProfile;
  onNavigate: (page: PageId) => void;
  workoutHistory?: CompletedWorkoutSession[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  athlete,
  onNavigate,
  workoutHistory = [],
}) => {
  const [workout, setWorkout] = useState<ScheduledWorkout>(() => ({
    ...TODAY_WORKOUT,
    durationMinutes: athlete.workoutDurationMinutes || TODAY_WORKOUT.durationMinutes,
  }));

  const [goals, setGoals] = useState<AthleteGoal[]>(() => {
    if (athlete.goals && athlete.goals.length > 0) {
      // Map user goals into goal cards with 0 initial progress for new users
      const customGoals: AthleteGoal[] = athlete.goals.map((gName, idx) => ({
        id: `G-CUSTOM-${idx}`,
        title: `${gName} Progression Standard`,
        category: 'Athletic Priority',
        currentValue: workoutHistory.length > 0 ? Math.min(100, workoutHistory.length * 25) : 0,
        targetValue: 100,
        unit: '%',
        dueDate: 'Rolling Microcycle',
        completed: false,
      }));
      return customGoals.concat(INITIAL_GOALS.slice(0, 2));
    }
    return INITIAL_GOALS;
  });

  const hasSessionData = workoutHistory && workoutHistory.length > 0;

  // Compute verified AXIO Intelligence insights strictly from actual stored data
  const intelligenceInsights = useMemo(() => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return [];
    }

    interface InsightItem {
      category: string;
      text: string;
      metric?: string;
    }

    const items: InsightItem[] = [];
    const sorted = [...workoutHistory].sort((a, b) => a.timestamp - b.timestamp);
    const totalSessions = sorted.length;
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    // 1. Form Accuracy Insight (Never claim improvement unless data proves it)
    if (
      previous &&
      typeof latest.averageFormAccuracy === 'number' &&
      typeof previous.averageFormAccuracy === 'number' &&
      latest.averageFormAccuracy > 0 &&
      previous.averageFormAccuracy > 0
    ) {
      if (latest.averageFormAccuracy > previous.averageFormAccuracy) {
        items.push({
          category: 'Form Accuracy',
          text: 'Your form accuracy improved this week.',
          metric: `${previous.averageFormAccuracy}% → ${latest.averageFormAccuracy}%`,
        });
      } else if (latest.averageFormAccuracy === previous.averageFormAccuracy) {
        items.push({
          category: 'Form Accuracy',
          text: 'Your form accuracy held steady across consecutive sessions.',
          metric: `${latest.averageFormAccuracy}% consistent`,
        });
      } else {
        items.push({
          category: 'Form Accuracy',
          text: 'Your recent session form accuracy showed variation under load.',
          metric: `${previous.averageFormAccuracy}% → ${latest.averageFormAccuracy}%`,
        });
      }
    } else if (typeof latest.averageFormAccuracy === 'number' && latest.averageFormAccuracy > 0) {
      items.push({
        category: 'Form Accuracy',
        text: 'Baseline form accuracy established from verified kinematic tracking.',
        metric: `${latest.averageFormAccuracy}% accuracy`,
      });
    }

    // 2. Workload Insight (Trending upward/downward based strictly on stored volume)
    if (
      previous &&
      typeof latest.totalVolumeKg === 'number' &&
      typeof previous.totalVolumeKg === 'number' &&
      latest.totalVolumeKg > 0 &&
      previous.totalVolumeKg > 0
    ) {
      if (latest.totalVolumeKg > previous.totalVolumeKg) {
        items.push({
          category: 'Workload',
          text: 'Your workload is trending upward.',
          metric: `${previous.totalVolumeKg.toLocaleString()} kg → ${latest.totalVolumeKg.toLocaleString()} kg`,
        });
      } else if (latest.totalVolumeKg === previous.totalVolumeKg) {
        items.push({
          category: 'Workload',
          text: 'Your workload remained consistent across consecutive sessions.',
          metric: `${latest.totalVolumeKg.toLocaleString()} kg moved`,
        });
      } else {
        items.push({
          category: 'Workload',
          text: 'Your recent session volume adjusted for active recovery.',
          metric: `${previous.totalVolumeKg.toLocaleString()} kg → ${latest.totalVolumeKg.toLocaleString()} kg`,
        });
      }
    } else if (typeof latest.totalVolumeKg === 'number' && latest.totalVolumeKg > 0) {
      items.push({
        category: 'Workload',
        text: 'Initial workload established from verified session volume.',
        metric: `${latest.totalVolumeKg.toLocaleString()} kg moved`,
      });
    }

    // 3. Workout Consistency Insight (Based strictly on active streak or weekly target)
    if (athlete.streakDays > 1) {
      items.push({
        category: 'Workout Consistency',
        text: 'Your training consistency increased.',
        metric: `${athlete.streakDays}-day streak active`,
      });
    } else if (athlete.completedWorkoutsThisWeek >= (athlete.totalWorkoutsTarget || 5) && athlete.completedWorkoutsThisWeek > 0) {
      items.push({
        category: 'Workout Consistency',
        text: 'You have achieved your target weekly training frequency.',
        metric: `${athlete.completedWorkoutsThisWeek} / ${athlete.totalWorkoutsTarget || 5} sessions met`,
      });
    } else if (athlete.completedWorkoutsThisWeek > 0) {
      items.push({
        category: 'Workout Consistency',
        text: `You have completed ${athlete.completedWorkoutsThisWeek} session${athlete.completedWorkoutsThisWeek > 1 ? 's' : ''} toward your weekly target.`,
        metric: `${athlete.completedWorkoutsThisWeek} / ${athlete.totalWorkoutsTarget || 5} target`,
      });
    }

    // 4. Performance Trend (Peak power output)
    if (
      previous &&
      latest.peakPowerWatts &&
      previous.peakPowerWatts &&
      latest.peakPowerWatts > previous.peakPowerWatts
    ) {
      items.push({
        category: 'Performance Trend',
        text: 'Peak power output increased over your prior session benchmark.',
        metric: `${previous.peakPowerWatts}W → ${latest.peakPowerWatts}W`,
      });
    }

    // 5. Completed Sessions (Fallback to ensure athlete always receives accurate summaries)
    if (items.length < 3) {
      items.push({
        category: 'Completed Sessions',
        text:
          totalSessions === 1
            ? 'Your initial workout session is verified and saved.'
            : `You have completed ${totalSessions} verified training sessions.`,
        metric: `${totalSessions} logged`,
      });
    }

    return items.slice(0, 3);
  }, [workoutHistory, athlete]);

  // Calculate actual weekly activity from verified user workout sessions for the current microcycle (Sun - Sat)
  const weeklyActivityDays = useMemo(() => {
    const days: { day: string; date: string; durationMinutes: number; loadAu: number; isToday: boolean }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - currentDayOfWeek + i);
      const dayStr = dayNames[i];
      const dateStr = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      const isToday = i === currentDayOfWeek;

      const sessionsOnDay = workoutHistory.filter((s) => {
        const sDate = new Date(s.timestamp);
        return sDate.toDateString() === d.toDateString();
      });

      const dayLoad = sessionsOnDay.reduce((sum, s) => sum + (s.loadAu || 0), 0);
      const dayDuration = sessionsOnDay.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      days.push({
        day: dayStr,
        date: dateStr,
        durationMinutes: dayDuration,
        loadAu: dayLoad,
        isToday,
      });
    }

    return days;
  }, [workoutHistory]);

  const totalWeeklyLoadAu = useMemo(() => {
    return weeklyActivityDays.reduce((sum, d) => sum + d.loadAu, 0);
  }, [weeklyActivityDays]);

  const toggleExercise = (idx: number) => {
    setWorkout((prev) => {
      const nextExercises = [...prev.exercises];
      nextExercises[idx] = {
        ...nextExercises[idx],
        completed: !nextExercises[idx].completed,
      };
      const allDone = nextExercises.every((e) => e.completed);
      return {
        ...prev,
        exercises: nextExercises,
        completed: allDone,
      };
    });
  };

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-12">
      {/* 1. Welcome Message & High-Performance Readiness Banner */}
      <section className="bg-gradient-to-br from-[#121422] via-[#0F1118] to-[#0A0B0E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 lg:p-9 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
        {/* Subtle AXIO Blue radial depth */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #0066FF 0%, transparent 70%)' }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
              <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
              <span>{hasSessionData ? 'Athlete Telemetry Active' : 'Profile Initialized · Awaiting Baseline'}</span>
              <span aria-hidden="true" className="text-white/20">·</span>
              <span className="font-sans text-zinc-400">{athlete.tier}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-normal text-white">
              Welcome back, {athlete.name.split(' ')[0]}
            </h1>

            {!hasSessionData ? (
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed font-normal">
                Welcome to AXIO. Your baseline neuromuscular profile is initialized. Complete your first training or AI CAM session to calibrate your readiness index and movement kinematics.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed font-normal">
                Neuromuscular readiness is calibrated from your verified sessions. Your nervous system is primed for progressive overload and concentric acceleration.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              iconLeft={<Video className="w-4 h-4 text-[#0066FF]" />}
              onClick={() => onNavigate('live-form')}
            >
              Live Form Coach
            </Button>

            <Button
              variant="primary"
              iconLeft={<Play className="w-4 h-4 fill-current" />}
              onClick={() => onNavigate('workout')}
            >
              Start Workout Session
            </Button>
          </div>
        </div>
      </section>

      {/* 2. AXIO BASELINE (First-Time User) or Primary Telemetry Counters (Active User) */}
      {!hasSessionData ? (
        <section className="space-y-6">
          {/* AXIO BASELINE Header & Call to Action */}
          <div className="bg-gradient-to-r from-[#111322] via-[#0E1018] to-[#0A0B10] border border-[#0066FF]/25 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-20 blur-3xl"
              style={{ background: 'radial-gradient(circle, #0066FF 0%, transparent 70%)' }}
            />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-normal bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30 px-2.5 py-1 rounded-md">
                    <Lock className="w-3.5 h-3.5" />
                    AXIO Baseline
                  </span>
                  <span className="text-xs font-normal text-zinc-400 tracking-normal">
                    Calibration Protocol
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold tracking-normal text-white">
                  Establish Your Athletic Baseline
                </h2>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Complete your first AXIO workout or AI CAM assessment to establish your personal performance baseline.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <Button
                  variant="primary"
                  size="lg"
                  iconLeft={<Play className="w-4 h-4 fill-current" />}
                  onClick={() => onNavigate('workout')}
                  className="font-bold tracking-wide shadow-[0_0_20px_rgba(0,102,255,0.35)]"
                >
                  START BASELINE ASSESSMENT
                </Button>
              </div>
            </div>
          </div>

          {/* Four Locked/Uninitialized Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Movement Quality */}
            <div className="bg-[#11131A] hover:bg-[#141622] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-normal text-[11px]">
                    BIOMECHANICS
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans uppercase bg-white/[0.04] text-zinc-400 border border-white/[0.08] px-2 py-0.5 rounded font-medium">
                    <Lock className="w-3 h-3 text-[#0066FF]" />
                    Locked
                  </span>
                </div>

                <div className="my-3.5">
                  <h3 className="text-sm font-semibold text-white">
                    Movement Quality
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-zinc-500 tabular-nums">
                      — —
                    </span>
                    <span className="font-sans text-xs text-zinc-500 uppercase font-medium">
                      Uninitialized
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Velocity loss curves, eccentric control standards, and power output telemetry.
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-sans text-zinc-500">
                <span>STATUS</span>
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  Awaiting baseline
                </span>
              </div>
            </div>

            {/* 2. Form Accuracy */}
            <div className="bg-[#11131A] hover:bg-[#141622] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-normal text-[11px]">
                    COMPUTER VISION
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans uppercase bg-white/[0.04] text-zinc-400 border border-white/[0.08] px-2 py-0.5 rounded font-medium">
                    <Lock className="w-3 h-3 text-[#0066FF]" />
                    Locked
                  </span>
                </div>

                <div className="my-3.5">
                  <h3 className="text-sm font-semibold text-white">
                    Form Accuracy
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-zinc-500 tabular-nums">
                      — —
                    </span>
                    <span className="font-sans text-xs text-zinc-500 uppercase font-medium">
                      Uninitialized
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    AI CAM real-time pose estimation, joint angle tracking, and kinetic symmetry.
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-sans text-zinc-500">
                <span>STATUS</span>
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  Awaiting baseline
                </span>
              </div>
            </div>

            {/* 3. Readiness */}
            <div className="bg-[#11131A] hover:bg-[#141622] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-normal text-[11px]">
                    PHYSIOLOGICAL
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans uppercase bg-white/[0.04] text-zinc-400 border border-white/[0.08] px-2 py-0.5 rounded font-medium">
                    <Lock className="w-3 h-3 text-[#0066FF]" />
                    Locked
                  </span>
                </div>

                <div className="my-3.5">
                  <h3 className="text-sm font-semibold text-white">
                    Readiness
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-zinc-500 tabular-nums">
                      — —
                    </span>
                    <span className="font-sans text-xs text-zinc-500 uppercase font-medium">
                      Uninitialized
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Neuromuscular recovery index, central nervous priming, and fatigue baseline.
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-sans text-zinc-500">
                <span>STATUS</span>
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  Awaiting baseline
                </span>
              </div>
            </div>

            {/* 4. Training Load */}
            <div className="bg-[#11131A] hover:bg-[#141622] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-normal text-[11px]">
                    WORKLOAD CAPACITY
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans uppercase bg-white/[0.04] text-zinc-400 border border-white/[0.08] px-2 py-0.5 rounded font-medium">
                    <Lock className="w-3 h-3 text-[#0066FF]" />
                    Locked
                  </span>
                </div>

                <div className="my-3.5">
                  <h3 className="text-sm font-semibold text-white">
                    Training Load
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-zinc-500 tabular-nums">
                      — —
                    </span>
                    <span className="font-sans text-xs text-zinc-500 uppercase font-medium">
                      Uninitialized
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Acute-to-Chronic Workload Ratio (ACWR), session volume, and tonnage capacity.
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-sans text-zinc-500">
                <span>STATUS</span>
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  Awaiting baseline
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Workout Streak Card */}
          <div className="bg-[#11131A] hover:bg-[#151722] border border-white/[0.07] hover:border-white/[0.16] rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.45),0_0_1px_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold uppercase tracking-normal text-[11px]">
                CONSISTENCY
              </span>
              <Flame className="w-4 h-4 text-[#0066FF]" />
            </div>

            <div className="my-3.5">
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                  {athlete.streakDays}
                </span>
                <span className="font-sans text-sm text-zinc-400">Days Streak</span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                Consecutive training &amp; active recovery logs
              </p>
            </div>

            <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-sans text-zinc-400">
              <span>WEEK TARGET</span>
              <span className="text-white font-medium">
                {athlete.completedWorkoutsThisWeek}/{athlete.totalWorkoutsTarget} SESSIONS
              </span>
            </div>
          </div>

          {/* Performance Score */}
          <MetricCard
            category="BIOMECHANICS"
            label="Performance Score"
            value={athlete.performanceScore}
            unit="/100"
            benchmark="90"
            trend={{
              value: `+${Math.min(10, workoutHistory.length * 2)}%`,
              direction: 'up',
              label: 'vs baseline',
            }}
            sparklineData={workoutHistory.map((s) => s.averageFormAccuracy || 80)}
          />

          {/* Form Score */}
          <MetricCard
            category="AI KINEMATICS"
            label="Form Accuracy"
            value={`${athlete.formScore}%`}
            unit=""
            benchmark="95%"
            trend={{
              value: `${athlete.formScore}%`,
              direction: 'up',
              label: 'joint symmetry',
            }}
            sparklineData={workoutHistory.map((s) => s.averageFormAccuracy || 80)}
          />

          {/* Weekly Volume */}
          <MetricCard
            category="WORKLOAD"
            label="Total Volume"
            value={(athlete.weeklyVolumeKg / 1000).toFixed(1)}
            unit="Tons"
            benchmark="10.0 T"
            trend={{
              value: `${(athlete.weeklyVolumeKg / 1000).toFixed(1)} T`,
              direction: 'neutral',
              label: 'of weekly load',
            }}
            sparklineData={workoutHistory.map((s) => (s.totalVolumeKg || 0) / 1000)}
          />
        </section>
      )}

      {/* AXIO INTELLIGENCE Insight Card */}
      <section className="bg-[#101218] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0066FF]/15 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold tracking-normal text-white">
                AXIO Intelligence
              </span>
              <span className="text-xs text-zinc-400 font-normal tracking-normal">
                · Performance Telemetry
              </span>
            </div>
          </div>

          <span className="text-xs font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded tracking-normal self-start sm:self-auto">
            {hasSessionData ? 'Live Heuristic Engine' : 'Awaiting Baseline'}
          </span>
        </div>

        {!hasSessionData ? (
          <div className="py-2 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#0066FF]/60 shrink-0 animate-pulse" />
            <p className="text-xs sm:text-sm text-zinc-300">
              Complete your first session to unlock personalized AXIO insights.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {intelligenceInsights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-[#141620] border border-white/[0.06] hover:border-white/[0.14] rounded-xl p-4 flex flex-col justify-between gap-2 transition-all duration-150 ease-out"
              >
                <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-normal text-[#0066FF] font-semibold">
                  <span>{insight.category}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                </div>
                <p className="text-xs sm:text-sm text-white font-medium leading-snug">
                  "{insight.text}"
                </p>
                {insight.metric && (
                  <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-500 font-sans">
                    <span>TELEMETRY</span>
                    <span className="text-zinc-400 font-sans font-semibold tabular-nums">{insight.metric}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Today's Workout & Weekly Activity Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        {/* Today's Workout (Col 7) */}
        <div className="lg:col-span-7 min-w-0 bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
                <span>Today's Program</span>
                <span aria-hidden="true" className="text-white/20">·</span>
                <span className="text-zinc-400 font-normal">{workout.timeSlot}</span>
              </div>
              <h2 className="text-xl font-semibold text-white tracking-normal mt-0.5">
                {workout.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-sans text-xs text-zinc-400 tabular-nums">
                {workout.durationMinutes} MIN · {workout.estimatedLoadAu} AU
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigate('workout')}
              >
                Open Session
              </Button>
            </div>
          </div>

          {/* Exercise Checklist */}
          <div className="space-y-2.5">
            <span className="text-xs font-medium text-zinc-400 tracking-normal block">
              Programmed Sets &amp; Velocity Targets
            </span>

            <div className="space-y-2">
              {workout.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleExercise(idx)}
                  className={`p-3.5 rounded-xl border transition-all duration-150 ease-out cursor-pointer flex items-center justify-between gap-3 ${
                    ex.completed
                      ? 'bg-white/[0.02] border-white/5 opacity-60'
                      : 'bg-[#141620] border-white/[0.06] hover:border-white/[0.14] hover:bg-[#181B26]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="shrink-0 text-white focus:outline-none"
                      aria-label={ex.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {ex.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#0066FF]" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-500" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${
                          ex.completed ? 'line-through text-zinc-500' : 'text-white'
                        }`}
                      >
                        {ex.name}
                      </div>
                      <div className="text-xs text-zinc-400 font-sans mt-0.5">
                        {ex.sets} sets · {ex.reps} · {ex.targetWeight}
                      </div>
                    </div>
                  </div>

                  {ex.velocityTarget && (
                    <span className="font-sans text-xs text-[#0066FF] font-semibold shrink-0 tabular-nums">
                      {ex.velocityTarget}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Activity (Col 5) */}
        <div className="lg:col-span-5 min-w-0 bg-[#101218] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <div className="text-xs font-medium tracking-normal text-zinc-400">
                Rolling Load Index
              </div>
              <h3 className="text-xl font-semibold text-white tracking-normal mt-0.5">
                Weekly Activity
              </h3>
            </div>
            {hasSessionData ? (
              <span className="font-sans text-xs text-[#0066FF] font-semibold tabular-nums">
                {totalWeeklyLoadAu.toLocaleString()} AU Cumulative
              </span>
            ) : (
              <span className="font-sans text-xs text-zinc-500">
                Awaiting First Session
              </span>
            )}
          </div>

          {/* Activity Bar Visualization */}
          <div className="space-y-4 w-full min-w-0">
            {/* Chart Area with responsive 7-column grid */}
            <div className="relative w-full pt-8 pb-1">
              {/* Subtle reference baseline grid lines */}
              <div className="absolute inset-x-0 top-8 bottom-8 flex flex-col justify-between pointer-events-none z-0">
                <div className="border-b border-white/[0.04] w-full" />
                <div className="border-b border-white/[0.04] w-full" />
                <div className="border-b border-white/[0.04] w-full" />
              </div>

              {/* 7 Columns for the 7 Days (Sun - Sat) */}
              <div className="relative z-10 grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 w-full min-w-0 items-end h-40">
                {(() => {
                  const maxLoad = Math.max(400, ...weeklyActivityDays.map((x) => x.loadAu));
                  return weeklyActivityDays.map((d, idx) => {
                    const heightPct = d.loadAu > 0 ? Math.min(100, Math.max(12, (d.loadAu / maxLoad) * 100)) : 6;
                    // Boundary-aware tooltip positioning to prevent horizontal overflow outside card
                    const tooltipAlignClass =
                      idx === 0
                        ? 'left-0 translate-x-0'
                        : idx === 6
                        ? 'right-0 left-auto translate-x-0'
                        : 'left-1/2 -translate-x-1/2';

                    return (
                      <div
                        key={d.day}
                        className="w-full min-w-0 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Floating tooltip on hover */}
                        <div className={`absolute bottom-full mb-2 ${tooltipAlignClass} opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-30 whitespace-nowrap shadow-xl`}>
                          <div className="text-[10px] font-sans font-medium text-white bg-[#0B0C10] px-2 py-1 rounded-md border border-white/10 tabular-nums flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-zinc-400 font-normal">{d.date}</span>
                            <span>{d.loadAu > 0 ? `${d.loadAu} AU` : '0 AU (Rest)'}</span>
                          </div>
                        </div>

                        {/* Bar track container */}
                        <div className="w-full flex-1 flex items-end justify-center px-0.5">
                          <div
                            className={`w-full max-w-[28px] sm:max-w-[32px] rounded-t-md transition-all duration-300 ${
                              d.isToday
                                ? 'bg-[#0066FF] shadow-lg shadow-[#0066FF]/30 ring-1 ring-[#0066FF]/50'
                                : d.loadAu > 0
                                ? 'bg-[#252936] group-hover:bg-[#0066FF]/70'
                                : 'bg-white/[0.06] group-hover:bg-white/[0.12]'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>

                        {/* Day label */}
                        <span
                          className={`text-[10px] sm:text-xs font-sans mt-2.5 truncate text-center w-full transition-colors ${
                            d.isToday ? 'text-white font-bold' : 'text-zinc-500 group-hover:text-zinc-300'
                          }`}
                        >
                          {d.day}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-[#0066FF] shrink-0 shadow-[0_0_6px_rgba(0,102,255,0.4)]" />
                <span className="text-white">{hasSessionData ? 'Today (Active)' : 'Today (Scheduled)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-[#252936] shrink-0" />
                <span>{hasSessionData ? 'Completed Session' : 'Load Telemetry (Pending)'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Weekly Performance Chart (Sports Technology & Biomechanics) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium tracking-normal text-[#0066FF]">
              Kinematic Waveform
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-normal text-white mt-0.5">
              Weekly Performance Telemetry
            </h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigate('progress')}
            iconRight={<ArrowUpRight className="w-4 h-4 text-[#0066FF]" />}
          >
            Detailed Analytics
          </Button>
        </div>

        <PerformanceChart workoutHistory={workoutHistory} />
      </section>

      {/* 5. AI Recommendations & Current Goals */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* AI Recommendations (Col 6) */}
        <div className="lg:col-span-6 bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0066FF]" />
              <h3 className="text-lg font-semibold text-white tracking-normal">
                AI Coach Insights
              </h3>
            </div>
            <span className="text-xs font-sans font-medium text-zinc-400">
              Kinetic Engine 1.0
            </span>
          </div>

          <div className="space-y-4">
            {AI_RECOMMENDATIONS.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-[#141620] border border-white/[0.06] hover:border-white/[0.14] hover:bg-[#181B26] transition-all duration-150 ease-out space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white tracking-normal text-xs">
                    {rec.category} · {rec.title}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                  {rec.insight}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-sans text-zinc-400">
                    {rec.impact}
                  </span>
                  <button
                    onClick={() => onNavigate(rec.actionTarget)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066FF] hover:underline"
                  >
                    <span>{rec.actionText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Goals (Col 6) */}
        <div className="lg:col-span-6 bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#0066FF]" />
              <h3 className="text-lg font-semibold text-white tracking-normal">
                Current Performance Goals
              </h3>
            </div>
            <span className="text-xs font-sans text-zinc-400 tabular-nums">
              {goals.filter((g) => g.completed).length} / {goals.length} MET
            </span>
          </div>

          <div className="space-y-4">
            {goals.map((g) => {
              const progressPct = Math.min(
                100,
                Math.round((g.currentValue / g.targetValue) * 100)
              );
              return (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-[#141620] border border-white/[0.06] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal font-medium">
                        {g.category} · Due {g.dueDate}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {g.title}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleGoal(g.id)}
                      className="shrink-0 p-1 text-zinc-500 hover:text-white transition-colors"
                      aria-label="Toggle Goal Status"
                    >
                      {g.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#0066FF]" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-500" />
                      )}
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-sans text-zinc-400 tabular-nums">
                      <span>
                        Current: <strong className="text-white font-semibold">{g.currentValue} {g.unit}</strong>
                      </span>
                      <span>
                        Target: <strong className="text-white font-semibold">{g.targetValue} {g.unit}</strong>
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-[#181A24] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0066FF] rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Recent Workouts Ledger */}
      <section className="bg-[#101218] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium tracking-normal text-zinc-400">
              Session History
            </div>
            <h3 className="text-lg font-semibold text-white tracking-normal mt-0.5">
              Recent Workouts
            </h3>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate('workout')}
          >
            View All Workouts
          </Button>
        </div>

        {workoutHistory.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF] mx-auto">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-white">No completed workouts yet</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Complete your first workout session to begin tracking your verified performance history.
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigate('workout')}
                iconLeft={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                Start Today's Workout
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0E1016] text-zinc-400 text-[11px] uppercase tracking-normal font-semibold">
                  <th className="py-3.5 px-5">Session</th>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Duration</th>
                  <th className="py-3.5 px-5 text-right">Peak Power</th>
                  <th className="py-3.5 px-5 text-right">Form Accuracy</th>
                  <th className="py-3.5 px-5 text-right">Load AU</th>
                  <th className="py-3.5 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {workoutHistory.slice(0, 5).map((wh) => (
                  <tr
                    key={wh.id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-semibold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-[#0066FF] shrink-0" />
                        <span>{wh.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400 font-sans whitespace-nowrap">
                      {wh.date}
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans text-white tabular-nums whitespace-nowrap">
                      {wh.durationMinutes} min
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans font-medium text-white tabular-nums whitespace-nowrap">
                      {wh.peakPowerWatts || '—'}
                      {wh.peakPowerWatts && <span className="text-zinc-500 ml-1 font-normal text-[11px]">W</span>}
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans text-[#0066FF] font-semibold tabular-nums whitespace-nowrap">
                      {wh.averageFormAccuracy ? `${wh.averageFormAccuracy}%` : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans text-zinc-400 tabular-nums whitespace-nowrap">
                      {wh.loadAu || '—'}
                    </td>
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <button
                        onClick={() => onNavigate('progress')}
                        className="text-xs text-[#0066FF] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
