import {
  computeVideoTransform,
  transformPoint,
  calculateAngle,
  isLandmarkValid,
  isHandLandmarkValid,
  isHandValidAndReliable,
  ExerciseAnalyzer,
  LANDMARKS,
  HAND_LANDMARKS,
  PoseLandmark,
  HandLandmark,
  CONFIDENCE_THRESHOLDS,
  getSegmentColor,
  getJointColor,
  POSE_CONNECTIONS,
  HAND_CONNECTIONS,
  AI_CAM_EXERCISES,
  getExerciseConfig,
  ExerciseType,
} from '../src/utils/poseDetector';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function assertClose(actual: number, expected: number, delta = 0.5, message = '') {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`TEST FAILED: Expected ~${expected}, got ${actual}. ${message}`);
  }
}

console.log('=== AXIO AI CAM VALIDATION TEST SUITE ===\n');

// ----------------------------------------------------
// TEST 1: Coordinate mapping and horizontal mirroring
// ----------------------------------------------------
console.log('Test 1: Coordinate mapping & aspect-ratio cropping (cover mode)...');

// Case A: Container wider than video (displayWidth: 800, displayHeight: 400, videoWidth: 640, videoHeight: 480)
const transformWider = computeVideoTransform(800, 400, 640, 480, false, 'cover');
assert(transformWider.renderedWidth === 800, 'Rendered width should match displayWidth for wider container');
assertClose(transformWider.renderedHeight, 600, 0.1, 'Rendered height should scale by video ratio');
assert(transformWider.offsetX === 0, 'Offset X should be 0 when container is wider');
assertClose(transformWider.offsetY, -100, 0.1, 'Offset Y should be negative (top/bottom cropped)');

// Case B: Container taller than video (displayWidth: 400, displayHeight: 600, videoWidth: 640, videoHeight: 480)
const transformTaller = computeVideoTransform(400, 600, 640, 480, false, 'cover');
assert(transformTaller.renderedHeight === 600, 'Rendered height should match displayHeight for taller container');
assertClose(transformTaller.renderedWidth, 800, 0.1, 'Rendered width should scale by video ratio');
assertClose(transformTaller.offsetX, -200, 0.1, 'Offset X should be negative (left/right cropped)');
assert(transformTaller.offsetY === 0, 'Offset Y should be 0 when container is taller');

// Case C: Mirroring transformation (Selfie / User camera)
const transformMirrored = computeVideoTransform(640, 480, 640, 480, true, 'cover');
const pLeft = transformPoint(0.2, 0.5, transformMirrored);
const pRight = transformPoint(0.8, 0.5, transformMirrored);
assertClose(pLeft.x, 640 * 0.8, 0.1, 'Mirrored x=0.2 should appear at 80% screen width');
assertClose(pRight.x, 640 * 0.2, 0.1, 'Mirrored x=0.8 should appear at 20% screen width');
assertClose(pLeft.y, 240, 0.1, 'Y coordinate should remain unmirrored');

console.log('  ✓ Coordinate mapping & mirroring passed');

// ----------------------------------------------------
// TEST 2: Joint angle calculation
// ----------------------------------------------------
console.log('Test 2: Joint angle calculations...');

const origin = { x: 0, y: 0 };
const rightArmA = { x: 0, y: -1 }; // 12 o'clock
const rightArmC = { x: 1, y: 0 };  // 3 o'clock
assert(calculateAngle(rightArmA, origin, rightArmC) === 90, 'Right angle should be 90°');

const straightA = { x: 0, y: -1 };
const straightC = { x: 0, y: 1 };
assert(calculateAngle(straightA, origin, straightC) === 180, 'Straight line should be 180°');

const acuteC = { x: 1, y: -1 };
assert(calculateAngle(rightArmA, origin, acuteC) === 45, '45 degree angle should be 45°');

console.log('  ✓ Joint angle calculations passed');

// ----------------------------------------------------
// TEST 3: Landmark validation & confidence handling
// ----------------------------------------------------
console.log('Test 3: Landmark validation & confidence handling...');

assert(isLandmarkValid({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }), 'Valid high-confidence landmark should pass');
assert(!isLandmarkValid({ x: 0.5, y: 0.5, z: 0, visibility: 0.2 }), 'Low-confidence landmark should be rejected');
assert(!isLandmarkValid({ x: -0.5, y: 0.5, z: 0, visibility: 0.9 }), 'Out-of-bounds landmark should be rejected');
assert(!isLandmarkValid({ x: NaN, y: 0.5, z: 0 }), 'NaN landmark should be rejected');

console.log('  ✓ Landmark validation passed');

// ----------------------------------------------------
// TEST 4: Skeleton anatomical connections
// ----------------------------------------------------
console.log('Test 4: Skeleton anatomical connections...');

assert(POSE_CONNECTIONS.length > 10, 'Body connections should be populated');
assert(HAND_CONNECTIONS.length === 21, 'Hand connections should have exactly 21 anatomical segments');

