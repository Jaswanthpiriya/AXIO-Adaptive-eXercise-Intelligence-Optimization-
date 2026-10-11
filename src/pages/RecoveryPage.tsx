/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Recovery & Daily Wellness Readiness Module
 * Simple daily check-in (Sleep, Energy, Muscle Soreness, Stress)
 * Calculates a transparent training readiness score and recommended intensity.
 * IMPORTANT: This is a wellness/training readiness indicator, not a medical diagnosis.
 */

import React, { useState } from 'react';
import { AthleteProfile, DailyRecoveryCheckIn, PageId } from '../types/app.ts';
import { useAxio } from '../context/AxioContext.tsx';
import { Button } from '../design-system/components/Button.tsx';
import {
  HeartPulse,
  Moon,
  Zap,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  RefreshCw,
  Dumbbell,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface RecoveryPageProps {
  athlete: AthleteProfile;
  onNavigate?: (page: PageId) => void;
}

export const RecoveryPage: React.FC<RecoveryPageProps> = ({ athlete, onNavigate }) => {
  const { recoveryCheckIns, latestRecoveryCheckIn, saveRecoveryCheckIn } = useAxio();

  const todayDateString = new Date().toISOString().split('T')[0];

  // Check if today already has a check-in
  const todayCheckIn = recoveryCheckIns.find((item) => item.date === todayDateString);

  // Form state
  const [sleepHours, setSleepHours] = useState<number>(todayCheckIn ? todayCheckIn.sleepHours : 7.5);
  const [energyLevel, setEnergyLevel] = useState<number>(todayCheckIn ? todayCheckIn.energyLevel : 4);
  const [muscleSoreness, setMuscleSoreness] = useState<number>(todayCheckIn ? todayCheckIn.muscleSoreness : 2);
  const [stressLevel, setStressLevel] = useState<number>(todayCheckIn ? todayCheckIn.stressLevel : 2);

  // View state: 'view' (shows readiness card if checkin exists) | 'edit' (shows check-in form)
  const [isEditing, setIsEditing] = useState<boolean>(!todayCheckIn);

  // Calculate transparent readiness indicator
  const calculateReadiness = (
    sleep: number,
    energy: number,
    soreness: number,
    stress: number
  ) => {
    // 1. Sleep score (35% weight)
    let sleepScore = 50;
    if (sleep >= 8 && sleep <= 9.5) {
      sleepScore = 100;
    } else if (sleep >= 7 && sleep < 8) {
      sleepScore = 88;
    } else if (sleep >= 6 && sleep < 7) {
      sleepScore = 72;
    } else if (sleep >= 5 && sleep < 6) {
      sleepScore = 52;
    } else if (sleep < 5) {
      sleepScore = 35;
    } else {
      // > 9.5 hours
      sleepScore = 90;
    }

    // 2. Energy score (25% weight) 1-5 scale
    const energyMap: Record<number, number> = { 1: 30, 2: 50, 3: 70, 4: 85, 5: 100 };
    const energyScore = energyMap[energy] || 70;

    // 3. Soreness score (20% weight, inverted: 1 = fresh, 5 = severe)
    const sorenessMap: Record<number, number> = { 1: 100, 2: 85, 3: 70, 4: 45, 5: 25 };
    const sorenessScore = sorenessMap[soreness] || 70;

    // 4. Stress score (20% weight, inverted: 1 = very low, 5 = very high)
    const stressMap: Record<number, number> = { 1: 100, 2: 85, 3: 70, 4: 45, 5: 25 };
    const stressScore = stressMap[stress] || 70;

    // Weighted composite readiness score
    const readinessScore = Math.min(
      100,
      Math.max(
        10,
        Math.round(
          sleepScore * 0.35 +
            energyScore * 0.25 +
            sorenessScore * 0.2 +
            stressScore * 0.2
        )
      )
    );

    // Recommended training intensity
    let recommendedIntensity: 'High Intensity' | 'Moderate Intensity' | 'Active Recovery / Light';
    if (readinessScore >= 80) {
      recommendedIntensity = 'High Intensity';
    } else if (readinessScore >= 60) {
      recommendedIntensity = 'Moderate Intensity';
    } else {
      recommendedIntensity = 'Active Recovery / Light';
    }

    // Detailed contributing factors
    const factors = [
      {
        factor: 'Sleep Duration',
        impact: (sleep >= 7 ? 'positive' : sleep >= 6 ? 'neutral' : 'negative') as 'positive' | 'neutral' | 'negative',
        description:
          sleep >= 8
            ? `${sleep} hours of restorative sleep promotes complete central nervous system recovery.`
            : sleep >= 7
            ? `${sleep} hours of sleep supports solid daily physiological recovery.`
            : `${sleep} hours of sleep is below the 7-9 hr optimal baseline, slightly limiting recovery.`,
      },
      {
        factor: 'Energy Level',
        impact: (energy >= 4 ? 'positive' : energy === 3 ? 'neutral' : 'negative') as 'positive' | 'neutral' | 'negative',
        description:
          energy >= 4
            ? 'Reported high perceived energy indicates strong neuromuscular drive for training.'
            : energy === 3
            ? 'Moderate baseline energy level reported for today.'
            : 'Low perceived energy suggests pacing exertion and prioritizing warm-up sets.',
      },
      {
        factor: 'Muscle Soreness',
        impact: (soreness <= 2 ? 'positive' : soreness === 3 ? 'neutral' : 'negative') as 'positive' | 'neutral' | 'negative',
        description:
          soreness <= 2
            ? 'Low muscular soreness indicates tissues are recovered from prior training stimulus.'
            : soreness === 3
            ? 'Moderate localized soreness detected; ensure thorough movement prep.'
            : 'Elevated muscle soreness reported; consider avoiding heavy eccentrics on affected muscle groups.',
      },
      {
        factor: 'Stress Level',
        impact: (stress <= 2 ? 'positive' : stress === 3 ? 'neutral' : 'negative') as 'positive' | 'neutral' | 'negative',
        description:
          stress <= 2
            ? 'Low non-training stress allows optimal autonomic balance and training focus.'
            : stress === 3
            ? 'Moderate daily stress reported within normal bounds.'
            : 'Elevated life stress adds to allostatic load; autoregulate overall training volume accordingly.',
      },
    ];

    // Synthesis explanation
    const positiveCount = factors.filter((f) => f.impact === 'positive').length;
    let summaryExplanation = '';
    if (readinessScore >= 80) {
      summaryExplanation = `Your readiness score of ${readinessScore} indicates high capacity for training. Driven by ${sleep} hours of sleep and ${
        energy >= 4 ? 'strong' : 'steady'
      } energy levels, your body is well-primed for full-intensity workouts or compound strength progression.`;
    } else if (readinessScore >= 60) {
      summaryExplanation = `Your readiness score of ${readinessScore} indicates moderate training capacity. ${
        soreness >= 3
          ? 'Noticeable muscle soreness suggests focusing on technique and standard volume rather than 1RM testing.'
          : stress >= 3
          ? 'Moderate stress and energy levels suggest training at consistent, controlled intensity.'
          : 'Solid baseline readiness suitable for hypertrophy or steady conditioning.'
      }`;
    } else {
      summaryExplanation = `Your readiness score of ${readinessScore} suggests prioritizing active recovery or light training today. Influenced by ${
        sleep < 6 ? 'reduced sleep' : soreness >= 4 ? 'significant muscle fatigue' : 'elevated daily stress'
      }, a lighter mobility or low-intensity session will best support long-term progression.`;
    }

    return {
      readinessScore,
      recommendedIntensity,
      contributingFactors: factors,
      summaryExplanation,
    };
  };

  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();

    const calculation = calculateReadiness(
      sleepHours,
      energyLevel,
      muscleSoreness,
      stressLevel
    );

    const newCheckIn: DailyRecoveryCheckIn = {
      id: `RECOVERY-${Date.now()}`,
      date: todayDateString,
      timestamp: Date.now(),
      sleepHours,
      energyLevel,
      muscleSoreness,
      stressLevel,
      readinessScore: calculation.readinessScore,
      recommendedIntensity: calculation.recommendedIntensity,
      contributingFactors: calculation.contributingFactors,
      summaryExplanation: calculation.summaryExplanation,
    };

    saveRecoveryCheckIn(newCheckIn);
    setIsEditing(false);
  };

  const activeCheckIn = todayCheckIn || latestRecoveryCheckIn;

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* 1. Header & Wellness Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
            <HeartPulse className="w-4 h-4" />
            <span>Athletic Autoregulation Pipeline · Daily Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-white mt-1">
            Recovery &amp; Readiness Check-In
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-normal">
            Self-assessed sleep, energy, and muscle fatigue indicators to guide today's workout intensity
          </p>
        </div>

        {/* Non-Medical Wellness Disclaimer Tag */}
        <div className="flex items-center gap-2 bg-[#0E1016] border border-white/[0.08] px-3 py-2 rounded-xl text-xs font-sans font-normal text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-[#0066FF] shrink-0" />
          <span>Wellness Indicator · Not a Medical Diagnosis</span>
        </div>
      </div>

      {/* 2. AXIO READINESS CARD (IF ACTIVE CHECK-IN EXISTS AND NOT IN EDIT MODE) */}
      {!isEditing && activeCheckIn && (
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <div className="text-xs font-medium tracking-normal text-[#0066FF]">
                Daily Training Preparedness
              </div>
              <h2 className="text-2xl font-bold tracking-normal text-white mt-0.5 font-sans">
                AXIO Readiness
              </h2>
              <div className="flex items-center gap-2 text-xs font-sans text-zinc-400 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Recorded for {new Date(activeCheckIn.timestamp).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => setIsEditing(true)}
            >
              Update Today's Check-In
            </Button>
          </div>

          {/* Readiness Score & Recommended Intensity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Readiness Score Gauge */}
            <div className="md:col-span-4 bg-[#0B0C10] border border-white/[0.06] rounded-xl p-6 text-center space-y-3">
              <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal font-semibold block">
                READINESS SCORE
              </span>

              <div className="relative inline-flex items-center justify-center">
                <div
                  className={`text-6xl font-black font-mono tracking-tight tabular-nums ${
                    activeCheckIn.readinessScore >= 80
                      ? 'text-[#00FF66]'
                      : activeCheckIn.readinessScore >= 60
                      ? 'text-[#0066FF]'
                      : 'text-amber-400'
                  }`}
                >
                  {activeCheckIn.readinessScore}
                </div>
                <span className="text-sm font-sans text-zinc-500 absolute -top-1 -right-6 font-bold">
                  /100
                </span>
              </div>

              {/* Score bar */}
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeCheckIn.readinessScore >= 80
                      ? 'bg-[#00FF66]'
                      : activeCheckIn.readinessScore >= 60
                      ? 'bg-[#0066FF]'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${activeCheckIn.readinessScore}%` }}
                />
              </div>

              <div className="text-xs font-sans text-zinc-400">
                {activeCheckIn.readinessScore >= 80
                  ? 'High Systemic Readiness'
                  : activeCheckIn.readinessScore >= 60
                  ? 'Moderate Systemic Readiness'
                  : 'Restorative Readiness Mode'}
              </div>
            </div>

            {/* Right: Recommended Intensity Card */}
            <div className="md:col-span-8 bg-[#0B0C10] border border-white/[0.06] rounded-xl p-6 space-y-4">
              <div>
                <span className="text-[11px] font-sans text-zinc-400 uppercase tracking-normal font-semibold block">
                  TODAY'S RECOMMENDED TRAINING INTENSITY
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <h3
                    className={`text-2xl font-black tracking-tight ${
                      activeCheckIn.recommendedIntensity === 'High Intensity'
                        ? 'text-[#00FF66]'
                        : activeCheckIn.recommendedIntensity === 'Moderate Intensity'
                        ? 'text-[#0066FF]'
                        : 'text-amber-400'
                    }`}
                  >
                    {activeCheckIn.recommendedIntensity}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold uppercase tracking-normal border ${
                      activeCheckIn.recommendedIntensity === 'High Intensity'
                        ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66]'
                        : activeCheckIn.recommendedIntensity === 'Moderate Intensity'
                        ? 'bg-[#0066FF]/10 border-[#0066FF]/30 text-[#00FF66]'
                        : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                    }`}
                  >
                    AUTOREGULATED
                  </span>
                </div>
              </div>

              {/* Short explanation of which check-in factors influenced it */}
              <div className="p-3.5 rounded-lg bg-[#101218] border border-white/[0.06] space-y-1">
                <span className="text-[11px] font-sans text-zinc-400 uppercase tracking-normal font-semibold block">
                  Readiness Synthesis Explanation
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {activeCheckIn.summaryExplanation}
                </p>
              </div>

              {/* Action: navigate to workout */}
              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-sans">
                  Ready to train? Proceed to your personalized workout routine.
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => onNavigate && onNavigate('workout')}
                >
                  Start Workout
                </Button>
              </div>
            </div>
          </div>

          {/* Contributing Factors Breakdown Ledger */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-sans font-semibold uppercase tracking-normal text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0066FF]" />
              <span>Influencing Check-In Factors</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeCheckIn.contributingFactors.map((f, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-semibold text-white">
                      {f.factor}
                    </span>
                    <span
                      className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded border uppercase tracking-normal ${
                        f.impact === 'positive'
                          ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66]'
                          : f.impact === 'neutral'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {f.impact === 'positive'
                        ? 'High Readiness'
                        : f.impact === 'neutral'
                        ? 'Moderate'
                        : 'Constraint'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. DAILY RECOVERY CHECK-IN FORM (SIMPLE USER-FRIENDLY CONTROLS) */}
      {isEditing && (
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-sans text-[#0066FF] uppercase font-semibold tracking-normal">
                DAILY LOG
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Complete Daily Recovery Check-In
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Input your sleep duration, energy level, muscle soreness, and stress level
              </p>
            </div>

            {activeCheckIn && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmitCheckIn} className="space-y-6">
            {/* Input 1: Sleep Duration */}
            <div className="p-5 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-[#0066FF]" />
                  <label className="text-sm font-bold text-white">
                    Sleep Duration
                  </label>
                </div>
                <span className="font-mono text-base font-extrabold text-[#0066FF] tabular-nums">
                  {sleepHours.toFixed(1)} hrs
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-[#0066FF] cursor-pointer"
              />

              {/* Preset quick selection chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[5, 6, 7, 7.5, 8, 8.5, 9, 10].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setSleepHours(hours)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-sans font-medium transition-all ${
                      sleepHours === hours
                        ? 'bg-[#0066FF] text-white font-semibold'
                        : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            {/* Input 2: Energy Level */}
            <div className="p-5 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#0066FF]" />
                  <label className="text-sm font-semibold text-white">
                    Perceived Energy Level
                  </label>
                </div>
                <span className="font-sans text-xs text-zinc-400 font-medium">
                  {energyLevel === 1 && '1/5 · Exhausted'}
                  {energyLevel === 2 && '2/5 · Sluggish'}
                  {energyLevel === 3 && '3/5 · Moderate'}
                  {energyLevel === 4 && '4/5 · Energized'}
                  {energyLevel === 5 && '5/5 · Peak Energy'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { val: 1, label: 'Exhausted' },
                  { val: 2, label: 'Low' },
                  { val: 3, label: 'Moderate' },
                  { val: 4, label: 'High' },
                  { val: 5, label: 'Peak' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setEnergyLevel(item.val)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      energyLevel === item.val
                        ? 'bg-[#0066FF] border-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/25'
                        : 'bg-[#101218] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="text-base font-sans font-bold">{item.val}</div>
                    <div className="text-[11px] font-sans mt-0.5 truncate">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input 3: Muscle Soreness */}
            <div className="p-5 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0066FF]" />
                  <label className="text-sm font-semibold text-white">
                    Muscle Soreness
                  </label>
                </div>
                <span className="font-sans text-xs text-zinc-400 font-medium">
                  {muscleSoreness === 1 && '1/5 · None / Fresh'}
                  {muscleSoreness === 2 && '2/5 · Mild Tightness'}
                  {muscleSoreness === 3 && '3/5 · Moderate Soreness'}
                  {muscleSoreness === 4 && '4/5 · Heavy Fatigue'}
                  {muscleSoreness === 5 && '5/5 · Severe DOMS'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { val: 1, label: 'Fresh' },
                  { val: 2, label: 'Mild' },
                  { val: 3, label: 'Moderate' },
                  { val: 4, label: 'Heavy' },
                  { val: 5, label: 'Severe' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setMuscleSoreness(item.val)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      muscleSoreness === item.val
                        ? 'bg-[#0066FF] border-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/25'
                        : 'bg-[#101218] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="text-base font-sans font-bold">{item.val}</div>
                    <div className="text-[11px] font-sans mt-0.5 truncate">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input 4: Stress Level */}
            <div className="p-5 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#0066FF]" />
                  <label className="text-sm font-semibold text-white">
                    Mental / Life Stress Level
                  </label>
                </div>
                <span className="font-sans text-xs text-zinc-400 font-medium">
                  {stressLevel === 1 && '1/5 · Very Low / Relaxed'}
                  {stressLevel === 2 && '2/5 · Low'}
                  {stressLevel === 3 && '3/5 · Moderate'}
                  {stressLevel === 4 && '4/5 · Elevated'}
                  {stressLevel === 5 && '5/5 · High Stress'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { val: 1, label: 'Very Low' },
                  { val: 2, label: 'Low' },
                  { val: 3, label: 'Moderate' },
                  { val: 4, label: 'Elevated' },
                  { val: 5, label: 'High' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setStressLevel(item.val)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      stressLevel === item.val
                        ? 'bg-[#0066FF] border-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/25'
                        : 'bg-[#101218] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="text-base font-sans font-bold">{item.val}</div>
                    <div className="text-[11px] font-sans mt-0.5 truncate">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                iconRight={<Sparkles className="w-4 h-4" />}
                className="w-full sm:w-auto px-8"
              >
                Calculate AXIO Readiness
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 4. TRANSPARENT METHODOLOGY & WELLNESS DISCLAIMER */}
      <div className="p-5 rounded-2xl bg-[#101218] border border-white/[0.08] space-y-3">
        <div className="flex items-center gap-2 text-xs font-sans font-semibold text-white uppercase tracking-normal">
          <Info className="w-4 h-4 text-[#0066FF]" />
          <span>Transparent Readiness Methodology</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
          The AXIO Readiness score is computed via a transparent athletic weighting:
          <strong className="text-white"> Sleep Duration (35%)</strong>,
          <strong className="text-white"> Energy Level (25%)</strong>,
          <strong className="text-white"> Muscle Soreness (20%)</strong>, and
          <strong className="text-white"> Stress Level (20%)</strong>.
          It does not require wearable hardware and does not make external diagnostic assumptions.
        </p>
        <div className="p-3 rounded-xl bg-[#0B0C10] border border-white/[0.06] text-xs font-sans text-zinc-400 leading-relaxed">
          <strong className="text-white block mb-0.5 font-semibold">Important Wellness Notice:</strong>
          AXIO Readiness is an autoregulated training guide designed to assist healthy athletes in planning daily workout intensity. It is not medical software, does not provide medical diagnoses, and should never substitute professional healthcare or medical advice.
        </div>
      </div>

      {/* 5. RECENT CHECK-INS HISTORY */}
      {recoveryCheckIns.length > 0 && (
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-sm font-semibold tracking-normal text-white font-sans flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0066FF]" />
              <span>Recent Check-In History ({recoveryCheckIns.length})</span>
            </h3>
            <span className="text-xs text-zinc-400 font-sans">
              Saved in athlete telemetry storage
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Sleep</th>
                  <th className="py-2.5 px-3">Energy</th>
                  <th className="py-2.5 px-3">Soreness</th>
                  <th className="py-2.5 px-3">Stress</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3 text-right">Intensity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {recoveryCheckIns.map((ci) => (
                  <tr key={ci.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{ci.date}</td>
                    <td className="py-3 px-3 text-zinc-300">{ci.sleepHours} hrs</td>
                    <td className="py-3 px-3 text-zinc-300">{ci.energyLevel}/5</td>
                    <td className="py-3 px-3 text-zinc-300">{ci.muscleSoreness}/5</td>
                    <td className="py-3 px-3 text-zinc-300">{ci.stressLevel}/5</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-black tabular-nums ${
                          ci.readinessScore >= 80
                            ? 'text-[#00FF66]'
                            : ci.readinessScore >= 60
                            ? 'text-[#0066FF]'
                            : 'text-amber-400'
                        }`}
                      >
                        {ci.readinessScore}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-white">
                      {ci.recommendedIntensity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
