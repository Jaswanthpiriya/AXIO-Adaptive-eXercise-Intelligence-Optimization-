/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Multi-Step User Onboarding Flow
 * Collects personal, fitness, goals, and preferences data with strict validation and AXIO visual design.
 */

import React, { useState } from 'react';
import {
  AthleteProfile,
  FitnessGoal,
  FitnessLevel,
  ActivityLevel,
  TrainingExperience,
  WorkoutLocation,
  AvailableEquipment,
  DietPreference,
} from '../../types/app.ts';
import { AxioMark } from '../../design-system/AxioLogo.tsx';
import { Button } from '../../design-system/components/Button.tsx';
import {
  User,
  Activity,
  Target,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Dumbbell,
  Flame,
  Check,
} from 'lucide-react';

interface OnboardingFlowProps {
  initialProfile?: AthleteProfile;
  onComplete: (profile: AthleteProfile) => void;
  onCancel?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialProfile,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  // Step 1: Personal Information
  const [name, setName] = useState(initialProfile?.name || '');
  const [age, setAge] = useState<string>(initialProfile?.age ? String(initialProfile.age) : '26');
  const [heightCm, setHeightCm] = useState<string>(
    initialProfile?.heightCm ? String(initialProfile.heightCm) : '182'
  );
  const [weightKg, setWeightKg] = useState<string>(
    initialProfile?.weightKg ? String(initialProfile.weightKg) : '82.5'
  );

  // Step 2: Fitness Information
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(
    initialProfile?.fitnessLevel || 'Intermediate'
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel || 'Moderately Active'
  );
  const [trainingExperience, setTrainingExperience] = useState<TrainingExperience>(
    initialProfile?.trainingExperience || '1 - 3 years'
  );

  // Step 3: Goals
  const [selectedGoals, setSelectedGoals] = useState<FitnessGoal[]>(
    initialProfile?.goals || ['Strength', 'Sports performance']
  );

  // Step 4: Preferences
  const [workoutLocation, setWorkoutLocation] = useState<WorkoutLocation>(
    initialProfile?.workoutLocation || 'Commercial Gym'
  );
  const [availableEquipment, setAvailableEquipment] = useState<AvailableEquipment[]>(
    initialProfile?.availableEquipment || ['Full Barbell & Racks', 'Dumbbells & Bench']
  );
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState<number>(
    initialProfile?.workoutDaysPerWeek || 4
  );
  const [workoutDurationMinutes, setWorkoutDurationMinutes] = useState<number>(
    initialProfile?.workoutDurationMinutes || 60
  );
  const [dietPreference, setDietPreference] = useState<DietPreference>(
    initialProfile?.dietPreference || 'High Protein Omnivore'
  );

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Options Definitions
  const fitnessLevels: { id: FitnessLevel; label: string; desc: string }[] = [
    {
      id: 'Beginner',
      label: 'Beginner',
      desc: 'Starting fresh or learning fundamental compound movement mechanics.',
    },
    {
      id: 'Intermediate',
      label: 'Intermediate',
      desc: 'Consistent lifting history for 1+ years with solid barbell baseline.',
    },
    {
      id: 'Advanced',
      label: 'Advanced',
      desc: 'Experienced lifter accustomed to autoregulation, RPE, and velocity gates.',
    },
    {
      id: 'Elite Athlete',
      label: 'Elite Athlete',
      desc: 'Competitive sports or collegiate strength & conditioning caliber.',
    },
  ];

  const activityLevels: { id: ActivityLevel; label: string; desc: string }[] = [
    { id: 'Sedentary', label: 'Sedentary', desc: 'Primarily desk work with minimal daily locomotion.' },
    { id: 'Lightly Active', label: 'Lightly Active', desc: '1-2 light movement or walking sessions weekly.' },
    { id: 'Moderately Active', label: 'Moderately Active', desc: '3-4 structured physical training sessions.' },
    { id: 'Very Active', label: 'Very Active', desc: '5+ intense workouts or physically demanding work.' },
    { id: 'Elite Training', label: 'Elite Training', desc: 'High-volume two-a-day or dedicated athlete training load.' },
  ];

  const trainingExperiences: TrainingExperience[] = [
    'Less than 1 year',
    '1 - 3 years',
    '3 - 5 years',
    '5+ years',
  ];

