/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness & Human Performance Platform
 * Assistant Action Registry — Typed, Validated Action & Navigation Intent Engine
 */

import { PageId } from '../types/app.ts';
import {
  AssistantLanguage,
  DetectedLanguage,
  detectMessageLanguage,
  isTeluguScript,
  isTenglish,
  parseTeluguCommandIntent,
  isMultilingualConfirmation,
  isMultilingualCancellation,
  getLocalizedActionStrings,
} from './multilingualAssistant.ts';

export type AssistantActionType =
  | 'navigate'
  | 'go_back'
  | 'start_workout'
  | 'show_workout_plan'
  | 'finish_workout'
  | 'show_completed_exercises'
  | 'create_nutrition_plan'
  | 'open_nutrition_plan'
  | 'mark_breakfast_completed'
  | 'mark_all_nutrition_completed'
  | 'show_progress'
  | 'show_workout_history'
  | 'workout_reminder'
  | 'ambiguous'
  | 'confirmation'
  | 'cancellation'
  | 'question'
  | 'unsupported';

export interface NavigationTarget {
  pageId: PageId;
  label: string;
  description: string;
  aliases: string[];
}

export interface AssistantActionResult {
  type: AssistantActionType;
  targetPageId?: PageId;
  targetLabel?: string;
  actionText: string;
  feedbackSpeech: string;
  isNavigation: boolean;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  clarificationQuestion?: string;
  suggestedFollowUps?: string[];
  detectedLanguage?: DetectedLanguage;
  effectiveLanguage?: 'en' | 'te';
}

/**
 * Validated Page Targets corresponding strictly to existing AXIO views
 */
export const VALIDATED_PAGES: Record<PageId, NavigationTarget> = {
  dashboard: {
    pageId: 'dashboard',
    label: 'Dashboard',
    description: 'Athlete overview and training performance metrics',
    aliases: ['dashboard', 'home', 'overview', 'main page', 'main dashboard'],
  },
  'ai-coach': {
    pageId: 'ai-coach',
    label: 'AI Coach',
    description: 'Voice & text fitness coach powered by Google Gemini',
    aliases: ['ai coach', 'coach', 'fitness coach', 'voice coach', 'virtual coach'],
  },
  workout: {
    pageId: 'workout',
    label: 'Workout',
    description: 'Active workout protocols, tracking, and exercises',
    aliases: ['workout', 'workout plan', 'training', 'training plan', 'workouts', 'my workout'],
  },
  'live-form': {
    pageId: 'live-form',
    label: 'AI Camera',
    description: 'Real-time computer vision pose feedback',
    aliases: ['ai camera', 'camera', 'ai cam', 'aicam', 'live form', 'live camera', 'form coach', 'pose camera', 'cam'],
  },
  recovery: {
    pageId: 'recovery',
    label: 'Recovery',
    description: 'Readiness check-ins and recovery metrics',
    aliases: ['recovery', 'recovery page', 'rest', 'readiness', 'recovery check in', 'daily recovery'],
  },
  exercises: {
    pageId: 'exercises',
    label: 'Exercises',
    description: 'Exercise movement library and kinematics',
    aliases: ['exercises', 'exercise library', 'movement library', 'exercise database', 'exercise list'],
  },
  nutrition: {
    pageId: 'nutrition',
    label: 'Nutrition',
    description: 'Macronutrient tracking, diet, and meal plans',
    aliases: ['nutrition', 'nutrition plan', 'diet', 'meal plan', 'food', 'meals', 'nutrition tracker', 'macro tracker'],
  },
  progress: {
    pageId: 'progress',
    label: 'Progress',
    description: 'Performance analytics and history',
    aliases: ['progress', 'progress tracker', 'analytics', 'performance history', 'my progress', 'stats', 'statistics'],
  },
  achievements: {
    pageId: 'achievements',
    label: 'Achievements',
    description: 'Milestones, badges, and records',
    aliases: ['achievements', 'badges', 'milestones', 'trophies', 'awards', 'records', 'personal records'],
  },
  profile: {
    pageId: 'profile',
    label: 'Profile',
    description: 'Athlete settings and biometric profile',
    aliases: ['profile', 'settings', 'account', 'athlete profile', 'my profile', 'biometrics'],
  },
};

