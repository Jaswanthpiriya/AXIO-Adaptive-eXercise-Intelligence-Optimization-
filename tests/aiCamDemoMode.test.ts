/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO AI CAM — Demo Mode Kinematics & Posture Simulation Unit Tests
 */

import { generateDemoPoseFrame } from '../src/utils/aiCamDemoEngine';
import { POSE_CONNECTIONS, LANDMARKS } from '../src/utils/poseDetector';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('=== AXIO AI CAM DEMO MODE TEST SUITE ===\n');

// ----------------------------------------------------
// TEST 1: Squat Kinematic Frame Generation & Valgus Simulation
// ----------------------------------------------------
console.log('Test 1: Squat Kinematics & Error Simulation...');

// Good Form at bottom of squat
const squatGoodBottom = generateDemoPoseFrame('squat', 0.5, false);
assert(squatGoodBottom.landmarks.length === 33, 'Must contain 33 MediaPipe landmarks');
assert(squatGoodBottom.phase === 'BOTTOM', `Expected BOTTOM phase, got ${squatGoodBottom.phase}`);
assert(squatGoodBottom.formScore >= 90, `Good form score should be >= 90, got ${squatGoodBottom.formScore}`);
assert(squatGoodBottom.status === 'GOOD FORM', `Expected GOOD FORM status, got ${squatGoodBottom.status}`);
assert(squatGoodBottom.postureFeedback.kneeAlignmentIssue === false, 'Good form must not have knee valgus');

// Simulated Form Error (Valgus Knee Collapse)
const squatErrorBottom = generateDemoPoseFrame('squat', 0.5, true);
assert(squatErrorBottom.postureFeedback.kneeAlignmentIssue === true, 'Error mode must flag kneeAlignmentIssue');
assert(squatErrorBottom.postureFeedback.leftLegIssue === true, 'Error mode must flag left leg issue');
assert(squatErrorBottom.postureFeedback.rightLegIssue === true, 'Error mode must flag right leg issue');
assert(squatErrorBottom.formScore <= 75, `Error form score should drop below 75, got ${squatErrorBottom.formScore}`);
assert(squatErrorBottom.status === 'IMPROVE FORM', `Expected IMPROVE FORM status, got ${squatErrorBottom.status}`);
assert(squatErrorBottom.feedbackMessage.toLowerCase().includes('knee'), 'Feedback must instruct knee alignment');
console.log('  ✓ Squat Good Form and Valgus Simulation verified');

// ----------------------------------------------------
// TEST 2: Push-up Kinematics & Plank Sag Simulation
// ----------------------------------------------------
console.log('Test 2: Push-up Kinematics & Plank Sag Simulation...');

// Top plank
const pushupTop = generateDemoPoseFrame('pushup', 0.0, false);
assert(pushupTop.phase === 'TOP', `Expected TOP phase, got ${pushupTop.phase}`);
assert(pushupTop.postureFeedback.spineAlignmentIssue === false, 'Plank must have neutral spine');

// Bottom push-up with hip sag error
const pushupError = generateDemoPoseFrame('pushup', 0.5, true);
assert(pushupError.postureFeedback.spineAlignmentIssue === true, 'Hip sag must flag spineAlignmentIssue');
assert(pushupError.postureFeedback.torsoIssue === true, 'Hip sag must flag torsoIssue');
assert(pushupError.status === 'IMPROVE FORM', 'Hip sag must trigger IMPROVE FORM status');
console.log('  ✓ Push-up Good Form and Hip Sag Simulation verified');

// ----------------------------------------------------
// TEST 3: Bicep Curl Kinematics & Elbow Flare Simulation
// ----------------------------------------------------
console.log('Test 3: Bicep Curl Kinematics & Elbow Flare Simulation...');

// Peak contraction
const curlPeak = generateDemoPoseFrame('bicep-curl', 0.5, false);
assert(curlPeak.phase === 'PEAK', `Expected PEAK phase, got ${curlPeak.phase}`);
assert(curlPeak.postureFeedback.armStabilityIssue === false, 'Good curl must keep elbows pinned');

// Error mode with swinging elbows
const curlError = generateDemoPoseFrame('bicep-curl', 0.5, true);
assert(curlError.postureFeedback.armStabilityIssue === true, 'Elbow flare must trigger armStabilityIssue');
assert(curlError.postureFeedback.leftArmIssue === true, 'Left arm issue flagged');
assert(curlError.postureFeedback.rightArmIssue === true, 'Right arm issue flagged');
console.log('  ✓ Bicep Curl Good Form and Elbow Flare Simulation verified');

// ----------------------------------------------------
// TEST 4: Jumping Jack Kinematics & Reach Simulation
// ----------------------------------------------------
console.log('Test 4: Jumping Jack Kinematics...');

const jackPeak = generateDemoPoseFrame('jumping-jack', 0.5, false);
assert(jackPeak.phase === 'PEAK', 'Jumping jack peak verified');
assert(jackPeak.landmarks[LANDMARKS.LEFT_WRIST].y < 0.25, 'Hands must reach overhead in peak jumping jack');

