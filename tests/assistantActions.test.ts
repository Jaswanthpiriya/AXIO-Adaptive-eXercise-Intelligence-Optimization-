/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Personal AI Assistant — Action Registry & Execution Verification Tests
 */

import { parseAssistantCommand, cleanCommandText } from '../src/utils/assistantActionRegistry.ts';
import {
  calculateNutritionTargets,
  getMealsForDiet,
  markBreakfastCompleted,
  markAllMealsCompleted,
} from '../src/data/nutritionData.ts';
import {
  getCurrentWorkoutPlan,
  getTodayCompletedExercises,
  startWorkoutSession,
  finishWorkoutSession,
  isWorkoutActive,
} from '../src/utils/workoutStateManager.ts';
import { AthleteProfile, CompletedWorkoutSession } from '../src/types/app.ts';
import { INITIAL_ATHLETE } from '../src/data/mockData.ts';

// Mock localStorage and sessionStorage for headless test runner
class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Attach mocks to global
(global as any).localStorage = new MockStorage();
(global as any).sessionStorage = new MockStorage();
(global as any).window = {
  dispatchEvent: () => true,
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failed++;
  }
}

console.log('=== AXIO ASSISTANT ACTION REGISTRY VERIFICATION ===\n');

// 1. WORKOUT ACTIONS
console.log('Test 1: Workout Action Intent Parsing...');
const start1 = parseAssistantCommand('Start my workout');
assert(start1.type === 'start_workout', 'Start my workout parsed correctly');
const start2 = parseAssistantCommand("let's start workout");
assert(start2.type === 'start_workout', "let's start workout parsed correctly");

const plan1 = parseAssistantCommand('Show my workout plan');
assert(plan1.type === 'show_workout_plan', 'Show my workout plan parsed correctly');
const plan2 = parseAssistantCommand("what is today's workout plan?");
assert(plan2.type === 'show_workout_plan', "what is today's workout plan parsed correctly");

const finish1 = parseAssistantCommand('Finish my workout');
assert(finish1.type === 'finish_workout', 'Finish my workout parsed correctly');
assert(finish1.requiresConfirmation === true, 'Finish my workout requires confirmation');

const completedEx1 = parseAssistantCommand("Show today's completed exercises");
assert(completedEx1.type === 'show_completed_exercises', "Show today's completed exercises parsed correctly");

// 2. NUTRITION ACTIONS
console.log('\nTest 2: Nutrition Action Intent Parsing...');
const createNut1 = parseAssistantCommand('Create my nutrition plan');
assert(createNut1.type === 'create_nutrition_plan', 'Create my nutrition plan parsed correctly');
const createNut2 = parseAssistantCommand('generate nutrition plan');
assert(createNut2.type === 'create_nutrition_plan', 'generate nutrition plan parsed correctly');

const openNut1 = parseAssistantCommand('Open my nutrition plan');
assert(openNut1.type === 'open_nutrition_plan', 'Open my nutrition plan parsed correctly');

const markBfast1 = parseAssistantCommand('Mark breakfast as completed');
assert(markBfast1.type === 'mark_breakfast_completed', 'Mark breakfast as completed parsed correctly');
const markBfast2 = parseAssistantCommand('log breakfast');
assert(markBfast2.type === 'mark_breakfast_completed', 'log breakfast parsed correctly');

const markAllNut1 = parseAssistantCommand("Mark today's nutrition plan as completed");
assert(markAllNut1.type === 'mark_all_nutrition_completed', "Mark today's nutrition plan as completed parsed");
assert(markAllNut1.requiresConfirmation === true, 'Mark all nutrition requires confirmation');

// 3. PROGRESS ACTIONS
console.log('\nTest 3: Progress & History Parsing...');
const progress1 = parseAssistantCommand('Show my progress');
assert(progress1.type === 'show_progress', 'Show my progress parsed correctly');

const history1 = parseAssistantCommand('Show my workout history');
assert(history1.type === 'show_workout_history', 'Show my workout history parsed correctly');