/**
 * Checks if the text looks like an informational or coaching question
 * rather than an action or navigation imperative.
 */
function isInformationalQuestion(raw: string): boolean {
  const lower = raw.toLowerCase().trim();

  // If asking specifically about workout plan, completed exercises, nutrition plan, or workout history,
  // it is an application data action query, NOT a general informational coaching question.
  const appDataQueries = [
    'workout plan',
    'completed exercise',
    'completed exercises',
    'nutrition plan',
    'workout history',
    'training history',
    'my progress',
  ];
  for (const q of appDataQueries) {
    if (lower.includes(q)) {
      return false;
    }
  }

  // If starts with direct action imperatives, it is NOT an informational question
  const actionImperatives = [
    'start',
    'finish',
    'create',
    'open',
    'show',
    'mark',
    'take me to',
    'go to',
    'navigate to',
    'switch to',
    'view',
    'log',
    'check off',
    'lets',
    "let's",
  ];
  for (const imperative of actionImperatives) {
    if (lower.startsWith(imperative)) {
      return false;
    }
  }

  // Common question patterns
  const questionStarters = [
    'what is',
    'what are',
    'what does',
    'how to',
    'how do',
    'how does',
    'how many',
    'how much',
    'how can',
    'why is',
    'why does',
    'why do',
    'can you explain',
    'tell me about',
    'explain',
    'define',
    'who is',
    'when should',
    'which is',
  ];

  for (const starter of questionStarters) {
    if (lower.startsWith(starter) || lower.includes(` ${starter} `)) {
      return true;
    }
  }

  // Ending with a question mark without any action keywords
  if (lower.endsWith('?')) {
    const hasActionWord = [
      'start',
      'finish',
      'create',
      'open',
      'show',
      'mark',
      'take me',
      'navigate',
      'go to',
      'completed exercises',
      'workout plan',
      'nutrition plan',
      'workout history',
    ].some((w) => lower.includes(w));
    if (!hasActionWord) {
      return true;
    }
  }

  return false;
}

/**
 * Normalizes input string by stripping punctuation and leading/trailing filler words.
 * Strips apostrophes (so "today's" -> "todays", "let's" -> "lets") for uniform matching.
 */
export function cleanCommandText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects ambiguous keywords that could refer to multiple distinct actions
 */
function detectAmbiguousCommand(cleaned: string): AssistantActionResult | null {
  // 1. Bare "workout"
  if (cleaned === 'workout' || cleaned === 'my workout' || cleaned === 'the workout') {
    return {
      type: 'ambiguous',
      actionText: 'Ambiguous request: "Workout"',
      feedbackSpeech: 'Did you want to start your workout, show your workout plan, or open the workout page?',
      clarificationQuestion: 'Did you want to start your workout, show your workout plan, or open the workout page?',
      suggestedFollowUps: ['Start my workout', 'Show my workout plan', 'Open workout'],
      isNavigation: false,
    };
  }

  // 2. Bare "nutrition"
  if (cleaned === 'nutrition' || cleaned === 'my nutrition' || cleaned === 'food') {
    return {
      type: 'ambiguous',
      actionText: 'Ambiguous request: "Nutrition"',
      feedbackSpeech: 'Did you want to open your nutrition plan, create a new nutrition plan, or mark a meal completed?',
      clarificationQuestion: 'Did you want to open your nutrition plan, create a new nutrition plan, or mark a meal completed?',
      suggestedFollowUps: ['Open my nutrition plan', 'Create my nutrition plan', 'Mark breakfast as completed'],
      isNavigation: false,
    };
  }

  // 3. Bare "plan"
  if (cleaned === 'plan' || cleaned === 'my plan' || cleaned === 'show plan') {
    return {
      type: 'ambiguous',
      actionText: 'Ambiguous request: "Plan"',
      feedbackSpeech: 'Did you mean your workout plan or your nutrition plan?',
      clarificationQuestion: 'Did you mean your workout plan or your nutrition plan?',
      suggestedFollowUps: ['Show my workout plan', 'Open my nutrition plan'],
      isNavigation: false,
    };
  }

  // 4. Bare "finish"
  if (cleaned === 'finish' || cleaned === 'end' || cleaned === 'stop') {
    return {
      type: 'ambiguous',
      actionText: 'Ambiguous request: "Finish"',
      feedbackSpeech: 'Did you mean to finish your active workout session?',
      clarificationQuestion: 'Did you mean to finish your active workout session?',
      suggestedFollowUps: ['Finish my workout', 'Cancel'],
      isNavigation: false,
    };
  }

  // 5. Bare "complete"
  if (cleaned === 'complete' || cleaned === 'mark complete') {
    return {
      type: 'ambiguous',
      actionText: 'Ambiguous request: "Complete"',
      feedbackSpeech: 'Did you mean to finish your workout session, or mark your nutrition plan as completed?',
      clarificationQuestion: 'Did you mean to finish your workout session, or mark your nutrition plan as completed?',
      suggestedFollowUps: ['Finish my workout', "Mark today's nutrition plan as completed", 'Mark breakfast as completed'],
      isNavigation: false,
    };
  }

  // 6. Bare "history"
  if (cleaned === 'history' || cleaned === 'my history') {
    return {
      type: 'ambiguous',
      actionText: 'Ambiguous request: "History"',
      feedbackSpeech: 'Did you mean your workout history or your recovery history?',
      clarificationQuestion: 'Did you mean your workout history or your recovery history?',
      suggestedFollowUps: ['Show my workout history', 'Open recovery'],
      isNavigation: false,
    };
  }

  return null;
}

