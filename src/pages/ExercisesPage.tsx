/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Exercise Biomechanics & Movement Library
 * Powered by reusable exercise data from exerciseLibrary.ts
 */

import React, { useState, useMemo } from 'react';
import {
  EXERCISE_LIBRARY,
  EXERCISE_CATEGORIES,
  ExerciseCategory,
  ExerciseDifficulty,
  ExerciseEquipment,
  ExerciseDefinition,
} from '../data/exerciseLibrary.ts';
import { PageId } from '../types/app.ts';
import { Button } from '../design-system/components/Button.tsx';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Video,
  ChevronRight,
  BookOpen,
  Info,
  Layers,
  Activity,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface ExercisesPageProps {
  onNavigate?: (page: PageId) => void;
}

export const ExercisesPage: React.FC<ExercisesPageProps> = ({ onNavigate }) => {
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');

  // Difficulty filter
  const [selectedDifficulty, setSelectedDifficulty] = useState<ExerciseDifficulty | 'All'>('All');

  // Equipment filter
  const [selectedEquipment, setSelectedEquipment] = useState<ExerciseEquipment | 'All'>('All');

  // Selected exercise for detailed modal view
  const [activeModalExercise, setActiveModalExercise] = useState<ExerciseDefinition | null>(null);

  // Extract unique equipment list from library
  const equipmentOptions = useMemo(() => {
    const set = new Set<ExerciseEquipment>();
    EXERCISE_LIBRARY.forEach((e) => set.add(e.equipment));
    return ['All', ...Array.from(set)] as (ExerciseEquipment | 'All')[];
  }, []);

  // Filter exercises based on search, category, difficulty, equipment
  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter((exercise) => {
      // 1. Search Query (Name, Target muscles, Instructions keywords)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exercise.name.toLowerCase().includes(q) ||
        exercise.targetMuscles.primary.some((m) => m.toLowerCase().includes(q)) ||
        exercise.targetMuscles.secondary.some((m) => m.toLowerCase().includes(q)) ||
        exercise.equipment.toLowerCase().includes(q);

      // 2. Category
      const matchesCategory =
        selectedCategory === 'All' || exercise.category === selectedCategory;

      // 3. Difficulty
      const matchesDifficulty =
        selectedDifficulty === 'All' || exercise.difficulty === selectedDifficulty;

      // 4. Equipment
      const matchesEquipment =
        selectedEquipment === 'All' || exercise.equipment === selectedEquipment;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesEquipment;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedEquipment]);

  // Color code difficulty
  const getDifficultyColor = (diff: ExerciseDifficulty) => {
    switch (diff) {
      case 'Beginner':
        return 'text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/30';
      case 'Intermediate':
        return 'text-[#0066FF] bg-[#0066FF]/10 border-[#0066FF]/30';
      case 'Advanced':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'Elite':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSelectedEquipment('All');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedDifficulty !== 'All' ||
    selectedEquipment !== 'All';

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. TOP PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-normal text-[#0066FF]">
            <BookOpen className="w-4 h-4" />
            <span>Kinesiology &amp; Biomechanical Movement Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-white mt-1">
            Exercise Library
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-normal">
            Anatomical target muscles, step-by-step instructions, common movement faults, and pro coaching cues
          </p>
        </div>

        {/* Total Catalog Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-[#121318] border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2 font-sans text-xs">
            <Layers className="w-4 h-4 text-[#0066FF]" />
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block font-medium">EXERCISES INDEXED</span>
              <strong className="text-white font-medium">{EXERCISE_LIBRARY.length} Movements</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        {/* Row 1: Search Bar & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise name, primary muscle (e.g. Quadriceps, Lats, Chest)..."
              className="w-full bg-[#0B0B0D] border border-white/[0.08] rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/40 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] rounded p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Difficulty & Equipment Selectors */}
          <div className="flex items-center gap-2 font-sans text-xs">
            {/* Difficulty Selector */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="bg-[#0B0B0D] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/40 transition-all cursor-pointer"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Elite">Elite</option>
            </select>

            {/* Equipment Selector */}
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value as any)}
              className="bg-[#0B0B0D] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/40 transition-all cursor-pointer"
            >
              <option value="All">All Equipment</option>
              {equipmentOptions
                .filter((eq) => eq !== 'All')
                .map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-2 text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Tabs */}
        <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] font-sans text-zinc-400 uppercase tracking-normal font-medium">
            <span>Muscle Groups / Categories:</span>
            <span>{filteredExercises.length} Movements Found</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-sans scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                selectedCategory === 'All'
                  ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-sm shadow-[#0066FF]/20'
                  : 'bg-[#0B0B0D] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              All Categories ({EXERCISE_LIBRARY.length})
            </button>

            {EXERCISE_CATEGORIES.map((cat) => {
              const count = EXERCISE_LIBRARY.filter((e) => e.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                    isSelected
                      ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-sm shadow-[#0066FF]/20'
                      : 'bg-[#0B0B0D] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. EXERCISES GRID */}
      {filteredExercises.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#121318] border border-white/[0.08] text-center space-y-3">
          <Dumbbell className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Exercises Matched</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            No movements match your current search and filter combination. Try adjusting your query or resetting filters.
          </p>
          <Button size="sm" variant="secondary" onClick={handleClearFilters}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExercises.map((exercise) => {
            return (
              <div
                key={exercise.id}
                className="bg-[#121318] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 group shadow-sm hover:shadow-lg"
              >
                {/* Top Badge Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-sans uppercase font-semibold tracking-normal px-2 py-0.5 rounded bg-[#0B0B0D] border border-white/10 text-[#0066FF]">
                      {exercise.category.toUpperCase()}
                    </span>

                    <div className="flex items-center gap-1.5 font-sans text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded border uppercase font-semibold ${getDifficultyColor(
                          exercise.difficulty
                        )}`}
                      >
                        {exercise.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Exercise Name */}
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-[#0066FF] transition-colors leading-snug">
                      {exercise.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#6B7280] font-sans">
                      <span className="text-zinc-300">{exercise.equipment}</span>
                      {exercise.tempo && (
                        <>
                          <span>·</span>
                          <span>Tempo: <strong className="font-sans text-zinc-300 font-medium">{exercise.tempo}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Target Muscles */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-sans text-[#6B7280] uppercase font-semibold">
                      PRIMARY TARGET:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exercise.targetMuscles.primary.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#0B0B0D] border border-white/5 text-xs text-white font-medium"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Muscles */}
                  {exercise.targetMuscles.secondary.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-sans text-[#6B7280] uppercase font-medium">
                        Secondary:
                      </div>
                      <p className="text-xs text-[#6B7280] truncate font-sans">
                        {exercise.targetMuscles.secondary.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Pro Tip Snippet */}
                  {exercise.techniqueTips.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#0B0B0D] border border-white/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-sans text-[#00FF66] uppercase font-semibold">
                        <Sparkles className="w-3 h-3" />
                        <span>Coaching Cue</span>
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-sans">
                        "{exercise.techniqueTips[0]}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  {exercise.aiCamSupported ? (
                    <span className="text-[10px] font-sans text-[#0066FF] flex items-center gap-1 font-medium">
                      <Video className="w-3 h-3" />
                      <span>AI CAM Tracked</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-sans text-[#6B7280]">
                      Standard Movement
                    </span>
                  )}

                  <button
                    onClick={() => setActiveModalExercise(exercise)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#0066FF] text-white hover:text-white border border-white/10 hover:border-[#0066FF] text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. DETAILED BIOMECHANICS & INSTRUCTIONS MODAL */}
      {activeModalExercise && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0D]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121318] border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-sans uppercase font-semibold tracking-normal px-2 py-0.5 rounded bg-[#0B0B0D] border border-white/10 text-[#0066FF]">
                    {activeModalExercise.category.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-sans px-2 py-0.5 rounded border uppercase font-semibold ${getDifficultyColor(
                      activeModalExercise.difficulty
                    )}`}
                  >
                    {activeModalExercise.difficulty}
                  </span>
                  <span className="text-xs font-sans text-[#6B7280]">
                    · {activeModalExercise.equipment}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {activeModalExercise.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalExercise(null)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#6B7280] hover:text-white transition-colors shrink-0"
                aria-label="Close details modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Muscles Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0B0B0D] border border-white/5 space-y-2">
                <span className="text-[10px] font-sans text-[#6B7280] uppercase tracking-normal block font-semibold">
                  PRIMARY TARGET MUSCLES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalExercise.targetMuscles.primary.map((m, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#0066FF]/10 border border-[#0066FF]/30 text-white font-medium text-xs font-sans"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B0B0D] border border-white/5 space-y-2">
                <span className="text-[10px] font-sans text-[#6B7280] uppercase tracking-normal block font-semibold">
                  SECONDARY ASSISTING MUSCLES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalExercise.targetMuscles.secondary.map((m, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs font-sans"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white font-sans uppercase tracking-normal flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
                <span>Step-by-Step Execution</span>
              </h4>
              <ol className="space-y-2 font-sans text-xs text-zinc-300 leading-relaxed">
                {activeModalExercise.instructions.map((step, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-[#0B0B0D] border border-white/5 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/40 text-[#0066FF] font-sans font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Common Mistakes */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-amber-400 font-sans uppercase tracking-normal flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Common Biomechanical Faults to Avoid</span>
              </h4>
              <ul className="space-y-2 text-xs text-zinc-300 font-sans">
                {activeModalExercise.commonMistakes.map((mistake, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5"
                  >
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technique Tips & Coaching Cues */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#00FF66] font-sans uppercase tracking-normal flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00FF66]" />
                <span>Technique Tips &amp; Pro Coaching Cues</span>
              </h4>
              <ul className="space-y-2 text-xs text-zinc-300 font-sans">
                {activeModalExercise.techniqueTips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-[#00FF66]/5 border border-[#00FF66]/20 flex items-start gap-2.5"
                  >
                    <span className="text-[#00FF66] font-bold shrink-0 mt-0.5">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-sans text-[#6B7280]">
                {activeModalExercise.tempo && (
                  <span>Recommended Tempo: <strong className="font-sans text-zinc-300 font-medium">{activeModalExercise.tempo}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeModalExercise.aiCamSupported && onNavigate && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setActiveModalExercise(null);
                      onNavigate('live-form');
                    }}
                    iconLeft={<Video className="w-3.5 h-3.5" />}
                  >
                    Track in AI CAM
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setActiveModalExercise(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