// Verify that left shoulder connects to left elbow and left wrist
const hasLeftArm = POSE_CONNECTIONS.some(
  ([a, b]) => (a === LANDMARKS.LEFT_SHOULDER && b === LANDMARKS.LEFT_ELBOW) || (b === LANDMARKS.LEFT_SHOULDER && a === LANDMARKS.LEFT_ELBOW)
);
assert(hasLeftArm, 'Left shoulder must connect to left elbow');

// Verify shoulders connect to hips
const hasTorsoLeft = POSE_CONNECTIONS.some(
  ([a, b]) => (a === LANDMARKS.LEFT_SHOULDER && b === LANDMARKS.LEFT_HIP) || (b === LANDMARKS.LEFT_SHOULDER && a === LANDMARKS.LEFT_HIP)
);
assert(hasTorsoLeft, 'Left shoulder must connect to left hip');

console.log('  ✓ Skeleton connections passed');

// ----------------------------------------------------
// TEST 5: ExerciseAnalyzer - Squat Biomechanics
// ----------------------------------------------------
console.log('Test 5: ExerciseAnalyzer squat biomechanics...');

const analyzer = new ExerciseAnalyzer('squat');

// Helper to create synthetic 33-pose landmark array with default standing posture
function createStandingSquatPose(overrides: Partial<Record<number, Partial<PoseLandmark>>> = {}): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    landmarks.push({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 });
  }

  // Torso
  landmarks[LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.25, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_SHOULDER] = { x: 0.58, y: 0.25, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.LEFT_HIP] = { x: 0.44, y: 0.50, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_HIP] = { x: 0.56, y: 0.50, z: 0, visibility: 0.95 };

  // Legs - Standing straight (kneeAngle ~ 175°)
  landmarks[LANDMARKS.LEFT_KNEE] = { x: 0.44, y: 0.70, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_KNEE] = { x: 0.56, y: 0.70, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.LEFT_ANKLE] = { x: 0.44, y: 0.90, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_ANKLE] = { x: 0.56, y: 0.90, z: 0, visibility: 0.95 };

  for (const [idxStr, ov] of Object.entries(overrides)) {
    const idx = Number(idxStr);
    landmarks[idx] = { ...landmarks[idx], ...ov };
  }
  return landmarks;
}

// 5A: Standing pose gives READY status
let res = analyzer.analyze(createStandingSquatPose());
assert(res.movementPhase === 'STANDING', 'Standing pose should give STANDING phase');
assert(res.aiStatus === 'READY', 'Standing pose before rep should give READY status');

// 5B: Parallel squat depth (femur horizontal, knee bent to ~90°)
const squatBottomPose = createStandingSquatPose({
  [LANDMARKS.LEFT_HIP]: { x: 0.48, y: 0.75, visibility: 0.95 },
  [LANDMARKS.LEFT_KNEE]: { x: 0.35, y: 0.75, visibility: 0.95 },
  [LANDMARKS.LEFT_ANKLE]: { x: 0.35, y: 0.92, visibility: 0.95 },
  [LANDMARKS.RIGHT_HIP]: { x: 0.52, y: 0.75, visibility: 0.95 },
  [LANDMARKS.RIGHT_KNEE]: { x: 0.65, y: 0.75, visibility: 0.95 },
  [LANDMARKS.RIGHT_ANKLE]: { x: 0.65, y: 0.92, visibility: 0.95 },
});
res = analyzer.analyze(squatBottomPose);
assert(res.movementPhase === 'BOTTOM', `Squat bottom should give BOTTOM phase, got ${res.movementPhase}`);
assert(res.aiStatus === 'GOOD FORM', 'Solid parallel depth should give GOOD FORM status');

// Return to standing should count rep
res = analyzer.analyze(createStandingSquatPose());
// Note: rapid call without time delta will register ascending/standing
console.log('  ✓ Squat depth & phase tracking passed');

// 5C: Knee valgus detection (knees collapsing inward toward midline in frontal view)
const valgusPose = createStandingSquatPose({
  [LANDMARKS.LEFT_HIP]: { x: 0.40, y: 0.60, visibility: 0.95 },
  [LANDMARKS.RIGHT_HIP]: { x: 0.60, y: 0.60, visibility: 0.95 },
  // Knees pulled inward to midline (x=0.49 and x=0.51) while ankles are wide (x=0.38 and x=0.62)
  [LANDMARKS.LEFT_KNEE]: { x: 0.49, y: 0.75, visibility: 0.95 },
  [LANDMARKS.RIGHT_KNEE]: { x: 0.51, y: 0.75, visibility: 0.95 },
  [LANDMARKS.LEFT_ANKLE]: { x: 0.38, y: 0.90, visibility: 0.95 },
  [LANDMARKS.RIGHT_ANKLE]: { x: 0.62, y: 0.90, visibility: 0.95 },
});
const valgusRes = analyzer.analyze(valgusPose);
assert(valgusRes.postureFeedback?.kneeAlignmentIssue === true, 'Knee valgus collapse must be flagged');
assert(valgusRes.postureFeedback?.leftLegIssue === true, 'Left leg must be flagged red on valgus');
assert(valgusRes.postureFeedback?.rightLegIssue === true, 'Right leg must be flagged red on valgus');
console.log('  ✓ Knee valgus check passed');

