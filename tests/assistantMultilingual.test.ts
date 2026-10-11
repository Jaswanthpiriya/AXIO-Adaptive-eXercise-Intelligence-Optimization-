/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness Platform — AXI Multilingual Assistant Verification Suite
 * Tests Telugu script, Tenglish, and English parsing, detection, state, and response generation.
 */

import {
  isTeluguScript,
  isTenglish,
  detectMessageLanguage,
  isMultilingualConfirmation,
  isMultilingualCancellation,
  parseTeluguCommandIntent,
  getLocalizedActionStrings,
  SUGGESTED_COMMANDS_TELUGU,
} from '../src/utils/multilingualAssistant.ts';
import { parseAssistantCommand } from '../src/utils/assistantActionRegistry.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

console.log('--- STARTING AXI MULTILINGUAL FOUNDATION TEST SUITE ---\n');

// ----------------------------------------------------------------------------
// 1. TELUGU SCRIPT DETECTION TEST
// ----------------------------------------------------------------------------
console.log('Test 1: Telugu Script Character Detection...');
assert(isTeluguScript('వర్కౌట్ ప్రారంభించండి') === true, 'Failed to detect pure Telugu script');
assert(isTeluguScript('నా వర్కౌట్ ప్లాన్ చూపించండి') === true, 'Failed to detect Telugu phrase');
assert(isTeluguScript('హలో AXI') === true, 'Failed to detect mixed Telugu and English');
assert(isTeluguScript('Start my workout') === false, 'English should not be detected as Telugu script');
assert(isTeluguScript('workout start cheyandi') === false, 'Tenglish should not be detected as Telugu script');
console.log('✓ Test 1 Passed: Telugu script detection verified.\n');

// ----------------------------------------------------------------------------
// 2. TENGLISH (ROMANIZED TELUGU) DETECTION TEST
// ----------------------------------------------------------------------------
console.log('Test 2: Tenglish (Romanized Telugu) Detection...');
assert(isTenglish('workout start cheyandi') === true, 'Failed to detect "cheyandi"');
assert(isTenglish('naa workout plan chupinchu') === true, 'Failed to detect "naa" and "chupinchu"');
assert(isTenglish('eeroju chesina exercises choopandi') === true, 'Failed to detect "eeroju", "chesina", "choopandi"');
assert(isTenglish('workout muginchandi') === true, 'Failed to detect "muginchandi"');
assert(isTenglish('breakfast aypoindi') === true, 'Failed to detect "aypoindi"');
assert(isTenglish('na progress ela undi') === true, 'Failed to detect "ela undi"');
assert(isTenglish('venakki vellu') === true, 'Failed to detect "venakki vellu"');
assert(isTenglish('Start my workout') === false, 'Standard English should not trigger Tenglish');
assert(isTenglish('Show my workout plan') === false, 'Standard English should not trigger Tenglish');
assert(isTenglish('Open nutrition plan') === false, 'Standard English should not trigger Tenglish');
console.log('✓ Test 2 Passed: Tenglish detection verified.\n');

// ----------------------------------------------------------------------------
// 3. AUTOMATIC LANGUAGE DETECTION MODE TEST
// ----------------------------------------------------------------------------
console.log('Test 3: Automatic Language Detection in Automatic Mode...');
const resEn = detectMessageLanguage('Start my workout', 'auto');
assert(resEn.detectedLanguage === 'en', 'English sentence should detect "en"');
assert(resEn.effectiveLanguage === 'en', 'English sentence effective language should be "en"');

const resTe = detectMessageLanguage('వర్కౌట్ ప్రారంభించండి', 'auto');
assert(resTe.detectedLanguage === 'te', 'Telugu script should detect "te"');
assert(resTe.effectiveLanguage === 'te', 'Telugu script effective language should be "te"');

const resTeng = detectMessageLanguage('workout start cheyi', 'auto');
assert(resTeng.detectedLanguage === 'tenglish', 'Tenglish sentence should detect "tenglish"');
assert(resTeng.effectiveLanguage === 'te', 'Tenglish sentence effective language should be "te"');
console.log('✓ Test 3 Passed: Automatic language detection verified.\n');

// ----------------------------------------------------------------------------
// 4. LANGUAGE PREFERENCE SETTINGS ENFORCEMENT TEST
// ----------------------------------------------------------------------------
console.log('Test 4: Language Preference Override Settings...');
// When user explicitly sets 'te' (Telugu)
const fixedTe = detectMessageLanguage('Start my workout', 'te');
assert(fixedTe.effectiveLanguage === 'te', 'When setting is "te", effective language must be "te"');

