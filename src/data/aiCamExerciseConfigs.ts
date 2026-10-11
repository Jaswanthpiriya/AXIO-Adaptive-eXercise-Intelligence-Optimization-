/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO AI CAM — Reusable Exercise Configuration System
 * Centralized biomechanical definitions, landmark requirements, camera setup,
 * joint kinematic rules, real-time form checks, and coaching cues.
 */

// MediaPipe 33-Pose Landmark Indices
export const POSE_LANDMARK_INDEX = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export type ExerciseType =
  | 'squat'
  | 'pushup'
  | 'bicep-curl'
  | 'lunge'
  | 'shoulder-press'
  | 'jumping-jack'
  | 'calf-raise'
  | 'lateral-raise'
  | 'high-knees'
  | 'glute-bridge';

export type CameraViewRecommendation = 'frontal' | 'sagittal' | 'any';

export type LimbExecutionMode =
  | 'bilateral'
  | 'unilateral_either'
  | 'unilateral_alternating'
  | 'upper_body'
  | 'lower_body';

export interface ExerciseFormCheckDef {
  id: string;
  label: string;
  metricKey: 'metric1' | 'metric2' | 'metric3';
  description: string;
  idealCriteria: string;
  warningStatus: string;
  goodStatus: string;
  cueOnFault: string;
}

export interface ExerciseKinematicsDef {
  primaryAngles: {
    label: string;
    description: string;
    startRange: [number, number];
    inflectionThreshold: number;
    completionThreshold: number;
  }[];
  startPositionDescription: string;
  inflectionDescription: string;
  completionDescription: string;
  minRepDurationMs: number;
  movementToleranceDeg: number;
}

export interface ExerciseConfig {
  id: ExerciseType;
  name: string;
  displayName: string;
  shortDescription: string;
  category: 'Lower Body' | 'Upper Body' | 'Full Body' | 'Core & Posterior Chain';
  recommendedCameraView: CameraViewRecommendation;
  cameraGuidance: string;
  requiredLandmarks: number[];
  limbExecutionMode: LimbExecutionMode;
  confidenceRequirements: {
    minDetection: number;
    reliable: number;
  };
  smoothing: {
    poseAlpha: number;
    handTracking: boolean;
  };
  kinematics: ExerciseKinematicsDef;
  formChecks: [ExerciseFormCheckDef, ExerciseFormCheckDef, ExerciseFormCheckDef];
  coachingCues: {
    setup: string;
    repComplete: string;
    faults: { issue: string; cue: string }[];
  };
  defaultTargetReps: number;
  estimatedWeightKg: number;
  isImplemented: boolean;
}

/**
 * Ordered list of all supported AXIO AI CAM exercises.
 * Preserves the 4 original exercises, followed by the 6 new exercises in exact order:
 * 1. Shoulder Press
 * 2. Jumping Jack
 * 3. Calf Raise
 * 4. Lateral Raise
 * 5. High Knees
 * 6. Glute Bridge
 */