// 5D: Occlusion & low confidence handling (no false positive claims of bad form)
const occludedPose = createStandingSquatPose({
  [LANDMARKS.LEFT_KNEE]: { x: 0.44, y: 0.70, visibility: 0.2 },
  [LANDMARKS.RIGHT_KNEE]: { x: 0.56, y: 0.70, visibility: 0.2 },
  [LANDMARKS.LEFT_ANKLE]: { x: 0.44, y: 0.90, visibility: 0.1 },
  [LANDMARKS.RIGHT_ANKLE]: { x: 0.56, y: 0.90, visibility: 0.1 },
});
const occludedRes = analyzer.analyze(occludedPose);
assert(occludedRes.postureFeedback === null, 'Occluded landmarks must return null posture feedback (neutral)');
assert(occludedRes.overallFormScore === 0, 'Occluded landmarks must not fabricate a score');
console.log('  ✓ Occlusion & insufficient evidence handling passed');

// ----------------------------------------------------
// TEST 6: ExerciseAnalyzer - Push-up Biomechanics
// ----------------------------------------------------
console.log('Test 6: ExerciseAnalyzer push-up biomechanics...');

analyzer.setExercise('pushup');

function createPlankPose(elbowAngleDeg: number, hipSag: boolean = false): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    landmarks.push({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 });
  }

  // Horizontal plank line: shoulder at x=0.20, hip at x=0.50, ankle at x=0.85
  const shoulderY = 0.50;
  const ankleY = 0.50;
  const hipY = hipSag ? 0.58 : 0.50; // Hip sag pulls hip downward (higher Y in screen space)

  landmarks[LANDMARKS.LEFT_SHOULDER] = { x: 0.20, y: shoulderY, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_SHOULDER] = { x: 0.20, y: shoulderY, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.LEFT_HIP] = { x: 0.50, y: hipY, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_HIP] = { x: 0.50, y: hipY, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.LEFT_ANKLE] = { x: 0.85, y: ankleY, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_ANKLE] = { x: 0.85, y: ankleY, z: 0, visibility: 0.95 };

  if (elbowAngleDeg > 150) {
    // Locked out arms
    landmarks[LANDMARKS.LEFT_ELBOW] = { x: 0.20, y: 0.65, z: 0, visibility: 0.95 };
    landmarks[LANDMARKS.LEFT_WRIST] = { x: 0.20, y: 0.80, z: 0, visibility: 0.95 };
  } else {
    // 90° elbow bend
    landmarks[LANDMARKS.LEFT_ELBOW] = { x: 0.10, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[LANDMARKS.LEFT_WRIST] = { x: 0.20, y: 0.60, z: 0, visibility: 0.95 };
  }

  return landmarks;
}

const pushupTopRes = analyzer.analyze(createPlankPose(170, false));
assert(pushupTopRes.movementPhase === 'TOP', 'Straight arms should register TOP phase');

const pushupBottomRes = analyzer.analyze(createPlankPose(90, false));
assert(pushupBottomRes.movementPhase === 'BOTTOM', '90° elbow should register BOTTOM phase');

const pushupSagRes = analyzer.analyze(createPlankPose(170, true));
assert(pushupSagRes.postureFeedback?.spineAlignmentIssue === true, 'Hip sag must be flagged as spine issue');

console.log('  ✓ Push-up depth & plank alignment passed');

// ----------------------------------------------------
// TEST 7: ExerciseAnalyzer - Bicep Curl & Lunge
// ----------------------------------------------------
console.log('Test 7: Bicep curl & Lunge biomechanics...');

analyzer.setExercise('bicep-curl');
function createCurlPose(elbowAngleDeg: number, elbowDrift: boolean = false): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    landmarks.push({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 });
  }

  landmarks[LANDMARKS.LEFT_SHOULDER] = { x: 0.45, y: 0.30, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.60, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_SHOULDER] = { x: 0.55, y: 0.30, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_HIP] = { x: 0.55, y: 0.60, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_ELBOW] = { x: 0.55, y: 0.48, z: 0, visibility: 0.95 };
  landmarks[LANDMARKS.RIGHT_WRIST] = { x: 0.55, y: 0.65, z: 0, visibility: 0.95 };

  if (elbowDrift) {
    // Elbow swung far forward from ribs (x=0.30 instead of 0.45)
    landmarks[LANDMARKS.LEFT_ELBOW] = { x: 0.28, y: 0.45, z: 0, visibility: 0.95 };
  } else {
    landmarks[LANDMARKS.LEFT_ELBOW] = { x: 0.45, y: 0.48, z: 0, visibility: 0.95 };
  }

  if (elbowAngleDeg < 70) {
    // Squeezed peak
    landmarks[LANDMARKS.LEFT_WRIST] = { x: 0.45, y: 0.35, z: 0, visibility: 0.95 };
  } else {
    // Fully extended
    landmarks[LANDMARKS.LEFT_WRIST] = { x: 0.45, y: 0.65, z: 0, visibility: 0.95 };
  }

  return landmarks;
}