// When user explicitly sets 'en' (English)
const fixedEn = detectMessageLanguage('Start my workout', 'en');
assert(fixedEn.effectiveLanguage === 'en', 'When setting is "en", effective language must be "en"');
console.log('✓ Test 4 Passed: Language preference settings verified.\n');

// ----------------------------------------------------------------------------
// 5. MULTILINGUAL CONFIRMATION & CANCELLATION TRIGGERS TEST
// ----------------------------------------------------------------------------
console.log('Test 5: Multilingual Confirmations and Cancellations...');
// Confirmations
assert(isMultilingualConfirmation('yes') === true, 'English "yes" failed');
assert(isMultilingualConfirmation('confirm') === true, 'English "confirm" failed');
assert(isMultilingualConfirmation('అవును') === true, 'Telugu "అవును" failed');
assert(isMultilingualConfirmation('సరే') === true, 'Telugu "సరే" failed');
assert(isMultilingualConfirmation('చేయండి') === true, 'Telugu "చేయండి" failed');
assert(isMultilingualConfirmation('avunu') === true, 'Tenglish "avunu" failed');
assert(isMultilingualConfirmation('sare') === true, 'Tenglish "sare" failed');
assert(isMultilingualConfirmation('cheyandi') === true, 'Tenglish "cheyandi" failed');

// Cancellations
assert(isMultilingualCancellation('no') === true, 'English "no" failed');
assert(isMultilingualCancellation('cancel') === true, 'English "cancel" failed');
assert(isMultilingualCancellation('వద్దు') === true, 'Telugu "వద్దు" failed');
assert(isMultilingualCancellation('ఆపండి') === true, 'Telugu "ఆపండి" failed');
assert(isMultilingualCancellation('రద్దు చేయండి') === true, 'Telugu "రద్దు చేయండి" failed');
assert(isMultilingualCancellation('vaddu') === true, 'Tenglish "vaddu" failed');
assert(isMultilingualCancellation('oddu') === true, 'Tenglish "oddu" failed');
assert(isMultilingualCancellation('aapu') === true, 'Tenglish "aapu" failed');
assert(isMultilingualCancellation('aapandi') === true, 'Tenglish "aapandi" failed');
console.log('✓ Test 5 Passed: Confirmations and cancellations verified.\n');

// ----------------------------------------------------------------------------
// 6. TELUGU SCRIPT COMMAND PARSING TEST
// ----------------------------------------------------------------------------
console.log('Test 6: Telugu Script Commands across all Action Types...');
const teCmds = [
  { cmd: 'వర్కౌట్ ప్రారంభించండి', expected: 'start_workout' },
  { cmd: 'నా వర్కౌట్ ప్లాన్ చూపించండి', expected: 'show_workout_plan' },
  { cmd: 'వర్కౌట్ ముగించండి', expected: 'finish_workout' },
  { cmd: 'పూర్తి చేసిన వ్యాయామాలు చూపించు', expected: 'show_completed_exercises' },
  { cmd: 'న్యూట్రిషన్ ప్లాన్ రూపొందించండి', expected: 'create_nutrition_plan' },
  { cmd: 'న్యూట్రిషన్ ప్లాన్ తెరవండి', expected: 'open_nutrition_plan' },
  { cmd: 'అల్పాహారం పూర్తయినట్లు మార్క్ చేయండి', expected: 'mark_breakfast_completed' },
  { cmd: 'నా ప్రోగ్రెస్ చూపించండి', expected: 'show_progress' },
  { cmd: 'వర్కౌట్ హిస్టరీ చూపించండి', expected: 'show_workout_history' },
  { cmd: 'డ్యాష్‌బోర్డ్ తెరవండి', expected: 'navigate', page: 'dashboard' },
  { cmd: 'AI కెమెరా తెరవండి', expected: 'navigate', page: 'live-form' },
  { cmd: 'వెనక్కి వెళ్ళండి', expected: 'go_back' },
];

for (const item of teCmds) {
  const parsed = parseAssistantCommand(item.cmd, false, 'auto');
  assert(parsed.type === item.expected, `Command "${item.cmd}" expected type "${item.expected}", got "${parsed.type}"`);
  assert(parsed.effectiveLanguage === 'te', `Command "${item.cmd}" effective language should be "te"`);
  if (item.page) {
    assert(parsed.targetPageId === item.page, `Command "${item.cmd}" expected target page "${item.page}", got "${parsed.targetPageId}"`);
  }
}
console.log('✓ Test 6 Passed: Telugu script command parsing verified across all actions.\n');

