import { parseAssistantCommand, VALIDATED_PAGES } from '../src/utils/assistantActionRegistry.ts';

console.log('=== AXIO PERSONAL ASSISTANT ACTION REGISTRY TEST SUITE ===');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`  FAIL: ${msg}`);
    process.exit(1);
  } else {
    passedTests++;
    console.log(`  ✓ ${msg}`);
  }
}

// Test 1: Exact Required Navigation Commands
console.log('\nTest 1: Required Exact Navigation Commands...');

const dash = parseAssistantCommand('Open my dashboard.');
assert(dash.type === 'navigate' && dash.targetPageId === 'dashboard', '"Open my dashboard." maps to dashboard');

const coach = parseAssistantCommand('Open AI Coach.');
assert(coach.type === 'navigate' && coach.targetPageId === 'ai-coach', '"Open AI Coach." maps to ai-coach');

const workout = parseAssistantCommand('Open workout.');
assert(workout.type === 'navigate' && workout.targetPageId === 'workout', '"Open workout." maps to workout');

const aicam = parseAssistantCommand('Open AI Camera.');
assert(aicam.type === 'navigate' && aicam.targetPageId === 'live-form', '"Open AI Camera." maps to live-form (AI Camera)');

const exercises = parseAssistantCommand('Open exercises.');
assert(exercises.type === 'navigate' && exercises.targetPageId === 'exercises', '"Open exercises." maps to exercises');

const recovery = parseAssistantCommand('Open recovery.');
assert(recovery.type === 'navigate' && recovery.targetPageId === 'recovery', '"Open recovery." maps to recovery');

const nutrition = parseAssistantCommand('Open nutrition.');
assert(nutrition.type === 'navigate' && nutrition.targetPageId === 'nutrition', '"Open nutrition." maps to nutrition');

const progress = parseAssistantCommand('Show my progress.');
assert((progress.type === 'navigate' || progress.type === 'show_progress') && progress.targetPageId === 'progress', '"Show my progress." maps to progress');

const achievements = parseAssistantCommand('Open achievements.');
assert(achievements.type === 'navigate' && achievements.targetPageId === 'achievements', '"Open achievements." maps to achievements');

const profile = parseAssistantCommand('Open my profile.');
assert(profile.type === 'navigate' && profile.targetPageId === 'profile', '"Open my profile." maps to profile');

const goBack = parseAssistantCommand('Go back.');
assert(goBack.type === 'go_back', '"Go back." maps to go_back action');

// Test 2: Natural Variations
console.log('\nTest 2: Natural Variations...');

const v1 = parseAssistantCommand('take me to nutrition');
assert(v1.type === 'navigate' && v1.targetPageId === 'nutrition', '"take me to nutrition" maps to nutrition');

const v2 = parseAssistantCommand('show the nutrition page');
assert(v2.type === 'navigate' && v2.targetPageId === 'nutrition', '"show the nutrition page" maps to nutrition');

const v3 = parseAssistantCommand('take me to workout');
assert(v3.type === 'navigate' && v3.targetPageId === 'workout', '"take me to workout" maps to workout');

const v4 = parseAssistantCommand('open camera');
assert(v4.type === 'navigate' && v4.targetPageId === 'live-form', '"open camera" maps to live-form');

const v5 = parseAssistantCommand('show progress');
assert((v5.type === 'navigate' || v5.type === 'show_progress') && v5.targetPageId === 'progress', '"show progress" maps to progress');

const v6 = parseAssistantCommand('navigate to dashboard');
assert(v6.type === 'navigate' && v6.targetPageId === 'dashboard', '"navigate to dashboard" maps to dashboard');

const v7 = parseAssistantCommand('previous page');
assert(v7.type === 'go_back', '"previous page" maps to go_back');

// Test 3: Informational Questions Must NOT Trigger Navigation
console.log('\nTest 3: Informational Questions Guarding...');

const q1 = parseAssistantCommand('What is protein?');
assert(q1.type === 'question' && !q1.isNavigation, '"What is protein?" is recognized as question, not navigation');

const q2 = parseAssistantCommand('How many push-ups do I need to do?');
assert(q2.type === 'question' && !q2.isNavigation, '"How many push-ups..." is recognized as question, not navigation');

const q3 = parseAssistantCommand('Why do squats hurt my knees?');
assert(q3.type === 'question' && !q3.isNavigation, '"Why do squats hurt..." is recognized as question, not navigation');

const q4 = parseAssistantCommand('Can you explain recovery?');
assert(q4.type === 'question' && !q4.isNavigation, '"Can you explain recovery?" is recognized as question, not navigation');

// Test 4: Unsupported Commands
console.log('\nTest 4: Unsupported Commands Handling...');

const u1 = parseAssistantCommand('Order a pizza');
assert(u1.type === 'unsupported' && !u1.isNavigation, '"Order a pizza" is flagged as unsupported command');

const u2 = parseAssistantCommand('Play some music');
assert(u2.type === 'unsupported' && !u2.isNavigation, '"Play some music" is flagged as unsupported command');

console.log(`\n=== ALL ${passedTests}/${totalTests} ASSISTANT ACTION REGISTRY TESTS PASSED! ===`);