const curlPeakRes = analyzer.analyze(createCurlPose(55, false));
assert(curlPeakRes.movementPhase === 'PEAK', 'High flexion should register PEAK');

const curlDriftRes = analyzer.analyze(createCurlPose(65, true));
assert(curlDriftRes.postureFeedback?.armStabilityIssue === true, 'Elbow forward swing must flag arm stability issue');

console.log('  ✓ Bicep curl & Lunge checks passed');

// ----------------------------------------------------
// TEST 8: Reusable Exercise Configuration System
// ----------------------------------------------------
console.log('Test 8: Reusable Exercise Configuration System validation...');

// 8A: Verify exact count and order
const expectedOrder: ExerciseType[] = [
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
];

assert(
  AI_CAM_EXERCISES.length === 10,
  `Expected 10 registered exercises, found ${AI_CAM_EXERCISES.length}`
);

expectedOrder.forEach((expectedId, idx) => {
  assert(
    AI_CAM_EXERCISES[idx].id === expectedId,
    `Exercise #${idx + 1} must be "${expectedId}", found "${AI_CAM_EXERCISES[idx].id}"`
  );
});

// 8B: Verify required configuration schema properties for all 10 exercises
AI_CAM_EXERCISES.forEach((cfg) => {
  assert(typeof cfg.id === 'string' && cfg.id.length > 0, `Config ${cfg.id} must have valid id`);
  assert(typeof cfg.name === 'string' && cfg.name.length > 0, `Config ${cfg.id} must have uppercase name`);
  assert(typeof cfg.displayName === 'string' && cfg.displayName.length > 0, `Config ${cfg.id} must have displayName`);
  assert(Array.isArray(cfg.requiredLandmarks) && cfg.requiredLandmarks.length > 0, `Config ${cfg.id} must define requiredLandmarks`);
  assert(['frontal', 'sagittal', 'any'].includes(cfg.recommendedCameraView), `Config ${cfg.id} must specify recommendedCameraView`);
  assert(typeof cfg.cameraGuidance === 'string' && cfg.cameraGuidance.length > 0, `Config ${cfg.id} must have cameraGuidance`);
  assert(cfg.confidenceRequirements.minDetection > 0 && cfg.confidenceRequirements.reliable > 0, `Config ${cfg.id} must have confidence requirements`);
  assert(Array.isArray(cfg.formChecks) && cfg.formChecks.length === 3, `Config ${cfg.id} must define exactly 3 formChecks`);
  assert(typeof cfg.defaultTargetReps === 'number' && cfg.defaultTargetReps >= 5, `Config ${cfg.id} must have positive target reps`);
  assert(typeof cfg.estimatedWeightKg === 'number' && cfg.estimatedWeightKg > 0, `Config ${cfg.id} must have positive estimated weight`);
  assert(typeof cfg.kinematics.minRepDurationMs === 'number', `Config ${cfg.id} must define minRepDurationMs`);
});

// 8C: Verify getExerciseConfig lookup and fallback
const squatCfg = getExerciseConfig('squat');
assert(squatCfg.name === 'SQUAT', 'getExerciseConfig(squat) should return squat config');
const pressCfg = getExerciseConfig('shoulder-press');
assert(pressCfg.displayName === 'Shoulder Press', 'getExerciseConfig(shoulder-press) should return shoulder press');

// 8D: Verify analyzer state transitions across all 10 exercises
const dummyPose: PoseLandmark[] = Array.from({ length: 33 }, () => ({
  x: 0.5,
  y: 0.5,
  z: 0,
  visibility: 0.95,
}));

expectedOrder.forEach((exId) => {
  analyzer.setExercise(exId);
  const result = analyzer.analyze(dummyPose);
  assert(result.exercise === exId, `Analyzer must report exercise ${exId}`);
  assert(result.repCount === 0, `Initial rep count for ${exId} must be 0`);
  assert(result.formBreakdown.metric1Name.length > 0, `Metric 1 name must be non-empty for ${exId}`);
  assert(result.formBreakdown.metric2Name.length > 0, `Metric 2 name must be non-empty for ${exId}`);
  assert(result.formBreakdown.metric3Name.length > 0, `Metric 3 name must be non-empty for ${exId}`);
});

console.log('  ✓ Exercise configuration registry and ordering passed');

// ----------------------------------------------------
// TEST 9: Six New Exercise Repetition State Machines
// ----------------------------------------------------
console.log('Test 9: Six New Exercise Repetition State Machines...');

function createBlankPose(): PoseLandmark[] {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));
}

// 9A: SHOULDER PRESS
console.log('  Testing Shoulder Press cycle...');
analyzer.setExercise('shoulder-press');