  const allGoals: { id: FitnessGoal; label: string; cue: string }[] = [
    { id: 'Strength', label: 'Strength', cue: 'Increase maximal 1RM force output' },
    { id: 'Sports performance', label: 'Sports Performance', cue: 'High-velocity power & rate of force' },
    { id: 'Muscle gain', label: 'Muscle Gain', cue: 'Hypertrophy & lean tissue development' },
    { id: 'Weight loss', label: 'Weight Loss', cue: 'Targeted caloric deficit & metabolic conditioning' },
    { id: 'Endurance', label: 'Endurance', cue: 'Aerobic threshold & sustained cardiac output' },
    { id: 'Flexibility', label: 'Flexibility & Mobility', cue: 'Joint range of motion & injury resilience' },
    { id: 'General fitness', label: 'General Fitness', cue: 'Holistic health, vitality, and longevity' },
  ];

  const workoutLocations: WorkoutLocation[] = [
    'Commercial Gym',
    'Home Gym',
    'Outdoors',
    'Hybrid / Multi-facility',
  ];

  const equipmentOptions: AvailableEquipment[] = [
    'Full Barbell & Racks',
    'Dumbbells & Bench',
    'Kettlebells & Free Weights',
    'Machines & Cables',
    'Bodyweight & Calisthenics',
    'Cardio Ergometers',
  ];

  const dietPreferences: { id: DietPreference; label: string; desc: string }[] = [
    { id: 'High Protein Omnivore', label: 'High Protein Omnivore', desc: 'Balanced animal & plant proteins for maximum recovery' },
    { id: 'Plant-Based / Vegan', label: 'Plant-Based / Vegan', desc: '100% plant-derived substrates & targeted amino acids' },
    { id: 'Vegetarian', label: 'Vegetarian', desc: 'Dairy, eggs, legumes, and nutrient-dense whole foods' },
    { id: 'Ketogenic / Low-Carb', label: 'Ketogenic / Low-Carb', desc: 'High fat, moderate protein, minimal glycogen carbohydrate' },
    { id: 'Mediterranean / Balanced', label: 'Mediterranean / Balanced', desc: 'High omega-3, unrefined grains, olive oil, and clean proteins' },
  ];

