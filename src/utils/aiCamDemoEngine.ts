/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO AI CAM — Presentation Demo Kinematics Engine
 * Smooth, mathematically verified anatomical landmark trajectories and posture simulation.
 * Purely deterministic, fully local, works 100% offline without camera or network dependencies.
 */

import {
  PoseLandmark,
  PostureFeedback,
  MovementPhase,
  AiCamStatus,
  LANDMARKS,
  calculateAngle,
} from './poseDetector.ts';
import { ExerciseType, getExerciseConfig } from '../data/aiCamExerciseConfigs.ts';

export interface DemoFrameData {
  landmarks: PoseLandmark[];
  phase: MovementPhase;
  postureFeedback: PostureFeedback;
  feedbackMessage: string;
  formScore: number;
  status: AiCamStatus;
  keyAngles: { label: string; angle: number }[];
  formChecks: { label: string; status: string; isGood: boolean; score: number }[];
}

/**
 * Creates a base 33-landmark pose with valid confidence
 */
function createBasePose(): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    landmarks.push({ x: 0.5, y: 0.5, z: 0, visibility: 0.98 });
  }
  return landmarks;
}

/**
 * Normalizes an angle into an integer
 */
function angle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  return calculateAngle(a, b, c);
}

/**
 * Helper to generate head landmarks around a given nose coordinate
 */
function populateHead(pose: PoseLandmark[], noseX: number, noseY: number) {
  pose[LANDMARKS.NOSE] = { x: noseX, y: noseY, z: 0, visibility: 0.99 };
  pose[LANDMARKS.LEFT_EYE_INNER] = { x: noseX - 0.015, y: noseY - 0.02, z: 0, visibility: 0.99 };
  pose[LANDMARKS.LEFT_EYE] = { x: noseX - 0.025, y: noseY - 0.02, z: 0, visibility: 0.99 };
  pose[LANDMARKS.LEFT_EYE_OUTER] = { x: noseX - 0.035, y: noseY - 0.02, z: 0, visibility: 0.99 };
  pose[LANDMARKS.RIGHT_EYE_INNER] = { x: noseX + 0.015, y: noseY - 0.02, z: 0, visibility: 0.99 };
  pose[LANDMARKS.RIGHT_EYE] = { x: noseX + 0.025, y: noseY - 0.02, z: 0, visibility: 0.99 };
  pose[LANDMARKS.RIGHT_EYE_OUTER] = { x: noseX + 0.035, y: noseY - 0.02, z: 0, visibility: 0.99 };
  pose[LANDMARKS.LEFT_EAR] = { x: noseX - 0.05, y: noseY - 0.01, z: 0, visibility: 0.99 };
  pose[LANDMARKS.RIGHT_EAR] = { x: noseX + 0.05, y: noseY - 0.01, z: 0, visibility: 0.99 };
  pose[LANDMARKS.MOUTH_LEFT] = { x: noseX - 0.02, y: noseY + 0.02, z: 0, visibility: 0.99 };
  pose[LANDMARKS.MOUTH_RIGHT] = { x: noseX + 0.02, y: noseY + 0.02, z: 0, visibility: 0.99 };
}

/**
 * Helper to populate hands from wrist position
 */
function populateHands(pose: PoseLandmark[]) {
  const lw = pose[LANDMARKS.LEFT_WRIST];
  const rw = pose[LANDMARKS.RIGHT_WRIST];
  pose[LANDMARKS.LEFT_PINKY] = { x: lw.x - 0.01, y: lw.y + 0.02, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_INDEX] = { x: lw.x, y: lw.y + 0.025, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_THUMB] = { x: lw.x + 0.01, y: lw.y + 0.015, z: 0, visibility: 0.95 };

  pose[LANDMARKS.RIGHT_PINKY] = { x: rw.x + 0.01, y: rw.y + 0.02, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_INDEX] = { x: rw.x, y: rw.y + 0.025, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_THUMB] = { x: rw.x - 0.01, y: rw.y + 0.015, z: 0, visibility: 0.95 };
}

/**
 * Helper to populate feet from ankle position
 */