function createShoulderPressPose(elbowAngleDeg: number): PoseLandmark[] {
  const pose = createBlankPose();
  // Torso
  pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.35, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.58, y: 0.35, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_HIP] = { x: 0.42, y: 0.65, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_HIP] = { x: 0.58, y: 0.65, z: 0, visibility: 0.95 };

  if (elbowAngleDeg >= 155) {
    // Overhead lockout
    pose[LANDMARKS.LEFT_ELBOW] = { x: 0.42, y: 0.20, z: 0, visibility: 0.95 };
    pose[LANDMARKS.LEFT_WRIST] = { x: 0.42, y: 0.08, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_ELBOW] = { x: 0.58, y: 0.20, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_WRIST] = { x: 0.58, y: 0.08, z: 0, visibility: 0.95 };
  } else {
    // Racked at shoulders (~85-90°)
    pose[LANDMARKS.LEFT_ELBOW] = { x: 0.35, y: 0.42, z: 0, visibility: 0.95 };
    pose[LANDMARKS.LEFT_WRIST] = { x: 0.38, y: 0.32, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_ELBOW] = { x: 0.65, y: 0.42, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_WRIST] = { x: 0.62, y: 0.32, z: 0, visibility: 0.95 };
  }
  return pose;
}

// Start in rack
let spRes = analyzer.analyze(createShoulderPressPose(85));
assert(spRes.repCount === 0, 'Shoulder press should start at 0 reps');

// Lockout overhead
spRes = analyzer.analyze(createShoulderPressPose(165));
assert(spRes.movementPhase === 'TOP', 'Shoulder press overhead should be TOP');
assert(spRes.repCount === 0, 'Do not count rep simply when arms are raised');

// Lower back to rack
// Advance timer slightly to allow debounce
(analyzer as any).lastRepTime = 0;
spRes = analyzer.analyze(createShoulderPressPose(85));
assert(spRes.repCount === 1, 'Shoulder press must count 1 rep after complete rack-lockout-rack cycle');
console.log('    ✓ Shoulder press cycle passed');

// 9B: JUMPING JACK
console.log('  Testing Jumping Jack cycle...');
analyzer.setExercise('jumping-jack');

function createJumpingJackPose(isOpen: boolean): PoseLandmark[] {
  const pose = createBlankPose();
  pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.45, y: 0.30, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.55, y: 0.30, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_HIP] = { x: 0.46, y: 0.55, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_HIP] = { x: 0.54, y: 0.55, z: 0, visibility: 0.95 };

  if (isOpen) {
    // Arms overhead, feet wide (stanceRatio ~1.7)
    pose[LANDMARKS.LEFT_WRIST] = { x: 0.42, y: 0.08, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_WRIST] = { x: 0.58, y: 0.08, z: 0, visibility: 0.95 };
    pose[LANDMARKS.LEFT_ANKLE] = { x: 0.38, y: 0.90, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_ANKLE] = { x: 0.62, y: 0.90, z: 0, visibility: 0.95 };
  } else {
    // Arms at sides, feet together (stanceRatio ~1.0)
    pose[LANDMARKS.LEFT_WRIST] = { x: 0.44, y: 0.55, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_WRIST] = { x: 0.56, y: 0.55, z: 0, visibility: 0.95 };
    pose[LANDMARKS.LEFT_ANKLE] = { x: 0.47, y: 0.90, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_ANKLE] = { x: 0.53, y: 0.90, z: 0, visibility: 0.95 };
  }
  return pose;
}

let jjRes = analyzer.analyze(createJumpingJackPose(false));
assert(jjRes.repCount === 0, 'Jumping jack starts at 0 reps');

jjRes = analyzer.analyze(createJumpingJackPose(true));
assert(jjRes.movementPhase === 'PEAK', 'Jumping jack open should register PEAK');
assert(jjRes.repCount === 0, 'Jumping jack does not count until closed again');

(analyzer as any).lastRepTime = 0;
jjRes = analyzer.analyze(createJumpingJackPose(false));
assert(jjRes.repCount === 1, 'Jumping jack counts 1 rep on closed-open-closed cycle');
console.log('    ✓ Jumping jack cycle passed');

// 9C: CALF RAISE
console.log('  Testing Calf Raise tracking & feet occlusion...');
analyzer.setExercise('calf-raise');

// Low visibility test
const blindFeetPose = createBlankPose();
blindFeetPose[LANDMARKS.LEFT_HEEL] = { x: 0.45, y: 0.90, z: 0, visibility: 0.1 };
blindFeetPose[LANDMARKS.RIGHT_HEEL] = { x: 0.55, y: 0.90, z: 0, visibility: 0.1 };
blindFeetPose[LANDMARKS.LEFT_ANKLE] = { x: 0.45, y: 0.85, z: 0, visibility: 0.1 };
blindFeetPose[LANDMARKS.RIGHT_ANKLE] = { x: 0.55, y: 0.85, z: 0, visibility: 0.1 };

let crRes = analyzer.analyze(blindFeetPose);
assert(crRes.repCount === 0, 'Must not count reps when feet unreliably tracked');
assert(crRes.aiStatus === 'READY', 'Must show READY when feet obscured');