  // Helper toggle for goals
  const toggleGoal = (goal: FitnessGoal) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
    if (errors.goals) {
      setErrors((prev) => ({ ...prev, goals: '' }));
    }
  };

  // Helper toggle for equipment
  const toggleEquipment = (eq: AvailableEquipment) => {
    setAvailableEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
    if (errors.equipment) {
      setErrors((prev) => ({ ...prev, equipment: '' }));
    }
  };

  // Validation Logic per step
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!name.trim() || name.trim().length < 2) {
        newErrors.name = 'Please enter your athlete name (at least 2 characters).';
      }
      const numAge = parseInt(age, 10);
      if (isNaN(numAge) || numAge < 14 || numAge > 99) {
        newErrors.age = 'Please enter a valid age between 14 and 99.';
      }
      const numHeight = parseFloat(heightCm);
      if (isNaN(numHeight) || numHeight < 100 || numHeight > 250) {
        newErrors.height = 'Please enter a valid height between 100cm and 250cm.';
      }
      const numWeight = parseFloat(weightKg);
      if (isNaN(numWeight) || numWeight < 35 || numWeight > 260) {
        newErrors.weight = 'Please enter a valid bodyweight between 35kg and 260kg.';
      }
    } else if (stepNumber === 2) {
      if (!fitnessLevel) newErrors.fitnessLevel = 'Please select your current fitness level.';
      if (!activityLevel) newErrors.activityLevel = 'Please select your activity level.';
      if (!trainingExperience) newErrors.trainingExperience = 'Please select your training experience.';
    } else if (stepNumber === 3) {
      if (selectedGoals.length === 0) {
        newErrors.goals = 'Please select at least one primary athletic goal.';
      }
    } else if (stepNumber === 4) {
      if (!workoutLocation) newErrors.location = 'Please select your preferred workout location.';
      if (availableEquipment.length === 0) {
        newErrors.equipment = 'Please select at least one piece of available equipment.';
      }
      if (!workoutDaysPerWeek || workoutDaysPerWeek < 1 || workoutDaysPerWeek > 7) {
        newErrors.days = 'Select between 1 and 7 training days per week.';
      }
      if (!dietPreference) newErrors.diet = 'Please select your nutrition preference.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    // Generate initials
    const parts = name.trim().split(' ');
    const avatarInitials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();

    // Map tier
    const tierMap: Record<FitnessLevel, string> = {
      Beginner: 'Foundational Athlete',
      Intermediate: 'Adaptive Performance',
      Advanced: 'High-Performance Elite',
      'Elite Athlete': 'Championship Competitor',
    };

    // Calculate baseline volume and scores
    const parsedWeight = parseFloat(weightKg) || 80;
    const weeklyVolumeEstimate = Math.round(parsedWeight * workoutDaysPerWeek * 70);

    const updatedProfile: AthleteProfile = {
      name: name.trim(),
      age: parseInt(age, 10) || 26,
      heightCm: parseFloat(heightCm) || 182,
      weightKg: parsedWeight,
      discipline: selectedGoals.slice(0, 2).join(' & '),
      tier: tierMap[fitnessLevel] || 'High-Performance Elite',
      avatarInitials,
      streakDays: initialProfile?.streakDays || 1,
      performanceScore: fitnessLevel === 'Elite Athlete' ? 96 : fitnessLevel === 'Advanced' ? 92 : 84,
      formScore: 95,
      weeklyVolumeKg: weeklyVolumeEstimate,
      completedWorkoutsThisWeek: 0,
      totalWorkoutsTarget: workoutDaysPerWeek,
      fitnessLevel,
      activityLevel,
      trainingExperience,
      goals: selectedGoals,
      workoutLocation,
      availableEquipment,
      workoutDaysPerWeek,
      workoutDurationMinutes,
      dietPreference,
      onboardingCompleted: true,
    };

    onComplete(updatedProfile);
  };

  const steps = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Fitness Level', icon: Activity },
    { num: 3, title: 'Goals', icon: Target },
    { num: 4, title: 'Preferences', icon: Sliders },
    { num: 5, title: 'Review & Protocol', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-white flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Bar */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <AxioMark className="w-8 h-8 text-white" />
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-[0.24em] text-white">
              Λ X I O
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-[#6B7280] uppercase">
              Athlete Intake Protocol
            </span>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-[#6B7280] hover:text-white transition-colors font-mono"
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Main Multi-Step Content Card */}
      <div className="max-w-3xl mx-auto w-full my-6 flex-1 flex flex-col justify-between">
        {/* Step Progression Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-mono text-[#0066FF] font-semibold tracking-wider uppercase">
              Step {currentStep} of 5 · {steps[currentStep - 1].title}
            </span>
            <span className="font-mono text-[#6B7280] tabular-nums">
              {Math.round((currentStep / 5) * 100)}% Complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-[#181A22] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#0066FF] transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>

          {/* Step Pills */}
          <div className="hidden sm:flex items-center justify-between mt-4">
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                    isCurrent
                      ? 'text-white font-semibold'
                      : isDone
                      ? 'text-[#0066FF]'
                      : 'text-[#6B7280]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] border ${
                      isCurrent
                        ? 'border-[#0066FF] bg-[#0066FF] text-white'
                        : isDone
                        ? 'border-[#0066FF] text-[#0066FF] bg-[#0066FF]/10'
                        : 'border-white/10 bg-[#121318] text-[#6B7280]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </span>
                  <span>{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="bg-[#121318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] font-mono text-[#0066FF] uppercase tracking-wider font-semibold">
                Section 1 of 4
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Personal Anthropometrics
              </h2>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                AXIO uses your physical profile to calibrate bar path physics, relative power output (W/kg), and energy expenditure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[#6B7280] block">
                  Full Name / Athlete Handle <span className="text-[#0066FF]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Thorne"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full bg-[#0B0B0D] text-white text-sm px-4 py-3 rounded-xl border transition-colors focus:outline-none ${
                    errors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-white/10 focus:border-[#0066FF]'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#6B7280] block">
                  Age (Years) <span className="text-[#0066FF]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="14"
                    max="99"
                    placeholder="26"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                    }}
                    className={`w-full bg-[#0B0B0D] text-white text-sm px-4 py-3 rounded-xl border transition-colors font-mono tabular-nums focus:outline-none ${
                      errors.age
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/10 focus:border-[#0066FF]'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#6B7280]">
                    YRS
                  </span>
                </div>
                {errors.age && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.age}</span>
                  </p>
                )}
              </div>

              {/* Standing Height */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#6B7280] block">
                  Standing Height (cm) <span className="text-[#0066FF]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    max="250"
                    placeholder="182"
                    value={heightCm}
                    onChange={(e) => {
                      setHeightCm(e.target.value);
                      if (errors.height) setErrors((prev) => ({ ...prev, height: '' }));
                    }}
                    className={`w-full bg-[#0B0B0D] text-white text-sm px-4 py-3 rounded-xl border transition-colors font-mono tabular-nums focus:outline-none ${
                      errors.height
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/10 focus:border-[#0066FF]'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#6B7280]">
                    CM
                  </span>
                </div>
                {errors.height && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.height}</span>
                  </p>
                )}
              </div>

              {/* Bodyweight */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[#6B7280] block">
                  Current Bodyweight (kg) <span className="text-[#0066FF]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="260"
                    placeholder="82.5"
                    value={weightKg}
                    onChange={(e) => {
                      setWeightKg(e.target.value);
                      if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
                    }}
                    className={`w-full bg-[#0B0B0D] text-white text-sm px-4 py-3 rounded-xl border transition-colors font-mono tabular-nums focus:outline-none ${
                      errors.weight
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/10 focus:border-[#0066FF]'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#6B7280]">
                    KG
                  </span>
                </div>
                {errors.weight && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.weight}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Fitness Information */}
        {currentStep === 2 && (
          <div className="bg-[#121318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] font-mono text-[#0066FF] uppercase tracking-wider font-semibold">
                Section 2 of 4
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Fitness &amp; Experience Baseline
              </h2>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Determines starting velocity loss thresholds, volume tolerance, and workout intensity.
              </p>
            </div>

            {/* Fitness Level */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-white block">
                1. What is your current fitness level?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fitnessLevels.map((lvl) => (
                  <div
                    key={lvl.id}
                    onClick={() => setFitnessLevel(lvl.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      fitnessLevel === lvl.id
                        ? 'bg-[#181A24] border-[#0066FF] shadow-sm'
                        : 'bg-[#0B0B0D] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        {lvl.label}
                      </span>
                      {fitnessLevel === lvl.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                      {lvl.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Activity Level */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <label className="text-xs font-semibold text-white block">
                2. Current Daily Activity Level
              </label>
              <div className="space-y-2">
                {activityLevels.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => setActivityLevel(act.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      activityLevel === act.id
                        ? 'bg-[#181A24] border-[#0066FF]'
                        : 'bg-[#0B0B0D] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {act.label}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {act.desc}
                      </div>
                    </div>
                    {activityLevel === act.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Training Experience */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <label className="text-xs font-semibold text-white block">
                3. Resistance Training Experience
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {trainingExperiences.map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setTrainingExperience(exp)}
                    className={`p-3 rounded-xl border text-xs font-mono transition-all text-center ${
                      trainingExperience === exp
                        ? 'bg-[#0066FF] border-[#0066FF] text-white font-semibold'
                        : 'bg-[#0B0B0D] border-white/10 text-[#6B7280] hover:text-white'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {currentStep === 3 && (
          <div className="bg-[#121318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] font-mono text-[#0066FF] uppercase tracking-wider font-semibold">
                Section 3 of 4
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Athletic &amp; Physical Goals
              </h2>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Select one or more targets. The AXIO Engine adapts your concentric velocity gates, volume dosage, and fueling algorithms accordingly.
              </p>
            </div>

            {errors.goals && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 p-3 rounded-xl bg-red-950/20 border border-red-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.goals}</span>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {allGoals.map((g) => {
                const isSelected = selectedGoals.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#181A24] border-[#0066FF] shadow-sm'
                        : 'bg-[#0B0B0D] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {g.label}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-0.5">
                        {g.cue}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-[#0066FF] border-[#0066FF] text-white'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-[#0B0B0D] rounded-xl border border-white/5 text-xs text-[#6B7280] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0066FF] shrink-0" />
              <span>
                Selected: <strong className="text-white">{selectedGoals.length} Focus Areas</strong>
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Preferences */}
        {currentStep === 4 && (
          <div className="bg-[#121318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] font-mono text-[#0066FF] uppercase tracking-wider font-semibold">
                Section 4 of 4
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Training &amp; Nutrition Preferences
              </h2>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Configure your weekly logistics, facility layout, available load instruments, and bioenergetic fueling profile.
              </p>
            </div>

            {/* Workout Location */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white block">
                Primary Training Location
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {workoutLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setWorkoutLocation(loc)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all text-center ${
                      workoutLocation === loc
                        ? 'bg-[#0066FF] border-[#0066FF] text-white font-semibold'
                        : 'bg-[#0B0B0D] border-white/10 text-[#6B7280] hover:text-white'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Equipment */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <label className="text-xs font-semibold text-white block">
                Available Equipment (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {equipmentOptions.map((eq) => {
                  const isSelected = availableEquipment.includes(eq);
                  return (
                    <div
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#181A24] border-[#0066FF] text-white'
                          : 'bg-[#0B0B0D] border-white/10 text-[#6B7280] hover:text-white'
                      }`}
                    >
                      <span>{eq}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schedule & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-white/5">
              {/* Days Per Week */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Days Per Week</span>
                  <span className="font-mono text-[#0066FF] text-sm tabular-nums">
                    {workoutDaysPerWeek} Days
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWorkoutDaysPerWeek(d)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-mono transition-colors ${
                        workoutDaysPerWeek === d
                          ? 'bg-[#0066FF] text-white border-[#0066FF] font-bold'
                          : 'bg-[#0B0B0D] border-white/10 text-[#6B7280] hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workout Duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Session Duration</span>
                  <span className="font-mono text-[#0066FF] text-sm tabular-nums">
                    {workoutDurationMinutes} Min
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[30, 45, 60, 75, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setWorkoutDurationMinutes(mins)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-mono transition-colors ${
                        workoutDurationMinutes === mins
                          ? 'bg-[#0066FF] text-white border-[#0066FF] font-bold'
                          : 'bg-[#0B0B0D] border-white/10 text-[#6B7280] hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Diet Preference */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <label className="text-xs font-semibold text-white block">
                Dietary Architecture
              </label>
              <div className="space-y-2">
                {dietPreferences.map((diet) => (
                  <div
                    key={diet.id}
                    onClick={() => setDietPreference(diet.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      dietPreference === diet.id
                        ? 'bg-[#181A24] border-[#0066FF]'
                        : 'bg-[#0B0B0D] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {diet.label}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {diet.desc}
                      </div>
                    </div>
                    {dietPreference === diet.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Blueprint Confirmation */}
        {currentStep === 5 && (
          <div className="bg-[#121318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] font-mono text-[#0066FF] uppercase tracking-wider font-semibold">
                Protocol Ready
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Athlete Profile Blueprint
              </h2>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Review your configured sports science parameters. The AXIO Engine has initialized your telemetry registry.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#0B0B0D] rounded-xl border border-white/5 space-y-2">
                <span className="text-[#6B7280] text-[10px] uppercase tracking-wider block">
                  ATHLETE IDENTITY
                </span>
                <div className="text-base font-bold text-white">{name}</div>
                <div className="text-zinc-300">
                  {age} yrs · {heightCm} cm · {weightKg} kg
                </div>
              </div>

              <div className="p-4 bg-[#0B0B0D] rounded-xl border border-white/5 space-y-2">
                <span className="text-[#6B7280] text-[10px] uppercase tracking-wider block">
                  PERFORMANCE TIER
                </span>
                <div className="text-base font-bold text-[#0066FF]">{fitnessLevel}</div>
                <div className="text-zinc-300">
                  {trainingExperience} exp · {activityLevel}
                </div>
              </div>

              <div className="p-4 bg-[#0B0B0D] rounded-xl border border-white/5 space-y-2">
                <span className="text-[#6B7280] text-[10px] uppercase tracking-wider block">
                  FOCUS GOALS
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedGoals.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white text-[11px]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#0B0B0D] rounded-xl border border-white/5 space-y-2">
                <span className="text-[#6B7280] text-[10px] uppercase tracking-wider block">
                  REGIMEN LOGISTICS
                </span>
                <div className="text-white font-semibold">
                  {workoutDaysPerWeek} sessions/wk · {workoutDurationMinutes} min/session
                </div>
                <div className="text-zinc-300">
                  {workoutLocation} · {dietPreference}
                </div>
              </div>
            </div>

            {/* Calculated Baseline Banner */}
            <div className="p-4 bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0066FF]">
                <ShieldCheck className="w-4 h-4" />
                <span>AI Autoregulation Calibrated</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-sans">
                Weekly training load estimated at <strong className="font-mono text-white">{(parseFloat(weightKg) * workoutDaysPerWeek * 70).toLocaleString()} kg volume</strong>. Concentric velocity gates set to <strong className="font-mono text-white">&gt; 0.85 m/s</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
          {currentStep > 1 ? (
            <Button
              variant="secondary"
              onClick={handlePrev}
              iconLeft={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Continue to Step {currentStep + 1}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleFinish}
              iconRight={<Sparkles className="w-4 h-4" />}
            >
              Launch AXIO Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
