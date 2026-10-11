/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Achievements, Gamification & Personal Records Vault
 * Dynamically tracks XP, Levels, Achievements, Workout Streaks, Personal Records (PRs),
 * and Milestones purely from actual user activity across workouts, AI CAM, repetitions,
 * form scores, and streaks. Zero fabricated achievements or unearned stats.
 */

import React, { useState, useMemo } from 'react';
import {
  CompletedWorkoutSession,
  AthleteProfile,
  PageId,
} from '../types/app.ts';
import { Button } from '../design-system/components/Button.tsx';
import {
  calculateGamificationState,
  LEVEL_TIERS,
} from '../utils/gamification.ts';
import {
  Trophy,
  Award,
  Flame,
  Zap,
  Target,
  Lock,
  Sparkles,
  CheckCircle2,
  Activity,
  Dumbbell,
  Video,
  Star,
  Search,
  X,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';

interface AchievementsPageProps {
  athlete?: AthleteProfile;
  workoutHistory?: CompletedWorkoutSession[];
  onNavigate?: (page: PageId) => void;
}

type GamificationTab = 'all' | 'achievements' | 'prs' | 'milestones' | 'levels';

export const AchievementsPage: React.FC<AchievementsPageProps> = ({
  athlete,
  workoutHistory = [],
  onNavigate,
}) => {
  // Main view tab
  const [activeTab, setActiveTab] = useState<GamificationTab>('all');

  // Filter state for achievements
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unlocked' | 'Locked'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected item for celebration modal
  const [celebrationItem, setCelebrationItem] = useState<{
    title: string;
    description: string;
    metricLabel: string;
    metricValue: string;
    xpReward: number;
    badgeText: string;
  } | null>(null);

  // Compute live gamification state strictly from real workout history & athlete data
  const gamification = useMemo(() => {
    return calculateGamificationState(workoutHistory, athlete);
  }, [workoutHistory, athlete]);

  const {
    totalXp,
    level,
    levelTitle,
    nextLevelXp,
    levelProgressPercent,
    xpBreakdown,
    streak,
    personalRecords,
    achievements,
    milestones,
  } = gamification;

  // Unlocked achievements summary
  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.isUnlocked).length;
  }, [achievements]);

  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  // Filtered achievements list
  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'Unlocked' && !item.isUnlocked) return false;
      if (statusFilter === 'Locked' && item.isUnlocked) return false;

      // 2. Category Filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [achievements, statusFilter, categoryFilter, searchQuery]);

  // Render achievement icon helper
  const renderIcon = (type: string, isUnlocked: boolean) => {
    const iconClass = `w-5 h-5 transition-transform group-hover:scale-110 ${
      isUnlocked ? 'text-[#00FF66]' : 'text-zinc-500'
    }`;

    switch (type) {
      case 'trophy':
        return <Trophy className={iconClass} />;
      case 'flame':
        return <Flame className={iconClass} />;
      case 'award':
        return <Award className={iconClass} />;
      case 'activity':
        return <Activity className={iconClass} />;
      case 'video':
        return <Video className={iconClass} />;
      case 'dumbbell':
        return <Dumbbell className={iconClass} />;
      case 'target':
        return <Target className={iconClass} />;
      case 'star':
        return <Star className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  // Rarity styling
  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'text-zinc-400 border-white/10 bg-white/5';
      case 'Rare':
        return 'text-[#0066FF] border-[#0066FF]/30 bg-[#0066FF]/10';
      case 'Epic':
        return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'Legendary':
        return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      default:
        return 'text-zinc-400 border-white/10 bg-white/5';
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & GAMIFICATION OVERVIEW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
            <Trophy className="w-4 h-4" />
            <span>Athletic Gamification &amp; Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-white mt-1">
            Achievements &amp; Personal Records
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-normal">
            Real performance progression: XP, consecutive streaks, verified PRs, and milestones
          </p>
        </div>

        {/* Level & XP Capsule Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-[#101218] border border-white/[0.08] px-4 py-2.5 rounded-xl flex items-center gap-3 font-sans text-xs shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-[#0066FF]/20 border border-[#0066FF]/40 text-[#0066FF] font-black text-sm flex items-center justify-center">
              L{level}
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-normal block font-semibold">
                {levelTitle}
              </span>
              <strong className="text-white text-sm">
                {totalXp.toLocaleString()} XP
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GAMIFICATION DASHBOARD (XP, WORKOUT STREAK, PERSONAL RECORDS, MILESTONES)*/}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
        {/* 1. XP & ATHLETE LEVEL COCKPIT */}
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] uppercase tracking-normal font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#0066FF]" />
              ATHLETE XP &amp; LEVEL
            </span>
            <span className="text-[10px] text-zinc-400">
              Tier {level} of 10
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                LVL {level}
              </span>
              <span className="text-xs text-[#0066FF] font-bold">
                {levelTitle}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1 text-xs text-zinc-400">
              <strong className="text-white">{totalXp.toLocaleString()}</strong>
              <span>/ {nextLevelXp.toLocaleString()} XP</span>
              <span className="text-[10px] text-zinc-500">({Math.max(0, nextLevelXp - totalXp)} XP to next rank)</span>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-[#0066FF] to-[#00FF66] rounded-full transition-all duration-500"
                style={{ width: `${levelProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="text-[#0066FF] font-semibold">
                {levelProgressPercent}% progress
              </span>
              <span>
                +{xpBreakdown.workoutsXp} Session XP
              </span>
            </div>
          </div>
        </div>

        {/* 2. WORKOUT STREAK HUB */}
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] uppercase tracking-normal font-bold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#0066FF]" />
              WORKOUT STREAK
            </span>
            <span className="text-[10px] text-[#00FF66] font-bold">
              {streak.multiplier}x Multiplier
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                {streak.currentStreak}
              </span>
              <span className="text-xl text-zinc-400 font-bold">
                {streak.currentStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {streak.activeToday
                ? 'Activity logged today · Streak active'
                : 'Log a workout today to preserve momentum'}
            </span>
          </div>

          {/* Rolling 7-day activity circles */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-1">
              {streak.rollingDays.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      day.hasWorkout
                        ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66]'
                        : 'bg-white/5 border-white/10 text-zinc-600'
                    }`}
                  >
                    {day.hasWorkout ? '✓' : ''}
                  </div>
                  <span className="text-[10px] text-zinc-400">{day.dayLabel}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span>Best Streak: {streak.longestStreak} Days</span>
              <span className="text-[#0066FF]">+{xpBreakdown.streakBonusXp} Streak XP</span>
            </div>
          </div>
        </div>

        {/* 3. PERSONAL RECORDS & MILESTONES SUMMARY */}
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] uppercase tracking-normal font-bold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#0066FF]" />
              RECORDS &amp; MILESTONES
            </span>
            <span className="text-[10px] text-zinc-400">
              Verified Data
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                {personalRecords.length}
              </span>
              <span className="text-xl text-zinc-400 font-bold">
                {personalRecords.length === 1 ? 'PR' : 'PRs'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {personalRecords.length > 0
                ? `${personalRecords.length} personal bests established in resistance & form`
                : 'No PRs recorded yet. Complete sets with weight to establish PRs.'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Milestones:</span>
              <strong className="text-[#00FF66]">
                {milestones.filter((m) => m.isUnlocked).length} / {milestones.length} Reached
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Achievements:</span>
              <strong className="text-white">
                {unlockedCount} / {totalCount} Unlocked ({progressPercent}%)
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION NAVIGATION TABS                                                */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3 text-xs font-sans">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
            activeTab === 'all'
              ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All Gamification
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
            activeTab === 'achievements'
              ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Achievements ({unlockedCount}/{totalCount})
        </button>
        <button
          onClick={() => setActiveTab('prs')}
          className={`px-4 py-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
            activeTab === 'prs'
              ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Personal Records ({personalRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
            activeTab === 'milestones'
              ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Milestones ({milestones.filter((m) => m.isUnlocked).length}/{milestones.length})
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-4 py-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
            activeTab === 'levels'
              ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          XP &amp; Levels (LVL {level})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: ACHIEVEMENTS (FIRST SESSION, 7 DAY STREAK, 10 WORKOUTS, etc)*/}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'achievements') && (
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <div className="text-[11px] font-sans text-[#0066FF] uppercase tracking-normal font-semibold">
                ATHLETIC HONOR RECOGNITION
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Achievements
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Unlocked strictly by verified user actions (workouts, streaks, kinematic form accuracy, PRs)
              </p>
            </div>

            {/* Status Tabs: All, Unlocked, Locked */}
            <div className="flex items-center gap-1.5 bg-[#0B0C10] p-1 rounded-xl border border-white/[0.06] text-xs font-sans">
              {(['All', 'Unlocked', 'Locked'] as const).map((status) => {
                const count =
                  status === 'All'
                    ? achievements.length
                    : status === 'Unlocked'
                    ? unlockedCount
                    : totalCount - unlockedCount;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                      statusFilter === status
                        ? 'bg-[#0066FF] text-white font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {status.toUpperCase()} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search achievements (e.g. FIRST SESSION, 7 DAY STREAK, FORM MASTER)..."
                className="w-full bg-[#0B0C10] border border-white/[0.08] hover:border-white/20 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0066FF] transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-sans scrollbar-none">
              {['All', 'Milestone', 'Consistency', 'Form & Quality', 'Personal Records', 'Volume & Power', 'AI CAM'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                      categoryFilter === cat
                        ? 'bg-[#0066FF] border-[#0066FF] text-white font-bold'
                        : 'bg-[#0B0C10] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((item) => {
              const pct = Math.min(100, Math.round((item.currentValue / item.targetValue) * 100));

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.isUnlocked) {
                      setCelebrationItem({
                        title: item.name,
                        description: item.description,
                        metricLabel: 'Requirement Fulfilled',
                        metricValue: `${item.targetValue} ${item.unit}`,
                        xpReward: item.xpReward,
                        badgeText: 'VERIFIED ACHIEVEMENT',
                      });
                    }
                  }}
                  className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                    item.isUnlocked
                      ? 'bg-[#0B0C10] border-[#00FF66]/40 shadow-lg shadow-[#00FF66]/5 cursor-pointer hover:border-[#00FF66]/60'
                      : 'bg-[#0B0C10] border-white/[0.06] opacity-80 hover:opacity-100 hover:border-white/15'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          item.isUnlocked
                            ? 'bg-[#00FF66]/10 border-[#00FF66]/30 shadow-sm shadow-[#00FF66]/20'
                            : 'bg-[#101218] border-white/10'
                        }`}
                      >
                        {renderIcon(item.iconType, item.isUnlocked)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-sans uppercase font-semibold tracking-normal text-[#0066FF]">
                            {item.category}
                          </span>
                          <span aria-hidden="true" className="text-zinc-600">·</span>
                          <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded border uppercase font-semibold tracking-normal ${getRarityClass(item.rarity)}`}>
                            {item.rarity}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white mt-1 leading-snug">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    {/* Unlocked / Locked Tag */}
                    <div className="shrink-0 font-sans text-[10px]">
                      {item.isUnlocked ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>UNLOCKED</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-500 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>LOCKED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {item.description}
                  </p>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5 font-sans text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>
                        Progress:{' '}
                        <strong className="text-white">
                          {item.currentValue.toLocaleString()} / {item.targetValue.toLocaleString()} {item.unit}
                        </strong>
                      </span>
                      <span className={item.isUnlocked ? 'text-[#00FF66] font-bold' : 'text-zinc-400'}>
                        {pct}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-[#101218] rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.isUnlocked
                            ? 'bg-[#00FF66]'
                            : pct >= 50
                            ? 'bg-[#0066FF]'
                            : 'bg-zinc-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] font-sans text-zinc-400">
                    {item.isUnlocked ? (
                      <span className="text-[#00FF66] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Unlocked {item.unlockedDate || 'Recently'}</span>
                      </span>
                    ) : (
                      <span>
                        Remaining: {Math.max(0, item.targetValue - item.currentValue).toLocaleString()} {item.unit}
                      </span>
                    )}

                    <span className="text-[#0066FF] font-bold">
                      +{item.xpReward} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: PERSONAL RECORDS (PR VAULT)                               */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'prs') && (
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <div className="text-[11px] font-sans text-[#0066FF] uppercase tracking-normal font-semibold">
                BIOMECHANICAL SUPREMACY
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Personal Records (PR Vault)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Heaviest resistance loads, maximum set volume, and highest kinematic form scores verified from your sessions
              </p>
            </div>

            <div className="bg-[#0B0C10] border border-white/[0.08] px-3.5 py-1.5 rounded-xl text-xs font-sans text-zinc-300">
              <span className="text-zinc-400">Verified PRs: </span>
              <strong className="text-[#00FF66] font-bold">{personalRecords.length}</strong>
            </div>
          </div>

          {personalRecords.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-xl bg-[#0B0C10] border border-white/[0.06] text-center space-y-3 font-sans">
              <Star className="w-8 h-8 text-zinc-500 mx-auto" />
              <h4 className="text-base font-bold text-white">No Personal Records Logged Yet</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                AXIO never fabricates records. Complete your first resistance workout or AI CAM form session with logged weights to establish verified personal records.
              </p>
              {onNavigate && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onNavigate('workout')}
                  className="mt-2 text-xs"
                >
                  Start First Workout Session
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
              {personalRecords.map((pr) => (
                <div
                  key={pr.id}
                  onClick={() =>
                    setCelebrationItem({
                      title: `${pr.exerciseName} PR`,
                      description: `Verified personal record achieved during ${pr.sessionTitle}.`,
                      metricLabel: pr.recordType,
                      metricValue: pr.formattedValue,
                      xpReward: 100,
                      badgeText: 'VERIFIED PERSONAL RECORD',
                    })
                  }
                  className="p-5 rounded-xl bg-[#0B0C10] border border-[#0066FF]/30 hover:border-[#0066FF] transition-all space-y-3 shadow-md shadow-[#0066FF]/5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] uppercase font-semibold text-[#0066FF] tracking-normal">
                      {pr.recordType}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-sans tabular-nums font-medium">
                      <Clock className="w-3 h-3" />
                      {pr.date}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-white truncate">
                      {pr.exerciseName}
                    </h5>
                    <div className="text-2xl font-black text-[#00FF66] mt-1 tabular-nums font-sans">
                      {pr.formattedValue}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="truncate max-w-[180px]">{pr.sessionTitle}</span>
                    <span className="text-[#0066FF] font-bold">+100 XP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: MILESTONES (1st Session, 5 Workouts, 10 Workouts, etc)    */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'milestones') && (
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <div className="text-[11px] font-sans text-[#0066FF] uppercase tracking-normal font-semibold">
                PROGRESSION ROADMAP
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Milestones
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Structured chronological milestones unlocking as your training volume and discipline scale
              </p>
            </div>

            <div className="bg-[#0B0C10] border border-white/[0.08] px-3.5 py-1.5 rounded-xl text-xs font-sans text-zinc-300">
              <span>Completed: </span>
              <strong className="text-[#00FF66]">
                {milestones.filter((m) => m.isUnlocked).length} / {milestones.length}
              </strong>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            {milestones.map((ms) => {
              const pct = Math.min(100, Math.round((ms.currentValue / ms.targetValue) * 100));

              return (
                <div
                  key={ms.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    ms.isUnlocked
                      ? 'bg-[#0B0C10] border-[#00FF66]/30'
                      : 'bg-[#0B0C10] border-white/[0.06] opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                        ms.isUnlocked
                          ? 'bg-[#00FF66]/20 border-[#00FF66]/40 text-[#00FF66]'
                          : 'bg-[#101218] border-white/10 text-zinc-500'
                      }`}
                    >
                      T{ms.tier}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white">
                          {ms.title}
                        </h5>
                        <span className="text-[10px] text-zinc-500 uppercase">
                          ({ms.category})
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                        {ms.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-white">
                        {ms.currentValue.toLocaleString()} / {ms.targetValue.toLocaleString()} {ms.unit}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {ms.isUnlocked ? 'Unlocked' : `${pct}% complete`}
                      </div>
                    </div>

                    <div className="w-24">
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div
                          className={`h-full rounded-full ${
                            ms.isUnlocked ? 'bg-[#00FF66]' : 'bg-[#0066FF]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs font-bold text-[#0066FF] w-16 text-right">
                      +{ms.xpReward} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB CONTENT: XP & LEVEL LADDER                                         */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'levels') && (
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-white/[0.06] pb-4">
            <div className="text-[11px] font-sans text-[#0066FF] uppercase tracking-normal font-semibold">
              ATHLETE PRESTIGE LADDER
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
              XP &amp; Athlete Ranks
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Earn XP with every verified set, perfect form rep, workout streak, and unlocked milestone
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-sans">
            {LEVEL_TIERS.map((tier) => {
              const isCurrent = level === tier.level;
              const isPast = level > tier.level;

              return (
                <div
                  key={tier.level}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                    isCurrent
                      ? 'bg-[#0B0C10] border-[#0066FF] shadow-lg shadow-[#0066FF]/15'
                      : isPast
                      ? 'bg-[#0B0C10] border-[#00FF66]/30'
                      : 'bg-[#0B0C10] border-white/[0.06] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? 'text-[#0066FF]'
                          : isPast
                          ? 'text-[#00FF66]'
                          : 'text-zinc-500'
                      }`}
                    >
                      LEVEL {tier.level}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0066FF] text-white font-semibold tracking-normal">
                        CURRENT
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00FF66]/10 text-[#00FF66] font-semibold tracking-normal">
                        PASSED ✓
                      </span>
                    )}
                  </div>

                  <div>
                    <h6 className="text-sm font-bold text-white leading-tight">
                      {tier.title}
                    </h6>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block font-sans tabular-nums font-medium">
                      {tier.minXp.toLocaleString()} - {tier.maxXp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CELEBRATION MODAL (WHEN CLICKING AN UNLOCKED PR / ACHIEVEMENT)          */}
      {/* ========================================================================= */}
      {celebrationItem && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0D]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121318] border border-[#00FF66]/40 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200 shadow-2xl shadow-[#00FF66]/15 relative overflow-hidden font-sans">
            {/* Ambient celebration beam */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#00FF66]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-2xl bg-[#00FF66]/10 border-2 border-[#00FF66]/40 text-[#00FF66] flex items-center justify-center mx-auto shadow-lg shadow-[#00FF66]/30">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-[#00FF66] uppercase tracking-normal font-semibold px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{celebrationItem.badgeText}</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {celebrationItem.title}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans max-w-xs mx-auto">
                {celebrationItem.description}
              </p>
            </div>

            {/* Metrics Breakdown Box */}
            <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>{celebrationItem.metricLabel}:</span>
                <span className="text-white font-bold">
                  {celebrationItem.metricValue}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Status:</span>
                <span className="text-[#00FF66] font-bold">Verified Real Data ✓</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
                <span>XP Earned:</span>
                <span className="text-[#0066FF] font-bold">
                  +{celebrationItem.xpReward} XP
                </span>
              </div>
            </div>

            <Button
              size="md"
              variant="primary"
              className="w-full"
              onClick={() => setCelebrationItem(null)}
            >
              Continue Training
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