export const AI_CAM_EXERCISES: ExerciseConfig[] = [
  // =========================================================================
  // 1. SQUAT (Existing)
  // =========================================================================
  {
    id: 'squat',
    name: 'SQUAT',
    displayName: 'Squat',
    shortDescription: 'Compound lower-body knee flexion and hip hinge movement',
    category: 'Lower Body',
    recommendedCameraView: 'frontal',
    cameraGuidance: 'Step back 6-8 ft so hips, knees, and feet are fully visible',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
      POSE_LANDMARK_INDEX.LEFT_KNEE,
      POSE_LANDMARK_INDEX.RIGHT_KNEE,
      POSE_LANDMARK_INDEX.LEFT_ANKLE,
      POSE_LANDMARK_INDEX.RIGHT_ANKLE,
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
    ],
    limbExecutionMode: 'bilateral',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.65,
      handTracking: true,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Knee Angle',
          description: 'Femur to tibia sagittal knee flexion',
          startRange: [155, 180],
          inflectionThreshold: 100,
          completionThreshold: 155,
        },
        {
          label: 'Torso Incline',
          description: 'Spine inclination angle from vertical',
          startRange: [0, 30],
          inflectionThreshold: 55,
          completionThreshold: 30,
        },
      ],
      startPositionDescription: 'Standing upright with knees extended (>155°)',
      inflectionDescription: 'Thighs at or below parallel to the floor (≤100° knee bend)',
      completionDescription: 'Full extension back to upright athletic stance (>155°)',
      minRepDurationMs: 800,
      movementToleranceDeg: 10,
    },
    formChecks: [
      {
        id: 'squat-knee-alignment',
        label: 'KNEE ALIGNMENT',
        metricKey: 'metric1',
        description: 'Tracking knees in line with toes, preventing valgus inward collapse',
        idealCriteria: 'Knees maintain lateral alignment without caving inward',
        warningStatus: 'KEEP ALIGNED',
        goodStatus: 'GOOD',
        cueOnFault: 'Drive knees outward in line with toes',
      },
      {
        id: 'squat-back-position',
        label: 'BACK POSITION',
        metricKey: 'metric3',
        description: 'Maintaining an upright thoracic posture and neutral spine',
        idealCriteria: 'Torso inclination stays under 55° from vertical',
        warningStatus: 'KEEP UPRIGHT',
        goodStatus: 'GOOD',
        cueOnFault: 'Keep chest up and torso upright',
      },
      {
        id: 'squat-depth',
        label: 'DEPTH',
        metricKey: 'metric2',
        description: 'Achieving parallel femur depth relative to the knee joint',
        idealCriteria: 'Knee angle reaches ≤100° at bottom of descent',
        warningStatus: 'GO LOWER',
        goodStatus: 'OPTIMAL',
        cueOnFault: 'Squat deeper to parallel',
      },
    ],
    coachingCues: {
      setup: 'Ready · Begin squat descent',
      repComplete: 'Rep complete · Stand tall',
      faults: [
        { issue: 'Knees collapsing inward', cue: 'Drive knees outward in line with toes' },
        { issue: 'Excessive forward torso lean', cue: 'Keep chest up and torso upright' },
        { issue: 'Incomplete squat depth', cue: 'Squat deeper to parallel' },
      ],
    },
    defaultTargetReps: 15,
    estimatedWeightKg: 80,
    isImplemented: true,
  },

  // =========================================================================
  // 2. PUSH-UP (Existing)
  // =========================================================================
  {
    id: 'pushup',
    name: 'PUSH-UP',
    displayName: 'Push-up',
    shortDescription: 'Horizontal upper-body press and core stabilization',
    category: 'Upper Body',
    recommendedCameraView: 'sagittal',
    cameraGuidance: 'Place device at floor or chair level with a side profile view',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
      POSE_LANDMARK_INDEX.LEFT_ELBOW,
      POSE_LANDMARK_INDEX.RIGHT_ELBOW,
      POSE_LANDMARK_INDEX.LEFT_WRIST,
      POSE_LANDMARK_INDEX.RIGHT_WRIST,
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
      POSE_LANDMARK_INDEX.LEFT_ANKLE,
      POSE_LANDMARK_INDEX.RIGHT_ANKLE,
    ],
    limbExecutionMode: 'bilateral',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.65,
      handTracking: false,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Elbow Angle',
          description: 'Humerus to forearm flexion in push-up descent',
          startRange: [155, 180],
          inflectionThreshold: 95,
          completionThreshold: 155,
        },
        {
          label: 'Hip/Spine Line',
          description: 'Plank angle along shoulder, hip, and ankle axis',
          startRange: [160, 180],
          inflectionThreshold: 155,
          completionThreshold: 160,
        },
      ],
      startPositionDescription: 'Full high plank lockout with elbows extended (>155°)',
      inflectionDescription: 'Chest lowered until elbows bend to 90° or deeper (≤95°)',
      completionDescription: 'Press back up to complete arm lockout (>155°)',
      minRepDurationMs: 800,
      movementToleranceDeg: 8,
    },
    formChecks: [
      {
        id: 'pushup-back-position',
        label: 'BACK POSITION',
        metricKey: 'metric2',
        description: 'Rigid plank alignment across shoulders, hips, and ankles',
        idealCriteria: 'Spine line stays straight above 155° without sag or pike',
        warningStatus: 'STRAIGHTEN CORE',
        goodStatus: 'GOOD',
        cueOnFault: 'Engage core to maintain a straight plank line',
      },
      {
        id: 'pushup-depth',
        label: 'DEPTH',
        metricKey: 'metric1',
        description: 'Lowering torso until elbows reach right-angle flexion',
        idealCriteria: 'Elbow angle reaches ≤95° at bottom of press',
        warningStatus: 'GO LOWER',
        goodStatus: 'OPTIMAL',
        cueOnFault: 'Lower chest to 90° elbow bend',
      },
      {
        id: 'pushup-arm-position',
        label: 'ARM POSITION',
        metricKey: 'metric3',
        description: 'Tucking elbows at 45° to protect anterior shoulder capsule',
        idealCriteria: 'Forearms track vertically without excessive elbow flaring',
        warningStatus: 'TUCK ELBOWS',
        goodStatus: 'GOOD',
        cueOnFault: 'Tuck elbows at 45° angle to ribs',
      },
    ],
    coachingCues: {
      setup: 'Plank hold · Lower chest with control',
      repComplete: 'Rep complete · Lock out',
      faults: [
        { issue: 'Hip sag in plank', cue: 'Engage core to prevent hip sag' },
        { issue: 'Hips elevated above plank line', cue: 'Lower hips into straight plank line' },
        { issue: 'Incomplete push-up depth', cue: 'Lower chest to 90° elbow bend' },
      ],
    },
    defaultTargetReps: 15,
    estimatedWeightKg: 55,
    isImplemented: true,
  },

  // =========================================================================
  // 3. BICEP CURL (Existing)
  // =========================================================================
  {
    id: 'bicep-curl',
    name: 'BICEP CURL',
    displayName: 'Bicep Curl',
    shortDescription: 'Unilateral or bilateral elbow flexion with humeral stability',
    category: 'Upper Body',
    recommendedCameraView: 'frontal',
    cameraGuidance: 'Position upper body, elbows, and wrists clearly in frame',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
      POSE_LANDMARK_INDEX.LEFT_ELBOW,
      POSE_LANDMARK_INDEX.RIGHT_ELBOW,
      POSE_LANDMARK_INDEX.LEFT_WRIST,
      POSE_LANDMARK_INDEX.RIGHT_WRIST,
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
    ],
    limbExecutionMode: 'unilateral_either',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.65,
      handTracking: true,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Elbow Flexion',
          description: 'Forearm to upper arm flexion angle',
          startRange: [145, 180],
          inflectionThreshold: 60,
          completionThreshold: 145,
        },
        {
          label: 'Torso-Arm Drift',
          description: 'Humerus angle relative to torso ribcage',
          startRange: [0, 25],
          inflectionThreshold: 40,
          completionThreshold: 25,
        },
      ],
      startPositionDescription: 'Full extension at thighs (>145° elbow angle)',
      inflectionDescription: 'Peak contraction curl toward anterior shoulder (≤60°)',
      completionDescription: 'Controlled eccentric return to complete arm hang (>145°)',
      minRepDurationMs: 800,
      movementToleranceDeg: 8,
    },
    formChecks: [
      {
        id: 'curl-elbow-position',
        label: 'ELBOW POSITION',
        metricKey: 'metric2',
        description: 'Pinning elbows against lateral ribs without anterior swinging',
        idealCriteria: 'Humeral drift remains under 40° during concentric phase',
        warningStatus: 'PIN ELBOWS',
        goodStatus: 'GOOD',
        cueOnFault: 'Keep elbows pinned to your sides',
      },
      {
        id: 'curl-range-of-motion',
        label: 'RANGE OF MOTION',
        metricKey: 'metric1',
        description: 'Curling weight fully into bicep peak contraction',
        idealCriteria: 'Elbow angle closes to ≤60° at top of curl',
        warningStatus: 'SQUEEZE HIGHER',
        goodStatus: 'FULL PEAK',
        cueOnFault: 'Squeeze biceps all the way to top',
      },
      {
        id: 'curl-extension',
        label: 'EXTENSION',
        metricKey: 'metric3',
        description: 'Extending arm fully between repetitions',
        idealCriteria: 'Elbow returns to >145° before next repetition begins',
        warningStatus: 'FULL EXTENSION',
        goodStatus: 'GOOD',
        cueOnFault: 'Lower weight to complete extension',
      },
    ],
    coachingCues: {
      setup: 'Extended · Squeeze biceps to curl',
      repComplete: 'Rep complete · Full extension',
      faults: [
        { issue: 'Elbow swinging forward', cue: 'Keep elbows pinned to your sides' },
        { issue: 'Incomplete curl', cue: 'Squeeze all the way to top' },
      ],
    },
    defaultTargetReps: 12,
    estimatedWeightKg: 20,
    isImplemented: true,
  },

  // =========================================================================
  // 4. LUNGE (Existing)
  // =========================================================================
  {
    id: 'lunge',
    name: 'LUNGE',
    displayName: 'Lunge',
    shortDescription: 'Unilateral split-squat knee flexion and pelvic stabilization',
    category: 'Lower Body',
    recommendedCameraView: 'sagittal',
    cameraGuidance: 'Step back with a diagonal or side profile view of stride length',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
      POSE_LANDMARK_INDEX.LEFT_KNEE,
      POSE_LANDMARK_INDEX.RIGHT_KNEE,
      POSE_LANDMARK_INDEX.LEFT_ANKLE,
      POSE_LANDMARK_INDEX.RIGHT_ANKLE,
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
    ],
    limbExecutionMode: 'unilateral_alternating',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.65,
      handTracking: false,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Front Knee',
          description: 'Working lead leg knee angle',
          startRange: [155, 180],
          inflectionThreshold: 100,
          completionThreshold: 155,
        },
        {
          label: 'Torso Angle',
          description: 'Spine verticality during split descent',
          startRange: [0, 25],
          inflectionThreshold: 35,
          completionThreshold: 25,
        },
      ],
      startPositionDescription: 'Standing tall with feet together or staggered (>155°)',
      inflectionDescription: 'Lead knee flexes to 90° with back knee lowering toward floor (≤100°)',
      completionDescription: 'Drive through lead heel to return to standing (>155°)',
      minRepDurationMs: 800,
      movementToleranceDeg: 10,
    },
    formChecks: [
      {
        id: 'lunge-knee-alignment',
        label: 'KNEE ALIGNMENT',
        metricKey: 'metric3',
        description: 'Lead knee tracks stably over mid-foot without lateral wobble',
        idealCriteria: 'Working knee maintains stable alignment over ankle',
        warningStatus: 'STABILIZE KNEE',
        goodStatus: 'GOOD',
        cueOnFault: 'Stabilize front knee in line with toe',
      },
      {
        id: 'lunge-back-position',
        label: 'BACK POSITION',
        metricKey: 'metric2',
        description: 'Keeping torso upright and shoulders stacked above hips',
        idealCriteria: 'Torso lean stays under 35° from vertical',
        warningStatus: 'KEEP UPRIGHT',
        goodStatus: 'GOOD',
        cueOnFault: 'Keep torso upright',
      },
      {
        id: 'lunge-depth',
        label: 'DEPTH',
        metricKey: 'metric1',
        description: 'Dropping hips straight down to 90° front knee bend',
        idealCriteria: 'Front knee angle reaches ≤100° at bottom of stride',
        warningStatus: 'GO LOWER',
        goodStatus: 'OPTIMAL',
        cueOnFault: 'Lower front knee to 90° bend',
      },
    ],
    coachingCues: {
      setup: 'Step forward · Prepare lunge',
      repComplete: 'Rep complete · Stand tall',
      faults: [
        { issue: 'Torso leaning forward', cue: 'Keep torso upright' },
        { issue: 'Incomplete front knee depth', cue: 'Lower front knee to 90° bend' },
      ],
    },
    defaultTargetReps: 12,
    estimatedWeightKg: 70,
    isImplemented: true,
  },

  // =========================================================================
  // 5. SHOULDER PRESS (New - #1)
  // =========================================================================
  {
    id: 'shoulder-press',
    name: 'SHOULDER PRESS',
    displayName: 'Shoulder Press',
    shortDescription: 'Vertical overhead press strengthening anterior deltoids and triceps',
    category: 'Upper Body',
    recommendedCameraView: 'frontal',
    cameraGuidance: 'Position camera so head, torso, and full overhead reach fit inside the frame',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
      POSE_LANDMARK_INDEX.LEFT_ELBOW,
      POSE_LANDMARK_INDEX.RIGHT_ELBOW,
      POSE_LANDMARK_INDEX.LEFT_WRIST,
      POSE_LANDMARK_INDEX.RIGHT_WRIST,
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
    ],
    limbExecutionMode: 'bilateral',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.65,
      handTracking: true,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Elbow Lockout',
          description: 'Forearm to upper arm extension overhead',
          startRange: [70, 95],
          inflectionThreshold: 160,
          completionThreshold: 95,
        },
        {
          label: 'Wrist-Elbow Line',
          description: 'Forearm verticality under barbell or dumbbells',
          startRange: [80, 100],
          inflectionThreshold: 90,
          completionThreshold: 90,
        },
      ],
      startPositionDescription: 'Weights racked at clavicle / chin height with elbows at ~85°',
      inflectionDescription: 'Press vertically overhead into complete arm lockout (≥160° elbow angle)',
      completionDescription: 'Controlled eccentric return back to chin / collarbone rack (≤95°)',
      minRepDurationMs: 800,
      movementToleranceDeg: 10,
    },
    formChecks: [
      {
        id: 'press-overhead-lockout',
        label: 'OVERHEAD LOCKOUT',
        metricKey: 'metric1',
        description: 'Reaching complete overhead extension without soft elbows',
        idealCriteria: 'Both elbows extend to ≥160° at apex of press',
        warningStatus: 'LOCK OUT',
        goodStatus: 'LOCKED',
        cueOnFault: 'Press fully overhead to lock out',
      },
      {
        id: 'press-elbow-path',
        label: 'ELBOW PATH',
        metricKey: 'metric2',
        description: 'Tracking elbows in the scapular plane (~45°) without extreme flare',
        idealCriteria: 'Elbows track in front of shoulders without excessive backward flare',
        warningStatus: 'TUCK IN FRONT',
        goodStatus: 'ALIGNED',
        cueOnFault: 'Press slightly in front of face in scapular plane',
      },
      {
        id: 'press-lumbar-arch',
        label: 'CORE STABILITY',
        metricKey: 'metric3',
        description: 'Bracing ribs and pelvis to avoid backward spinal hyperextension',
        idealCriteria: 'Torso remains vertical without backward leaning compensation',
        warningStatus: 'BRACE CORE',
        goodStatus: 'STABLE',
        cueOnFault: 'Brace core to prevent arching your lower back',
      },
    ],
    coachingCues: {
      setup: 'Racked at shoulders · Press overhead',
      repComplete: 'Rep complete · Lower with control',
      faults: [
        { issue: 'Incomplete overhead extension', cue: 'Lock out elbows fully overhead' },
        { issue: 'Excessive lumbar hyperextension', cue: 'Tighten core and glutes to stay upright' },
        { issue: 'Asymmetrical press height', cue: 'Press both hands upward simultaneously' },
      ],
    },
    defaultTargetReps: 12,
    estimatedWeightKg: 35,
    isImplemented: true,
  },

  // =========================================================================
  // 6. JUMPING JACK (New - #2)
  // =========================================================================
  {
    id: 'jumping-jack',
    name: 'JUMPING JACK',
    displayName: 'Jumping Jack',
    shortDescription: 'Full-body cardiovascular calisthenic with synchronous arm and leg abduction',
    category: 'Full Body',
    recommendedCameraView: 'frontal',
    cameraGuidance: 'Step back 7-9 ft so entire body from head to feet and full arm span are in view',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
      POSE_LANDMARK_INDEX.LEFT_WRIST,
      POSE_LANDMARK_INDEX.RIGHT_WRIST,
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
      POSE_LANDMARK_INDEX.LEFT_ANKLE,
      POSE_LANDMARK_INDEX.RIGHT_ANKLE,
    ],
    limbExecutionMode: 'bilateral',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.6,
      handTracking: false,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Arm Abduction',
          description: 'Angle of arms relative to torso midline',
          startRange: [0, 30],
          inflectionThreshold: 140,
          completionThreshold: 35,
        },
        {
          label: 'Stance Width Ratio',
          description: 'Ankle distance divided by shoulder width',
          startRange: [0.6, 1.1],
          inflectionThreshold: 1.8,
          completionThreshold: 1.1,
        },
      ],
      startPositionDescription: 'Feet together with arms resting at sides (<35° arm abduction)',
      inflectionDescription: 'Feet jump wide (>1.8x shoulder width) while hands reach overhead (≥140°)',
      completionDescription: 'Jump back to feet together with arms return to sides (<35°)',
      minRepDurationMs: 500,
      movementToleranceDeg: 12,
    },
    formChecks: [
      {
        id: 'jack-arm-reach',
        label: 'OVERHEAD REACH',
        metricKey: 'metric1',
        description: 'Raising arms fully overhead until hands nearly touch',
        idealCriteria: 'Shoulder abduction reaches ≥140° at top of jump',
        warningStatus: 'REACH HIGHER',
        goodStatus: 'FULL REACH',
        cueOnFault: 'Raise arms all the way overhead',
      },
      {
        id: 'jack-stance-width',
        label: 'STANCE WIDTH',
        metricKey: 'metric2',
        description: 'Jumping feet out past shoulder width for full kinetic excursion',
        idealCriteria: 'Ankle distance exceeds 1.8x shoulder width on open jump',
        warningStatus: 'STEP WIDER',
        goodStatus: 'WIDE STANCE',
        cueOnFault: 'Jump feet wider than shoulder width',
      },
      {
        id: 'jack-landing-cadence',
        label: 'RHYTHM & TEMPO',
        metricKey: 'metric3',
        description: 'Landing softly on balls of feet with athletic knee bend',
        idealCriteria: 'Continuous fluid rhythm without jarring heel impacts',
        warningStatus: 'SOFT LANDINGS',
        goodStatus: 'IN RHYTHM',
        cueOnFault: 'Land softly on balls of feet with light knee bend',
      },
    ],
    coachingCues: {
      setup: 'Feet together · Begin jumping jack',
      repComplete: 'Rep complete · Keep the rhythm',
      faults: [
        { issue: 'Incomplete arm raise', cue: 'Bring arms all the way overhead' },
        { issue: 'Narrow foot spread', cue: 'Jump feet wider apart' },
      ],
    },
    defaultTargetReps: 25,
    estimatedWeightKg: 10,
    isImplemented: true,
  },

  // =========================================================================
  // 7. CALF RAISE (New - #3)
  // =========================================================================
  {
    id: 'calf-raise',
    name: 'CALF RAISE',
    displayName: 'Calf Raise',
    shortDescription: 'Triple-extension gastrocnemius and soleus ankle plantarflexion',
    category: 'Lower Body',
    recommendedCameraView: 'any',
    cameraGuidance: 'Aim camera at mid-body or floor so feet, ankles, and knees are clear',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_KNEE,
      POSE_LANDMARK_INDEX.RIGHT_KNEE,
      POSE_LANDMARK_INDEX.LEFT_ANKLE,
      POSE_LANDMARK_INDEX.RIGHT_ANKLE,
      POSE_LANDMARK_INDEX.LEFT_HEEL,
      POSE_LANDMARK_INDEX.RIGHT_HEEL,
      POSE_LANDMARK_INDEX.LEFT_FOOT_INDEX,
      POSE_LANDMARK_INDEX.RIGHT_FOOT_INDEX,
    ],
    limbExecutionMode: 'bilateral',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.7,
      handTracking: false,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Ankle Plantarflexion',
          description: 'Elevation of heels above ground reference',
          startRange: [0, 5],
          inflectionThreshold: 20,
          completionThreshold: 6,
        },
        {
          label: 'Knee Extension',
          description: 'Knee straightness during plantarflexion push',
          startRange: [165, 180],
          inflectionThreshold: 165,
          completionThreshold: 165,
        },
      ],
      startPositionDescription: 'Feet flat on floor with heels grounded and knees extended',
      inflectionDescription: 'Drive up onto toes to maximal heel elevation with brief peak pause',
      completionDescription: 'Lower heels under eccentric control back to floor contact',
      minRepDurationMs: 800,
      movementToleranceDeg: 5,
    },
    formChecks: [
      {
        id: 'calf-peak-elevation',
        label: 'HEEL ELEVATION',
        metricKey: 'metric1',
        description: 'Rising to full extension on the balls of your feet',
        idealCriteria: 'Heels achieve clear vertical displacement above resting position',
        warningStatus: 'PUSH HIGHER',
        goodStatus: 'FULL HEIGHT',
        cueOnFault: 'Drive up onto big toes for maximum height',
      },
      {
        id: 'calf-knee-lock',
        label: 'KNEE EXTENSION',
        metricKey: 'metric2',
        description: 'Keeping knees locked straight to target the gastrocnemius muscle',
        idealCriteria: 'Knee angle stays ≥165° without squatting or bouncing',
        warningStatus: 'KEEP LEGS STRAIGHT',
        goodStatus: 'LOCKED',
        cueOnFault: 'Keep knees straight without bending forward',
      },
      {
        id: 'calf-tempo-control',
        label: 'TEMPO CONTROL',
        metricKey: 'metric3',
        description: 'Controlling eccentric lowering instead of dropping suddenly',
        idealCriteria: 'Smooth 2-second eccentric lowering without bouncing off ground',
        warningStatus: 'SLOW DOWN',
        goodStatus: 'CONTROLLED',
        cueOnFault: 'Lower heels slowly with control',
      },
    ],
    coachingCues: {
      setup: 'Heels flat · Drive up onto toes',
      repComplete: 'Rep complete · Lower heels slowly',
      faults: [
        { issue: 'Insufficient heel rise', cue: 'Push higher onto the balls of your feet' },
        { issue: 'Knees bending to assist', cue: 'Keep knees straight throughout the raise' },
      ],
    },
    defaultTargetReps: 20,
    estimatedWeightKg: 70,
    isImplemented: true,
  },

  // =========================================================================
  // 8. LATERAL RAISE (New - #4)
  // =========================================================================
  {
    id: 'lateral-raise',
    name: 'LATERAL RAISE',
    displayName: 'Lateral Raise',
    shortDescription: 'Shoulder coronal plane abduction isolating lateral deltoids',
    category: 'Upper Body',
    recommendedCameraView: 'frontal',
    cameraGuidance: 'Face camera directly with torso and natural arm span visible',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
      POSE_LANDMARK_INDEX.LEFT_ELBOW,
      POSE_LANDMARK_INDEX.RIGHT_ELBOW,
      POSE_LANDMARK_INDEX.LEFT_WRIST,
      POSE_LANDMARK_INDEX.RIGHT_WRIST,
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
    ],
    limbExecutionMode: 'bilateral',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.65,
      handTracking: true,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Shoulder Abduction',
          description: 'Humerus abduction from torso midline',
          startRange: [0, 25],
          inflectionThreshold: 80,
          completionThreshold: 30,
        },
        {
          label: 'Elbow Fixed Bend',
          description: 'Slight athletic elbow flexion maintained',
          startRange: [150, 170],
          inflectionThreshold: 150,
          completionThreshold: 150,
        },
      ],
      startPositionDescription: 'Dumbbells at lateral thighs with arms resting (<25°)',
      inflectionDescription: 'Raise arms out to sides until elbows reach shoulder height (80°-95°)',
      completionDescription: 'Lower weights under eccentric resistance back to thighs (<30°)',
      minRepDurationMs: 900,
      movementToleranceDeg: 8,
    },
    formChecks: [
      {
        id: 'lateral-shoulder-height',
        label: 'PARALLEL HEIGHT',
        metricKey: 'metric1',
        description: 'Raising arms until elbows align with shoulder plane (80°-90°)',
        idealCriteria: 'Elbows reach horizontal shoulder plane without hyperextending above neck',
        warningStatus: 'LIFT TO PARALLEL',
        goodStatus: 'PARALLEL',
        cueOnFault: 'Raise elbows to shoulder level',
      },
      {
        id: 'lateral-torso-sway',
        label: 'TORSO STABILITY',
        metricKey: 'metric2',
        description: 'Strict upper body stability without rocking backward momentum',
        idealCriteria: 'Torso lean deviation remains within 5° throughout concentric phase',
        warningStatus: 'NO MOMENTUM',
        goodStatus: 'STABLE',
        cueOnFault: 'Stand tall without swinging your torso',
      },
      {
        id: 'lateral-wrist-alignment',
        label: 'ELBOW LEAD',
        metricKey: 'metric3',
        description: 'Leading with elbows slightly higher than or level with wrists',
        idealCriteria: 'Wrists do not rise higher than elbows at peak abduction',
        warningStatus: 'LEAD WITH ELBOWS',
        goodStatus: 'ALIGNED',
        cueOnFault: 'Lead with elbows rather than lifting wrists first',
      },
    ],
    coachingCues: {
      setup: 'Arms at sides · Raise to shoulder level',
      repComplete: 'Rep complete · Lower with control',
      faults: [
        { issue: 'Swinging torso for momentum', cue: 'Stay upright and eliminate body swing' },
        { issue: 'Incomplete shoulder abduction', cue: 'Lift dumbbells to full shoulder height' },
        { issue: 'Shrugging traps excessively', cue: 'Keep shoulder blades down away from ears' },
      ],
    },
    defaultTargetReps: 15,
    estimatedWeightKg: 12,
    isImplemented: true,
  },

  // =========================================================================
  // 9. HIGH KNEES (New - #5)
  // =========================================================================
  {
    id: 'high-knees',
    name: 'HIGH KNEES',
    displayName: 'High Knees (L/R Drives)',
    shortDescription: 'Alternating high knee drives to hip parallel, counted per alternating knee lift',
    category: 'Full Body',
    recommendedCameraView: 'frontal',
    cameraGuidance: 'Step back 6-8 ft so legs, hips, and chest are visible during movement',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
      POSE_LANDMARK_INDEX.LEFT_KNEE,
      POSE_LANDMARK_INDEX.RIGHT_KNEE,
      POSE_LANDMARK_INDEX.LEFT_ANKLE,
      POSE_LANDMARK_INDEX.RIGHT_ANKLE,
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
    ],
    limbExecutionMode: 'unilateral_alternating',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.6,
      handTracking: false,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Hip Flexion Drive',
          description: 'Femur angle relative to torso vertical',
          startRange: [0, 30],
          inflectionThreshold: 85,
          completionThreshold: 30,
        },
        {
          label: 'Torso Verticality',
          description: 'Backward lean prevention during knee drive',
          startRange: [0, 15],
          inflectionThreshold: 25,
          completionThreshold: 15,
        },
      ],
      startPositionDescription: 'Standing athletic posture on balls of feet',
      inflectionDescription: 'Dynamic knee drive upward until thigh reaches parallel with hip (≥85°)',
      completionDescription: 'Rapid foot plant with immediate opposite knee drive',
      minRepDurationMs: 400,
      movementToleranceDeg: 12,
    },
    formChecks: [
      {
        id: 'highknee-elevation',
        label: 'KNEE HEIGHT',
        metricKey: 'metric1',
        description: 'Driving lead knee up to hip level (90° hip flexion)',
        idealCriteria: 'Thigh reaches horizontal parallel plane with pelvic line',
        warningStatus: 'DRIVE HIGHER',
        goodStatus: 'PARALLEL',
        cueOnFault: 'Drive knees up to hip height',
      },
      {
        id: 'highknee-upright-posture',
        label: 'UPRIGHT POSTURE',
        metricKey: 'metric2',
        description: 'Staying tall without excessive backward spinal lean',
        idealCriteria: 'Torso remains forward and athletic (<20° backward tilt)',
        warningStatus: 'LEAN FORWARD',
        goodStatus: 'UPRIGHT',
        cueOnFault: 'Stay tall and avoid leaning backward',
      },
      {
        id: 'highknee-foot-strike',
        label: 'QUICK CADENCE',
        metricKey: 'metric3',
        description: 'Springy contact on balls of feet with fast turnover',
        idealCriteria: 'Fast cadence with minimal ground contact time',
        warningStatus: 'FASTER TURNOVER',
        goodStatus: 'EXPLOSIVE',
        cueOnFault: 'Pump arms and keep feet springy on the floor',
      },
    ],
    coachingCues: {
      setup: 'Athletic stance · Drive knees to chest',
      repComplete: 'Rep complete · Maintain pace',
      faults: [
        { issue: 'Knees below hip parallel', cue: 'Drive working knee all the way to hip height' },
        { issue: 'Leaning torso backwards', cue: 'Keep slight forward chest tilt over toes' },
      ],
    },
    defaultTargetReps: 30,
    estimatedWeightKg: 15,
    isImplemented: true,
  },

  // =========================================================================
  // 10. GLUTE BRIDGE (New - #6)
  // =========================================================================
  {
    id: 'glute-bridge',
    name: 'GLUTE BRIDGE',
    displayName: 'Glute Bridge',
    shortDescription: 'Supine hip extension strengthening gluteus maximus and hamstrings',
    category: 'Core & Posterior Chain',
    recommendedCameraView: 'sagittal',
    cameraGuidance: 'Place device near floor level with a clear side profile of mat',
    requiredLandmarks: [
      POSE_LANDMARK_INDEX.LEFT_SHOULDER,
      POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
      POSE_LANDMARK_INDEX.LEFT_HIP,
      POSE_LANDMARK_INDEX.RIGHT_HIP,
      POSE_LANDMARK_INDEX.LEFT_KNEE,
      POSE_LANDMARK_INDEX.RIGHT_KNEE,
      POSE_LANDMARK_INDEX.LEFT_ANKLE,
      POSE_LANDMARK_INDEX.RIGHT_ANKLE,
    ],
    limbExecutionMode: 'bilateral',
    confidenceRequirements: {
      minDetection: 0.4,
      reliable: 0.65,
    },
    smoothing: {
      poseAlpha: 0.7,
      handTracking: false,
    },
    kinematics: {
      primaryAngles: [
        {
          label: 'Hip Extension',
          description: 'Shoulder to hip to knee straight line angle',
          startRange: [110, 135],
          inflectionThreshold: 165,
          completionThreshold: 135,
        },
        {
          label: 'Knee Flexion Angle',
          description: 'Knee joint bend maintaining ~90° tibia angle',
          startRange: [80, 105],
          inflectionThreshold: 90,
          completionThreshold: 90,
        },
      ],
      startPositionDescription: 'Lying supine with knees bent to ~90° and feet flat on floor',
      inflectionDescription: 'Drive hips upward into full hip extension (≥165° straight line)',
      completionDescription: 'Lower pelvis under control back to light floor contact',
      minRepDurationMs: 900,
      movementToleranceDeg: 8,
    },
    formChecks: [
      {
        id: 'bridge-hip-lockout',
        label: 'HIP EXTENSION',
        metricKey: 'metric1',
        description: 'Lifting hips into a straight diagonal line from knees to shoulders',
        idealCriteria: 'Hip extension angle reaches ≥165° at peak contraction',
        warningStatus: 'BRIDGE HIGHER',
        goodStatus: 'FULL EXTENSION',
        cueOnFault: 'Drive hips up into a straight line',
      },
      {
        id: 'bridge-glute-squeeze',
        label: 'APEX SQUEEZE',
        metricKey: 'metric2',
        description: 'Holding peak contraction without lumbar arching compensation',
        idealCriteria: 'Brief pause at top with glutes contracted and neutral pelvis',
        warningStatus: 'SQUEEZE GLUTES',
        goodStatus: 'PEAK SQUEEZE',
        cueOnFault: 'Squeeze glutes at top without arching lower back',
      },
      {
        id: 'bridge-foot-grounding',
        label: 'FOOT PLACEMENT',
        metricKey: 'metric3',
        description: 'Planting heels firmly with knees tracking straight ahead',
        idealCriteria: 'Knees stay hip-width apart without inward collapse or splay',
        warningStatus: 'PLANT HEELS',
        goodStatus: 'STABLE BASE',
        cueOnFault: 'Keep feet hip-width and drive through heels',
      },
    ],
    coachingCues: {
      setup: 'Lie supine · Drive through heels to bridge',
      repComplete: 'Rep complete · Lower with control',
      faults: [
        { issue: 'Incomplete hip extension', cue: 'Lift hips fully until straight with knees and shoulders' },
        { issue: 'Lumbar hyperextension', cue: 'Tuck pelvis and squeeze glutes rather than arching back' },
      ],
    },
    defaultTargetReps: 15,
    estimatedWeightKg: 60,
    isImplemented: true,
  },
];

/**
 * Fast lookup map by ExerciseType
 */
export const AI_CAM_EXERCISE_MAP: Record<ExerciseType, ExerciseConfig> =
  AI_CAM_EXERCISES.reduce(
    (acc, config) => {
      acc[config.id] = config;
      return acc;
    },
    {} as Record<ExerciseType, ExerciseConfig>
  );

/**
 * Safely retrieve exercise configuration by ID with fallback to squat
 */
export function getExerciseConfig(id: ExerciseType): ExerciseConfig {
  return AI_CAM_EXERCISE_MAP[id] || AI_CAM_EXERCISES[0];
}

/**
 * Returns list of exercise IDs in canonical order
 */
export const ALL_EXERCISE_IDS: ExerciseType[] = AI_CAM_EXERCISES.map((c) => c.id);