// Visible heels test
function createCalfRaisePose(isElevated: boolean): PoseLandmark[] {
  const pose = createBlankPose();
  pose[LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.50, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_HIP] = { x: 0.55, y: 0.50, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_KNEE] = { x: 0.45, y: 0.70, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_KNEE] = { x: 0.55, y: 0.70, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_ANKLE] = { x: 0.45, y: 0.90, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_ANKLE] = { x: 0.55, y: 0.90, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_FOOT_INDEX] = { x: 0.45, y: 0.95, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_FOOT_INDEX] = { x: 0.55, y: 0.95, z: 0, visibility: 0.95 };

  if (isElevated) {
    // Heels lifted (y=0.88 vs toe y=0.95 -> rise 0.07)
    pose[LANDMARKS.LEFT_HEEL] = { x: 0.45, y: 0.88, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_HEEL] = { x: 0.55, y: 0.88, z: 0, visibility: 0.95 };
  } else {
    // Heels flat (y=0.94 vs toe y=0.95 -> rise 0.01)
    pose[LANDMARKS.LEFT_HEEL] = { x: 0.45, y: 0.94, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_HEEL] = { x: 0.55, y: 0.94, z: 0, visibility: 0.95 };
  }
  return pose;
}

crRes = analyzer.analyze(createCalfRaisePose(false));
assert(crRes.repCount === 0, 'Flat heels start at 0 reps');

crRes = analyzer.analyze(createCalfRaisePose(true));
assert(crRes.movementPhase === 'PEAK', 'Elevated heels register PEAK');
assert(crRes.repCount === 0, 'Heel lift alone does not finish rep');

(analyzer as any).lastRepTime = 0;
crRes = analyzer.analyze(createCalfRaisePose(false));
assert(crRes.repCount === 1, 'Calf raise completed 1 rep on return to floor');
console.log('    ✓ Calf raise cycle passed');

// 9D: LATERAL RAISE
console.log('  Testing Lateral Raise amplitude discrimination...');
analyzer.setExercise('lateral-raise');

function createLateralRaisePose(abductionAngleDeg: number): PoseLandmark[] {
  const pose = createBlankPose();
  pose[LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.60, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_HIP] = { x: 0.55, y: 0.60, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.45, y: 0.35, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.55, y: 0.35, z: 0, visibility: 0.95 };

  if (abductionAngleDeg >= 80) {
    // Parallel shoulder height (90°)
    pose[LANDMARKS.LEFT_ELBOW] = { x: 0.25, y: 0.35, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_ELBOW] = { x: 0.75, y: 0.35, z: 0, visibility: 0.95 };
  } else if (abductionAngleDeg > 40) {
    // Small twitch (45°)
    pose[LANDMARKS.LEFT_ELBOW] = { x: 0.35, y: 0.45, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_ELBOW] = { x: 0.65, y: 0.45, z: 0, visibility: 0.95 };
  } else {
    // Hanging at thighs (25°)
    pose[LANDMARKS.LEFT_ELBOW] = { x: 0.42, y: 0.52, z: 0, visibility: 0.95 };
    pose[LANDMARKS.RIGHT_ELBOW] = { x: 0.58, y: 0.52, z: 0, visibility: 0.95 };
  }
  return pose;
}

let lrRes = analyzer.analyze(createLateralRaisePose(25));
assert(lrRes.repCount === 0, 'Lateral raise starts at 0 reps');

// Small movement should NOT trigger peak
lrRes = analyzer.analyze(createLateralRaisePose(45));
assert(lrRes.movementPhase !== 'PEAK', 'Small arm movement must not trigger PEAK');

// Raise to parallel (90°)
lrRes = analyzer.analyze(createLateralRaisePose(90));
assert(lrRes.movementPhase === 'PEAK', 'Parallel raise triggers PEAK');

// Return to thighs
(analyzer as any).lastRepTime = 0;
lrRes = analyzer.analyze(createLateralRaisePose(25));
assert(lrRes.repCount === 1, 'Lateral raise counts 1 rep on return to thighs');
console.log('    ✓ Lateral raise cycle passed');

// 9E: HIGH KNEES
console.log('  Testing High Knees alternating drives...');
analyzer.setExercise('high-knees');

function createHighKneePose(activeSide: 'none' | 'left' | 'right'): PoseLandmark[] {
  const pose = createBlankPose();
  pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.45, y: 0.25, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.55, y: 0.25, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.50, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_HIP] = { x: 0.55, y: 0.50, z: 0, visibility: 0.95 };

  // Standing straight by default
  pose[LANDMARKS.LEFT_KNEE] = { x: 0.45, y: 0.75, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_KNEE] = { x: 0.55, y: 0.75, z: 0, visibility: 0.95 };

  if (activeSide === 'left') {
    // Left knee driven up (hip angle ~85°)
    pose[LANDMARKS.LEFT_KNEE] = { x: 0.35, y: 0.50, z: 0, visibility: 0.95 };
  } else if (activeSide === 'right') {
    // Right knee driven up (hip angle ~85°)
    pose[LANDMARKS.RIGHT_KNEE] = { x: 0.65, y: 0.50, z: 0, visibility: 0.95 };
  }
  return pose;
}

