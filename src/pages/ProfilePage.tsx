/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Athlete Profile & Biometric Sensor Registry
 */

import React, { useState } from 'react';
import { AthleteProfile } from '../types/app.ts';
import { Button } from '../design-system/components/Button.tsx';
import { InputField } from '../design-system/components/InputField.tsx';
import {
  User,
  Cpu,
  ShieldCheck,
  Check,
  Save,
  RotateCcw,
  Target,
  Sliders,
  Dumbbell,
  Utensils,
  Activity,
} from 'lucide-react';

interface ProfilePageProps {
  athlete: AthleteProfile;
  onUpdateAthlete: (athlete: AthleteProfile) => void;
  onRetakeOnboarding: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  athlete,
  onUpdateAthlete,
  onRetakeOnboarding,
}) => {
  const [name, setName] = useState(athlete.name);
  const [age, setAge] = useState(String(athlete.age || 26));
  const [discipline, setDiscipline] = useState(athlete.discipline);
  const [bodyweight, setBodyweight] = useState(String(athlete.weightKg || 86.4));
  const [height, setHeight] = useState(String(athlete.heightCm || 188));
  const [daysPerWeek, setDaysPerWeek] = useState(athlete.workoutDaysPerWeek || 5);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onUpdateAthlete({
      ...athlete,
      name,
      age: parseInt(age, 10) || athlete.age,
      discipline,
      weightKg: parseFloat(bodyweight) || athlete.weightKg,
      heightCm: parseFloat(height) || athlete.heightCm,
      workoutDaysPerWeek: daysPerWeek,
      totalWorkoutsTarget: daysPerWeek,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const sensors = [
    {
      name: 'AXIO Barbell Optical Transducer',
      type: '12-Axis Kinematic VBT Sensor',
      status: 'Connected (100 Hz)',
      battery: '94%',
    },
    {
      name: 'Whoop 4.0 Recovery Strap',
      type: 'Continuous PPG & Sleep HRV',
      status: 'Synced (Last sync 2m ago)',
      battery: '78%',
    },
    {
      name: 'Dual Bilateral Force Plates',
      type: 'Ground Reaction Force Sensor',
      status: 'Calibrated',
      battery: 'AC Power',
    },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
            Identity &amp; Biomechanical Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-white mt-1">
            Athlete Profile
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-normal">
            Anthropometrics, intake specifications, and paired sensor telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onRetakeOnboarding}
            iconLeft={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Retake Intake Wizard
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
            iconLeft={savedSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
          >
            {savedSuccess ? 'Profile Saved' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Main Profile Identity Card */}
      <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <div className="w-20 h-20 rounded-2xl bg-[#0066FF]/15 border border-[#0066FF]/35 text-[#0066FF] font-sans text-2xl font-bold flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(0,102,255,0.15)]">
          {athlete.avatarInitials}
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {athlete.name}
            </h2>
            <span className="text-[10px] font-sans uppercase bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30 px-2.5 py-0.5 rounded-md font-semibold tracking-normal">
              {athlete.tier}
            </span>
            <span className="text-[10px] font-sans uppercase bg-white/[0.04] text-zinc-400 border border-white/[0.08] px-2.5 py-0.5 rounded-md tracking-normal font-medium">
              {athlete.fitnessLevel || 'Advanced'}
            </span>
          </div>

          <p className="text-xs text-zinc-400 font-sans">
            Focus: <span className="text-zinc-300">{athlete.discipline || athlete.goals?.join(', ')}</span>
          </p>

          <div className="flex items-center gap-3 sm:gap-4 text-xs text-zinc-300 pt-2 font-sans tabular-nums flex-wrap">
            <span className="bg-[#0B0C10] px-2.5 py-1 rounded border border-white/[0.05]"><span className="text-zinc-500 mr-1.5">AGE</span>{athlete.age} YRS</span>
            <span className="bg-[#0B0C10] px-2.5 py-1 rounded border border-white/[0.05]"><span className="text-zinc-500 mr-1.5">MASS</span>{athlete.weightKg} KG</span>
            <span className="bg-[#0B0C10] px-2.5 py-1 rounded border border-white/[0.05]"><span className="text-zinc-500 mr-1.5">HEIGHT</span>{athlete.heightCm} CM</span>
            <span className="bg-[#0B0C10] px-2.5 py-1 rounded border border-white/[0.05]"><span className="text-zinc-500 mr-1.5">STREAK</span><span className="text-[#0066FF] font-bold">{athlete.streakDays} DAYS</span></span>
          </div>
        </div>
      </div>

      {/* Structured Intake Dossier Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fitness & Activity Level */}
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Activity className="w-4 h-4 text-[#0066FF]" />
            <span>Fitness Information</span>
          </div>
          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between border-b border-white/[0.05] pb-2">
              <span className="text-zinc-400">FITNESS LEVEL</span>
              <span className="text-white font-semibold">{athlete.fitnessLevel || 'Advanced'}</span>
            </div>
            <div className="flex justify-between border-b border-white/[0.05] pb-2">
              <span className="text-zinc-400">ACTIVITY LEVEL</span>
              <span className="text-white font-semibold">{athlete.activityLevel || 'Very Active'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">EXPERIENCE</span>
              <span className="text-white font-semibold">{athlete.trainingExperience || '3 - 5 years'}</span>
            </div>
          </div>
        </div>

        {/* Selected Goals */}
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Target className="w-4 h-4 text-[#0066FF]" />
            <span>Athletic Goals</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {athlete.goals && athlete.goals.length > 0 ? (
              athlete.goals.map((g, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded bg-[#0B0C10] border border-white/[0.08] text-zinc-200 text-xs font-sans"
                >
                  {g}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-400 font-sans">Strength, Sports Performance</span>
            )}
          </div>
        </div>

        {/* Regimen Preferences */}
        <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sliders className="w-4 h-4 text-[#0066FF]" />
            <span>Preferences &amp; Diet</span>
          </div>
          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between border-b border-white/[0.05] pb-2">
              <span className="text-zinc-400">LOCATION</span>
              <span className="text-white font-semibold">{athlete.workoutLocation || 'Commercial Gym'}</span>
            </div>
            <div className="flex justify-between border-b border-white/[0.05] pb-2">
              <span className="text-zinc-400">SESSION TIME</span>
              <span className="text-white font-semibold">{athlete.workoutDurationMinutes || 60} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">DIET FUEL</span>
              <span className="text-white font-semibold truncate max-w-[130px]" title={athlete.dietPreference}>
                {athlete.dietPreference || 'High Protein'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Anthropometric & Biometric Inputs */}
      <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <div className="border-b border-white/[0.06] pb-4">
          <h3 className="text-base font-semibold text-white tracking-tight">
            Anthropometrics &amp; Core Settings
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Critical parameters for power-to-weight and ground reaction force normalizations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField
            label="Athlete Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <InputField
            label="Athlete Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            unitSuffix="yrs"
          />

          <InputField
            label="Primary Discipline"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          />

          <InputField
            label="Body Mass"
            value={bodyweight}
            onChange={(e) => setBodyweight(e.target.value)}
            unitSuffix="kg"
            helperText="Used for relative power calculation (W/kg)"
          />

          <InputField
            label="Standing Height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            unitSuffix="cm"
            helperText="Used for joint segment displacement model"
          />

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 tracking-normal uppercase block">
              Programmed Workout Days / Week
            </label>
            <div className="flex items-center gap-1.5 pt-1">
              {[2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysPerWeek(d)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-sans transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                    daysPerWeek === d
                      ? 'bg-[#0066FF] text-white border-[#0066FF] font-semibold shadow-[0_0_12px_rgba(0,102,255,0.3)]'
                      : 'bg-[#0B0C10] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.18]'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Paired Sensors & Hardware Pipeline */}
      <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Paired Hardware Sensors
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live kinematic feeds delivering sub-millisecond telemetry
            </p>
          </div>
          <span className="text-xs font-sans text-[#0066FF] font-semibold tracking-normal">
            3 DEVICES ACTIVE
          </span>
        </div>

        <div className="space-y-3">
          {sensors.map((s, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#141620] border border-white/[0.08] flex items-center justify-center text-[#0066FF] shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{s.name}</div>
                  <div className="text-xs text-zinc-400">{s.type}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-sans">
                <span className="text-[#0066FF] font-medium">{s.status}</span>
                <span className="text-zinc-400 font-sans tabular-nums bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">{s.battery}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