/**
 * Parses user command into a deterministic, validated action
 */
export function parseAssistantCommand(
  rawCommand: string,
  hasPendingConfirmation: boolean = false,
  languagePreference: AssistantLanguage = 'auto'
): AssistantActionResult {
  const trimmed = rawCommand.trim();
  const langResult = detectMessageLanguage(trimmed, languagePreference);
  const detectedLanguage = langResult.detectedLanguage;
  const effectiveLanguage = langResult.effectiveLanguage;

  if (!trimmed) {
    return {
      type: 'unsupported',
      actionText: effectiveLanguage === 'te' ? 'కమాండ్ అందలేదు.' : 'No command received.',
      feedbackSpeech:
        effectiveLanguage === 'te'
          ? 'దయచేసి వాయిస్ లేదా టైప్ చేసిన కమాండ్ ఇవ్వండి.'
          : 'Please provide a voice or typed command.',
      isNavigation: false,
      detectedLanguage,
      effectiveLanguage,
    };
  }

  const cleaned = cleanCommandText(trimmed);

  // 1. Pending confirmation handling (if assistant is currently awaiting user confirmation)
  if (hasPendingConfirmation) {
    if (isMultilingualConfirmation(trimmed)) {
      return {
        type: 'confirmation',
        actionText:
          effectiveLanguage === 'te'
            ? 'వినియోగదారు చర్యను నిర్ధారించారు.'
            : 'Action confirmed by user.',
        feedbackSpeech:
          effectiveLanguage === 'te'
            ? 'నిర్ధారించబడింది. చర్య అమలు చేయబడుతోంది.'
            : 'Confirmed. Executing action.',
        isNavigation: false,
        detectedLanguage,
        effectiveLanguage,
      };
    }

    if (isMultilingualCancellation(trimmed)) {
      return {
        type: 'cancellation',
        actionText:
          effectiveLanguage === 'te'
            ? 'చర్య రద్దు చేయబడింది.'
            : 'Action cancelled by user.',
        feedbackSpeech:
          effectiveLanguage === 'te'
            ? 'రద్దు చేయబడింది. ఎటువంటి మార్పులు చేయలేదు.'
            : 'Action cancelled.',
        isNavigation: false,
        detectedLanguage,
        effectiveLanguage,
      };
    }
  }

  // 2. Check Telugu script and Tenglish command intents (only when input is Telugu script or Tenglish)
  if (isTeluguScript(trimmed) || isTenglish(trimmed)) {
    const teluguIntent = parseTeluguCommandIntent(trimmed);
    if (teluguIntent) {
      if (teluguIntent.type === 'navigate' && teluguIntent.targetPageId) {
        const strings = getLocalizedActionStrings(
          'navigate',
          { targetLabel: teluguIntent.targetLabel },
          effectiveLanguage
        );
        return {
          type: 'navigate',
          targetPageId: teluguIntent.targetPageId,
          targetLabel: teluguIntent.targetLabel,
          actionText: strings.statusMessage,
          feedbackSpeech: strings.spokenMessage,
          isNavigation: true,
          detectedLanguage,
          effectiveLanguage,
        };
      }

      if (teluguIntent.type === 'finish_workout') {
        const strings = getLocalizedActionStrings(
          'finish_workout',
          { isConfirmation: true },
          effectiveLanguage
        );
        return {
          type: 'finish_workout',
          actionText: strings.statusMessage,
          feedbackSpeech: strings.spokenMessage,
          isNavigation: false,
          requiresConfirmation: true,
          confirmationPrompt:
            effectiveLanguage === 'te'
              ? 'మీరు మీ యాక్టివ్ వర్కౌట్ సెషన్‌ను ఇప్పుడే ముగించాలనుకుంటున్నారా? ప్రస్తుత సెట్లు మీ శిక్షణ చరిత్రలో భద్రపరచబడతాయి.'
              : 'Are you sure you want to finish your active workout session now? Current sets and training load will be saved to your history.',
          detectedLanguage,
          effectiveLanguage,
        };
      }

      if (teluguIntent.type === 'mark_all_nutrition_completed') {
        const strings = getLocalizedActionStrings(
          'mark_all_nutrition_completed',
          { isConfirmation: true },
          effectiveLanguage
        );
        return {
          type: 'mark_all_nutrition_completed',
          actionText: strings.statusMessage,
          feedbackSpeech: strings.spokenMessage,
          isNavigation: false,
          requiresConfirmation: true,
          confirmationPrompt:
            effectiveLanguage === 'te'
              ? 'ఈరోజు న్యూట్రిషన్ ప్లాన్‌లోని అన్ని భోజనాలను పూర్తయినట్లు మార్క్ చేయాలనుకుంటున్నారా?'
              : 'Are you sure you want to mark all meals in today\'s nutrition plan as completed? All scheduled meals will be logged.',
          detectedLanguage,
          effectiveLanguage,
        };
      }

      const strings = getLocalizedActionStrings(teluguIntent.type, {}, effectiveLanguage);
      const isNav =
        teluguIntent.type === 'start_workout' ||
        teluguIntent.type === 'show_workout_plan' ||
        teluguIntent.type === 'create_nutrition_plan' ||
        teluguIntent.type === 'open_nutrition_plan' ||
        teluguIntent.type === 'show_progress' ||
        teluguIntent.type === 'show_workout_history' ||
        teluguIntent.type === 'go_back';

      return {
        type: teluguIntent.type,
        actionText: strings.statusMessage,
        feedbackSpeech: strings.spokenMessage,
        isNavigation: isNav,
        detectedLanguage,
        effectiveLanguage,
      };
    }
  }

  // 3. Guard against ordinary questions (e.g., "What is protein?")
  if (isInformationalQuestion(trimmed)) {
    return {
      type: 'question',
      actionText: `Question detected: "${trimmed}".`,
      feedbackSpeech: `That's an informational fitness question. You can ask the AI Coach directly by saying "Open AI Coach", or say a supported command like "Start my workout" or "Open nutrition".`,
      isNavigation: false,
    };
  }

  // 3. Ambiguity check
  const ambiguous = detectAmbiguousCommand(cleaned);
  if (ambiguous) {
    return ambiguous;
  }

  // 4. WORKOUT ACTIONS

  // 4.1. "Start my workout."
  const startWorkoutPatterns = [
    'start my workout',
    'start workout',
    'start the workout',
    'begin my workout',
    'begin workout',
    'begin the workout',
    'start training',
    'start my training',
    'launch workout',
    'launch my workout',
    'lets work out',
    "let's work out",
    'lets start workout',
    "let's start workout",
    'start todays workout',
    "start today's workout",
    'commence workout',
  ];
  if (startWorkoutPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'start_workout',
      targetPageId: 'workout',
      targetLabel: 'Workout',
      actionText: 'Starting workout session',
      feedbackSpeech: 'Starting your workout session. Loading active protocol.',
      isNavigation: true,
    };
  }

  // 4.2. "Show my workout plan."
  const showWorkoutPlanPatterns = [
    'show my workout plan',
    'show workout plan',
    'show the workout plan',
    'give me today\'s workout plan',
    'give me todays workout plan',
    'give me my workout plan',
    'give me workout plan',
    'give me the workout plan',
    'tell me today\'s workout plan',
    'tell me todays workout plan',
    'tell me my workout plan',
    'tell me the workout plan',
    'view my workout plan',
    'view workout plan',
    'view the workout plan',
    'what is my workout plan',
    'what is the workout plan',
    'what is todays workout plan',
    "what is today's workout plan",
    "what's today's workout plan",
    "whats todays workout plan",
    'show todays workout plan',
    "show today's workout plan",
    'display my workout plan',
    'display workout plan',
    'see my workout plan',
    'see workout plan',
    'my workout plan',
    'todays workout plan',
    "today's workout plan",
  ];
  if (showWorkoutPlanPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    const strings = getLocalizedActionStrings('show_workout_plan', {}, effectiveLanguage);
    return {
      type: 'show_workout_plan',
      targetPageId: 'workout',
      targetLabel: 'Workout',
      actionText: effectiveLanguage === 'te' ? strings.statusMessage : 'Showing workout plan',
      feedbackSpeech: effectiveLanguage === 'te' ? strings.spokenMessage : 'Displaying your current workout plan.',
      isNavigation: true,
      detectedLanguage,
      effectiveLanguage,
    };
  }

  // 4.2b. "Workout reminder"
  const workoutReminderPatterns = [
    'workout reminder',
    'set workout reminder',
    'set a workout reminder',
    'remind me to workout',
    'remind me to workout tomorrow',
    'i want a workout reminder tomorrow',
    'i need a workout reminder tomorrow',
    'workout reminder tomorrow',
    'tomorrow workout reminder',
    'schedule workout reminder',
    'schedule a workout reminder',
    'give me a workout reminder',
  ];
  if (
    workoutReminderPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`) ||
    /(?:set|create|schedule|add|give me|i want|i need|remind me).+(?:workout reminder|reminder to workout)/i.test(cleaned) ||
    /workout reminder/i.test(cleaned)
  ) {
    const strings = getLocalizedActionStrings('workout_reminder', {}, effectiveLanguage);
    return {
      type: 'workout_reminder',
      actionText: effectiveLanguage === 'te' ? strings.statusMessage : 'Workout reminder set for tomorrow.',
      feedbackSpeech: effectiveLanguage === 'te' ? strings.spokenMessage : 'Workout reminder scheduled for tomorrow. Stay ready to train!',
      isNavigation: false,
      detectedLanguage,
      effectiveLanguage,
    };
  }

  // 4.3. "Finish my workout." (Consequential: requires confirmation!)
  const finishWorkoutPatterns = [
    'finish my workout',
    'finish workout',
    'finish the workout',
    'end my workout',
    'end workout',
    'end the workout',
    'complete my workout',
    'complete workout',
    'complete the workout',
    'stop my workout',
    'stop workout',
    'finish training',
    'end training',
    'conclude workout',
    'wrap up workout',
    'finish session',
    'finish my session',
    'end session',
  ];
  if (finishWorkoutPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'finish_workout',
      targetPageId: 'workout',
      targetLabel: 'Workout',
      actionText: 'Finish workout session',
      feedbackSpeech: 'Are you sure you want to finish your workout session now?',
      isNavigation: false,
      requiresConfirmation: true,
      confirmationPrompt: 'Are you sure you want to finish your workout session? Current sets and training load will be saved to your history.',
    };
  }

  // 4.4. "Show today's completed exercises."
  const completedExercisesPatterns = [
    'show todays completed exercises',
    "show today's completed exercises",
    'show completed exercises',
    'show my completed exercises',
    'completed exercises',
    'todays completed exercises',
    "today's completed exercises",
    'what exercises did i complete today',
    'what exercises have i completed today',
    'what exercises have i completed',
    'what exercises did i do today',
    'exercises completed today',
    'show exercises completed today',
    'list completed exercises',
  ];
  if (completedExercisesPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'show_completed_exercises',
      actionText: "Showing today's completed exercises",
      feedbackSpeech: "Checking today's completed exercises.",
      isNavigation: false,
    };
  }

  // 5. NUTRITION ACTIONS

  // 5.1. "Create my nutrition plan."
  const createNutritionPlanPatterns = [
    'create my nutrition plan',
    'create nutrition plan',
    'create the nutrition plan',
    'create a nutrition plan',
    'generate my nutrition plan',
    'generate nutrition plan',
    'generate a nutrition plan',
    'build my nutrition plan',
    'build nutrition plan',
    'make my nutrition plan',
    'make a nutrition plan',
    'set up my nutrition plan',
    'setup my nutrition plan',
    'setup nutrition plan',
    'calibrate my nutrition plan',
    'calculate my nutrition plan',
  ];
  if (createNutritionPlanPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'create_nutrition_plan',
      targetPageId: 'nutrition',
      targetLabel: 'Nutrition',
      actionText: 'Creating nutrition plan',
      feedbackSpeech: 'Calibrating and creating your personalized nutrition plan.',
      isNavigation: true,
    };
  }

  // 5.2. "Open my nutrition plan."
  const openNutritionPlanPatterns = [
    'open my nutrition plan',
    'open nutrition plan',
    'open the nutrition plan',
    'view my nutrition plan',
    'view nutrition plan',
    'view the nutrition plan',
    'show my nutrition plan',
    'show nutrition plan',
    'show the nutrition plan',
    'display my nutrition plan',
    'display nutrition plan',
    'my nutrition plan',
    'todays nutrition plan',
    "today's nutrition plan",
  ];
  if (openNutritionPlanPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'open_nutrition_plan',
      targetPageId: 'nutrition',
      targetLabel: 'Nutrition',
      actionText: 'Opening nutrition plan',
      feedbackSpeech: 'Opening your nutrition plan.',
      isNavigation: true,
    };
  }

  // 5.3. "Mark breakfast as completed."
  const markBreakfastPatterns = [
    'mark breakfast as completed',
    'mark breakfast completed',
    'mark breakfast as done',
    'mark breakfast done',
    'complete breakfast',
    'log breakfast',
    'log my breakfast',
    'i ate breakfast',
    'check off breakfast',
    'mark my breakfast as completed',
    'mark my breakfast completed',
    'record breakfast',
    'finish breakfast',
  ];
  if (markBreakfastPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'mark_breakfast_completed',
      targetPageId: 'nutrition',
      targetLabel: 'Nutrition',
      actionText: 'Marking breakfast as completed',
      feedbackSpeech: 'Logging breakfast as completed.',
      isNavigation: false,
    };
  }

  // 5.4. "Mark today's nutrition plan as completed." (Consequential: requires confirmation!)
  const markAllNutritionPatterns = [
    'mark todays nutrition plan as completed',
    "mark today's nutrition plan as completed",
    'mark todays nutrition plan completed',
    "mark today's nutrition plan completed",
    'mark nutrition plan as completed',
    'mark nutrition plan completed',
    'complete todays nutrition plan',
    "complete today's nutrition plan",
    'complete nutrition plan',
    'mark all meals completed',
    'mark all meals as completed',
    'mark all meals done',
    'mark my nutrition plan as completed',
    'mark my nutrition plan completed',
    'complete all meals',
    'log all meals',
    'mark today nutrition completed',
  ];
  if (markAllNutritionPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'mark_all_nutrition_completed',
      targetPageId: 'nutrition',
      targetLabel: 'Nutrition',
      actionText: "Marking today's complete nutrition plan as completed",
      feedbackSpeech: "Are you sure you want to mark all meals in today's nutrition plan as completed?",
      isNavigation: false,
      requiresConfirmation: true,
      confirmationPrompt: "Are you sure you want to mark all meals in today's nutrition plan as completed? All scheduled meals will be recorded as logged.",
    };
  }

  // 6. PROGRESS ACTIONS

  // 6.1. "Show my workout history."
  const workoutHistoryPatterns = [
    'show my workout history',
    'show workout history',
    'show the workout history',
    'view my workout history',
    'view workout history',
    'show my training history',
    'show training history',
    'display workout history',
    'display my workout history',
    'open workout history',
    'past workouts',
    'my past workouts',
    'my workout history',
    'workout history',
    'session history',
    'previous workouts',
  ];
  if (workoutHistoryPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'show_workout_history',
      targetPageId: 'progress',
      targetLabel: 'Progress',
      actionText: 'Showing workout history',
      feedbackSpeech: 'Opening your workout session history.',
      isNavigation: true,
    };
  }

  // 6.2. "Show my progress."
  const progressPatterns = [
    'show my progress',
    'show progress',
    'show the progress',
    'open my progress',
    'open progress',
    'view my progress',
    'view progress',
    'display my progress',
    'display progress',
    'check my progress',
    'my progress',
    'show stats',
    'show my stats',
    'view stats',
  ];
  if (progressPatterns.some((p) => cleaned === p || cleaned.startsWith(`${p} `) || cleaned === `please ${p}`)) {
    return {
      type: 'show_progress',
      targetPageId: 'progress',
      targetLabel: 'Progress',
      actionText: 'Showing progress analytics',
      feedbackSpeech: 'Opening your progress analytics.',
      isNavigation: true,
    };
  }

  // 7. "Go back"
  const goBackTriggers = [
    'go back',
    'back',
    'return',
    'previous page',
    'navigate back',
    'take me back',
    'go to previous page',
    'step back',
  ];
  if (goBackTriggers.some((trigger) => cleaned === trigger || cleaned.startsWith(`${trigger} `))) {
    return {
      type: 'go_back',
      actionText: 'Navigating to previous page',
      feedbackSpeech: 'Navigating back to the previous page.',
      isNavigation: true,
    };
  }

  // 8. General navigation commands against validated page targets
  for (const [pageId, target] of Object.entries(VALIDATED_PAGES) as [PageId, NavigationTarget][]) {
    for (const alias of target.aliases) {
      const patterns = [
        `open ${alias}`,
        `open my ${alias}`,
        `open the ${alias}`,
        `take me to ${alias}`,
        `take me to my ${alias}`,
        `take me to the ${alias}`,
        `go to ${alias}`,
        `go to my ${alias}`,
        `go to the ${alias}`,
        `show ${alias}`,
        `show my ${alias}`,
        `show the ${alias}`,
        `view ${alias}`,
        `view my ${alias}`,
        `view the ${alias}`,
        `navigate to ${alias}`,
        `navigate to my ${alias}`,
        `navigate to the ${alias}`,
        `switch to ${alias}`,
        `switch to my ${alias}`,
        `launch ${alias}`,
      ];

      for (const pattern of patterns) {
        if (
          cleaned === pattern ||
          cleaned === `please ${pattern}` ||
          cleaned.startsWith(`${pattern} `) ||
          cleaned.endsWith(` ${pattern}`)
        ) {
          return {
            type: 'navigate',
            targetPageId: pageId,
            targetLabel: target.label,
            actionText: `Opening ${target.label}`,
            feedbackSpeech: `Navigating to ${target.label}.`,
            isNavigation: true,
          };
        }
      }
    }
  }

  // 9. If command is unrecognized / unsupported
  if (effectiveLanguage === 'te') {
    return {
      type: 'unsupported',
      actionText: `కమాండ్ గుర్తించబడలేదు: "${trimmed}"`,
      feedbackSpeech: `క్షమించండి, ఆ కమాండ్ గుర్తించబడలేదు. మద్దతు ఉన్న ఆదేశాలు: "వర్కౌట్ ప్రారంభించండి", "వర్కౌట్ ప్లాన్ చూపించండి", "న్యూట్రిషన్ ప్లాన్ తెరవండి", "ప్రోగ్రెస్ చూపించండి".`,
      isNavigation: false,
      suggestedFollowUps: [
        'వర్కౌట్ ప్రారంభించండి',
        'వర్కౌట్ ప్లాన్ చూపించండి',
        'న్యూట్రిషన్ ప్లాన్ తెరవండి',
        'నా ప్రోగ్రెస్ చూపించండి',
      ],
      detectedLanguage,
      effectiveLanguage,
    };
  }

  return {
    type: 'unsupported',
    actionText: `Command not recognized: "${trimmed}"`,
    feedbackSpeech: `I didn't recognize that command. Supported actions include: "Start my workout", "Show my workout plan", "Finish my workout", "Show today's completed exercises", "Create my nutrition plan", "Open my nutrition plan", "Mark breakfast as completed", "Show my progress", and "Show my workout history".`,
    isNavigation: false,
    suggestedFollowUps: [
      'Start my workout',
      'Show my workout plan',
      'Open my nutrition plan',
      'Show my progress',
      'Show my workout history',
    ],
    detectedLanguage,
    effectiveLanguage,
  };
}
