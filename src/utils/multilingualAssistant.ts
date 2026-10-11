/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness Platform — AXI Multilingual Assistant Engine
 * Comprehensive Multilingual Support: English, తెలుగు (Telugu script), and Tenglish (Romanized Telugu)
 */

import { PageId } from '../types/app.ts';
import { AssistantActionType } from './assistantActionRegistry.ts';

export type AssistantLanguage = 'en' | 'te' | 'auto';
export type DetectedLanguage = 'en' | 'te' | 'tenglish';

export interface LanguageDetectionResult {
  detectedLanguage: DetectedLanguage;
  effectiveLanguage: 'en' | 'te';
  confidence: number;
  matchedKeywords?: string[];
}

/**
 * Checks if a string contains Telugu script Unicode characters (U+0C00 - U+0C7F).
 */
export function isTeluguScript(text: string): boolean {
  if (!text) return false;
  return /[\u0C00-\u0C7F]/.test(text);
}

/**
 * Common Tenglish (Telugu written in Roman English alphabet) keywords, verbal suffixes,
 * and conversational stems commonly used in sports, fitness, and daily interactions.
 */
export const TENGLISH_PATTERNS = [
  // Action verbs & imperatives
  /\bchey(?:i|andi|aali|ali|oddu|aka)?\b/i,
  /\bcheyy(?:i|andi)?\b/i,
  /\bches(?:a|anu|amu|ara|ina|edhi)?\b/i,
  /\bchesuk(?:o|ondi|ovaali)\b/i,
  /\bchup(?:u|i|inchu|andi|iyyi|ivvu)\b/i,
  /\bchoop(?:u|i|inchu|andi|iyyi|ivvu)\b/i,
  /\baap(?:u|andi|ey|eyandi)\b/i,
  /\bmugin(?:chu|chandi)\b/i,
  /\bpoorthi\b/i,
  /\bshuru\b/i,
  /\bmodalu\b/i,
  /\bpett(?:u|andi)\b/i,
  /\bvell(?:u|andi|ali)\b/i,
  /\braa(?:ndi)?\b/i,
  /\btin(?:u|andi|naru|nanu)\b/i,
  /\bthinn(?:anu|ara)\b/i,
  /\bivv(?:u|andi)\b/i,
  /\btelus(?:uko|ukovali|indha)\b/i,
  /\bchepp(?:u|andi)\b/i,

  // Pronouns, markers & question words
  /\bnaa?\b/i,
  /\bmee(?:ru)?\b/i,
  /\bneenu?\b/i,
  /\bmanaki\b/i,
  /\beeroju\b/i,
  /\benti\b/i,
  /\bela(?:ga)?\b/i,
  /\bundi\b/i,
  /\bundaa\b/i,
  /\bundhi\b/i,
  /\beppudu\b/i,
  /\bekkada\b/i,
  /\benduku\b/i,
  /\bayi(?:ndi|poyindi|ndha)\b/i,
  /\bayp(?:o|oy)(?:indi|ndhi|a)?\b/i,
  /\bavunu\b/i,
  /\bvaddu\b/i,
  /\bvadhu\b/i,
  /\bledu\b/i,
  /\bledhu\b/i,
  /\bsare\b/i,
  /\bkadha\b/i,
  /\bandi\b/i,
  /\bvenakki\b/i,
  /\bvyayamam\b/i,
  /\bkasratu\b/i,
  /\baaharam\b/i,
  /\btindi\b/i,
  /\bnamaskaram\b/i,
  /\bbagunnara\b/i,
];

/**
 * Checks if a string contains Tenglish (Romanized Telugu).
 */