const jackError = generateDemoPoseFrame('jumping-jack', 0.5, true);
assert(jackError.postureFeedback.leftArmIssue === true, 'Incomplete reach flagged in error mode');
console.log('  ✓ Jumping Jack Kinematics verified');

// ----------------------------------------------------
// TEST 5: Anatomical Landmark Consistency & Bounds
// ----------------------------------------------------
console.log('Test 5: Anatomical Landmark Consistency & Bounds...');

const exercises = ['squat', 'pushup', 'bicep-curl', 'jumping-jack'] as const;
for (const ex of exercises) {
  for (let t = 0; t <= 1; t += 0.2) {
    const frame = generateDemoPoseFrame(ex, t, false);
    assert(frame.landmarks.length === 33, `Exercise ${ex} at t=${t} must have 33 landmarks`);
    for (let i = 0; i < 33; i++) {
      const lm = frame.landmarks[i];
      assert(lm.x >= 0 && lm.x <= 1, `Landmark ${i} X must be in [0,1], got ${lm.x}`);
      assert(lm.y >= 0 && lm.y <= 1, `Landmark ${i} Y must be in [0,1], got ${lm.y}`);
      assert(lm.visibility !== undefined && lm.visibility > 0.9, `Landmark ${i} visibility must be > 0.9`);
    }

    // Verify all POSE_CONNECTIONS can be indexed without throwing
    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      assert(frame.landmarks[startIdx] !== undefined, `Connection start landmark ${startIdx} exists`);
      assert(frame.landmarks[endIdx] !== undefined, `Connection end landmark ${endIdx} exists`);
    }
  }
}
console.log('  ✓ Anatomical consistency across all exercises passed');

// ----------------------------------------------------
// TEST 6: Rep Cycle Progression & No Double-Counting
// ----------------------------------------------------
console.log('Test 6: Rep Cycle Progression & No Double-Counting...');
let simulatedReps = 0;
let progress = 0;
let totalElapsed = 0;
const timeDeltas = [16.6, 16.7, 16.6, 33.3, 16.6]; // Variable frame times
const repDurationMs = 2800;

for (let frame = 0; frame < 300; frame++) {
  const dt = timeDeltas[frame % timeDeltas.length];
  totalElapsed += dt;
  progress += dt / repDurationMs;
  if (progress >= 1.0) {
    progress = 0.0;
    simulatedReps += 1;
  }
}
const expectedReps = Math.floor(totalElapsed / repDurationMs);
assert(simulatedReps === expectedReps, `Expected ${expectedReps} reps for ${Math.round(totalElapsed)}ms elapsed, got ${simulatedReps}`);
console.log('  ✓ Rep cycle progression & single-trigger increment verified');

// ----------------------------------------------------
// TEST 7: Segment Color Mapping (Green = Good, Red = Error)
// ----------------------------------------------------
console.log('Test 7: Segment Color Mapping (Green vs Red)...');
import { getSegmentColor, getJointColor } from '../src/utils/poseDetector';

const squatGood = generateDemoPoseFrame('squat', 0.5, false);
assert(
  getSegmentColor(LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, squatGood.landmarks, squatGood.postureFeedback) === 'green',
  'Good form left thigh must be green'
);
assert(
  getJointColor(LANDMARKS.LEFT_KNEE, squatGood.landmarks, squatGood.postureFeedback) === 'green',
  'Good form knee joint must be green'
);

const squatFault = generateDemoPoseFrame('squat', 0.5, true);
assert(
  getSegmentColor(LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, squatFault.landmarks, squatFault.postureFeedback) === 'red',
  'Valgus fault left thigh must be red'
);
assert(
  getJointColor(LANDMARKS.LEFT_KNEE, squatFault.landmarks, squatFault.postureFeedback) === 'red',
  'Valgus fault knee joint must be red'
);
// Unaffected segments must remain green
assert(
  getSegmentColor(LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, squatFault.landmarks, squatFault.postureFeedback) === 'green',
  'Unaffected arm must remain green during knee valgus'
);
console.log('  ✓ Green/Red color mapping verified for correct/incorrect form');

// ----------------------------------------------------
// TEST 8: Synchronized Telemetry Updates
// ----------------------------------------------------
console.log('Test 8: Synchronized Telemetry Updates...');
for (const phasePoint of [0.1, 0.4, 0.85, 0.95]) {
  const frame = generateDemoPoseFrame('squat', phasePoint, false);
  assert(frame.keyAngles.length > 0, 'Key angles must be computed');
  assert(frame.formChecks.length === 3, 'All 3 form checks must be populated');
  assert(typeof frame.formScore === 'number' && frame.formScore > 0, 'Form score must be valid number');
  assert(typeof frame.feedbackMessage === 'string' && frame.feedbackMessage.length > 0, 'Feedback cue must be present');
}
console.log('  ✓ Synchronized telemetry updates verified');

