/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Performance Fueling & Sports Nutrition Engine
 * Grounded in athlete biometrics, fitness goals, and dietary preferences.
 * Emphasizes DAILY NUTRITION (Protein, Calories, Water - Consumed / Target)
 * with progress indicators, structured Meals (Breakfast, Lunch, Dinner, Snacks),
 * attractive food cards, real data tracking with authentic empty states,
 * and strict non-medical guidance disclaimers.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AthleteProfile, DietPreference, FitnessGoal } from '../types/app.ts';
import { Button } from '../design-system/components/Button.tsx';
import { DIET_MEAL_PLANS } from '../data/nutritionData.ts';
import {
  Utensils,
  Droplets,
  Plus,
  Minus,
  CheckCircle2,
  Flame,
  Scale,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
  Activity,
  RotateCcw,
  Check,
  Coffee,
  Sun,
  Moon,
  Cookie,
  PlusCircle,
  X,
} from 'lucide-react';

interface NutritionPageProps {
  athlete?: AthleteProfile;
  onUpdateAthlete?: (updated: AthleteProfile) => void;
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface FoodCardMeal {
  id: string;
  category: MealCategory;
  title: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  description: string;
  ingredients: string[];
  consumedAt?: string;
  isCustom?: boolean;
}

export const NutritionPage: React.FC<NutritionPageProps> = ({
  athlete,
  onUpdateAthlete,
}) => {
  // Safe fallbacks from athlete profile
  const weightKg = athlete?.weightKg || 86.4;
  const heightCm = athlete?.heightCm || 188;
  const age = athlete?.age || 26;
  const activityLevel = athlete?.activityLevel || 'Very Active';
  const primaryGoal: FitnessGoal = athlete?.goals?.[0] || 'Strength';

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const storageKey = `axio_nutrition_log_${todayStr}`;

  // Active dietary preference state
  const [activeDiet, setActiveDiet] = useState<DietPreference>(() => {
    return athlete?.dietPreference || 'High Protein Omnivore';
  });

  // Track meal consumption timestamps: { [mealId]: '08:15 AM' }
  const [consumedMealLog, setConsumedMealLog] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.consumedMealLog && typeof parsed.consumedMealLog === 'object') {
          return parsed.consumedMealLog;
        }
        if (Array.isArray(parsed.consumedMealIds)) {
          const map: Record<string, string> = {};
          parsed.consumedMealIds.forEach((id: string) => {
            map[id] = 'Logged';
          });
          return map;
        }
      }
    } catch (e) {
      console.warn('Failed to load daily nutrition state', e);
    }
    // Starts completely empty if user hasn't logged anything today (no fabricated numbers)
    return {};
  });

  // Custom user-added food items
  const [customMeals, setCustomMeals] = useState<FoodCardMeal[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.customMeals)) {
          return parsed.customMeals;
        }
      }
    } catch (e) {
      console.warn('Failed to load custom meals', e);
    }
    return [];
  });

  // Hydration state in milliliters (defaults strictly to 0 if not logged)
  const [waterConsumedMl, setWaterConsumedMl] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.waterConsumedMl === 'number') {
          return parsed.waterConsumedMl;
        }
      }
    } catch (e) {
      console.warn('Failed to load hydration state', e);
    }
    return 0;
  });

  // Filter meals category tab: 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'All' | MealCategory>('All');

  // Custom meal modal state
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState<MealCategory>('Snacks');
  const [customTitle, setCustomTitle] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');
  const [customIngredients, setCustomIngredients] = useState('');

  // Persist daily logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          date: todayStr,
          consumedMealLog,
          consumedMealIds: Object.keys(consumedMealLog),
          customMeals,
          waterConsumedMl,
          activeDiet,
        })
      );
    } catch (e) {
      console.warn('Failed to save daily nutrition log', e);
    }
  }, [consumedMealLog, customMeals, waterConsumedMl, activeDiet, storageKey, todayStr]);

  // Synchronize with external assistant changes in real-time
  useEffect(() => {
    const handleExternalUpdate = (event: Event) => {
      const customEvt = event as CustomEvent;
      if (customEvt.detail?.consumedMealLog) {
        setConsumedMealLog(customEvt.detail.consumedMealLog);
      }
      if (customEvt.detail?.activeDiet) {
        setActiveDiet(customEvt.detail.activeDiet);
      }
    };

    window.addEventListener('axio-nutrition-updated', handleExternalUpdate);
    return () => {
      window.removeEventListener('axio-nutrition-updated', handleExternalUpdate);
    };
  }, []);

  // =========================================================================
  // 1. BIOMETRIC ENERGY & TARGET CALCULATIONS
  // =========================================================================

  // Basal Metabolic Rate (Mifflin-St Jeor formula)
  const bmr = useMemo(() => {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  }, [weightKg, heightCm, age]);

  // Activity Multiplier
  const activityMultiplier = useMemo(() => {
    switch (activityLevel) {
      case 'Sedentary':
        return 1.2;
      case 'Lightly Active':
        return 1.375;
      case 'Moderately Active':
        return 1.55;
      case 'Very Active':
        return 1.725;
      case 'Elite Training':
        return 1.9;
      default:
        return 1.725;
    }
  }, [activityLevel]);

  // Total Daily Energy Expenditure (TDEE)
  const tdee = useMemo(() => {
    return Math.round(bmr * activityMultiplier);
  }, [bmr, activityMultiplier]);

  // Calorie Target based on Goal
  const targetCalories = useMemo(() => {
    if (athlete?.goals?.includes('Weight loss')) {
      return Math.round(tdee - 450);
    }
    if (athlete?.goals?.includes('Muscle gain')) {
      return Math.round(tdee + 350);
    }
    if (athlete?.goals?.includes('Strength')) {
      return Math.round(tdee + 200);
    }
    if (athlete?.goals?.includes('Endurance')) {
      return Math.round(tdee + 250);
    }
    return tdee;
  }, [tdee, athlete?.goals]);

  // Protein Target (g): 2.0g - 2.2g / kg depending on goal
  const targetProtein = useMemo(() => {
    if (
      athlete?.goals?.includes('Weight loss') ||
      athlete?.goals?.includes('Muscle gain') ||
      athlete?.goals?.includes('Strength')
    ) {
      return Math.round(weightKg * 2.2);
    }
    return Math.round(weightKg * 2.0);
  }, [weightKg, athlete?.goals]);

  // Water Target (ml): 40ml per kg body weight + baseline compensation
  const targetWaterMl = useMemo(() => {
    return Math.round(weightKg * 40 + 600);
  }, [weightKg]);

  // =========================================================================
  // 2. CURATED FOOD CARDS FOR EACH DIET (BREAKFAST, LUNCH, DINNER, SNACKS)
  // =========================================================================

  // Combine diet preset meals + any user custom meals
  const allMeals = useMemo(() => {
    const base = DIET_MEAL_PLANS[activeDiet] || DIET_MEAL_PLANS['High Protein Omnivore'];
    return [...base, ...customMeals];
  }, [activeDiet, customMeals]);

  // Toggle meal consumed
  const handleToggleMeal = (mealId: string) => {
    setConsumedMealLog((prev) => {
      const next = { ...prev };
      if (next[mealId]) {
        delete next[mealId];
      } else {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        next[mealId] = timeNow;
      }
      return next;
    });
  };

  // Switch dietary preference
  const handleSelectDiet = (diet: DietPreference) => {
    setActiveDiet(diet);
    if (onUpdateAthlete && athlete) {
      onUpdateAthlete({
        ...athlete,
        dietPreference: diet,
      });
    }
  };

  // Reset today's nutrition log back to empty state
  const handleResetLog = () => {
    setConsumedMealLog({});
    setWaterConsumedMl(0);
    setCustomMeals([]);
  };

  // Add custom meal
  const handleAddCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newMeal: FoodCardMeal = {
      id: `custom-${Date.now()}`,
      category: customCategory,
      title: customTitle.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      calories: parseInt(customCalories) || 250,
      protein: parseInt(customProtein) || 20,
      carbs: parseInt(customCarbs) || 20,
      fats: parseInt(customFats) || 10,
      description: 'Custom entry logged by athlete.',
      ingredients: customIngredients
        ? customIngredients.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Custom Whole Food'],
      isCustom: true,
    };

    setCustomMeals((prev) => [...prev, newMeal]);
    // Automatically mark the custom meal as consumed
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setConsumedMealLog((prev) => ({ ...prev, [newMeal.id]: timeNow }));

    // Reset form
    setCustomTitle('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFats('');
    setCustomIngredients('');
    setIsAddCustomOpen(false);
  };

  // Calculate consumed totals strictly from checked meals
  const consumedTotals = useMemo(() => {
    const consumedIds = Object.keys(consumedMealLog);
    const consumed = allMeals.filter((m) => consumedIds.includes(m.id));
    return {
      calories: consumed.reduce((s, m) => s + m.calories, 0),
      protein: consumed.reduce((s, m) => s + m.protein, 0),
      carbs: consumed.reduce((s, m) => s + m.carbs, 0),
      fats: consumed.reduce((s, m) => s + m.fats, 0),
      mealsCount: consumed.length,
    };
  }, [allMeals, consumedMealLog]);

  // Check if ANY real nutrition data has been logged today
  const hasLoggedData = consumedTotals.mealsCount > 0 || waterConsumedMl > 0;

  // Percentage calculations (capped at 100 for bar width, but displayed accurately)
  const proteinPercent = Math.round((consumedTotals.protein / targetProtein) * 100);
  const caloriesPercent = Math.round((consumedTotals.calories / targetCalories) * 100);
  const waterPercent = Math.round((waterConsumedMl / targetWaterMl) * 100);

  // Filtered food cards by category
  const filteredMeals = useMemo(() => {
    if (selectedCategoryTab === 'All') return allMeals;
    return allMeals.filter((m) => m.category === selectedCategoryTab);
  }, [allMeals, selectedCategoryTab]);

  // Category Icon helper
  const getCategoryIcon = (category: MealCategory) => {
    switch (category) {
      case 'Breakfast':
        return <Coffee className="w-3.5 h-3.5 text-amber-400" />;
      case 'Lunch':
        return <Sun className="w-3.5 h-3.5 text-[#0066FF]" />;
      case 'Dinner':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Snacks':
        return <Cookie className="w-3.5 h-3.5 text-[#00FF66]" />;
    }
  };

  const mealCategories: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & DIETARY PROTOCOL SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
            <Utensils className="w-4 h-4" />
            <span>Athletic Substrate Fueling &amp; Bioenergetics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-white mt-1">
            Performance Nutrition
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 mt-0.5">
            <span>Calibrated for {athlete?.name?.split(' ')[0] || 'Athlete'}</span>
            <span aria-hidden="true">·</span>
            <span>{weightKg} kg</span>
            <span aria-hidden="true">·</span>
            <span>{heightCm} cm</span>
            <span aria-hidden="true">·</span>
            <span className="text-zinc-300 font-medium">{primaryGoal}</span>
          </div>
        </div>

        {/* Estimated Daily TDEE Expenditure Metric */}
        <div className="flex items-center gap-3">
          <div className="bg-[#101218] border border-white/[0.08] px-4 py-2.5 rounded-xl flex items-center gap-3 font-sans text-xs shadow-sm">
            <Flame className="w-4 h-4 text-[#0066FF]" />
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-normal block font-medium">
                ESTIMATED TDEE
              </span>
              <strong className="text-white text-sm font-semibold">
                <span className="font-mono tabular-nums">{tdee.toLocaleString()}</span> kcal / day
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DIETARY PREFERENCE SELECTOR (Segmented Protocol Buttons) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="uppercase text-zinc-400 tracking-normal font-medium text-[11px]">
            Active Dietary Protocol:
          </span>
          <span className="text-[#0066FF] font-semibold text-[11px]">
            {activeDiet}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              'High Protein Omnivore',
              'Plant-Based / Vegan',
              'Vegetarian',
              'Ketogenic / Low-Carb',
              'Mediterranean / Balanced',
            ] as DietPreference[]
          ).map((diet) => {
            const isSelected = activeDiet === diet;
            return (
              <button
                key={diet}
                onClick={() => handleSelectDiet(diet)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-sans font-medium transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-md shadow-[#0066FF]/25'
                    : 'bg-[#101218] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 hover:bg-[#141620]'
                }`}
              >
                {diet}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DAILY NUTRITION SECTION                                                */}
      {/* Protein (Consumed / Target)                                               */}
      {/* Calories (Consumed / Target)                                              */}
      {/* Water (Consumed / Target)                                                 */}
      {/* Real data only; genuine empty state when 0 data is logged.                */}
      {/* ========================================================================= */}
      <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <div className="text-[10px] font-sans text-[#0066FF] uppercase tracking-normal font-semibold">
              TODAY'S FUELING INTAKE
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
              DAILY NUTRITION
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time consumed intake versus calculated physiological targets
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasLoggedData && (
              <button
                onClick={handleResetLog}
                className="text-xs font-sans text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/20 bg-white/[0.02]"
                title="Reset today's nutrition log back to 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Today's Log</span>
              </button>
            )}

            <div className="bg-[#0B0C10] border border-white/[0.08] px-3.5 py-1.5 rounded-xl text-xs font-sans text-zinc-300">
              <span className="text-zinc-400">Meals Logged: </span>
              <strong className="text-white font-medium font-mono tabular-nums">
                {consumedTotals.mealsCount} / {allMeals.length}
              </strong>
            </div>
          </div>
        </div>

        {/* 3 Core Metric Cards: Protein, Calories, Water with Progress Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
          {/* 1. PROTEIN: Consumed / Target */}
          <div className="bg-[#0B0C10] border border-white/[0.06] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] uppercase tracking-normal font-bold text-white flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#00FF66]" />
                PROTEIN
              </span>
              <span className="text-[11px] text-zinc-400">
                Target: {((targetProtein / weightKg)).toFixed(1)}g / kg
              </span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold">
                Consumed / Target
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${
                    consumedTotals.protein > 0 ? 'text-[#00FF66]' : 'text-zinc-400'
                  }`}
                >
                  {consumedTotals.protein}g
                </span>
                <span className="text-xl text-zinc-400 font-bold">
                  / {targetProtein}g
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                {hasLoggedData
                  ? `${Math.max(0, targetProtein - consumedTotals.protein)}g remaining for myofibrillar synthesis`
                  : 'Awaiting first meal logging'}
              </span>
            </div>

            {/* Progress indicator */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-[#00FF66] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, proteinPercent)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className={proteinPercent > 0 ? 'text-[#00FF66] font-semibold' : 'text-zinc-400'}>
                  {proteinPercent}% of daily target
                </span>
                <span>
                  {consumedTotals.protein} / {targetProtein} g
                </span>
              </div>
            </div>
          </div>

          {/* 2. CALORIES: Consumed / Target */}
          <div className="bg-[#0B0C10] border border-white/[0.06] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] uppercase tracking-normal font-bold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#0066FF]" />
                CALORIES
              </span>
              <span className="text-[11px] text-zinc-400">
                {primaryGoal} Macro Baseline
              </span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold">
                Consumed / Target
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${
                    consumedTotals.calories > 0 ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  {consumedTotals.calories.toLocaleString()}
                </span>
                <span className="text-xl text-zinc-400 font-bold">
                  / {targetCalories.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">kcal</span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                {hasLoggedData
                  ? `${Math.max(0, targetCalories - consumedTotals.calories).toLocaleString()} kcal balance remaining`
                  : 'Energy balance unlogged for today'}
              </span>
            </div>

            {/* Progress indicator */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-[#0066FF] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, caloriesPercent)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className={caloriesPercent > 0 ? 'text-[#0066FF] font-semibold' : 'text-zinc-400'}>
                  {caloriesPercent}% of energy budget
                </span>
                <span>
                  {consumedTotals.calories} / {targetCalories} kcal
                </span>
              </div>
            </div>
          </div>

          {/* 3. WATER: Consumed / Target */}
          <div className="bg-[#0B0C10] border border-white/[0.06] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] uppercase tracking-normal font-bold text-white flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#0066FF]" />
                WATER
              </span>
              <span className="text-[11px] text-zinc-400">
                {weightKg} kg Athlete Baseline
              </span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold">
                Consumed / Target
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${
                    waterConsumedMl > 0 ? 'text-[#0066FF]' : 'text-zinc-400'
                  }`}
                >
                  {(waterConsumedMl / 1000).toFixed(2)}L
                </span>
                <span className="text-xl text-zinc-400 font-bold">
                  / {(targetWaterMl / 1000).toFixed(1)}L
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                {hasLoggedData
                  ? `${Math.max(0, targetWaterMl - waterConsumedMl)} ml remaining today`
                  : '40 ml/kg + thermal sweat compensation'}
              </span>
            </div>

            {/* Progress indicator */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-[#0066FF] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, waterPercent)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className={waterPercent > 0 ? 'text-[#0066FF] font-semibold' : 'text-zinc-400'}>
                  {waterPercent}% hydrated
                </span>
                <span>
                  {waterConsumedMl} / {targetWaterMl} ml
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Empty State (Shown when no data has been logged yet today) */}
        {!hasLoggedData && (
          <div className="p-5 sm:p-6 rounded-xl bg-[#0B0C10] border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-white font-semibold uppercase tracking-normal">
                <Info className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>NO FUELING DATA LOGGED YET TODAY</span>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed font-sans">
                AXIO does not display fabricated numbers. Your daily intake starts at 0 until you log consumed meals or hydration below.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 text-xs font-sans">
              <button
                onClick={() => setWaterConsumedMl((prev) => prev + 250)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Droplets className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>+250ml Water</span>
              </button>
              <button
                onClick={() => handleToggleMeal(allMeals[0]?.id)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0066FF] text-white hover:bg-[#0052cc] font-medium transition-all shadow-md shadow-[#0066FF]/20 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Log Breakfast</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MEALS SECTION: BREAKFAST, LUNCH, DINNER, SNACKS WITH ATTRACTIVE CARDS  */}
      {/* ========================================================================= */}
      <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <div className="text-[10px] font-sans text-[#0066FF] uppercase tracking-normal font-semibold">
              STRUCTURED DAILY FUELING
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Meals
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-sans">
              <span>Breakfast</span>
              <span aria-hidden="true">·</span>
              <span>Lunch</span>
              <span aria-hidden="true">·</span>
              <span>Dinner</span>
              <span aria-hidden="true">·</span>
              <span>Snacks</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Custom food button */}
            <button
              onClick={() => setIsAddCustomOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0B0C10] hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-sans font-medium flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>+ Add Item</span>
            </button>

            {/* Category Segmented Tabs: All, Breakfast, Lunch, Dinner, Snacks */}
            <div className="flex flex-wrap items-center gap-1 bg-[#0B0C10] p-1 rounded-xl border border-white/[0.06] text-xs font-sans">
              {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedCategoryTab(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategoryTab === tab
                      ? 'bg-[#0066FF] text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal: Add Custom Food Item */}
        {isAddCustomOpen && (
          <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#0066FF]/40 space-y-4 font-sans shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <PlusCircle className="w-4 h-4 text-[#0066FF]" />
                <span>Add Custom Real Food Item</span>
              </div>
              <button
                onClick={() => setIsAddCustomOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomMeal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold mb-1">
                    Meal Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as MealCategory)}
                    className="w-full bg-[#101218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0066FF]"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold mb-1">
                    Food Name / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Whey Shake + Banana"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-[#101218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="350"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className="w-full bg-[#101218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold mb-1 text-[#00FF66]">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="30"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="w-full bg-[#101218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="40"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    className="w-full bg-[#101218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold mb-1">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="8"
                    value={customFats}
                    onChange={(e) => setCustomFats(e.target.value)}
                    className="w-full bg-[#101218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 uppercase tracking-normal block font-semibold mb-1">
                  Ingredients (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 scoop whey, 1 medium banana, 300ml almond milk"
                  value={customIngredients}
                  onChange={(e) => setCustomIngredients(e.target.value)}
                  className="w-full bg-[#101218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0066FF] hover:bg-[#0052cc] text-xs font-bold text-white transition-all shadow-md shadow-[#0066FF]/25"
                >
                  Save &amp; Log Consumed
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grouped or Filtered Display of Meals */}
        {selectedCategoryTab === 'All' ? (
          <div className="space-y-8">
            {mealCategories.map((category) => {
              const categoryMeals = allMeals.filter((m) => m.category === category);
              if (categoryMeals.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <h4 className="text-sm font-sans uppercase font-semibold text-white tracking-normal">
                        {category}
                      </h4>
                    </div>
                    <span className="text-xs font-sans text-zinc-400">
                      {categoryMeals.filter((m) => consumedMealLog[m.id]).length} / {categoryMeals.length} Logged
                    </span>
                  </div>

                  {/* Food Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryMeals.map((meal) => {
                      const isConsumed = Boolean(consumedMealLog[meal.id]);
                      const loggedTime = consumedMealLog[meal.id];

                      return (
                        <div
                          key={meal.id}
                          className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                            isConsumed
                              ? 'bg-[#0B0C10] border-[#00FF66]/40 shadow-lg shadow-[#00FF66]/5'
                              : 'bg-[#0B0C10] border-white/[0.07] hover:border-white/20'
                          }`}
                        >
                          {/* Card Top */}
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs font-sans text-zinc-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#0066FF]" />
                                  <span className="font-mono tabular-nums">{meal.time}</span>
                                </span>
                                {meal.isCustom && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-[#0066FF]">Custom Item</span>
                                  </>
                                )}
                              </div>

                              <span
                                className={`text-[11px] font-sans font-semibold ${
                                  isConsumed ? 'text-[#00FF66]' : 'text-zinc-400'
                                }`}
                              >
                                {isConsumed ? `Consumed · ${loggedTime}` : 'Planned'}
                              </span>
                            </div>

                            <h5 className="text-base font-bold text-white mt-1.5 leading-snug">
                              {meal.title}
                            </h5>

                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-sans">
                              {meal.description}
                            </p>
                          </div>

                          {/* Ingredients */}
                          <div className="space-y-1 pt-2 border-t border-white/5">
                            <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal block font-medium">
                              Key Ingredients:
                            </span>
                            <div className="flex flex-wrap gap-1.5 font-sans text-[11px]">
                              {meal.ingredients.map((ing, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-[#101218] border border-white/5 text-zinc-300"
                                >
                                  {ing}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Macro Ledger & Action Button */}
                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                            <div>
                              <div className="flex items-baseline gap-1 font-mono">
                                <strong className="text-base font-black text-white tabular-nums">
                                  {meal.calories}
                                </strong>
                                <span className="text-[10px] text-zinc-400 font-sans">kcal</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
                                <span className="text-[#00FF66] font-bold">
                                  {meal.protein}g P
                                </span>
                                <span aria-hidden="true" className="text-zinc-600 font-sans">·</span>
                                <span className="text-zinc-300">
                                  {meal.carbs}g C
                                </span>
                                <span aria-hidden="true" className="text-zinc-600 font-sans">·</span>
                                <span className="text-zinc-400">
                                  {meal.fats}g F
                                </span>
                              </div>
                            </div>

                            {/* Consumed Toggle Button */}
                            <button
                              onClick={() => handleToggleMeal(meal.id)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-all duration-150 ${
                                isConsumed
                                  ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 hover:bg-[#00FF66]/30'
                                  : 'bg-[#0066FF] text-white hover:bg-[#0052cc] shadow-md shadow-[#0066FF]/20'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isConsumed ? 'Consumed ✓' : 'Mark Consumed'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Filtered View for specific category (Breakfast, Lunch, Dinner, or Snacks) */
          <div>
            {filteredMeals.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#0B0C10] border border-white/[0.06] text-center space-y-2 font-mono">
                <Info className="w-6 h-6 text-zinc-400 mx-auto" />
                <p className="text-sm text-white font-bold">
                  No {selectedCategoryTab} items recorded.
                </p>
                <p className="text-xs text-zinc-400">
                  Click "+ Add Item" above to add real foods to your {selectedCategoryTab} schedule.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMeals.map((meal) => {
                  const isConsumed = Boolean(consumedMealLog[meal.id]);
                  const loggedTime = consumedMealLog[meal.id];

                  return (
                    <div
                      key={meal.id}
                      className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                        isConsumed
                          ? 'bg-[#0B0C10] border-[#00FF66]/40 shadow-lg shadow-[#00FF66]/5'
                          : 'bg-[#0B0C10] border-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      {/* Card Top */}
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs font-sans text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#0066FF]" />
                              <span className="font-mono tabular-nums">{meal.time}</span>
                            </span>
                            {meal.isCustom && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#0066FF]">Custom Item</span>
                              </>
                            )}
                          </div>

                          <span
                            className={`text-[11px] font-sans font-semibold ${
                              isConsumed ? 'text-[#00FF66]' : 'text-zinc-400'
                            }`}
                          >
                            {isConsumed ? `Consumed · ${loggedTime}` : 'Planned'}
                          </span>
                        </div>

                        <h5 className="text-base font-bold text-white mt-1.5 leading-snug">
                          {meal.title}
                        </h5>

                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-sans">
                          {meal.description}
                        </p>
                      </div>

                      {/* Ingredients */}
                      <div className="space-y-1 pt-2 border-t border-white/5">
                        <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-normal block font-medium">
                          Key Ingredients:
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-sans text-[11px]">
                          {meal.ingredients.map((ing, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-[#101218] border border-white/5 text-zinc-300"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Macro Ledger & Action Button */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-baseline gap-1 font-mono">
                            <strong className="text-base font-black text-white tabular-nums">
                              {meal.calories}
                            </strong>
                            <span className="text-[10px] text-zinc-400 font-sans">kcal</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
                            <span className="text-[#00FF66] font-bold">
                              {meal.protein}g P
                            </span>
                            <span aria-hidden="true" className="text-zinc-600 font-sans">·</span>
                            <span className="text-zinc-300">
                              {meal.carbs}g C
                            </span>
                            <span aria-hidden="true" className="text-zinc-600 font-sans">·</span>
                            <span className="text-zinc-400">
                              {meal.fats}g F
                            </span>
                          </div>
                        </div>

                        {/* Consumed Toggle Button */}
                        <button
                          onClick={() => handleToggleMeal(meal.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-all duration-150 ${
                            isConsumed
                              ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 hover:bg-[#00FF66]/30'
                              : 'bg-[#0066FF] text-white hover:bg-[#0052cc] shadow-md shadow-[#0066FF]/20'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isConsumed ? 'Consumed ✓' : 'Mark Consumed'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. HYDRATION QUICK CONTROLS                                               */}
      {/* ========================================================================= */}
      <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0066FF] uppercase tracking-normal font-sans">
            <Droplets className="w-4 h-4" />
            <span>Cellular Hydration Monitor · {weightKg} kg Athlete</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {(waterConsumedMl / 1000).toFixed(2)} Liters
            </span>
            <span className="text-sm text-zinc-400 font-sans">
              / <span className="font-mono tabular-nums">{(targetWaterMl / 1000).toFixed(1)}</span> Liters Target ({targetWaterMl} ml)
            </span>
          </div>
          <p className="text-xs text-zinc-300 max-w-xl leading-relaxed font-sans">
            40 ml per kg body weight plus thermal sweat factor. Sip consistently throughout training with electrolytes to sustain motor unit firing frequency.
          </p>
        </div>

        {/* Quick Log Water Buttons */}
        <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
          <button
            onClick={() => setWaterConsumedMl((prev) => Math.max(0, prev - 250))}
            className="p-2 rounded-xl bg-[#0B0C10] border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
            title="Subtract 250 ml"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setWaterConsumedMl((prev) => prev + 250)}
          >
            +250 ml Glass
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setWaterConsumedMl((prev) => prev + 500)}
          >
            +500 ml Bottle
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setWaterConsumedMl((prev) => prev + 750)}
          >
            +750 ml Flask
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. GENERAL SPORTS NUTRITION GUIDELINES (NON-MEDICAL)                       */}
      {/* ========================================================================= */}
      <div className="bg-[#101218] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
        <div className="border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2 text-[11px] font-sans font-semibold tracking-normal uppercase text-[#0066FF]">
            <Sparkles className="w-4 h-4" />
            <span>Sports Science Methodology</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
            General Performance Nutrition Guidance
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Core nutritional principles to support training adaptation, recovery, and neuromuscular output
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Module 1: Peri-Workout Nutrient Timing */}
          <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
              <Clock className="w-4 h-4 text-[#0066FF]" />
              <span>1. Peri-Workout Nutrient Timing</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Consume digestible carbohydrates and moderate protein 90 to 120 minutes prior to training to saturate glycogen stores. Within 60 minutes post-session, target 30–45g of quality protein to support muscle protein synthesis.
            </p>
          </div>

          {/* Module 2: Cellular Hydration & Electrolytes */}
          <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
              <Droplets className="w-4 h-4 text-[#0066FF]" />
              <span>2. Cellular Hydration &amp; Electrolytes</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Mild dehydration can impair peak motor velocity. Maintain fluid intake across the day. During intensive sessions, include sodium and potassium to support intracellular water retention and muscle contraction.
            </p>
          </div>

          {/* Module 3: Protein Distribution */}
          <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
              <Scale className="w-4 h-4 text-[#00FF66]" />
              <span>3. Protein Distribution &amp; Quality</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Distribute total protein across 4 balanced feedings spaced 3 to 4 hours apart (Breakfast, Lunch, Dinner, Snacks), each providing at least 2.5–3g of leucine to trigger continuous myofibrillar recovery.
            </p>
          </div>

          {/* Module 4: Goal-Specific Pacing */}
          <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
              <Activity className="w-4 h-4 text-[#0066FF]" />
              <span>4. Goal Pacing for {primaryGoal}</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {primaryGoal === 'Weight loss'
                ? 'Target a progressive 300–500 kcal deficit while keeping protein at or above 2.2g/kg to safeguard contractile lean mass.'
                : primaryGoal === 'Muscle gain'
                ? 'Maintain a controlled 250–400 kcal surplus to provide adequate energy for tissue synthesis without excessive adipose gain.'
                : 'Prioritize steady energy availability, ensuring complex carbohydrates fuel scheduled training volume.'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. MANDATORY WELLNESS & NON-MEDICAL DISCLAIMER                            */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0C10] border border-amber-500/30 space-y-3">
        <div className="flex items-center gap-2 text-xs font-sans font-semibold uppercase text-amber-400">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>General Guidance &amp; Non-Medical Disclaimer</span>
        </div>
        <div className="text-xs text-zinc-300 leading-relaxed space-y-2 font-sans">
          <p>
            <strong>IMPORTANT NOTICE:</strong> The nutritional calculations, estimated caloric targets, macronutrient distributions, and sample meal structures provided by AXIO are for general fitness and athletic conditioning guidance only.
          </p>
          <p>
            This information is <strong>not medical advice</strong>, clinical diagnosis, or medical nutrition therapy. Nutritional needs vary based on individual health history and genetics. Always consult a licensed healthcare professional, physician, or registered dietitian before making significant changes to your diet or supplementation.
          </p>
        </div>
      </div>
    </div>
  );
};