function populateFeet(pose: PoseLandmark[]) {
  const la = pose[LANDMARKS.LEFT_ANKLE];
  const ra = pose[LANDMARKS.RIGHT_ANKLE];
  pose[LANDMARKS.LEFT_HEEL] = { x: la.x - 0.01, y: la.y + 0.02, z: 0, visibility: 0.95 };
  pose[LANDMARKS.LEFT_FOOT_INDEX] = { x: la.x + 0.03, y: la.y + 0.025, z: 0, visibility: 0.95 };

  pose[LANDMARKS.RIGHT_HEEL] = { x: ra.x + 0.01, y: ra.y + 0.02, z: 0, visibility: 0.95 };
  pose[LANDMARKS.RIGHT_FOOT_INDEX] = { x: ra.x - 0.03, y: ra.y + 0.025, z: 0, visibility: 0.95 };
}

/**
 * Generates continuous demo kinematics for any supported exercise
 */
export function generateDemoPoseFrame(
  exercise: ExerciseType,
  progress: number, // 0.0 to 1.0 (smooth rep cycle)
  simulateError: boolean
): DemoFrameData {
  const pose = createBasePose();
  const t = Math.max(0, Math.min(1, progress));
  // Harmonic cycle: 0 -> 1 -> 0 with smooth ease
  const cycle = Math.sin(t * Math.PI);

  const cleanFeedback: PostureFeedback = {
    torsoIssue: false,
    leftLegIssue: false,
    rightLegIssue: false,
    leftArmIssue: false,
    rightArmIssue: false,
    kneeAlignmentIssue: false,
    depthIssue: false,
    torsoLeanIssue: false,
    spineAlignmentIssue: false,
    armStabilityIssue: false,
    activeIssues: [],
  };

  switch (exercise) {
    case 'squat': {
      // ----------------------------------------------------
      // SQUAT DEMONSTRATION
      // ----------------------------------------------------
      const noseY = 0.16 + cycle * 0.18;
      populateHead(pose, 0.50, noseY);

      const shoulderY = 0.24 + cycle * 0.20;
      pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.43, y: shoulderY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.57, y: shoulderY, z: 0, visibility: 0.98 };

      // Hands in front of chest (athletic counterbalance)
      pose[LANDMARKS.LEFT_ELBOW] = { x: 0.38, y: shoulderY + 0.10, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ELBOW] = { x: 0.62, y: shoulderY + 0.10, z: 0, visibility: 0.98 };
      pose[LANDMARKS.LEFT_WRIST] = { x: 0.46, y: shoulderY + 0.08, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_WRIST] = { x: 0.54, y: shoulderY + 0.08, z: 0, visibility: 0.98 };

      const hipY = 0.48 + cycle * 0.24; // 0.48 -> 0.72 (parallel depth)
      pose[LANDMARKS.LEFT_HIP] = { x: 0.44, y: hipY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_HIP] = { x: 0.56, y: hipY, z: 0, visibility: 0.98 };

      // Ankles planted firmly on the floor
      const ankleY = 0.88;
      pose[LANDMARKS.LEFT_ANKLE] = { x: 0.42, y: ankleY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ANKLE] = { x: 0.58, y: ankleY, z: 0, visibility: 0.98 };

      // Knees: in good form they track outward; in error form they collapse inward (valgus)
      const kneeY = 0.68 + cycle * 0.04;
      let leftKneeX = 0.42 - cycle * 0.05; // 0.42 -> 0.37 (proper outward tracking)
      let rightKneeX = 0.58 + cycle * 0.05; // 0.58 -> 0.63

      let pf = { ...cleanFeedback };
      let feedback = 'Good form! Solid depth and upright chest';
      let score = 96;
      let status: AiCamStatus = 'GOOD FORM';

      if (simulateError && cycle > 0.3) {
        // Valgus collapse simulated: knees pull inward toward midline
        leftKneeX = 0.485;
        rightKneeX = 0.515;
        pf.kneeAlignmentIssue = true;
        pf.leftLegIssue = true;
        pf.rightLegIssue = true;
        pf.activeIssues = ['Knees collapsing inward (Valgus)'];
        feedback = 'Keep knees aligned with toes · Avoid knee collapse';
        score = 68;
        status = 'IMPROVE FORM';
      }

      pose[LANDMARKS.LEFT_KNEE] = { x: leftKneeX, y: kneeY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_KNEE] = { x: rightKneeX, y: kneeY, z: 0, visibility: 0.98 };

      populateHands(pose);
      populateFeet(pose);

      const kneeAng = angle(pose[LANDMARKS.LEFT_HIP], pose[LANDMARKS.LEFT_KNEE], pose[LANDMARKS.LEFT_ANKLE]);
      const hipAng = angle(pose[LANDMARKS.LEFT_SHOULDER], pose[LANDMARKS.LEFT_HIP], pose[LANDMARKS.LEFT_KNEE]);

      let phase: MovementPhase = 'STANDING';
      if (cycle < 0.15) {
        phase = 'STANDING';
      } else if (t < 0.45) {
        phase = 'DESCENDING';
        if (!simulateError) feedback = 'Controlling descent · Chest high';
      } else if (cycle >= 0.85) {
        phase = 'BOTTOM';
        if (!simulateError) feedback = 'Parallel depth reached · Drive through heels';
      } else {
        phase = 'ASCENDING';
        if (!simulateError) feedback = 'Driving up to standing lockout';
      }

      return {
        landmarks: pose,
        phase,
        postureFeedback: pf,
        feedbackMessage: feedback,
        formScore: score,
        status,
        keyAngles: [
          { label: 'Knee Angle', angle: kneeAng },
          { label: 'Hip Angle', angle: hipAng },
          { label: 'Torso Incline', angle: Math.round(15 * cycle) },
          { label: 'Ankle Dorsiflexion', angle: Math.round(78 + 12 * (1 - cycle)) },
        ],
        formChecks: [
          {
            label: 'KNEE ALIGNMENT',
            status: pf.kneeAlignmentIssue ? 'COLLAPSING' : 'ALIGNED',
            isGood: !pf.kneeAlignmentIssue,
            score: pf.kneeAlignmentIssue ? 65 : 97,
          },
          {
            label: 'BACK POSITION',
            status: 'NEUTRAL SPINE',
            isGood: true,
            score: 95,
          },
          {
            label: 'DEPTH',
            status: cycle >= 0.8 ? 'PARALLEL' : 'DESCENDING',
            isGood: true,
            score: cycle >= 0.8 ? 98 : 92,
          },
        ],
      };
    }

    case 'pushup': {
      // ----------------------------------------------------
      // PUSH-UP DEMONSTRATION (Semi-sagittal horizontal plank)
      // ----------------------------------------------------
      const shoulderX = 0.28;
      const shoulderY = 0.42 + cycle * 0.16; // Descends toward floor
      populateHead(pose, 0.20, shoulderY - 0.05);

      pose[LANDMARKS.LEFT_SHOULDER] = { x: shoulderX, y: shoulderY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_SHOULDER] = { x: shoulderX + 0.04, y: shoulderY - 0.02, z: 0, visibility: 0.98 };

      // Wrists fixed on the floor plane
      const wristX = 0.28;
      const wristY = 0.68;
      pose[LANDMARKS.LEFT_WRIST] = { x: wristX, y: wristY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_WRIST] = { x: wristX + 0.04, y: wristY - 0.02, z: 0, visibility: 0.98 };

      // Elbows bend backward as chest drops
      const elbowX = 0.28 - cycle * 0.09;
      const elbowY = (shoulderY + wristY) / 2;
      pose[LANDMARKS.LEFT_ELBOW] = { x: elbowX, y: elbowY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ELBOW] = { x: elbowX + 0.04, y: elbowY - 0.02, z: 0, visibility: 0.98 };

      // Hips in straight plank line from shoulder to ankle
      const ankleX = 0.82;
      const ankleY = 0.64;
      pose[LANDMARKS.LEFT_ANKLE] = { x: ankleX, y: ankleY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ANKLE] = { x: ankleX + 0.03, y: ankleY - 0.02, z: 0, visibility: 0.98 };

      const hipX = 0.54;
      let hipY = shoulderY + (ankleY - shoulderY) * 0.45; // Plank diagonal line

      let pf = { ...cleanFeedback };
      let feedback = 'Excellent plank alignment · Full range of motion';
      let score = 95;
      let status: AiCamStatus = 'GOOD FORM';

      if (simulateError && cycle > 0.25) {
        // Simulated hip sag (torso sagging downward toward floor)
        hipY += 0.11;
        pf.torsoIssue = true;
        pf.spineAlignmentIssue = true;
        pf.activeIssues = ['Hips sagging · Engage core'];
        feedback = 'Keep core tight · Prevent hip sagging';
        score = 64;
        status = 'IMPROVE FORM';
      }

      pose[LANDMARKS.LEFT_HIP] = { x: hipX, y: hipY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_HIP] = { x: hipX + 0.03, y: hipY - 0.02, z: 0, visibility: 0.98 };

      // Knees along plank line
      const kneeX = 0.68;
      const kneeY = (hipY + ankleY) / 2;
      pose[LANDMARKS.LEFT_KNEE] = { x: kneeX, y: kneeY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_KNEE] = { x: kneeX + 0.03, y: kneeY - 0.02, z: 0, visibility: 0.98 };

      populateHands(pose);
      populateFeet(pose);

      const elbowAng = angle(pose[LANDMARKS.LEFT_SHOULDER], pose[LANDMARKS.LEFT_ELBOW], pose[LANDMARKS.LEFT_WRIST]);
      const plankAng = angle(pose[LANDMARKS.LEFT_SHOULDER], pose[LANDMARKS.LEFT_HIP], pose[LANDMARKS.LEFT_ANKLE]);

      let phase: MovementPhase = 'TOP';
      if (cycle < 0.15) {
        phase = 'TOP';
      } else if (t < 0.45) {
        phase = 'DESCENDING';
        if (!simulateError) feedback = 'Lowering with 45° elbow tuck';
      } else if (cycle >= 0.85) {
        phase = 'BOTTOM';
        if (!simulateError) feedback = 'Full chest depth · Push through palms';
      } else {
        phase = 'ASCENDING';
        if (!simulateError) feedback = 'Driving up to straight arm lockout';
      }

      return {
        landmarks: pose,
        phase,
        postureFeedback: pf,
        feedbackMessage: feedback,
        formScore: score,
        status,
        keyAngles: [
          { label: 'Elbow Angle', angle: elbowAng },
          { label: 'Plank Alignment', angle: plankAng },
          { label: 'Arm Angle', angle: Math.round(90 - cycle * 45) },
        ],
        formChecks: [
          {
            label: 'BACK POSITION',
            status: pf.spineAlignmentIssue ? 'HIPS SAGGING' : 'FLAT PLANK',
            isGood: !pf.spineAlignmentIssue,
            score: pf.spineAlignmentIssue ? 60 : 96,
          },
          {
            label: 'DEPTH',
            status: cycle >= 0.8 ? 'FULL CHEST' : 'DESCENDING',
            isGood: true,
            score: cycle >= 0.8 ? 98 : 90,
          },
          {
            label: 'ARM POSITION',
            status: '45° TUCK',
            isGood: true,
            score: 94,
          },
        ],
      };
    }

    case 'bicep-curl': {
      // ----------------------------------------------------
      // BICEP CURL DEMONSTRATION (Frontal standing)
      // ----------------------------------------------------
      populateHead(pose, 0.50, 0.16);

      pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.25, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.58, y: 0.25, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_HIP] = { x: 0.44, y: 0.50, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_HIP] = { x: 0.56, y: 0.50, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_KNEE] = { x: 0.44, y: 0.70, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_KNEE] = { x: 0.56, y: 0.70, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_ANKLE] = { x: 0.44, y: 0.90, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ANKLE] = { x: 0.56, y: 0.90, z: 0, visibility: 0.98 };

      // Elbows: in good form they stay pinned to ribs (y=0.42)
      let leftElbowX = 0.41;
      let rightElbowX = 0.59;
      let elbowY = 0.42;

      // Wrists: curl upward from y=0.64 (extension) to y=0.28 (flexion)
      let wristY = 0.64 - cycle * 0.36;

      let pf = { ...cleanFeedback };
      let feedback = 'Elbows pinned · Strict controlled cadence';
      let score = 97;
      let status: AiCamStatus = 'GOOD FORM';

      if (simulateError && cycle > 0.3) {
        // Simulated elbow flare & torso momentum swing
        leftElbowX = 0.33;
        rightElbowX = 0.67;
        elbowY = 0.37;
        pf.leftArmIssue = true;
        pf.rightArmIssue = true;
        pf.armStabilityIssue = true;
        pf.activeIssues = ['Elbows flaring forward · Momentum swing'];
        feedback = 'Keep elbows pinned to ribs · Avoid body swinging';
        score = 70;
        status = 'IMPROVE FORM';
      }

      pose[LANDMARKS.LEFT_ELBOW] = { x: leftElbowX, y: elbowY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ELBOW] = { x: rightElbowX, y: elbowY, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_WRIST] = { x: leftElbowX, y: wristY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_WRIST] = { x: rightElbowX, y: wristY, z: 0, visibility: 0.98 };

      populateHands(pose);
      populateFeet(pose);

      const curlAng = angle(pose[LANDMARKS.LEFT_SHOULDER], pose[LANDMARKS.LEFT_ELBOW], pose[LANDMARKS.LEFT_WRIST]);

      let phase: MovementPhase = 'CURLING';
      if (cycle < 0.15) {
        phase = 'READY';
      } else if (t < 0.45) {
        phase = 'CURLING';
        if (!simulateError) feedback = 'Contracting biceps · Strict path';
      } else if (cycle >= 0.85) {
        phase = 'PEAK';
        if (!simulateError) feedback = 'Peak biceps contraction · Squeeze at top';
      } else {
        phase = 'LOWERING';
        if (!simulateError) feedback = 'Controlled eccentric lowering';
      }

      return {
        landmarks: pose,
        phase,
        postureFeedback: pf,
        feedbackMessage: feedback,
        formScore: score,
        status,
        keyAngles: [
          { label: 'Elbow Flexion', angle: curlAng },
          { label: 'Arm Stability', angle: Math.round(pf.armStabilityIssue ? 38 : 10) },
          { label: 'Torso Incline', angle: Math.round(pf.armStabilityIssue ? 14 : 2) },
        ],
        formChecks: [
          {
            label: 'ELBOW POSITION',
            status: pf.armStabilityIssue ? 'FLARING' : 'PINNED',
            isGood: !pf.armStabilityIssue,
            score: pf.armStabilityIssue ? 68 : 98,
          },
          {
            label: 'RANGE OF MOTION',
            status: cycle >= 0.8 ? 'FULL FLEX' : 'IN MOTION',
            isGood: true,
            score: cycle >= 0.8 ? 98 : 92,
          },
          {
            label: 'EXTENSION',
            status: 'CONTROLLED',
            isGood: true,
            score: 95,
          },
        ],
      };
    }

    case 'jumping-jack': {
      // ----------------------------------------------------
      // JUMPING JACK DEMONSTRATION
      // ----------------------------------------------------
      populateHead(pose, 0.50, 0.16);

      pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.44, y: 0.25, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.56, y: 0.25, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_HIP] = { x: 0.46, y: 0.50, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_HIP] = { x: 0.54, y: 0.50, z: 0, visibility: 0.98 };

      // Legs jump out: ankles spread from (0.46, 0.54) to (0.34, 0.66)
      const ankleSpread = 0.04 + cycle * 0.12;
      pose[LANDMARKS.LEFT_ANKLE] = { x: 0.50 - ankleSpread, y: 0.90, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ANKLE] = { x: 0.50 + ankleSpread, y: 0.90, z: 0, visibility: 0.98 };

      const kneeSpread = 0.04 + cycle * 0.08;
      pose[LANDMARKS.LEFT_KNEE] = { x: 0.50 - kneeSpread, y: 0.70, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_KNEE] = { x: 0.50 + kneeSpread, y: 0.70, z: 0, visibility: 0.98 };

      // Arms swing overhead in circular arc
      // Good form: hands reach overhead at (0.48, 0.12)
      // Error form: arms only reach shoulder height (incomplete overhead reach)
      let wristXLeft = 0.40 - cycle * 0.12;
      let wristXRight = 0.60 + cycle * 0.12;
      let wristY = 0.58 - cycle * 0.44; // 0.58 -> 0.14 overhead

      let elbowXLeft = 0.38 - cycle * 0.10;
      let elbowXRight = 0.62 + cycle * 0.10;
      let elbowY = 0.40 - cycle * 0.22;

      let pf = { ...cleanFeedback };
      let feedback = 'Dynamic tempo · Full overhead extension';
      let score = 98;
      let status: AiCamStatus = 'GOOD FORM';

      if (simulateError && cycle > 0.3) {
        wristY = 0.38; // Arm stops near horizontal
        elbowY = 0.36;
        pf.leftArmIssue = true;
        pf.rightArmIssue = true;
        pf.activeIssues = ['Incomplete overhead reach'];
        feedback = 'Extend arms fully overhead · Full range of motion';
        score = 72;
        status = 'IMPROVE FORM';
      } else if (cycle > 0.6) {
        // Hands close overhead
        wristXLeft = 0.48;
        wristXRight = 0.52;
      }

      pose[LANDMARKS.LEFT_ELBOW] = { x: elbowXLeft, y: elbowY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ELBOW] = { x: elbowXRight, y: elbowY, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_WRIST] = { x: wristXLeft, y: wristY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_WRIST] = { x: wristXRight, y: wristY, z: 0, visibility: 0.98 };

      populateHands(pose);
      populateFeet(pose);

      const shoulderAng = angle(pose[LANDMARKS.LEFT_HIP], pose[LANDMARKS.LEFT_SHOULDER], pose[LANDMARKS.LEFT_ELBOW]);

      return {
        landmarks: pose,
        phase: cycle > 0.6 ? 'PEAK' : 'READY',
        postureFeedback: pf,
        feedbackMessage: feedback,
        formScore: score,
        status,
        keyAngles: [
          { label: 'Shoulder Elevation', angle: shoulderAng },
          { label: 'Stance Width', angle: Math.round(20 + cycle * 35) },
          { label: 'Cadence Rhythm', angle: 95 },
        ],
        formChecks: [
          {
            label: 'OVERHEAD REACH',
            status: pf.leftArmIssue ? 'INCOMPLETE' : cycle > 0.6 ? 'FULL TOUCH' : 'GOOD',
            isGood: !pf.leftArmIssue,
            score: pf.leftArmIssue ? 70 : 98,
          },
          {
            label: 'STANCE WIDTH',
            status: cycle > 0.6 ? 'WIDE BASE' : 'FEET IN',
            isGood: true,
            score: 95,
          },
          {
            label: 'RHYTHM & TEMPO',
            status: 'CONTROLLED',
            isGood: true,
            score: 96,
          },
        ],
      };
    }

    case 'shoulder-press': {
      // ----------------------------------------------------
      // SHOULDER PRESS DEMONSTRATION
      // ----------------------------------------------------
      populateHead(pose, 0.50, 0.16);

      pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.25, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.58, y: 0.25, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_HIP] = { x: 0.44, y: 0.50, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_HIP] = { x: 0.56, y: 0.50, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_KNEE] = { x: 0.44, y: 0.70, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_KNEE] = { x: 0.56, y: 0.70, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_ANKLE] = { x: 0.44, y: 0.90, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ANKLE] = { x: 0.56, y: 0.90, z: 0, visibility: 0.98 };

      let wristYLeft = 0.28 - cycle * 0.18;
      let wristYRight = 0.28 - cycle * 0.18;
      let elbowYLeft = 0.38 - cycle * 0.19;
      let elbowYRight = 0.38 - cycle * 0.19;
      let wristXLeft = 0.36 + cycle * 0.08;
      let wristXRight = 0.64 - cycle * 0.08;
      let elbowXLeft = 0.35 + cycle * 0.06;
      let elbowXRight = 0.65 - cycle * 0.06;

      let pf = { ...cleanFeedback };
      let feedback = 'Symmetric press · Full overhead lockout';
      let score = 96;
      let status: AiCamStatus = 'GOOD FORM';

      if (simulateError && cycle > 0.3) {
        wristYLeft = 0.22;
        elbowYLeft = 0.30;
        elbowXLeft = 0.30;
        pf.leftArmIssue = true;
        pf.armStabilityIssue = true;
        pf.activeIssues = ['Asymmetric press · Left arm lag'];
        feedback = 'Press evenly with both arms · Avoid unilateral lag';
        score = 69;
        status = 'IMPROVE FORM';
      }

      pose[LANDMARKS.LEFT_ELBOW] = { x: elbowXLeft, y: elbowYLeft, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ELBOW] = { x: elbowXRight, y: elbowYRight, z: 0, visibility: 0.98 };
      pose[LANDMARKS.LEFT_WRIST] = { x: wristXLeft, y: wristYLeft, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_WRIST] = { x: wristXRight, y: wristYRight, z: 0, visibility: 0.98 };

      populateHands(pose);
      populateFeet(pose);

      const leftElbowAng = angle(pose[LANDMARKS.LEFT_SHOULDER], pose[LANDMARKS.LEFT_ELBOW], pose[LANDMARKS.LEFT_WRIST]);
      const rightElbowAng = angle(pose[LANDMARKS.RIGHT_SHOULDER], pose[LANDMARKS.RIGHT_ELBOW], pose[LANDMARKS.RIGHT_WRIST]);

      return {
        landmarks: pose,
        phase: cycle > 0.85 ? 'PEAK' : cycle > 0.15 ? 'ASCENDING' : 'READY',
        postureFeedback: pf,
        feedbackMessage: feedback,
        formScore: score,
        status,
        keyAngles: [
          { label: 'Left Elbow Angle', angle: leftElbowAng },
          { label: 'Right Elbow Angle', angle: rightElbowAng },
          { label: 'Torso Incline', angle: 0 },
        ],
        formChecks: [
          {
            label: 'OVERHEAD LOCKOUT',
            status: pf.leftArmIssue ? 'INCOMPLETE' : cycle >= 0.8 ? 'LOCKED OUT' : 'PRESSING',
            isGood: !pf.leftArmIssue,
            score: pf.leftArmIssue ? 68 : 98,
          },
          {
            label: 'ELBOW PATH',
            status: pf.armStabilityIssue ? 'FLARING' : 'IN PLANE',
            isGood: !pf.armStabilityIssue,
            score: pf.armStabilityIssue ? 65 : 95,
          },
          {
            label: 'CORE STABILITY',
            status: 'NEUTRAL SPINE',
            isGood: true,
            score: 96,
          },
        ],
      };
    }

    case 'lunge': {
      // ----------------------------------------------------
      // LUNGE DEMONSTRATION
      // ----------------------------------------------------
      const noseY = 0.16 + cycle * 0.14;
      populateHead(pose, 0.50, noseY);

      const shoulderY = 0.25 + cycle * 0.15;
      pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.44, y: shoulderY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.56, y: shoulderY, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_ELBOW] = { x: 0.40, y: shoulderY + 0.12, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ELBOW] = { x: 0.60, y: shoulderY + 0.12, z: 0, visibility: 0.98 };
      pose[LANDMARKS.LEFT_WRIST] = { x: 0.45, y: shoulderY + 0.10, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_WRIST] = { x: 0.55, y: shoulderY + 0.10, z: 0, visibility: 0.98 };

      const hipY = 0.48 + cycle * 0.18;
      pose[LANDMARKS.LEFT_HIP] = { x: 0.45, y: hipY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_HIP] = { x: 0.55, y: hipY, z: 0, visibility: 0.98 };

      const leftAnkleX = 0.40 - cycle * 0.05;
      const leftAnkleY = 0.88;
      const rightAnkleX = 0.60 + cycle * 0.08;
      const rightAnkleY = 0.88;

      let leftKneeX = 0.40 - cycle * 0.04;
      const leftKneeY = 0.68 + cycle * 0.06;
      const rightKneeX = 0.58 + cycle * 0.02;
      const rightKneeY = 0.68 + cycle * 0.15;

      let pf = { ...cleanFeedback };
      let feedback = 'Upright posture · 90° knee angle on lead leg';
      let score = 95;
      let status: AiCamStatus = 'GOOD FORM';

      if (simulateError && cycle > 0.3) {
        leftKneeX = 0.48;
        pf.leftLegIssue = true;
        pf.kneeAlignmentIssue = true;
        pf.activeIssues = ['Lead knee tracking inward · Valgus'];
        feedback = 'Align lead knee over second toe · Keep upright torso';
        score = 67;
        status = 'IMPROVE FORM';
      }

      pose[LANDMARKS.LEFT_KNEE] = { x: leftKneeX, y: leftKneeY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_KNEE] = { x: rightKneeX, y: rightKneeY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.LEFT_ANKLE] = { x: leftAnkleX, y: leftAnkleY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ANKLE] = { x: rightAnkleX, y: rightAnkleY, z: 0, visibility: 0.98 };

      populateHands(pose);
      populateFeet(pose);

      const leadKneeAng = angle(pose[LANDMARKS.LEFT_HIP], pose[LANDMARKS.LEFT_KNEE], pose[LANDMARKS.LEFT_ANKLE]);

      return {
        landmarks: pose,
        phase: cycle > 0.85 ? 'BOTTOM' : cycle > 0.15 ? 'DESCENDING' : 'STANDING',
        postureFeedback: pf,
        feedbackMessage: feedback,
        formScore: score,
        status,
        keyAngles: [
          { label: 'Lead Knee Angle', angle: leadKneeAng },
          { label: 'Torso Incline', angle: 4 },
        ],
        formChecks: [
          {
            label: 'KNEE ALIGNMENT',
            status: pf.kneeAlignmentIssue ? 'INWARD SHIFT' : 'TRACKING OVER TOE',
            isGood: !pf.kneeAlignmentIssue,
            score: pf.kneeAlignmentIssue ? 64 : 97,
          },
          {
            label: 'BACK POSITION',
            status: 'UPRIGHT TORSO',
            isGood: true,
            score: 95,
          },
          {
            label: 'DEPTH',
            status: cycle >= 0.8 ? '90° DEPTH' : 'DESCENDING',
            isGood: true,
            score: cycle >= 0.8 ? 98 : 91,
          },
        ],
      };
    }

    default: {
      // ----------------------------------------------------
      // GENERAL EXERCISE FALLBACK (e.g. Calf Raise, Lateral Raise, High Knees, Glute Bridge)
      // ----------------------------------------------------
      populateHead(pose, 0.50, 0.16);

      pose[LANDMARKS.LEFT_SHOULDER] = { x: 0.43, y: 0.25, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_SHOULDER] = { x: 0.57, y: 0.25, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.50, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_HIP] = { x: 0.55, y: 0.50, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_KNEE] = { x: 0.44, y: 0.70, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_KNEE] = { x: 0.56, y: 0.70, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_ANKLE] = { x: 0.44, y: 0.90, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ANKLE] = { x: 0.56, y: 0.90, z: 0, visibility: 0.98 };

      // Overhead press motion
      const wristY = 0.32 - cycle * 0.20;
      const elbowY = 0.38 - cycle * 0.15;
      pose[LANDMARKS.LEFT_ELBOW] = { x: 0.38, y: elbowY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_ELBOW] = { x: 0.62, y: elbowY, z: 0, visibility: 0.98 };

      pose[LANDMARKS.LEFT_WRIST] = { x: 0.40, y: wristY, z: 0, visibility: 0.98 };
      pose[LANDMARKS.RIGHT_WRIST] = { x: 0.60, y: wristY, z: 0, visibility: 0.98 };

      let pf = { ...cleanFeedback };
      let feedback = 'Good technique · Solid balance';
      let score = 95;
      let status: AiCamStatus = 'GOOD FORM';

      if (simulateError && cycle > 0.3) {
        pf.leftArmIssue = true;
        pf.activeIssues = ['Asymmetrical movement'];
        feedback = 'Maintain bilateral symmetry throughout the lift';
        score = 70;
        status = 'IMPROVE FORM';
      }

      populateHands(pose);
      populateFeet(pose);

      const cfg = getExerciseConfig(exercise);

      return {
        landmarks: pose,
        phase: cycle > 0.7 ? 'TOP' : 'READY',
        postureFeedback: pf,
        feedbackMessage: feedback,
        formScore: score,
        status,
        keyAngles: [
          { label: 'Primary Joint', angle: Math.round(90 + cycle * 80) },
          { label: 'Torso Incline', angle: 0 },
        ],
        formChecks: [
          {
            label: cfg?.formChecks?.[0]?.label || 'ALIGNMENT',
            status: pf.leftArmIssue ? 'ASYMMETRY' : 'ALIGNED',
            isGood: !pf.leftArmIssue,
            score: pf.leftArmIssue ? 68 : 96,
          },
          {
            label: cfg?.formChecks?.[1]?.label || 'RANGE OF MOTION',
            status: 'FULL ROM',
            isGood: true,
            score: 95,
          },
          {
            label: cfg?.formChecks?.[2]?.label || 'STABILITY',
            status: 'CONTROLLED',
            isGood: true,
            score: 94,
          },
        ],
      };
    }
  }
}