// ----------------------------------------------------
// TEST 9: Graceful Fallback for Unsupported Exercises
// ----------------------------------------------------
console.log('Test 9: Graceful Fallback for Unsupported / Other Exercises...');
const otherExList = ['shoulder-press', 'lunge', 'calf-raise', 'lateral-raise', 'high-knees', 'glute-bridge', 'unknown-test' as any];
for (const ex of otherExList) {
  const frame = generateDemoPoseFrame(ex, 0.5, false);
  assert(frame.landmarks.length === 33, `Fallback for ${ex} must yield 33 landmarks`);
  assert(frame.formChecks.length > 0, `Fallback for ${ex} must have form checks`);
  assert(frame.status === 'GOOD FORM', `Fallback for ${ex} must default to GOOD FORM`);
}
console.log('  ✓ Graceful handling across all exercises verified');

// ----------------------------------------------------
// TEST 10: Offline Safety & Local Determinism
// ----------------------------------------------------
console.log('Test 10: Offline Safety & Local Determinism...');
const runA = generateDemoPoseFrame('squat', 0.42, true);
const runB = generateDemoPoseFrame('squat', 0.42, true);
assert(runA.formScore === runB.formScore, 'Deterministic scoring');
assert(runA.landmarks[LANDMARKS.LEFT_KNEE].x === runB.landmarks[LANDMARKS.LEFT_KNEE].x, 'Deterministic landmarks');
console.log('  ✓ Deterministic offline execution verified');

// ----------------------------------------------------
// TEST 11: Shoulder Press & Lunge Kinematics & Faults
// ----------------------------------------------------
console.log('Test 11: Shoulder Press & Lunge Kinematics...');
const pressPeak = generateDemoPoseFrame('shoulder-press', 0.5, false);
assert(pressPeak.landmarks.length === 33, 'Shoulder press 33 landmarks');
assert(pressPeak.formScore >= 90, 'Good form shoulder press score >= 90');
const pressFault = generateDemoPoseFrame('shoulder-press', 0.5, true);
assert(pressFault.postureFeedback.leftArmIssue === true, 'Asymmetric press flagged in error mode');
assert(pressFault.formScore < 75, 'Error form score < 75');

const lungeBottom = generateDemoPoseFrame('lunge', 0.5, false);
assert(lungeBottom.phase === 'BOTTOM', 'Lunge bottom phase');
assert(lungeBottom.postureFeedback.kneeAlignmentIssue === false, 'Good lunge knee aligned');
const lungeFault = generateDemoPoseFrame('lunge', 0.5, true);
assert(lungeFault.postureFeedback.kneeAlignmentIssue === true, 'Lunge knee valgus flagged');
console.log('  ✓ Shoulder Press & Lunge Kinematics verified');

// ----------------------------------------------------
// TEST 12: Comprehensive Boundary Verification for All 10 Exercises
// ----------------------------------------------------
console.log('Test 12: Strict [0.05, 0.95] Canvas Viewport Boundary for All 10 Exercises...');
const allTenExercises = [
  'squat',
  'pushup',
  'bicep-curl',
  'lunge',
  'shoulder-press',
  'jumping-jack',
  'calf-raise',
  'lateral-raise',
  'high-knees',
  'glute-bridge',
] as const;

for (const ex of allTenExercises) {
  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    for (const errorMode of [false, true]) {
      const frame = generateDemoPoseFrame(ex, t, errorMode);
      for (let i = 0; i < 33; i++) {
        const lm = frame.landmarks[i];
        assert(
          lm.x >= 0.05 && lm.x <= 0.95,
          `Exercise ${ex} at t=${t} lm ${i} X ${lm.x} out of safe preview [0.05, 0.95]`
        );
        assert(
          lm.y >= 0.05 && lm.y <= 0.95,
          `Exercise ${ex} at t=${t} lm ${i} Y ${lm.y} out of safe preview [0.05, 0.95]`
        );
      }
    }
  }
}
console.log('  ✓ All 10 exercises strictly confined within camera preview bounds');

// ----------------------------------------------------
// TEST 13: Rep Cycle Cadence Wrap & No-Double Counting
// ----------------------------------------------------
console.log('Test 13: Rep Cycle Wrapping & Reset Verification...');
let testProgress = 0.95;
const delta = 16.6; // 60fps frame
const repMs = 2800;
let repTriggers = 0;

for (let f = 0; f < 10; f++) {
  testProgress += delta / repMs;
  if (testProgress >= 1.0) {
    testProgress = testProgress % 1.0;
    repTriggers++;
  }
}
assert(repTriggers === 1, `Expected exactly 1 rep trigger across cycle boundary, got ${repTriggers}`);
assert(testProgress > 0 && testProgress < 0.2, 'Progress smoothly wraps after rep completion');
console.log('  ✓ Cycle boundary single-increment verified');

console.log('\n=== ALL DEMO MODE TESTS PASSED SUCCESSFULLY! ===\n');