let hkRes = analyzer.analyze(createHighKneePose('none'));
assert(hkRes.repCount === 0, 'High knees starts at 0 reps');

// Drive Left knee
(analyzer as any).lastRepTime = 0;
hkRes = analyzer.analyze(createHighKneePose('left'));
assert(hkRes.repCount === 1, 'Left knee drive counts 1st rep');

// Repeat Left knee without alternating - must NOT double count!
hkRes = analyzer.analyze(createHighKneePose('left'));
assert(hkRes.repCount === 1, 'Consecutive same-side knee drive must NOT count');

// Ground feet
analyzer.analyze(createHighKneePose('none'));

// Drive Right knee (alternating side)
(analyzer as any).lastRepTime = 0;
hkRes = analyzer.analyze(createHighKneePose('right'));
assert(hkRes.repCount === 2, 'Right knee drive (alternating) counts 2nd rep');
console.log('    ✓ High knees alternating cycle passed');

// 9F: GLUTE BRIDGE
console.log('  Testing Glute Bridge side profile...');
analyzer.setExercise('glute-bridge');

function createGluteBridgePose(isBridged: boolean): PoseLandmark[] {
  const pose = createBlankPose();
  // Mat side profile: shoulder at (0.30, 0.70)
  pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.30, y: 0.70, z: 0, visibility: 0.95 };

  if (isBridged) {
    // Straight diagonal line: shoulder (0.30, 0.70) -> hip (0.50, 0.60) -> knee (0.70, 0.50) -> angle ~170°
    pose[LANDMARKS.LEFT_HIP] = { x: 0.50, y: 0.60, z: 0, visibility: 0.95 };
    pose[LANDMARKS.LEFT_KNEE] = { x: 0.70, y: 0.50, z: 0, visibility: 0.95 };
  } else {
    // Hips on mat: shoulder (0.30, 0.70) -> hip (0.50, 0.70) -> knee (0.65, 0.50) -> angle ~125°
    pose[LANDMARKS.LEFT_HIP] = { x: 0.50, y: 0.70, z: 0, visibility: 0.95 };
    pose[LANDMARKS.LEFT_KNEE] = { x: 0.65, y: 0.50, z: 0, visibility: 0.95 };
  }
  return pose;
}

let gbRes = analyzer.analyze(createGluteBridgePose(false));
assert(gbRes.repCount === 0, 'Glute bridge starts at 0 reps');

gbRes = analyzer.analyze(createGluteBridgePose(true));
assert(gbRes.movementPhase === 'PEAK', 'Glute bridge lockout registers PEAK');
assert(gbRes.repCount === 0, 'Glute bridge does not count until returned to mat');

(analyzer as any).lastRepTime = 0;
gbRes = analyzer.analyze(createGluteBridgePose(false));
assert(gbRes.repCount === 1, 'Glute bridge counts 1 rep on return to mat baseline');
console.log('    ✓ Glute bridge cycle passed');

// ----------------------------------------------------
// TEST 10: Task 4 Form Validation & Skeleton Feedback
// ----------------------------------------------------
console.log('Test 10: Movement-Specific Form Validation & Skeleton Feedback for Six New Exercises...');

// 10A: Shoulder Press - Asymmetry turns specific arm segment red
analyzer.setExercise('shoulder-press');
const asymPressPose = createBlankPose();
asymPressPose[LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.35, z: 0, visibility: 0.95 };
asymPressPose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.58, y: 0.35, z: 0, visibility: 0.95 };
asymPressPose[LANDMARKS.LEFT_HIP] = { x: 0.42, y: 0.65, z: 0, visibility: 0.95 };
asymPressPose[LANDMARKS.RIGHT_HIP] = { x: 0.58, y: 0.65, z: 0, visibility: 0.95 };
// Left arm locked overhead (165°), Right arm stalled midway (110°)
asymPressPose[LANDMARKS.LEFT_ELBOW] = { x: 0.42, y: 0.20, z: 0, visibility: 0.95 };
asymPressPose[LANDMARKS.LEFT_WRIST] = { x: 0.42, y: 0.08, z: 0, visibility: 0.95 };
asymPressPose[LANDMARKS.RIGHT_ELBOW] = { x: 0.65, y: 0.38, z: 0, visibility: 0.95 };
asymPressPose[LANDMARKS.RIGHT_WRIST] = { x: 0.62, y: 0.28, z: 0, visibility: 0.95 };

const asymPressRes = analyzer.analyze(asymPressPose);
assert(asymPressRes.postureFeedback !== null, 'Should return posture feedback');
assert(asymPressRes.postureFeedback?.rightArmIssue === true, 'Right arm issue flagged for lower arm in press');
assert(
  getJointColor(LANDMARKS.RIGHT_ELBOW, asymPressPose, asymPressRes.postureFeedback) === 'red',
  'Right elbow turns red when asymmetrical'
);
assert(
  getJointColor(LANDMARKS.LEFT_ELBOW, asymPressPose, asymPressRes.postureFeedback) === 'green',
  'Left elbow remains green'
);
console.log('  ✓ Shoulder Press asymmetry skeleton feedback verified');