export function isTenglish(text: string): boolean {
  if (!text) return false;
  // If it's already Telugu script, it's Telugu, not Tenglish
  if (isTeluguScript(text)) return false;

  const lower = text.toLowerCase().trim();
  let matchCount = 0;

  for (const pattern of TENGLISH_PATTERNS) {
    if (pattern.test(lower)) {
      matchCount++;
      if (matchCount >= 1) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects the language of a user message and returns the effective processing language
 * based on user setting ('en', 'te', 'auto').
 */
export function detectMessageLanguage(
  text: string,
  preference: AssistantLanguage = 'auto'
): LanguageDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    const effective = preference === 'te' ? 'te' : 'en';
    return {
      detectedLanguage: effective === 'te' ? 'te' : 'en',
      effectiveLanguage: effective,
      confidence: 1.0,
    };
  }

  // 1. Explicit Telugu script detection
  if (isTeluguScript(trimmed)) {
    return {
      detectedLanguage: 'te',
      effectiveLanguage: 'te',
      confidence: 1.0,
    };
  }

  // 2. Tenglish (Romanized Telugu) detection
  if (isTenglish(trimmed)) {
    return {
      detectedLanguage: 'tenglish',
      effectiveLanguage: 'te', // Respond in Telugu when user speaks Tenglish
      confidence: 0.9,
    };
  }

  // 3. User preference override when preference is fixed to 'te'
  if (preference === 'te') {
    return {
      detectedLanguage: 'en',
      effectiveLanguage: 'te',
      confidence: 0.8,
    };
  }

  // 4. Default to English
  return {
    detectedLanguage: 'en',
    effectiveLanguage: 'en',
    confidence: 1.0,
  };
}

/**
 * Multilingual Affirmative (Confirmation) Triggers for Consequential Actions
 */
export function isMultilingualConfirmation(text: string): boolean {
  const clean = text.toLowerCase().trim();

  // Telugu script triggers
  const teluguScriptAffirmative = [
    'అవును',
    'సరే',
    'ఖచ్చితంగా',
    'చేయండి',
    'ముగించండి',
    'పూర్తి చేయండి',
    'నిర్ధారించండి',
    'అలాగే',
    'ఓకే',
  ];
  if (teluguScriptAffirmative.some((t) => clean.includes(t))) return true;

  // Tenglish triggers
  const tenglishAffirmative = [
    'avunu',
    'sare',
    'sarle',
    'alagay',
    'cheyandi',
    'cheyi',
    'muginchandi',
    'confirm cheyi',
    'finish cheyi',
    'finish cheyandi',
    'complete cheyandi',
  ];
  if (tenglishAffirmative.some((t) => clean === t || clean.startsWith(`${t} `) || clean.endsWith(` ${t}`))) {
    return true;
  }

  // English triggers
  const englishAffirmative = [
    'yes',
    'yep',
    'yeah',
    'confirm',
    'proceed',
    'do it',
    'finish it',
    'complete it',
    'yes please',
    'sure',
    'ok',
    'okay',
  ];
  return englishAffirmative.some((t) => clean === t || clean.startsWith(`${t} `));
}

/**
 * Multilingual Cancellation Triggers for Consequential Actions
 */
export function isMultilingualCancellation(text: string): boolean {
  const clean = text.toLowerCase().trim();

  // Telugu script triggers
  const teluguScriptNegative = [
    'వద్దు',
    'రద్దు చేయండి',
    'ఆపండి',
    'లేదు',
    'వద్దు ఆపండి',
    'రద్దు',
  ];
  if (teluguScriptNegative.some((t) => clean.includes(t))) return true;

  // Tenglish triggers
  const tenglishNegative = [
    'vaddu',
    'vadhu',
    'oddu',
    'ledu',
    'ledhu',
    'aapu',
    'aapandi',
    'aapeyandi',
    'cheyoddu',
    'cancel cheyi',
    'cancel cheyandi',
  ];
  if (tenglishNegative.some((t) => clean === t || clean.startsWith(`${t} `) || clean.endsWith(` ${t}`))) {
    return true;
  }

  // English triggers
  const englishNegative = [
    'no',
    'nope',
    'cancel',
    'abort',
    'stop',
    'nevermind',
    'never mind',
    'dont finish',
    "don't finish",
    'keep going',
  ];
  return englishNegative.some((t) => clean === t || clean.startsWith(`${t} `));
}

/**
 * Parses user input for Telugu script and Tenglish command intents.
 * Returns null if not recognized as a Telugu/Tenglish intent (falls back to standard parser).
 */
export function parseTeluguCommandIntent(
  rawCommand: string
): { type: AssistantActionType; targetPageId?: PageId; targetLabel?: string } | null {
  const clean = rawCommand.toLowerCase().trim();

  // 1. START WORKOUT
  if (
    // Telugu script
    clean.includes('వర్కౌట్ ప్రారంభించ') ||
    clean.includes('వర్కౌట్ మొదలు') ||
    clean.includes('వర్కౌట్ స్టార్ట్') ||
    clean.includes('వ్యాయామం మొదలు') ||
    clean.includes('ట్రైనింగ్ ప్రారంభించ') ||
    // Tenglish
    /workout (?:start|shuru|modalu)/i.test(clean) ||
    /(?:start|modalu).+workout/i.test(clean) ||
    /naa? workout start/i.test(clean) ||
    /training start chey/i.test(clean) ||
    /kasratu start/i.test(clean)
  ) {
    return { type: 'start_workout' };
  }

  // 2. SHOW WORKOUT PLAN
  if (
    // Telugu script
    clean.includes('వర్కౌట్ ప్లాన్ చూపించ') ||
    clean.includes('వర్కౌట్ ప్లాన్ చెప్పు') ||
    clean.includes('వర్కౌట్ ప్లాన్ చెప్పండి') ||
    clean.includes('వర్కౌట్ ప్రణాళిక') ||
    clean.includes('వర్కౌట్ ప్లాన్ ఏంటి') ||
    clean.includes('నా వర్కౌట్ ప్లాన్ చెప్పు') ||
    clean.includes('ఈరోజు నా వర్కౌట్ ప్లాన్ చెప్పు') ||
    (clean.includes('వర్కౌట్ ప్లాన్') && (clean.includes('చెప్పు') || clean.includes('చెప్పండి') || clean.includes('ఇవ్వు'))) ||
    // Tenglish
    /workout plan (?:chup|choop|cheppu|cheppandi|teliyacheyi|ivvu)/i.test(clean) ||
    /plan (?:chup|choop|cheppu|cheppandi)/i.test(clean) ||
    /eeroju workout plan/i.test(clean) ||
    /ivala workout plan/i.test(clean) ||
    /ivvala workout plan/i.test(clean) ||
    /naaku ivala workout plan/i.test(clean) ||
    /naaku eeroju workout plan/i.test(clean) ||
    /naa? workout plan/i.test(clean)
  ) {
    return { type: 'show_workout_plan' };
  }

  // 3. FINISH WORKOUT
  if (
    // Telugu script
    clean.includes('వర్కౌట్ ముగించ') ||
    clean.includes('వర్కౌట్ ఆప') ||
    clean.includes('వర్కౌట్ పూర్తి చేయ') ||
    clean.includes('వర్కౌట్ ఫినిష్') ||
    // Tenglish
    /workout (?:finish|muginchu|muginchandi|complete|aapandi|aapeyandi|aapu)/i.test(clean) ||
    /(?:finish|complete).+workout/i.test(clean)
  ) {
    return { type: 'finish_workout' };
  }

  // 4. SHOW COMPLETED EXERCISES
  if (
    // Telugu script
    clean.includes('పూర్తి చేసిన వ్యాయామ') ||
    clean.includes('చేసిన ఎక్సర్‌సైజు') ||
    clean.includes('చేసిన వ్యాయామ') ||
    // Tenglish
    /completed exercises (?:chup|choop)/i.test(clean) ||
    /chesina exercises (?:chup|choop)/i.test(clean) ||
    /eeroju chesina/i.test(clean)
  ) {
    return { type: 'show_completed_exercises' };
  }

  // 5. CREATE NUTRITION PLAN
  if (
    // Telugu script
    clean.includes('న్యూట్రిషన్ ప్లాన్ రూపొందించ') ||
    clean.includes('న్యూట్రిషన్ ప్లాన్ తయారు') ||
    clean.includes('డైట్ ప్లాన్ క్రియేట్') ||
    clean.includes('పోషకాహార ప్రణాళిక రూపొందించ') ||
    // Tenglish
    /nutrition plan (?:create|tayaru|chesuk)/i.test(clean) ||
    /diet plan (?:create|tayaru)/i.test(clean)
  ) {
    return { type: 'create_nutrition_plan' };
  }

  // 6. OPEN NUTRITION PLAN
  if (
    // Telugu script
    clean.includes('న్యూట్రిషన్ ప్లాన్ తెరవ') ||
    clean.includes('న్యూట్రిషన్ ప్లాన్ చూపించ') ||
    clean.includes('డైట్ ప్లాన్ ఓపెన్') ||
    clean.includes('ఆహార ప్రణాళిక') ||
    // Tenglish
    /nutrition plan (?:open|chup|choop)/i.test(clean) ||
    /diet plan (?:open|chup|choop)/i.test(clean) ||
    /nutrition (?:chup|choop|open)/i.test(clean)
  ) {
    return { type: 'open_nutrition_plan' };
  }

  // 7. MARK BREAKFAST COMPLETED
  if (
    // Telugu script
    clean.includes('అల్పాహారం పూర్తయి') ||
    clean.includes('బ్రేక్‌ఫాస్ట్ పూర్తయి') ||
    clean.includes('టిఫిన్ చేశా') ||
    clean.includes('బ్రేక్‌ఫాస్ట్ మార్క్') ||
    // Tenglish
    /breakfast (?:mark|complete|aypoindi|ayindi|chesa|chesanu)/i.test(clean) ||
    /tiffin (?:chesa|chesanu|ayindi)/i.test(clean)
  ) {
    return { type: 'mark_breakfast_completed' };
  }

  // 8. MARK ALL NUTRITION COMPLETED
  if (
    // Telugu script
    clean.includes('అన్ని భోజనాలు పూర్త') ||
    clean.includes('మొత్తం డైట్ ప్లాన్ పూర్తి') ||
    clean.includes('న్యూట్రిషన్ ప్లాన్ పూర్తయినట్లు మార్క్') ||
    // Tenglish
    /(?:all meals|motham meals|complete nutrition|motham food)/i.test(clean) &&
    /(?:complete|poorthi|mark|finish)/i.test(clean)
  ) {
    return { type: 'mark_all_nutrition_completed' };
  }

  // 9. SHOW PROGRESS
  if (
    // Telugu script
    clean.includes('ప్రోగ్రెస్ చూపించ') ||
    clean.includes('ప్రోగ్రెస్ తెరవ') ||
    clean.includes('పురోగతి చూపించ') ||
    clean.includes('స్టాట్స్ చూపించ') ||
    clean.includes('ప్రోగ్రెస్ ఎలా ఉంది') ||
    clean.includes('పురోగతి ఎలా ఉంది') ||
    clean.includes('నా ప్రోగ్రెస్') ||
    // Tenglish
    /progress (?:chup|choop|open)/i.test(clean) ||
    /naa? progress/i.test(clean) ||
    /progress ela und/i.test(clean) ||
    /stats (?:chup|choop)/i.test(clean)
  ) {
    return { type: 'show_progress' };
  }

  // 10. SHOW WORKOUT HISTORY
  if (
    // Telugu script
    clean.includes('వర్కౌట్ హిస్టరీ') ||
    clean.includes('హిస్టరీ చూపించ') ||
    clean.includes('గత వర్కౌట్') ||
    clean.includes('ట్రైనింగ్ హిస్టరీ') ||
    // Tenglish
    /(?:workout|training)? ?history (?:chup|choop|open)/i.test(clean) ||
    /naa? workout history/i.test(clean)
  ) {
    return { type: 'show_workout_history' };
  }

  // 10b. WORKOUT REMINDER
  if (
    // Telugu script & mixed
    (clean.includes('రిమైండర్') || clean.includes('గుర్తుచేయ') || clean.includes('గుర్తు చేయ') || clean.includes('నోటిఫికేషన్')) ||
    clean.includes('workout reminder') ||
    clean.includes('రిమైండర్ కావాలి') ||
    clean.includes('వర్కౌట్ రిమైండర్') ||
    // Tenglish
    /(?:workout|training) reminder/i.test(clean) ||
    /reminder (?:kavali|kaavali|pettu|pettandi|set chey|set cheyandi)/i.test(clean) ||
    /(?:repu|tomorrow).+reminder/i.test(clean)
  ) {
    return { type: 'workout_reminder' };
  }

  // 11. GO BACK
  if (
    // Telugu script
    clean.includes('వెనక్కి వెళ్ళ') ||
    clean.includes('వెనుకకు') ||
    clean === 'వెనక్కి' ||
    clean.includes('మునుపటి పేజీ') ||
    // Tenglish
    /venakki (?:vellu|vellandi)?/i.test(clean) ||
    /back (?:vellu|vellandi|ki vellu)/i.test(clean) ||
    /previous page/i.test(clean)
  ) {
    return { type: 'go_back' };
  }

  // 12. NAVIGATION TO SPECIFIC PAGES
  const pageNavMap: { keywords: string[]; pageId: PageId; label: string }[] = [
    {
      keywords: [
        'డ్యాష్‌బోర్డ్',
        'dashboard',
        'హోమ్',
        'home page',
      ],
      pageId: 'dashboard',
      label: 'Dashboard',
    },
    {
      keywords: [
        'ai కోచ్',
        'కోచ్',
        'ai coach',
        'coach tho matladali',
      ],
      pageId: 'ai-coach',
      label: 'AI Coach',
    },
    {
      keywords: [
        'ai కెమెరా',
        'కెమెరా',
        'ai camera',
        'ai cam',
        'camera open',
        'live form',
      ],
      pageId: 'live-form',
      label: 'AI Camera',
    },
    {
      keywords: [
        'రికవరీ',
        'recovery',
        'rest page',
      ],
      pageId: 'recovery',
      label: 'Recovery',
    },
    {
      keywords: [
        'వ్యాయామాలు',
        'exercises',
        'exercise library',
      ],
      pageId: 'exercises',
      label: 'Exercises',
    },
    {
      keywords: [
        'న్యూట్రిషన్',
        'ఆహారం',
        'nutrition',
        'diet',
      ],
      pageId: 'nutrition',
      label: 'Nutrition',
    },
    {
      keywords: [
        'ప్రోగ్రెస్',
        'పురోగతి',
        'progress',
      ],
      pageId: 'progress',
      label: 'Progress',
    },
    {
      keywords: [
        'విజయాలు',
        'బాడ్జీలు',
        'achievements',
        'badges',
      ],
      pageId: 'achievements',
      label: 'Achievements',
    },
    {
      keywords: [
        'ప్రొఫైల్',
        'సెట్టింగులు',
        'profile',
        'settings',
      ],
      pageId: 'profile',
      label: 'Profile',
    },
  ];

  for (const item of pageNavMap) {
    for (const kw of item.keywords) {
      if (
        clean.includes(kw) &&
        (clean.includes('తెరవ') ||
          clean.includes('ఓపెన్') ||
          clean.includes('వెళ్ళ') ||
          clean.includes('open') ||
          clean.includes('vellu') ||
          clean.includes('chup'))
      ) {
        return {
          type: 'navigate',
          targetPageId: item.pageId,
          targetLabel: item.label,
        };
      }
    }
  }

  // 13. INFORMATIONAL QUESTION DETECTION IN TELUGU / TENGLISH
  if (
    clean.endsWith('?') ||
    clean.includes('ఎలా') ||
    clean.includes('ఏంటి') ||
    clean.includes('ఎందుకు') ||
    clean.includes('ఎన్ని') ||
    clean.includes('ela ') ||
    clean.includes('enti') ||
    clean.includes('enduku') ||
    clean.includes('cheppandi')
  ) {
    return { type: 'question' };
  }

  return null;
}

/**
 * Localized Action Outcomes for Telugu ('te') vs English ('en')
 */
export interface ActionOutcomeStrings {
  actionBadge: string;
  statusMessage: string;
  spokenMessage: string;
}

export function getLocalizedActionStrings(
  actionType: AssistantActionType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, any>,
  lang: 'en' | 'te'
): ActionOutcomeStrings {
  if (lang === 'en') {
    return {
      actionBadge: details.actionBadge || 'Action Executed',
      statusMessage: details.statusMessage || 'Action completed successfully.',
      spokenMessage: details.spokenMessage || 'Action completed.',
    };
  }

  // TELUGU LOCALIZATION (Native, natural Telugu)
  switch (actionType) {
    case 'start_workout': {
      const title = details.title || 'వర్కౌట్ సెషన్';
      const duration = details.duration || 30;
      const count = details.exercisesCount || 0;
      return {
        actionBadge: 'వర్కౌట్ ప్రారంభించబడింది',
        statusMessage: `యాక్టివ్ వర్కౌట్ సెషన్ ప్రారంభించబడింది: "${title}" (${duration} నిమిషాలు). ${count} వ్యాయామాలు వరుసలో ఉన్నాయి.`,
        spokenMessage: `మీ వర్కౌట్ ప్రారంభిస్తున్నాము: ${title}. వ్యాయామం మొదలుపెడదాం!`,
      };
    }

    case 'show_workout_plan': {
      const title = details.title || 'వర్కౌట్ ప్రణాళిక';
      const duration = details.duration || 30;
      const exNames = details.exerciseNames || '';
      const count = details.exercisesCount || 0;
      return {
        actionBadge: 'వర్కౌట్ ప్రణాళిక',
        statusMessage: `వర్కౌట్ ప్లాన్: "${title}" (${duration} నిమిషాలు). వ్యాయామాలు: ${exNames}.`,
        spokenMessage: `ఇది మీ వర్కౌట్ ప్లాన్: ${title}, ఇందులో ${count} వ్యాయామాలు ఉన్నాయి.`,
      };
    }

    case 'finish_workout': {
      if (details.isConfirmation) {
        return {
          actionBadge: 'నిర్ధారణ అవసరం',
          statusMessage: 'నిర్ధారణ అవసరం: మీరు మీ యాక్టివ్ వర్కౌట్ సెషన్‌ను ఇప్పుడే ముగించాలనుకుంటున్నారా?',
          spokenMessage: 'మీరు మీ వర్కౌట్ సెషన్‌ను ముగించాలనుకుంటున్నారా? "అవును" లేదా "వద్దు" అని చెప్పండి.',
        };
      }
      if (details.noActiveWorkout) {
        return {
          actionBadge: 'యాక్టివ్ వర్కౌట్ లేదు',
          statusMessage: 'ప్రస్తుతం ఎటువంటి యాక్టివ్ వర్కౌట్ సెషన్ నడవడం లేదు. శిక్షణ మొదలుపెట్టడానికి "వర్కౌట్ ప్రారంభించండి" అని చెప్పండి.',
          spokenMessage: 'ప్రస్తుతం ఎటువంటి యాక్టివ్ వర్కౌట్ సెషన్ లేదు.',
        };
      }
      const rec = details.sessionRecord || {};
      return {
        actionBadge: 'వర్కౌట్ పూర్తయింది',
        statusMessage: `వర్కౌట్ సెషన్ పూర్తయింది: "${rec.title || 'శిక్షణ'}" (${rec.durationMinutes || 0} నిమిషాలు, ${rec.totalVolumeKg || 0} కేజీల వాల్యూమ్).`,
        spokenMessage: `వర్కౌట్ విజయవంతంగా పూర్తయింది! మీ రికార్డు శిక్షణ చరిత్రలో భద్రపరచబడింది.`,
      };
    }

    case 'show_completed_exercises': {
      const count = details.count || 0;
      const summary = details.summary || '';
      if (count > 0) {
        return {
          actionBadge: `పూర్తయిన వ్యాయామాలు (${count})`,
          statusMessage: `ఈరోజు పూర్తి చేసిన వ్యాయామాలు: ${summary}.`,
          spokenMessage: `ఈరోజు మీరు ${count} వ్యాయామాలు పూర్తి చేశారు: ${summary}.`,
        };
      }
      return {
        actionBadge: 'వ్యాయామాలు పూర్తి కాలేదు',
        statusMessage: 'ఈరోజు మీరు ఇంకా ఎటువంటి వ్యాయామాలు పూర్తి చేయలేదు. శిక్షణ ప్రారంభించడానికి "వర్కౌట్ ప్రారంభించండి" అని చెప్పండి!',
        spokenMessage: 'ఈరోజు మీరు ఇంకా ఎటువంటి వ్యాయామాలు పూర్తి చేయలేదు.',
      };
    }

    case 'create_nutrition_plan': {
      const calories = details.calories || 2200;
      const protein = details.protein || 140;
      const diet = details.diet || 'పోషకాహారం';
      return {
        actionBadge: 'న్యూట్రిషన్ ప్లాన్ రూపొందించబడింది',
        statusMessage: `${diet} కోసం వ్యక్తిగతీకరించిన ప్రణాళిక సిద్ధమైంది. రోజువారీ లక్ష్యం: ${calories} క్యాలరీలు, ${protein} గ్రాముల ప్రోటీన్.`,
        spokenMessage: `మీ న్యూట్రిషన్ ప్లాన్ రూపొందించబడింది: ${calories} క్యాలరీలు మరియు ${protein} గ్రాముల ప్రోటీన్ లక్ష్యం.`,
      };
    }

    case 'open_nutrition_plan': {
      const calories = details.calories || 2200;
      const protein = details.protein || 140;
      return {
        actionBadge: 'న్యూట్రిషన్ ప్లాన్ తెరవబడింది',
        statusMessage: `న్యూట్రిషన్ ప్లాన్ తెరవబడింది. రోజువారీ లక్ష్యం: ${calories} క్యాలరీలు, ${protein} గ్రాముల ప్రోటీన్.`,
        spokenMessage: `మీ న్యూట్రిషన్ ప్రణాళిక తెరవబడుతోంది.`,
      };
    }

    case 'mark_breakfast_completed': {
      if (details.alreadyCompleted) {
        return {
          actionBadge: 'అల్పాహారం ఇప్పటికే పూర్తయింది',
          statusMessage: `అల్పాహారం ఇప్పటికే నమోదైంది (${details.mealTitle || 'బ్రేక్‌ఫాస్ట్'}).`,
          spokenMessage: `అల్పాహారం ఇప్పటికే పూర్తయినట్లు నమోదై ఉంది.`,
        };
      }
      return {
        actionBadge: 'అల్పాహారం పూర్తయింది',
        statusMessage: `అల్పాహారం పూర్తయినట్లు నమోదు చేయబడింది: "${details.mealTitle || 'బ్రేక్‌ఫాస్ట్'}" (${details.calories || 0} క్యాలరీలు).`,
        spokenMessage: `అల్పాహారం పూర్తయినట్లు విజయవంతంగా నమోదు చేయబడింది.`,
      };
    }

    case 'mark_all_nutrition_completed': {
      if (details.isConfirmation) {
        return {
          actionBadge: 'నిర్ధారణ అవసరం',
          statusMessage: 'నిర్ధారణ అవసరం: ఈరోజు న్యూట్రిషన్ ప్లాన్‌లోని అన్ని భోజనాలను పూర్తయినట్లు మార్క్ చేయాలనుకుంటున్నారా?',
          spokenMessage: 'ఈరోజు అన్ని భోజనాలను పూర్తయినట్లు నమోదు చేయాలనుకుంటున్నారా? "అవును" లేదా "వద్దు" అని చెప్పండి.',
        };
      }
      return {
        actionBadge: 'న్యూట్రిషన్ పూర్తయింది',
        statusMessage: `ఈరోజు పూర్తి న్యూట్రిషన్ ప్లాన్ నమోదైంది. అన్ని షెడ్యూల్ చేసిన భోజనాలు పూర్తయ్యాయి.`,
        spokenMessage: `ఈరోజు పూర్తి న్యూట్రిషన్ ప్లాన్ విజయవంతంగా పూర్తయింది.`,
      };
    }

    case 'show_progress': {
      const count = details.count || 0;
      const volume = details.volumeKg || 0;
      const streak = details.streakDays || 0;
      return {
        actionBadge: 'ప్రోగ్రెస్ తెరవబడింది',
        statusMessage: `పురోగతి విశ్లేషణ తెరవబడింది: ${count} పూర్తయిన సెషన్లు, ఈ వారం ${volume} కేజీల వాల్యూమ్, ${streak} రోజుల స్ట్రీక్.`,
        spokenMessage: `మీ ప్రోగ్రెస్ తెరవబడుతోంది. మీరు ఈ వారం ${count} శిక్షణా సెషన్లు పూర్తి చేశారు.`,
      };
    }

    case 'show_workout_history': {
      const count = details.count || 0;
      return {
        actionBadge: `వర్కౌట్ హిస్టరీ (${count})`,
        statusMessage: `వర్కౌట్ హిస్టరీ: ${count} నమోదైన సెషన్లు.`,
        spokenMessage: `మీ వర్కౌట్ హిస్టరీ తెరవబడుతోంది. మీ వద్ద ${count} నమోదైన సెషన్లు ఉన్నాయి.`,
      };
    }

    case 'navigate': {
      const label = details.targetLabel || 'పేజీ';
      return {
        actionBadge: `${label} తెరవబడింది`,
        statusMessage: `${label} పేజీకి విజయవంతంగా వెళ్ళారు.`,
        spokenMessage: `${label} పేజీకి వెళ్తున్నాము.`,
      };
    }

    case 'go_back': {
      return {
        actionBadge: 'వెనక్కి వెళ్ళారు',
        statusMessage: 'మునుపటి పేజీకి విజయవంతంగా తిరిగి వెళ్ళారు.',
        spokenMessage: 'మునుపటి పేజీకి తిరిగి వెళ్తున్నాము.',
      };
    }

    case 'confirmation': {
      return {
        actionBadge: 'చర్య నిర్ధారించబడింది',
        statusMessage: 'చర్య వినియోగదారుని ద్వారా నిర్ధారించబడింది.',
        spokenMessage: 'నిర్ధారించబడింది. చర్య అమలు చేయబడుతోంది.',
      };
    }

    case 'cancellation': {
      return {
        actionBadge: 'చర్య రద్దు చేయబడింది',
        statusMessage: 'చర్య రద్దు చేయబడింది. ఎటువంటి మార్పులు చేయలేదు.',
        spokenMessage: 'చర్య రద్దు చేయబడింది. ఎటువంటి మార్పులు చేయలేదు.',
      };
    }

    case 'workout_reminder': {
      return {
        actionBadge: 'వర్కౌట్ రిమైండర్ సెట్ చేయబడింది',
        statusMessage: 'రేపటి కోసం మీ వర్కౌట్ రిమైండర్ సెట్ చేయబడింది. మీరు మీ షెడ్యూల్ ప్రకారం వ్యాయామం చేయాలని నోటిఫై చేయబడతారు.',
        spokenMessage: 'రేపటి కోసం వర్కౌట్ రిమైండర్ సెట్ చేయబడింది. మీ శిక్షణను కొనసాగించండి!',
      };
    }

    case 'question': {
      return {
        actionBadge: 'ప్రశ్న గుర్తించబడింది',
        statusMessage: `ఫిట్‌నెస్ సమాచార ప్రశ్న గుర్తించబడింది. మరింత లోతైన వివరాల కోసం AI కోచ్‌ని సంప్రదించండి.`,
        spokenMessage: `ఇది ఫిట్‌నెస్ ప్రశ్న. మీరు "ఓపెన్ AI కోచ్" అని చెప్పి AI కోచ్‌ని నేరుగా అడగవచ్చు.`,
      };
    }

    default: {
      return {
        actionBadge: 'మద్దతు లేని కమాండ్',
        statusMessage: `ఈ కమాండ్ గుర్తించబడలేదు. మద్దతు ఉన్న కమాండ్లు: "వర్కౌట్ ప్రారంభించండి", "వర్కౌట్ ప్లాన్ చూపించండి", "న్యూట్రిషన్ ప్లాన్ తెరవండి", "ప్రోగ్రెస్ చూపించండి".`,
        spokenMessage: `క్షమించండి, ఆ కమాండ్ గుర్తించబడలేదు. మద్దతు ఉన్న ఆదేశాన్ని చెప్పండి.`,
      };
    }
  }
}

/**
 * Suggested Commands for Quick Action in Telugu
 */
export const SUGGESTED_COMMANDS_TELUGU = [
  {
    category: 'వర్కౌట్ చర్యలు',
    commands: [
      'వర్కౌట్ ప్రారంభించండి',
      'వర్కౌట్ ప్లాన్ చూపించండి',
      'పూర్తి చేసిన వ్యాయామాలు చూపించు',
      'వర్కౌట్ ముగించండి',
    ],
  },
  {
    category: 'న్యూట్రిషన్ చర్యలు',
    commands: [
      'న్యూట్రిషన్ ప్లాన్ రూపొందించండి',
      'న్యూట్రిషన్ ప్లాన్ తెరవండి',
      'అల్పాహారం పూర్తయినట్లు మార్క్ చేయండి',
    ],
  },
  {
    category: 'ప్రోగ్రెస్ & విశ్లేషణ',
    commands: [
      'నా ప్రోగ్రెస్ చూపించండి',
      'వర్కౌట్ హిస్టరీ చూపించండి',
    ],
  },
  {
    category: 'నావిగేషన్',
    commands: [
      'డ్యాష్‌బోర్డ్ తెరవండి',
      'AI కెమెరా తెరవండి',
      'వెనక్కి వెళ్ళండి',
    ],
  },
];
