import { cleanTextForSpeech } from '../src/pages/AiCoachPage';
import { generateContextualCoachResponse } from '../src/utils/aiCoachEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('=== AXIO AI VOICE COACH VALIDATION TEST SUITE ===\n');

// 1. Text normalization for speech synthesis
console.log('Test 1: Text normalization for SpeechSynthesis...');
const sampleRawResponse = `**DUMBBELL BICEP CURL**

**Setup:**
Stand tall with feet shoulder-width apart, holding dumbbells at arm's length with palms facing forward.

**Execution:**
Curl the dumbbells up toward your shoulders while keeping your elbows stationary.
1. 3 × 10 reps (Rest: 45s)
2. 3 × 8 reps with 75kg

**FORM CHECK:**
• Keep elbows pinned to your ribs.
• Full ROM at the bottom.

COACHING TIP:
Maintain a 2-second eccentric lowering cadence.`;

const cleaned = cleanTextForSpeech(sampleRawResponse);

assert(!cleaned.includes('**'), 'Cleaned text must not contain markdown bold asterisks');
assert(!cleaned.includes('•'), 'Cleaned text must not contain bullet points');
assert(cleaned.includes('3 sets of 10'), 'Cleaned text should pronounce "3 × 10" as "3 sets of 10"');
assert(cleaned.includes('45 seconds'), 'Cleaned text should pronounce "45s" as "45 seconds"');
assert(cleaned.includes('75 kilograms'), 'Cleaned text should pronounce "75kg" as "75 kilograms"');
assert(cleaned.includes('range of motion'), 'Cleaned text should expand ROM to range of motion');

console.log('  ✓ cleanTextForSpeech correctly sanitizes markdown for voice synthesis\n');

// 2. Safety & Pain protocol verification
console.log('Test 2: Emergency safety and pain advice...');
const painQuery = 'I feel a sharp pain in my shoulder when doing presses';
const safetyResponse = generateContextualCoachResponse(painQuery);
assert(safetyResponse.includes('STOP EXERCISE IMMEDIATELY'), 'Safety response must instruct athlete to stop exercise immediately');
assert(safetyResponse.includes('seek medical evaluation') || safetyResponse.includes('physician'), 'Safety response must advise medical consultation');

console.log('  ✓ Safety & pain protocol verified\n');

// 3. Fallback engine accuracy
console.log('Test 3: Voice response generation for fitness questions...');
const squatQuery = 'How do I do a proper squat?';
const squatResponse = generateContextualCoachResponse(squatQuery);
assert(squatResponse.includes('SQUAT'), 'Response must explain squat mechanics');
assert(squatResponse.includes('Setup') || squatResponse.includes('Execution'), 'Response must have technical structure');

console.log('  ✓ Contextual fitness response verified\n');

console.log('=== ALL VOICE COACH TESTS PASSED SUCCESSFULLY! ===\n');