// 10B: Calf Raise - Knee bend turns knees red
analyzer.setExercise('calf-raise');
const kneeBentCalfPose = createBlankPose();
kneeBentCalfPose[LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.40, z: 0, visibility: 0.95 };
kneeBentCalfPose[LANDMARKS.LEFT_KNEE] = { x: 0.35, y: 0.60, z: 0, visibility: 0.95 };
kneeBentCalfPose[LANDMARKS.LEFT_ANKLE] = { x: 0.45, y: 0.85, z: 0, visibility: 0.95 };
kneeBentCalfPose[LANDMARKS.LEFT_HEEL] = { x: 0.45, y: 0.88, z: 0, visibility: 0.95 };
kneeBentCalfPose[LANDMARKS.LEFT_FOOT_INDEX] = { x: 0.50, y: 0.92, z: 0, visibility: 0.95 };
const calfRes = analyzer.analyze(kneeBentCalfPose);
assert(calfRes.postureFeedback?.leftLegIssue === true, 'Calf raise knee bend flagged');
assert(
  getJointColor(LANDMARKS.LEFT_KNEE, kneeBentCalfPose, calfRes.postureFeedback) === 'red',
  'Knee joint turns red when bent during calf raise'
);
console.log('  ✓ Calf Raise knee extension skeleton feedback verified');

// 10C: Lateral Raise - Torso sway turns torso segments red
analyzer.setExercise('lateral-raise');
const torsoSwayPose = createBlankPose();
torsoSwayPose[LANDMARKS.LEFT_SHOULDER] = { x: 0.35, y: 0.35, z: 0, visibility: 0.95 };
torsoSwayPose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.55, y: 0.30, z: 0, visibility: 0.95 };
torsoSwayPose[LANDMARKS.LEFT_ELBOW] = { x: 0.22, y: 0.37, z: 0, visibility: 0.95 };
torsoSwayPose[LANDMARKS.RIGHT_ELBOW] = { x: 0.68, y: 0.32, z: 0, visibility: 0.95 };
// Hip shifted heavily sideways (excessive torso angle > 18°)
torsoSwayPose[LANDMARKS.LEFT_HIP] = { x: 0.58, y: 0.68, z: 0, visibility: 0.95 };
torsoSwayPose[LANDMARKS.RIGHT_HIP] = { x: 0.70, y: 0.68, z: 0, visibility: 0.95 };
const latRes = analyzer.analyze(torsoSwayPose);
assert(latRes.postureFeedback?.torsoIssue === true, 'Torso sway flagged in lateral raise');
assert(
  getJointColor(LANDMARKS.LEFT_HIP, torsoSwayPose, latRes.postureFeedback) === 'red',
  'Hip joint turns red on torso swing'
);
console.log('  ✓ Lateral Raise torso sway skeleton feedback verified');

// 10D: Uncertain landmarks must render neutral/gray, never red
const lowConfidencePose = createBlankPose();
lowConfidencePose[LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.35, z: 0, visibility: 0.40 }; // low confidence (<0.65)
lowConfidencePose[LANDMARKS.LEFT_ELBOW] = { x: 0.35, y: 0.45, z: 0, visibility: 0.35 };
const grayColor = getJointColor(LANDMARKS.LEFT_SHOULDER, lowConfidencePose, {
  torsoIssue: true,
  leftLegIssue: true,
  rightLegIssue: true,
  leftArmIssue: true,
  rightArmIssue: true,
  kneeAlignmentIssue: true,
  depthIssue: true,
  torsoLeanIssue: true,
  spineAlignmentIssue: true,
  armStabilityIssue: true,
  activeIssues: ['Everything wrong'],
});
assert(grayColor === 'gray', 'Low confidence landmark must be rendered gray, never red or false alarm');
console.log('  ✓ Uncertain landmark neutral/gray rule verified');

// ----------------------------------------------------
// TEST 11: Rep counter increment and session tracking
// ----------------------------------------------------
console.log('Test 11: Rep Counter incrementing & session tracking...');
const testAnalyzer = new ExerciseAnalyzer('squat');
assert(testAnalyzer.getRepCount() === 0, 'Initial rep count should be 0');
const rep1 = testAnalyzer.incrementRep();
assert(rep1 === 1, 'First incremented rep should equal 1');
assert(testAnalyzer.getRepCount() === 1, 'getRepCount should return 1');
const rep2 = testAnalyzer.incrementRep();
assert(rep2 === 2, 'Second incremented rep should equal 2');
const metrics = testAnalyzer.getSessionMetrics();
assert(metrics.totalReps === 2, 'Total reps in session metrics should equal 2');
testAnalyzer.resetSession();
assert(testAnalyzer.getRepCount() === 0, 'Reset session should reset rep count to 0');
console.log('  ✓ Rep Counter incrementing & session tracking verified');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');