// 4. AMBIGUOUS PHRASES & CLARIFICATION
console.log('\nTest 4: Ambiguity Detection & Clarification Prompts...');
const ambigWorkout = parseAssistantCommand('workout');
assert(ambigWorkout.type === 'ambiguous', 'Bare "workout" detected as ambiguous');
assert(Boolean(ambigWorkout.clarificationQuestion), 'Clarification question provided for "workout"');

const ambigNut = parseAssistantCommand('nutrition');
assert(ambigNut.type === 'ambiguous', 'Bare "nutrition" detected as ambiguous');

const ambigPlan = parseAssistantCommand('plan');
assert(ambigPlan.type === 'ambiguous', 'Bare "plan" detected as ambiguous');

const ambigFinish = parseAssistantCommand('finish');
assert(ambigFinish.type === 'ambiguous', 'Bare "finish" detected as ambiguous');

// 5. QUESTION GUARDS
console.log('\nTest 5: Informational Questions...');
const question1 = parseAssistantCommand('What is protein?');
assert(question1.type === 'question', '"What is protein?" detected as informational question');

const question2 = parseAssistantCommand('How many reps should I do for hypertrophy?');
assert(question2.type === 'question', '"How many reps..." detected as informational question');

// 6. CONFIRMATION RESPONSES
console.log('\nTest 6: Confirmation Responses...');
const confirm1 = parseAssistantCommand('yes', true);
assert(confirm1.type === 'confirmation', '"yes" parsed as confirmation when pending');

const cancel1 = parseAssistantCommand('cancel', true);
assert(cancel1.type === 'cancellation', '"cancel" parsed as cancellation when pending');

// 7. REAL DATA OPERATIONS
console.log('\nTest 7: Real Data Logic (No Fake Data)...');
const athlete: AthleteProfile = {
  ...INITIAL_ATHLETE,
  weightKg: 85,
  heightCm: 185,
  age: 28,
  activityLevel: 'Very Active',
  dietPreference: 'High Protein Omnivore',
};

const targets = calculateNutritionTargets(athlete);
assert(targets.targetCalories > 2000, `Calculated calories: ${targets.targetCalories}`);
assert(targets.targetProtein > 150, `Calculated protein: ${targets.targetProtein}`);

// Test breakfast logging
const bfastRes = markBreakfastCompleted(athlete);
assert(bfastRes.success === true, 'Breakfast marked completed');
const bfastResRepeat = markBreakfastCompleted(athlete);
assert(bfastResRepeat.alreadyCompleted === true, 'Subsequent breakfast mark detects already completed');

// Test today completed exercises with empty state
const emptyExercises = getTodayCompletedExercises([]);
assert(emptyExercises.length === 0, 'Empty exercise list returns 0 (no fake entries)');

// Test today completed exercises with real session
const sampleSession: CompletedWorkoutSession = {
  id: 'SESS-1',
  title: 'Morning Power',
  date: new Date().toLocaleDateString(),
  timestamp: Date.now(),
  durationSeconds: 1800,
  durationMinutes: 30,
  totalVolumeKg: 2400,
  setsCompleted: 6,
  totalSets: 6,
  exercisesCompleted: 2,
  totalExercises: 2,
  averageFormAccuracy: 92,
  peakPowerWatts: 380,
  loadAu: 220,
  goal: 'Strength',
  fitnessLevel: 'Intermediate',
  exercises: [
    {
      exerciseName: 'Barbell Back Squat',
      targetMuscles: 'Quadriceps, Glutes',
      difficulty: 'High Intensity',
      completed: true,
      sets: [
        { setNum: 1, weightKg: 100, reps: 5, completed: true },
        { setNum: 2, weightKg: 100, reps: 5, completed: true },
        { setNum: 3, weightKg: 100, reps: 5, completed: true },
      ],
    },
  ],
};

const realExercises = getTodayCompletedExercises([sampleSession]);
assert(realExercises.length === 1, `Found ${realExercises.length} completed exercise`);
assert(realExercises[0].name === 'Barbell Back Squat', 'Exercise name matches');
assert(realExercises[0].setsCount === 3, 'Sets count matches 3');

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