// ----------------------------------------------------------------------------
// 7. TENGLISH (ROMANIZED TELUGU) COMMAND PARSING TEST
// ----------------------------------------------------------------------------
console.log('Test 7: Tenglish Commands across all Action Types...');
const tenglishCmds = [
  { cmd: 'workout start cheyi', expected: 'start_workout' },
  { cmd: 'naa workout start cheyandi', expected: 'start_workout' },
  { cmd: 'workout plan chupinchu', expected: 'show_workout_plan' },
  { cmd: 'workout finish cheyi', expected: 'finish_workout' },
  { cmd: 'workout muginchandi', expected: 'finish_workout' },
  { cmd: 'chesina exercises chupinchu', expected: 'show_completed_exercises' },
  { cmd: 'nutrition plan create cheyandi', expected: 'create_nutrition_plan' },
  { cmd: 'nutrition plan open cheyi', expected: 'open_nutrition_plan' },
  { cmd: 'breakfast aypoindi', expected: 'mark_breakfast_completed' },
  { cmd: 'progress chupandi', expected: 'show_progress' },
  { cmd: 'workout history chupinchu', expected: 'show_workout_history' },
  { cmd: 'dashboard open cheyi', expected: 'navigate', page: 'dashboard' },
  { cmd: 'ai camera open cheyi', expected: 'navigate', page: 'live-form' },
  { cmd: 'venakki vellu', expected: 'go_back' },
];

for (const item of tenglishCmds) {
  const parsed = parseAssistantCommand(item.cmd, false, 'auto');
  assert(parsed.type === item.expected, `Tenglish command "${item.cmd}" expected type "${item.expected}", got "${parsed.type}"`);
  assert(parsed.effectiveLanguage === 'te', `Tenglish command "${item.cmd}" effective language should be "te"`);
  if (item.page) {
    assert(parsed.targetPageId === item.page, `Tenglish command "${item.cmd}" expected target page "${item.page}", got "${parsed.targetPageId}"`);
  }
}
console.log('✓ Test 7 Passed: Tenglish command parsing verified across all actions.\n');

// ----------------------------------------------------------------------------
// 8. LOCALIZED ACTION RESPONSE GENERATOR TEST
// ----------------------------------------------------------------------------
console.log('Test 8: Telugu Localized Output Strings Quality...');
const workoutStrings = getLocalizedActionStrings(
  'start_workout',
  { title: 'హైపర్ట్రోఫీ శిక్షణ', duration: 45, exercisesCount: 5 },
  'te'
);
assert(workoutStrings.actionBadge === 'వర్కౌట్ ప్రారంభించబడింది', 'Telugu badge mismatch');
assert(workoutStrings.statusMessage.includes('హైపర్ట్రోఫీ శిక్షణ'), 'Telugu title missing in status message');
assert(workoutStrings.spokenMessage.includes('ప్రారంభిస్తున్నాము'), 'Telugu spoken verb missing');

const progressStrings = getLocalizedActionStrings(
  'show_progress',
  { count: 12, volumeKg: '4,500', streakDays: 7 },
  'te'
);
assert(progressStrings.actionBadge === 'ప్రోగ్రెస్ తెరవబడింది', 'Telugu progress badge mismatch');
assert(progressStrings.statusMessage.includes('12'), 'Session count missing in Telugu progress status');

console.log('✓ Test 8 Passed: Telugu localized response generation verified.\n');

// ----------------------------------------------------------------------------
// 9. SUGGESTED COMMANDS VALIDITY IN TELUGU
// ----------------------------------------------------------------------------
console.log('Test 9: Telugu Suggested Command Groups Validation...');
assert(SUGGESTED_COMMANDS_TELUGU.length >= 4, 'Telugu suggested commands must have at least 4 categories');
for (const group of SUGGESTED_COMMANDS_TELUGU) {
  assert(group.commands.length > 0, `Category ${group.category} must have commands`);
  for (const cmd of group.commands) {
    const parsed = parseAssistantCommand(cmd, false, 'te');
    assert(parsed.type !== 'unsupported', `Suggested Telugu command "${cmd}" should be recognized, but was unsupported`);
  }
}
console.log('✓ Test 9 Passed: Telugu suggested commands are 100% resolvable.\n');

console.log('===========================================================');
console.log('ALL AXI MULTILINGUAL TESTS PASSED (100% SUCCESS)');
console.log('===========================================================');
