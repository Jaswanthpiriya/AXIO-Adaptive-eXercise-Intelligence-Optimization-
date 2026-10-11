/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO AI CAM — Real-Time Pose Estimation & Kinematic Analysis Engine
 * Browser-compatible MediaPipe Pose integration with real joint angle mathematics.
 */

import {
  ExerciseType,
  ExerciseConfig,
  AI_CAM_EXERCISES,
  getExerciseConfig,
} from '../data/aiCamExerciseConfigs.ts';

export type { ExerciseType, ExerciseConfig };
export { AI_CAM_EXERCISES, getExerciseConfig };

export interface PoseLandmark {
  x: number; // 0..1 normalized width
  y: number; // 0..1 normalized height
  z: number; // depth
  visibility?: number;
}

export type MovementPhase =
  | 'READY'
  | 'STANDING'
  | 'DESCENDING'
  | 'BOTTOM'
  | 'ASCENDING'
  | 'TOP'
  | 'CURLING'
  | 'PEAK'
  | 'LOWERING';

export type AiCamStatus =
  | 'READY'
  | 'ANALYZING'
  | 'GOOD FORM'
  | 'IMPROVE FORM'
  | 'CAMERA ERROR';

export interface FormBreakdown {
  metric1Name: string;
  metric1Score: number;
  metric2Name: string;
  metric2Score: number;
  metric3Name: string;
  metric3Score: number;
}

export interface PoseAnalysisResult {
  exercise: ExerciseType;
  exerciseName: string;
  repCount: number;
  movementPhase: MovementPhase;
  overallFormScore: number;
  aiStatus: AiCamStatus;
  primaryFeedback: string;
  formBreakdown: FormBreakdown;
  keyAngles: {
    label: string;
    angle: number;
  }[];
  postureFeedback?: PostureFeedback | null;
}

export type SegmentColor = 'green' | 'red' | 'gray';

export interface PostureFeedback {
  torsoIssue: boolean;
  leftLegIssue: boolean;
  rightLegIssue: boolean;
  leftArmIssue: boolean;
  rightArmIssue: boolean;
  kneeAlignmentIssue: boolean;
  depthIssue: boolean;
  torsoLeanIssue: boolean;
  spineAlignmentIssue: boolean;
  armStabilityIssue: boolean;
  activeIssues: string[];
}

// MediaPipe landmark indices
export const LANDMARKS = {
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

// Anatomically verified skeletal connections for human pose tracking
export const POSE_CONNECTIONS: [number, number][] = [
  // Upper torso (shoulder girdle / clavicle):
  // - left shoulder ↔ right shoulder
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],

  // Upper torso to hip area:
  // - left shoulder → left hip
  // - right shoulder → right hip
  // - left hip → right hip
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],

  // Left arm:
  // - left shoulder → left elbow
  // - left elbow → left wrist
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW],
  [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],

  // Right arm:
  // - right shoulder → right elbow
  // - right elbow → right wrist
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_ELBOW],
  [LANDMARKS.RIGHT_ELBOW, LANDMARKS.RIGHT_WRIST],

  // Left leg:
  // - left hip → left knee
  // - left knee → left ankle
  [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
  [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
  // Left foot (when available):
  [LANDMARKS.LEFT_ANKLE, LANDMARKS.LEFT_HEEL],
  [LANDMARKS.LEFT_HEEL, LANDMARKS.LEFT_FOOT_INDEX],
  [LANDMARKS.LEFT_ANKLE, LANDMARKS.LEFT_FOOT_INDEX],

  // Right leg:
  // - right hip → right knee
  // - right knee → right ankle
  [LANDMARKS.RIGHT_HIP, LANDMARKS.RIGHT_KNEE],
  [LANDMARKS.RIGHT_KNEE, LANDMARKS.RIGHT_ANKLE],
  // Right foot (when available):
  [LANDMARKS.RIGHT_ANKLE, LANDMARKS.RIGHT_HEEL],
  [LANDMARKS.RIGHT_HEEL, LANDMARKS.RIGHT_FOOT_INDEX],
  [LANDMARKS.RIGHT_ANKLE, LANDMARKS.RIGHT_FOOT_INDEX],
];

/**
 * Calculates the 2D joint angle between three points (A -> B -> C)
 * Point B is the apex/vertex of the angle.
 */
export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

/**
 * Ensures MediaPipe Pose and CameraUtils are loaded in the browser
 */
export async function loadMediaPipePose(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if ((window as any).Pose) {
    return (window as any).Pose;
  }

  // Dynamically load scripts if not already present
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  try {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');

    // Wait a brief tick for global instantiation
    let attempts = 0;
    while (!(window as any).Pose && attempts < 20) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }

    return (window as any).Pose || null;
  } catch (err) {
    console.error('Failed to load MediaPipe Pose scripts:', err);
    return null;
  }
}

/**
 * Ensures MediaPipe Hands is loaded in the browser
 */
export async function loadMediaPipeHands(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if ((window as any).Hands) {
    return (window as any).Hands;
  }

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  try {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

    let attempts = 0;
    while (!(window as any).Hands && attempts < 25) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }

    return (window as any).Hands || null;
  } catch (err) {
    console.error('Failed to load MediaPipe Hands scripts:', err);
    return null;
  }
}

/**
 * Skeleton keypoints rendered as small tracking points.
 * Strictly covers the detected joints of the anatomical skeleton.
 */
export const SKELETON_KEYPOINTS: number[] = [
  // TORSO
  LANDMARKS.LEFT_SHOULDER,
  LANDMARKS.RIGHT_SHOULDER,
  LANDMARKS.LEFT_HIP,
  LANDMARKS.RIGHT_HIP,
  // ARMS
  LANDMARKS.LEFT_ELBOW,
  LANDMARKS.RIGHT_ELBOW,
  LANDMARKS.LEFT_WRIST,
  LANDMARKS.RIGHT_WRIST,
  // LEGS & FEET
  LANDMARKS.LEFT_KNEE,
  LANDMARKS.RIGHT_KNEE,
  LANDMARKS.LEFT_ANKLE,
  LANDMARKS.RIGHT_ANKLE,
  LANDMARKS.LEFT_HEEL,
  LANDMARKS.RIGHT_HEEL,
  LANDMARKS.LEFT_FOOT_INDEX,
  LANDMARKS.RIGHT_FOOT_INDEX,
];

// Major kinematic joints rendered with optical CV tracking marker
const MAJOR_JOINTS = new Set<number>([
  LANDMARKS.LEFT_SHOULDER,
  LANDMARKS.RIGHT_SHOULDER,
  LANDMARKS.LEFT_ELBOW,
  LANDMARKS.RIGHT_ELBOW,
  LANDMARKS.LEFT_WRIST,
  LANDMARKS.RIGHT_WRIST,
  LANDMARKS.LEFT_HIP,
  LANDMARKS.RIGHT_HIP,
  LANDMARKS.LEFT_KNEE,
  LANDMARKS.RIGHT_KNEE,
  LANDMARKS.LEFT_ANKLE,
  LANDMARKS.RIGHT_ANKLE,
]);

/**
 * Landmark confidence thresholds for reliable CV tracking & form evaluation:
 * - MIN_DETECTION (0.40): Do not draw landmarks or lines below this (prevents hallucinated joints)
 * - RELIABLE (0.65): Confidence required to trigger posture issue flags (red); between 0.40 and 0.65 rendered as neutral gray
 */
export const CONFIDENCE_THRESHOLDS = {
  MIN_DETECTION: 0.4,
  RELIABLE: 0.65,
} as const;

/**
 * AXIO High-Performance Athletic Color Styles:
 * - green: optimal alignment within acceptable range
 * - red: specific segment with detected form issue
 * - gray: uncertain/low-confidence tracking (neutral, does not falsely claim bad form)
 */
export const SKELETON_COLORS = {
  green: {
    line: '#00FF66',
    glow: 'rgba(0, 255, 102, 0.55)',
    jointOuter: '#00FF66',
    jointInner: '#FFFFFF',
    jointGlow: 'rgba(0, 255, 102, 0.75)',
  },
  red: {
    line: '#FF3344',
    glow: 'rgba(255, 51, 68, 0.65)',
    jointOuter: '#FF3344',
    jointInner: '#FFFFFF',
    jointGlow: 'rgba(255, 51, 68, 0.85)',
  },
  gray: {
    line: '#7E8B9B',
    glow: 'rgba(126, 139, 155, 0.30)',
    jointOuter: '#7E8B9B',
    jointInner: '#D1D5DB',
    jointGlow: 'rgba(126, 139, 155, 0.40)',
  },
} as const;

/**
 * Anatomical body segment classification for precise localized coloring
 */
export type BodySegmentRegion =
  | 'torso'
  | 'neck'
  | 'leftArmUpper'
  | 'leftArmForearm'
  | 'rightArmUpper'
  | 'rightArmForearm'
  | 'leftLegThigh'
  | 'leftLegShin'
  | 'leftFoot'
  | 'rightLegThigh'
  | 'rightLegShin'
  | 'rightFoot';

export function getSegmentRegion(idx1: number, idx2: number): BodySegmentRegion | null {
  const min = Math.min(idx1, idx2);
  const max = Math.max(idx1, idx2);

  // Upper torso (clavicle & shoulder girdle) & torso-to-hip connections:
  if (min === LANDMARKS.LEFT_SHOULDER && max === LANDMARKS.RIGHT_SHOULDER) return 'torso';
  if (min === LANDMARKS.LEFT_SHOULDER && max === LANDMARKS.LEFT_HIP) return 'torso';
  if (min === LANDMARKS.RIGHT_SHOULDER && max === LANDMARKS.RIGHT_HIP) return 'torso';
  if (min === LANDMARKS.LEFT_HIP && max === LANDMARKS.RIGHT_HIP) return 'torso';

  // Left Arm:
  if (min === LANDMARKS.LEFT_SHOULDER && max === LANDMARKS.LEFT_ELBOW) return 'leftArmUpper';
  if (min === LANDMARKS.LEFT_ELBOW && max === LANDMARKS.LEFT_WRIST) return 'leftArmForearm';

  // Right Arm:
  if (min === LANDMARKS.RIGHT_SHOULDER && max === LANDMARKS.RIGHT_ELBOW) return 'rightArmUpper';
  if (min === LANDMARKS.RIGHT_ELBOW && max === LANDMARKS.RIGHT_WRIST) return 'rightArmForearm';

  // Left Leg:
  if (min === LANDMARKS.LEFT_HIP && max === LANDMARKS.LEFT_KNEE) return 'leftLegThigh';
  if (min === LANDMARKS.LEFT_KNEE && max === LANDMARKS.LEFT_ANKLE) return 'leftLegShin';
  if (
    (min === LANDMARKS.LEFT_ANKLE && max === LANDMARKS.LEFT_HEEL) ||
    (min === LANDMARKS.LEFT_HEEL && max === LANDMARKS.LEFT_FOOT_INDEX) ||
    (min === LANDMARKS.LEFT_ANKLE && max === LANDMARKS.LEFT_FOOT_INDEX)
  ) {
    return 'leftFoot';
  }

  // Right Leg:
  if (min === LANDMARKS.RIGHT_HIP && max === LANDMARKS.RIGHT_KNEE) return 'rightLegThigh';
  if (min === LANDMARKS.RIGHT_KNEE && max === LANDMARKS.RIGHT_ANKLE) return 'rightLegShin';
  if (
    (min === LANDMARKS.RIGHT_ANKLE && max === LANDMARKS.RIGHT_HEEL) ||
    (min === LANDMARKS.RIGHT_HEEL && max === LANDMARKS.RIGHT_FOOT_INDEX) ||
    (min === LANDMARKS.RIGHT_ANKLE && max === LANDMARKS.RIGHT_FOOT_INDEX)
  ) {
    return 'rightFoot';
  }

  return null;
}

/**
 * Computes posture color for a given skeletal connection [idx1, idx2]
 * COLOR RULES:
 * - GREEN: body skeleton lines in green when relevant movement & alignment are within acceptable range
 * - RED: turn ONLY relevant body segments red when system detects a form issue (never entire skeleton)
 * - GRAY: neutral/gray tracking when landmarks are not reliable (visibility < 0.65)
 */
export function getSegmentColor(
  idx1: number,
  idx2: number,
  landmarks: PoseLandmark[],
  postureFeedback?: PostureFeedback | null
): SegmentColor {
  const lm1 = landmarks[idx1];
  const lm2 = landmarks[idx2];
  if (!lm1 || !lm2) return 'gray';

  const vis1 = lm1.visibility ?? 1;
  const vis2 = lm2.visibility ?? 1;

  // Confidence check: If either endpoint is uncertain (< 0.65), render neutral gray
  // "When landmarks are not reliable, use neutral/gray tracking rather than falsely saying the user has bad form."
  if (vis1 < CONFIDENCE_THRESHOLDS.RELIABLE || vis2 < CONFIDENCE_THRESHOLDS.RELIABLE) {
    return 'gray';
  }

  if (!postureFeedback) return 'green';

  const region = getSegmentRegion(idx1, idx2);
  if (!region) return 'green';

  // Turn ONLY the relevant body segments red when a form issue is detected:
  if (region === 'torso') {
    if (
      postureFeedback.torsoIssue ||
      postureFeedback.torsoLeanIssue ||
      postureFeedback.spineAlignmentIssue
    ) {
      return 'red';
    }
  }

  if (region === 'leftLegThigh' || region === 'leftLegShin') {
    if (
      postureFeedback.leftLegIssue ||
      (postureFeedback.depthIssue && region === 'leftLegThigh')
    ) {
      return 'red';
    }
  }

  if (region === 'rightLegThigh' || region === 'rightLegShin') {
    if (
      postureFeedback.rightLegIssue ||
      (postureFeedback.depthIssue && region === 'rightLegThigh')
    ) {
      return 'red';
    }
  }

  if (region === 'leftArmUpper' || region === 'leftArmForearm') {
    if (postureFeedback.leftArmIssue || postureFeedback.armStabilityIssue) {
      return 'red';
    }
  }

  if (region === 'rightArmUpper' || region === 'rightArmForearm') {
    if (postureFeedback.rightArmIssue || postureFeedback.armStabilityIssue) {
      return 'red';
    }
  }

  return 'green';
}

/**
 * Computes posture color for a joint keypoint
 */
export function getJointColor(
  idx: number,
  landmarks: PoseLandmark[],
  postureFeedback?: PostureFeedback | null
): SegmentColor {
  const lm = landmarks[idx];
  if (!lm) return 'gray';

  const vis = lm.visibility ?? 1;
  if (vis < CONFIDENCE_THRESHOLDS.RELIABLE) {
    return 'gray';
  }

  if (!postureFeedback) return 'green';

  // Knees: turn red if knee alignment, leg, or squat depth issue
  if (
    idx === LANDMARKS.LEFT_KNEE &&
    (postureFeedback.leftLegIssue ||
      postureFeedback.kneeAlignmentIssue ||
      postureFeedback.depthIssue)
  ) {
    return 'red';
  }
  if (
    idx === LANDMARKS.RIGHT_KNEE &&
    (postureFeedback.rightLegIssue ||
      postureFeedback.kneeAlignmentIssue ||
      postureFeedback.depthIssue)
  ) {
    return 'red';
  }

  // Hips: turn red if torso lean, excessive hip movement, or plank spine issue
  if (
    (idx === LANDMARKS.LEFT_HIP || idx === LANDMARKS.RIGHT_HIP) &&
    (postureFeedback.torsoIssue ||
      postureFeedback.torsoLeanIssue ||
      postureFeedback.spineAlignmentIssue)
  ) {
    return 'red';
  }

  // Shoulders: turn red if torso lean or spine alignment issue
  if (
    (idx === LANDMARKS.LEFT_SHOULDER || idx === LANDMARKS.RIGHT_SHOULDER) &&
    (postureFeedback.torsoLeanIssue || postureFeedback.spineAlignmentIssue)
  ) {
    return 'red';
  }

  // Elbows & Wrists: turn red if arm issue
  if (
    (idx === LANDMARKS.LEFT_ELBOW || idx === LANDMARKS.LEFT_WRIST) &&
    (postureFeedback.leftArmIssue || postureFeedback.armStabilityIssue)
  ) {
    return 'red';
  }
  if (
    (idx === LANDMARKS.RIGHT_ELBOW || idx === LANDMARKS.RIGHT_WRIST) &&
    (postureFeedback.rightArmIssue || postureFeedback.armStabilityIssue)
  ) {
    return 'red';
  }

  return 'green';
}

/**
 * Validates that a landmark was genuinely detected by the model
 * and does not lie outside the plausible frame boundary.
 */
export function isLandmarkValid(
  lm?: PoseLandmark,
  minConfidence: number = CONFIDENCE_THRESHOLDS.MIN_DETECTION
): boolean {
  if (!lm) return false;
  if (typeof lm.x !== 'number' || typeof lm.y !== 'number') return false;
  if (!Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return false;
  // Bounding check (reject wild or infinite coordinates)
  if (lm.x < -0.05 || lm.x > 1.05 || lm.y < -0.05 || lm.y > 1.05) return false;
  // Reject unconfident or hallucinated landmarks
  if (lm.visibility !== undefined && lm.visibility < minConfidence) return false;
  return true;
}

/**
 * Video-to-Canvas coordinate transformation descriptor:
 * Maps normalized MediaPipe coordinates [0, 1] to exact rendered CSS display pixels,
 * accounting for object-cover/contain scaling, offsets, and horizontal selfie mirroring.
 */
export interface VideoViewportTransform {
  renderedWidth: number;
  renderedHeight: number;
  offsetX: number;
  offsetY: number;
  isMirrored: boolean;
}

/**
 * Computes exact display coordinates accounting for CSS object-fit (cover/contain)
 * and horizontal mirroring.
 */
export function computeVideoTransform(
  displayWidth: number,
  displayHeight: number,
  videoWidth: number,
  videoHeight: number,
  isMirrored: boolean,
  fit: 'cover' | 'contain' = 'cover'
): VideoViewportTransform {
  if (displayWidth <= 0 || displayHeight <= 0 || videoWidth <= 0 || videoHeight <= 0) {
    return {
      renderedWidth: displayWidth > 0 ? displayWidth : 640,
      renderedHeight: displayHeight > 0 ? displayHeight : 480,
      offsetX: 0,
      offsetY: 0,
      isMirrored,
    };
  }

  const containerRatio = displayWidth / displayHeight;
  const videoRatio = videoWidth / videoHeight;

  let renderedWidth: number;
  let renderedHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (fit === 'cover') {
    if (containerRatio > videoRatio) {
      // Container is wider than video: video fills width, top/bottom cropped
      renderedWidth = displayWidth;
      renderedHeight = displayWidth / videoRatio;
      offsetX = 0;
      offsetY = (displayHeight - renderedHeight) / 2;
    } else {
      // Container is taller/narrower than video: video fills height, sides cropped
      renderedWidth = displayHeight * videoRatio;
      renderedHeight = displayHeight;
      offsetX = (displayWidth - renderedWidth) / 2;
      offsetY = 0;
    }
  } else {
    // 'contain'
    if (containerRatio > videoRatio) {
      renderedHeight = displayHeight;
      renderedWidth = displayHeight * videoRatio;
      offsetX = (displayWidth - renderedWidth) / 2;
      offsetY = 0;
    } else {
      renderedWidth = displayWidth;
      renderedHeight = displayWidth / videoRatio;
      offsetX = 0;
      offsetY = (displayHeight - renderedHeight) / 2;
    }
  }

  return {
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY,
    isMirrored,
  };
}

/**
 * Transforms normalized coordinates (0..1) into exact canvas display pixel coordinates
 */
export function transformPoint(
  x: number,
  y: number,
  transform: VideoViewportTransform
): { x: number; y: number } {
  const normX = transform.isMirrored ? 1 - x : x;
  return {
    x: transform.offsetX + normX * transform.renderedWidth,
    y: transform.offsetY + y * transform.renderedHeight,
  };
}

/**
 * Draws the detected human pose skeleton with posture-based coloring:
 * - Green (#00FF66) when movement & alignment within acceptable range
 * - Red (#FF3344) ONLY on relevant segments with form issues (never whole skeleton)
 * - Gray (#7E8B9B) when landmarks are not reliable (below confidence threshold)
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
  postureFeedback?: PostureFeedback | null,
  transform?: VideoViewportTransform
) {
  if (!landmarks || landmarks.length === 0) return;

  const getCoords = (lm: { x: number; y: number }): [number, number] => {
    if (transform) {
      const pt = transformPoint(lm.x, lm.y, transform);
      return [pt.x, pt.y];
    }
    return [lm.x * width, lm.y * height];
  };

  // 1. Group Connection Lines by Color Category
  const segmentsByColor: Record<SegmentColor, [PoseLandmark, PoseLandmark][]> = {
    gray: [],
    green: [],
    red: [],
  };

  for (const [idx1, idx2] of POSE_CONNECTIONS) {
    const p1 = landmarks[idx1];
    const p2 = landmarks[idx2];

    if (
      isLandmarkValid(p1, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(p2, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
    ) {
      if (
        !Number.isFinite(p1.x) || !Number.isFinite(p1.y) ||
        !Number.isFinite(p2.x) || !Number.isFinite(p2.y)
      ) {
        continue;
      }
      // Strict bone distance check: prevents stretched or aberrant cross-screen lines
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist > 0.65) {
        continue;
      }

      const color = getSegmentColor(idx1, idx2, landmarks, postureFeedback);
      segmentsByColor[color].push([p1, p2]);
    }
  }

  // Draw lines in order: gray (neutral/stabilizing), green (optimal form), red (highlighted form issue)
  for (const colorKey of ['gray', 'green', 'red'] as SegmentColor[]) {
    const segs = segmentsByColor[colorKey];
    if (segs.length === 0) continue;

    const style = SKELETON_COLORS[colorKey];
    ctx.save();
    ctx.strokeStyle = style.line;
    ctx.lineWidth = colorKey === 'red' ? 3.0 : 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = colorKey === 'red' ? 6 : 4;

    ctx.beginPath();
    for (const [p1, p2] of segs) {
      const [x1, y1] = getCoords(p1);
      const [x2, y2] = getCoords(p2);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 2. Draw Detected Real Anatomical Joints as Small Points with matching status
  const jointsByColor: Record<
    SegmentColor,
    { cx: number; cy: number; isMajor: boolean }[]
  > = {
    gray: [],
    green: [],
    red: [],
  };

  for (const idx of SKELETON_KEYPOINTS) {
    const lm = landmarks[idx];
    if (!isLandmarkValid(lm, CONFIDENCE_THRESHOLDS.MIN_DETECTION)) continue;

    const color = getJointColor(idx, landmarks, postureFeedback);
    const [jx, jy] = getCoords(lm);
    jointsByColor[color].push({
      cx: jx,
      cy: jy,
      isMajor: MAJOR_JOINTS.has(idx),
    });
  }

  for (const colorKey of ['gray', 'green', 'red'] as SegmentColor[]) {
    const joints = jointsByColor[colorKey];
    if (joints.length === 0) continue;

    const style = SKELETON_COLORS[colorKey];
    ctx.save();

    // Outer glow ring
    for (const { cx, cy, isMajor } of joints) {
      const outerRadius = isMajor ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = style.jointOuter;
      ctx.shadowColor = style.jointGlow;
      ctx.shadowBlur = isMajor ? 5 : 3;
      ctx.fill();
    }

    // Inner crisp center point
    ctx.shadowBlur = 0;
    for (const { cx, cy, isMajor } of joints) {
      const innerRadius = isMajor ? 1.4 : 1.0;
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = style.jointInner;
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Facial landmark rendering has been removed to preserve user privacy.
 * The skeleton stops strictly at the neck and represents the body only.
 * The user's face is never covered by landmark lines, dots, or meshes.
 */
export function drawFacialLandmarks(
  _ctx?: CanvasRenderingContext2D,
  _landmarks?: PoseLandmark[],
  _width?: number,
  _height?: number,
  _postureFeedback?: PostureFeedback | null
) {
  // No-op: Facial identification and face overlays removed for user privacy.
}

/**
 * Hand landmark model interface (MediaPipe Hands 21 landmarks per hand)
 */
export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

/**
 * Anatomical Hand Skeleton Connections (MediaPipe Hand 21-Landmark Topology):
 * Grouped strictly by anatomical segments:
 * 1. Wrist & Palm structure (wrist to thumb CMC, wrist to index MCP, knuckle arch, wrist to pinky MCP)
 * 2. Thumb ray (CMC → MCP → IP → TIP)
 * 3. Index finger ray (MCP → PIP → DIP → TIP)
 * 4. Middle finger ray (MCP → PIP → DIP → TIP)
 * 5. Ring finger ray (MCP → PIP → DIP → TIP)
 * 6. Little finger ray (MCP → PIP → DIP → TIP)
 */
export const HAND_WRIST_AND_PALM_CONNECTIONS: [number, number][] = [
  [HAND_LANDMARKS.WRIST, HAND_LANDMARKS.THUMB_CMC],       // 0 → 1: Wrist to Thumb base
  [HAND_LANDMARKS.WRIST, HAND_LANDMARKS.INDEX_MCP],      // 0 → 5: Wrist to Index knuckle
  [HAND_LANDMARKS.INDEX_MCP, HAND_LANDMARKS.MIDDLE_MCP],  // 5 → 9: Metacarpal arch
  [HAND_LANDMARKS.MIDDLE_MCP, HAND_LANDMARKS.RING_MCP],   // 9 → 13: Metacarpal arch
  [HAND_LANDMARKS.RING_MCP, HAND_LANDMARKS.PINKY_MCP],    // 13 → 17: Metacarpal arch
  [HAND_LANDMARKS.WRIST, HAND_LANDMARKS.PINKY_MCP],      // 0 → 17: Wrist to Pinky knuckle
];

export const HAND_THUMB_CONNECTIONS: [number, number][] = [
  [HAND_LANDMARKS.THUMB_CMC, HAND_LANDMARKS.THUMB_MCP],   // 1 → 2
  [HAND_LANDMARKS.THUMB_MCP, HAND_LANDMARKS.THUMB_IP],    // 2 → 3
  [HAND_LANDMARKS.THUMB_IP, HAND_LANDMARKS.THUMB_TIP],    // 3 → 4
];

export const HAND_INDEX_CONNECTIONS: [number, number][] = [
  [HAND_LANDMARKS.INDEX_MCP, HAND_LANDMARKS.INDEX_PIP],   // 5 → 6
  [HAND_LANDMARKS.INDEX_PIP, HAND_LANDMARKS.INDEX_DIP],   // 6 → 7
  [HAND_LANDMARKS.INDEX_DIP, HAND_LANDMARKS.INDEX_TIP],   // 7 → 8
];

export const HAND_MIDDLE_CONNECTIONS: [number, number][] = [
  [HAND_LANDMARKS.MIDDLE_MCP, HAND_LANDMARKS.MIDDLE_PIP], // 9 → 10
  [HAND_LANDMARKS.MIDDLE_PIP, HAND_LANDMARKS.MIDDLE_DIP], // 10 → 11
  [HAND_LANDMARKS.MIDDLE_DIP, HAND_LANDMARKS.MIDDLE_TIP], // 11 → 12
];

export const HAND_RING_CONNECTIONS: [number, number][] = [
  [HAND_LANDMARKS.RING_MCP, HAND_LANDMARKS.RING_PIP],     // 13 → 14
  [HAND_LANDMARKS.RING_PIP, HAND_LANDMARKS.RING_DIP],     // 14 → 15
  [HAND_LANDMARKS.RING_DIP, HAND_LANDMARKS.RING_TIP],     // 15 → 16
];

export const HAND_LITTLE_CONNECTIONS: [number, number][] = [
  [HAND_LANDMARKS.PINKY_MCP, HAND_LANDMARKS.PINKY_PIP],   // 17 → 18
  [HAND_LANDMARKS.PINKY_PIP, HAND_LANDMARKS.PINKY_DIP],   // 18 → 19
  [HAND_LANDMARKS.PINKY_DIP, HAND_LANDMARKS.PINKY_TIP],   // 19 → 20
];

export const HAND_CONNECTIONS: [number, number][] = [
  ...HAND_WRIST_AND_PALM_CONNECTIONS,
  ...HAND_THUMB_CONNECTIONS,
  ...HAND_INDEX_CONNECTIONS,
  ...HAND_MIDDLE_CONNECTIONS,
  ...HAND_RING_CONNECTIONS,
  ...HAND_LITTLE_CONNECTIONS,
];

/**
 * Validates that an individual hand landmark coordinate is finite, in bounds,
 * and passes the minimum confidence threshold if reported.
 */
export function isHandLandmarkValid(lm?: HandLandmark, minConfidence = 0.4): boolean {
  if (!lm) return false;
  if (typeof lm.x !== 'number' || typeof lm.y !== 'number') return false;
  if (!Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return false;
  // Bounding check (reject wild or infinite coordinates outside video viewport)
  if (lm.x < -0.05 || lm.x > 1.05 || lm.y < -0.05 || lm.y > 1.05) return false;
  if (typeof lm.visibility === 'number' && Number.isFinite(lm.visibility) && lm.visibility < minConfidence) {
    return false;
  }
  return true;
}

/**
 * Validates whole-hand detection integrity:
 * - Checks detection confidence score if reported by handedness classifier
 * - Requires anchor wrist landmark and minimum count of valid landmarks
 * - Rejects collapsed/clustered landmarks where points overlap
 * - Rejects erratic, out-of-bound spans across the screen
 * - Hides the hand skeleton when valid hand landmarks are unavailable
 */
export function isHandValidAndReliable(
  hand: HandLandmark[],
  score?: number
): boolean {
  if (!hand || hand.length < 21) return false;

  // Hand detection confidence score from model handedness if available
  if (score !== undefined && score < 0.45) return false;

  // Wrist is the anatomical root anchor of the hand
  const wrist = hand[HAND_LANDMARKS.WRIST];
  if (!isHandLandmarkValid(wrist, CONFIDENCE_THRESHOLDS.MIN_DETECTION)) {
    return false;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let validCount = 0;

  for (let i = 0; i < 21; i++) {
    const lm = hand[i];
    if (isHandLandmarkValid(lm, CONFIDENCE_THRESHOLDS.MIN_DETECTION)) {
      validCount++;
      if (lm.x < minX) minX = lm.x;
      if (lm.x > maxX) maxX = lm.x;
      if (lm.y < minY) minY = lm.y;
      if (lm.y > maxY) maxY = lm.y;
    }
  }

  // Hide hand skeleton if too many landmarks are missing or unreliable
  if (validCount < 16) return false;

  const spanX = maxX - minX;
  const spanY = maxY - minY;

  // Reject wild coordinate explosion across entire screen
  if (spanX > 0.85 || spanY > 0.85) return false;

  // Reject clustered/collapsed landmarks (entire hand compressed into < 3% of viewport)
  const handSpan = Math.hypot(spanX, spanY);
  if (handSpan < 0.030) return false;

  // Check palm span from wrist to middle finger knuckle if middle knuckle is valid
  const middleMcp = hand[HAND_LANDMARKS.MIDDLE_MCP];
  if (isHandLandmarkValid(middleMcp, CONFIDENCE_THRESHOLDS.MIN_DETECTION)) {
    const palmDist = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y);
    if (palmDist < 0.010) return false;
  }

  return true;
}

/**
 * Temporal smoothing filter for pose landmarks to prevent camera jitter
 * while moving naturally and accurately without noticeable lag.
 */
export class PoseSmoother {
  private prevLandmarks: PoseLandmark[] | null = null;
  private lastTimestamp: number = 0;

  public smooth(current: PoseLandmark[] | null | undefined): PoseLandmark[] | null {
    if (!current || current.length === 0) {
      this.prevLandmarks = null;
      return null;
    }

    const now = Date.now();
    const timeDelta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    // Reset if there was a gap between frames > 400ms
    if (!this.prevLandmarks || this.prevLandmarks.length !== current.length || timeDelta > 400) {
      this.prevLandmarks = current.map((p) => ({ ...p }));
      return current;
    }

    const alpha = 0.92; // Snappy responsiveness (92% current, 8% previous) avoids trailing lag
    const smoothed: PoseLandmark[] = current.map((curr, i) => {
      const prev = this.prevLandmarks![i];

      // If either landmark was invalid, never interpolate across frames
      if (
        !isLandmarkValid(curr, CONFIDENCE_THRESHOLDS.MIN_DETECTION) ||
        !isLandmarkValid(prev, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
      ) {
        return { ...curr };
      }

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const distSq = dx * dx + dy * dy;

      // Fast snap on movement to keep skeleton firmly attached to joints
      if (distSq > 0.003) {
        return { ...curr };
      }

      return {
        x: prev.x + alpha * dx,
        y: prev.y + alpha * dy,
        z: curr.z !== undefined && prev.z !== undefined ? prev.z + alpha * (curr.z - prev.z) : curr.z,
        visibility: curr.visibility,
      };
    });

    this.prevLandmarks = smoothed.map((p) => ({ ...p }));
    return smoothed;
  }

  public reset() {
    this.prevLandmarks = null;
    this.lastTimestamp = 0;
  }
}

/**
 * Temporal smoothing filter for hand landmarks to prevent camera jitter
 * while moving naturally and accurately with the user's real movements.
 */
export class HandSmoother {
  private prevHands: Map<string, { landmarks: HandLandmark[]; timestamp: number }> = new Map();

  public smooth(handId: string, current: HandLandmark[]): HandLandmark[] {
    const now = Date.now();

    // Clean up stale entries older than 300ms
    for (const [key, val] of this.prevHands.entries()) {
      if (now - val.timestamp > 300) {
        this.prevHands.delete(key);
      }
    }

    const prevEntry = this.prevHands.get(handId);
    if (!prevEntry || prevEntry.landmarks.length !== current.length || now - prevEntry.timestamp > 300) {
      this.prevHands.set(handId, { landmarks: current.map((p) => ({ ...p })), timestamp: now });
      return current;
    }

    const prev = prevEntry.landmarks;
    const alpha = 0.90; // Snappy responsiveness (90% current, 10% previous)
    const smoothed: HandLandmark[] = current.map((curr, i) => {
      const p = prev[i];
      if (
        !isHandLandmarkValid(curr, CONFIDENCE_THRESHOLDS.MIN_DETECTION) ||
        !isHandLandmarkValid(p, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
      ) {
        return { ...curr };
      }

      const dx = curr.x - p.x;
      const dy = curr.y - p.y;
      const distSq = dx * dx + dy * dy;

      // Fast snap on movement to prevent hand trailing lag
      if (distSq > 0.003) {
        return { ...curr };
      }

      return {
        x: p.x + alpha * dx,
        y: p.y + alpha * dy,
        z: curr.z !== undefined && p.z !== undefined ? p.z + alpha * (curr.z - p.z) : curr.z,
        visibility: curr.visibility,
      };
    });

    this.prevHands.set(handId, { landmarks: smoothed.map((p) => ({ ...p })), timestamp: now });
    return smoothed;
  }

  public reset() {
    this.prevHands.clear();
  }
}

/**
 * Draws an individual detected hand skeleton:
 * - Palm structure: wrist to thumb CMC, wrist to index MCP, wrist to pinky MCP, knuckle arch
 * - 5 finger chains (thumb, index, middle, ring, pinky)
 * - Hides uncertain or collapsed hand connections
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  handLandmarks: HandLandmark[],
  width: number,
  height: number,
  handScore?: number,
  handColorKey: SegmentColor = 'green',
  transform?: VideoViewportTransform
) {
  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) return;
  if (!handLandmarks || handLandmarks.length < 21) return;

  // Validate hand integrity and check for collapsed / clustered landmarks
  if (!isHandValidAndReliable(handLandmarks, handScore)) {
    return;
  }

  const getHandCoords = (lm: { x: number; y: number }): [number, number] => {
    if (transform) {
      const pt = transformPoint(lm.x, lm.y, transform);
      return [pt.x, pt.y];
    }
    return [lm.x * width, lm.y * height];
  };

  const handStyle = SKELETON_COLORS[handColorKey];

  // 1. Draw Hand Connection Lines (Palm structure + 5 finger chains)
  ctx.save();
  ctx.strokeStyle = handStyle.line;
  ctx.lineWidth = handColorKey === 'red' ? 2.6 : 2.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = handStyle.glow;
  ctx.shadowBlur = handColorKey === 'red' ? 5 : 3;

  ctx.beginPath();
  for (const [idx1, idx2] of HAND_CONNECTIONS) {
    const p1 = handLandmarks[idx1];
    const p2 = handLandmarks[idx2];
    if (
      isHandLandmarkValid(p1, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isHandLandmarkValid(p2, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
    ) {
      if (
        !Number.isFinite(p1.x) || !Number.isFinite(p1.y) ||
        !Number.isFinite(p2.x) || !Number.isFinite(p2.y)
      ) {
        continue;
      }
      const boneDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (boneDist >= 0.003 && boneDist <= 0.22) {
        const [x1, y1] = getHandCoords(p1);
        const [x2, y2] = getHandCoords(p2);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
    }
  }
  ctx.stroke();
  ctx.restore();

  // 2. Draw Hand Joints as Small, Crisp Points
  ctx.save();
  for (let i = 0; i < 21; i++) {
    const lm = handLandmarks[i];
    if (!isHandLandmarkValid(lm, CONFIDENCE_THRESHOLDS.MIN_DETECTION)) continue;

    const [cx, cy] = getHandCoords(lm);

    const isTip =
      i === HAND_LANDMARKS.THUMB_TIP ||
      i === HAND_LANDMARKS.INDEX_TIP ||
      i === HAND_LANDMARKS.MIDDLE_TIP ||
      i === HAND_LANDMARKS.RING_TIP ||
      i === HAND_LANDMARKS.PINKY_TIP;

    const isWrist = i === HAND_LANDMARKS.WRIST;

    // Outer marker
    const outerRadius = isWrist ? 3.0 : isTip ? 2.4 : 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = handStyle.jointOuter;
    ctx.shadowColor = handStyle.jointGlow;
    ctx.shadowBlur = 3;
    ctx.fill();

    // Inner center
    const innerRadius = isWrist ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = handStyle.jointInner;
    ctx.shadowBlur = 0;
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Unified Full Body & Dual Hand Skeleton Renderer:
 * - Keeps anatomically verified body pose skeleton
 * - Adds full dual-hand tracking with 5 finger chains when hands are present
 * - Posture-based skeleton coloring:
 *   - GREEN for correct movement & alignment within acceptable range
 *   - RED only for specific body segments with form faults
 *   - GRAY for uncertain/low-confidence landmarks (never falsely claims bad form)
 * - Never fabricates landmarks when not detected
 */
export function drawFullBodyAndHandSkeleton(
  ctx: CanvasRenderingContext2D,
  poseLandmarks: PoseLandmark[] | null | undefined,
  multiHandLandmarks: HandLandmark[][] | null | undefined,
  multiHandedness: any[] | null | undefined,
  width: number,
  height: number,
  poseSmoother?: PoseSmoother,
  handSmoother?: HandSmoother,
  postureFeedback?: PostureFeedback | null,
  transform?: VideoViewportTransform
) {
  // 1. Smooth pose landmarks if smoother provided
  const smoothedPose = poseSmoother ? poseSmoother.smooth(poseLandmarks) : poseLandmarks;

  // 2. Draw Body Skeleton with posture-based coloring if pose landmarks detected
  if (smoothedPose && smoothedPose.length > 0) {
    drawPoseSkeleton(ctx, smoothedPose, width, height, postureFeedback, transform);
  }

  // 3. Draw Hand Landmark Tracking if hands are detected
  // Do NOT invent lines between unrelated joints or across frames!
  if (multiHandLandmarks && multiHandLandmarks.length > 0) {
    const leftWrist = smoothedPose ? smoothedPose[LANDMARKS.LEFT_WRIST] : null;
    const rightWrist = smoothedPose ? smoothedPose[LANDMARKS.RIGHT_WRIST] : null;

    multiHandLandmarks.forEach((rawHand, index) => {
      if (!rawHand || rawHand.length < 21) return;

      const handednessObj = multiHandedness && multiHandedness[index];
      const handLabel = handednessObj?.label || (index === 0 ? 'Hand0' : 'Hand1');
      const handScore = handednessObj?.score;
      const handId = `${handLabel}_${index}`;

      const hand = handSmoother ? handSmoother.smooth(handId, rawHand) : rawHand;

      // Determine hand posture color based on proximity to body wrists
      let handColor: SegmentColor = 'green';
      const handWrist = hand[HAND_LANDMARKS.WRIST];

      if (isHandLandmarkValid(handWrist, CONFIDENCE_THRESHOLDS.MIN_DETECTION)) {
        let nearestDistSq = Infinity;
        let matchedSide: 'left' | 'right' | null = null;
        const MAX_MATCH_DIST_SQ = 0.01; // ~10% screen radius max (realistic wrist proximity)

        if (leftWrist && isLandmarkValid(leftWrist, CONFIDENCE_THRESHOLDS.MIN_DETECTION)) {
          const d2 = (handWrist.x - leftWrist.x) ** 2 + (handWrist.y - leftWrist.y) ** 2;
          if (d2 < MAX_MATCH_DIST_SQ && d2 < nearestDistSq) {
            nearestDistSq = d2;
            matchedSide = 'left';
          }
        }

        if (rightWrist && isLandmarkValid(rightWrist, CONFIDENCE_THRESHOLDS.MIN_DETECTION)) {
          const d2 = (handWrist.x - rightWrist.x) ** 2 + (handWrist.y - rightWrist.y) ** 2;
          if (d2 < MAX_MATCH_DIST_SQ && d2 < nearestDistSq) {
            nearestDistSq = d2;
            matchedSide = 'right';
          }
        }

        if (postureFeedback) {
          if (matchedSide === 'left' && (postureFeedback.leftArmIssue || postureFeedback.armStabilityIssue)) {
            handColor = 'red';
          } else if (matchedSide === 'right' && (postureFeedback.rightArmIssue || postureFeedback.armStabilityIssue)) {
            handColor = 'red';
          }
        }
      }

      drawHandSkeleton(ctx, hand, width, height, handScore, handColor, transform);
    });
  }
}

/**
 * State machine & movement analyzer for exercises
 */
export class ExerciseAnalyzer {
  private currentExercise: ExerciseType = 'squat';
  private repCount: number = 0;
  private currentPhase: MovementPhase = 'READY';
  private reachedBottom: boolean = false;
  private reachedPeak: boolean = false;
  private minAngleInRep: number = 180;
  private maxAngleInRep: number = 0;
  private lastPhaseTime: number = Date.now();
  private lastRepTime: number = 0;
  private bestFormScore: number = 0;
  private formScoreSum: number = 0;
  private formScoreCount: number = 0;
  private keyFeedbackHistory: Set<string> = new Set();
  private lastAlternatingSide: 'left' | 'right' | null = null;
  private baselineHeelOffset: number | null = null;

  constructor(exercise: ExerciseType = 'squat') {
    this.currentExercise = exercise;
  }

  public setExercise(exercise: ExerciseType) {
    this.currentExercise = exercise;
    this.repCount = 0;
    this.currentPhase = 'READY';
    this.reachedBottom = false;
    this.reachedPeak = false;
    this.minAngleInRep = 180;
    this.maxAngleInRep = 0;
    this.bestFormScore = 0;
    this.formScoreSum = 0;
    this.formScoreCount = 0;
    this.lastAlternatingSide = null;
    this.baselineHeelOffset = null;
    this.keyFeedbackHistory.clear();
  }

  public resetSession() {
    this.repCount = 0;
    this.currentPhase = 'READY';
    this.reachedBottom = false;
    this.reachedPeak = false;
    this.minAngleInRep = 180;
    this.maxAngleInRep = 0;
    this.bestFormScore = 0;
    this.formScoreSum = 0;
    this.formScoreCount = 0;
    this.lastAlternatingSide = null;
    this.baselineHeelOffset = null;
    this.keyFeedbackHistory.clear();
  }

  public getSessionMetrics() {
    return {
      totalReps: this.repCount,
      averageForm:
        this.formScoreCount > 0
          ? Math.round(this.formScoreSum / this.formScoreCount)
          : 0,
      bestForm: this.bestFormScore > 0 ? this.bestFormScore : 0,
      keyFeedback: Array.from(this.keyFeedbackHistory).slice(0, 3),
    };
  }

  public incrementRep(): number {
    this.repCount += 1;
    this.lastRepTime = Date.now();
    this.keyFeedbackHistory.add('Good repetition');
    return this.repCount;
  }

  public getRepCount(): number {
    return this.repCount;
  }

  /**
   * Main analysis pipeline called on every camera frame with real landmarks
   */
  public analyze(landmarks: PoseLandmark[]): PoseAnalysisResult {
    if (!landmarks || landmarks.length < 33) {
      return {
        exercise: this.currentExercise,
        exerciseName: this.getExerciseName(),
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Step back so full body is visible in camera frame',
        formBreakdown: {
          metric1Name: 'Body Visibility',
          metric1Score: 0,
          metric2Name: 'Joint Tracking',
          metric2Score: 0,
          metric3Name: 'Alignment',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    switch (this.currentExercise) {
      case 'squat':
        return this.analyzeSquat(landmarks);
      case 'pushup':
        return this.analyzePushup(landmarks);
      case 'bicep-curl':
        return this.analyzeBicepCurl(landmarks);
      case 'lunge':
        return this.analyzeLunge(landmarks);
      case 'shoulder-press':
        return this.analyzeShoulderPress(landmarks);
      case 'jumping-jack':
        return this.analyzeJumpingJack(landmarks);
      case 'calf-raise':
        return this.analyzeCalfRaise(landmarks);
      case 'lateral-raise':
        return this.analyzeLateralRaise(landmarks);
      case 'high-knees':
        return this.analyzeHighKnees(landmarks);
      case 'glute-bridge':
        return this.analyzeGluteBridge(landmarks);
      default:
        return this.analyzeSquat(landmarks);
    }
  }

  private getExerciseName(): string {
    return getExerciseConfig(this.currentExercise).name;
  }

  // ==========================================
  // 1. SQUAT MOVEMENT ANALYSIS
  // ==========================================
  private analyzeSquat(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
    const leftFoot = landmarks[LANDMARKS.LEFT_FOOT_INDEX];
    const rightFoot = landmarks[LANDMARKS.RIGHT_FOOT_INDEX];
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];

    const isLeftLegReliable =
      isLandmarkValid(leftHip, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftKnee, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftAnkle, CONFIDENCE_THRESHOLDS.RELIABLE);

    const isRightLegReliable =
      isLandmarkValid(rightHip, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightKnee, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightAnkle, CONFIDENCE_THRESHOLDS.RELIABLE);

    // If neither leg is reliable, there is insufficient evidence to evaluate squat kinematics
    if (!isLeftLegReliable && !isRightLegReliable) {
      return {
        exercise: 'squat',
        exerciseName: 'SQUAT',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Step back so hips, knees, and ankles are in camera frame',
        formBreakdown: {
          metric1Name: 'Knee Alignment',
          metric1Score: 0,
          metric2Name: 'Depth',
          metric2Score: 0,
          metric3Name: 'Posture',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    // Pick side with higher visibility for primary sagittal plane knee angles
    const leftVis = (leftHip?.visibility ?? 0) + (leftKnee?.visibility ?? 0) + (leftAnkle?.visibility ?? 0);
    const rightVis = (rightHip?.visibility ?? 0) + (rightKnee?.visibility ?? 0) + (rightAnkle?.visibility ?? 0);
    const useLeft = isLeftLegReliable && (!isRightLegReliable || leftVis >= rightVis);

    const hip = useLeft ? leftHip : rightHip;
    const knee = useLeft ? leftKnee : rightKnee;
    const ankle = useLeft ? leftAnkle : rightAnkle;
    const foot = useLeft ? leftFoot : rightFoot;
    const shoulder = useLeft ? leftShoulder : rightShoulder;

    const kneeAngle = calculateAngle(hip, knee, ankle);
    const hipAngle = calculateAngle(shoulder, hip, knee);
    const ankleAngle = foot && isLandmarkValid(foot, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
      ? calculateAngle(knee, ankle, foot)
      : 85;

    // View plane discrimination (frontal vs profile/sagittal):
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const anklesWidth = Math.abs(leftAnkle.x - rightAnkle.x);
    const isFrontalView = hipWidth > 0.06 && shoulderWidth > 0.08 && anklesWidth > 0.06;

    // 1. Knee alignment check (valgus inward collapse):
    // Evaluated strictly in frontal camera view where lateral knee collapse is genuinely visible
    let kneeAlignmentScore = 95;
    let kneeAlignmentIssue = false;
    let leftLegIssue = false;
    let rightLegIssue = false;
    const activeIssues: string[] = [];

    if (isFrontalView && isLeftLegReliable && isRightLegReliable) {
      const midHipX = (leftHip.x + rightHip.x) / 2;
      const leftHipDist = Math.abs(leftHip.x - midHipX);
      const leftKneeDist = Math.abs(leftKnee.x - midHipX);
      const leftAnkleDist = Math.abs(leftAnkle.x - midHipX);

      const rightHipDist = Math.abs(rightHip.x - midHipX);
      const rightKneeDist = Math.abs(rightKnee.x - midHipX);
      const rightAnkleDist = Math.abs(rightAnkle.x - midHipX);

      const leftValgus = leftKneeDist < leftAnkleDist * 0.65 && leftKneeDist < leftHipDist * 0.70;
      const rightValgus = rightKneeDist < rightAnkleDist * 0.65 && rightKneeDist < rightHipDist * 0.70;

      if (leftValgus) {
        kneeAlignmentIssue = true;
        leftLegIssue = true;
        kneeAlignmentScore = 70;
      }
      if (rightValgus) {
        kneeAlignmentIssue = true;
        rightLegIssue = true;
        kneeAlignmentScore = 70;
      }

      if (leftValgus && rightValgus) {
        activeIssues.push('Knees collapsing inward');
      } else if (leftValgus) {
        activeIssues.push('Left knee collapsing inward');
      } else if (rightValgus) {
        activeIssues.push('Right knee collapsing inward');
      }
    }

    // 2. Torso posture check:
    const isTorsoReliable =
      isLandmarkValid(leftShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftHip, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightHip, CONFIDENCE_THRESHOLDS.RELIABLE);

    const verticalPoint = { x: hip.x, y: hip.y - 0.5 };
    const torsoAngle = calculateAngle(verticalPoint, hip, shoulder);

    let postureScore = 95;
    let torsoLeanIssue = false;
    let torsoIssue = false;

    if (isTorsoReliable) {
      if (!isFrontalView && torsoAngle > 55) {
        // Sagittal view forward chest collapse
        torsoLeanIssue = true;
        torsoIssue = true;
        postureScore = 70;
        activeIssues.push('Excessive forward torso lean');
      } else if (isFrontalView) {
        const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y) / Math.max(0.01, shoulderWidth);
        if (shoulderSlope > 0.22) {
          torsoIssue = true;
          postureScore = 75;
          activeIssues.push('Torso lateral tilt');
        }
      }
    }

    // 3. Squat depth & Rep cycle state machine:
    // STANDING (> 155°) -> DESCENDING (<= 150°) -> BOTTOM (<= 100°) -> ASCENDING -> STANDING (> 155°)
    let phase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';
    let depthScore = 95;
    let depthIssue = false;

    if (kneeAngle > 155) {
      if (this.currentPhase === 'ASCENDING' && this.reachedBottom) {
        const now = Date.now();
        if (now - this.lastRepTime > 800) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedBottom = false;
        this.minAngleInRep = 180;
        phase = 'STANDING';
        feedback = 'Rep complete · Stand tall';
        this.keyFeedbackHistory.add('Good repetition');
      } else if (this.minAngleInRep < 135 && !this.reachedBottom) {
        this.reachedBottom = false;
        this.minAngleInRep = 180;
        phase = 'STANDING';
        feedback = 'Squat deeper to parallel next rep';
        aiStatus = 'IMPROVE FORM';
      } else {
        phase = 'STANDING';
        this.minAngleInRep = 180;
        feedback = 'Ready · Begin squat descent';
        aiStatus = 'READY';
      }
      depthScore = 100;
    } else if (kneeAngle <= 155 && kneeAngle > 100) {
      this.minAngleInRep = Math.min(this.minAngleInRep, kneeAngle);

      if (this.reachedBottom) {
        phase = 'ASCENDING';
        feedback = 'Drive through heels to stand';
        aiStatus = 'ANALYZING';
        depthScore = 95;
      } else if (this.minAngleInRep > 100 && kneeAngle > this.minAngleInRep + 8 && kneeAngle > 115) {
        // User started ascending without reaching parallel
        phase = 'ASCENDING';
        depthIssue = true;
        depthScore = 70;
        if (isLeftLegReliable) leftLegIssue = true;
        if (isRightLegReliable) rightLegIssue = true;
        feedback = 'Squat deeper to parallel';
        aiStatus = 'IMPROVE FORM';
        activeIssues.push('Incomplete squat depth');
      } else {
        phase = 'DESCENDING';
        feedback = 'Control descent';
        aiStatus = 'ANALYZING';
        depthScore = 95;
      }
    } else if (kneeAngle <= 100) {
      phase = 'BOTTOM';
      this.reachedBottom = true;
      this.minAngleInRep = Math.min(this.minAngleInRep, kneeAngle);
      feedback = 'Solid parallel depth · Drive up';
      aiStatus = 'GOOD FORM';
      depthScore = 98;
    }

    // Priority corrective cues:
    if (kneeAlignmentIssue && phase !== 'STANDING') {
      feedback = 'Drive knees outward in line with toes';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Keep knees aligned');
    } else if (torsoLeanIssue && phase !== 'STANDING') {
      feedback = 'Keep chest up and torso upright';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Keep chest up');
    } else if (depthIssue) {
      feedback = 'Squat deeper to parallel';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Reach parallel depth');
    }

    this.currentPhase = phase;
    const overallForm = Math.round(
      kneeAlignmentScore * 0.35 + depthScore * 0.35 + postureScore * 0.3
    );
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
      torsoIssue,
      leftLegIssue,
      rightLegIssue,
      leftArmIssue: false,
      rightArmIssue: false,
      kneeAlignmentIssue,
      depthIssue,
      torsoLeanIssue,
      spineAlignmentIssue: false,
      armStabilityIssue: false,
      activeIssues,
    };

    return {
      exercise: 'squat',
      exerciseName: 'SQUAT',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'KNEE ALIGNMENT',
        metric1Score: kneeAlignmentScore,
        metric2Name: 'DEPTH',
        metric2Score: depthScore,
        metric3Name: 'POSTURE',
        metric3Score: postureScore,
      },
      keyAngles: [
        { label: 'Knee Angle', angle: kneeAngle },
        { label: 'Hip Angle', angle: hipAngle },
        { label: 'Ankle Angle', angle: ankleAngle },
        { label: 'Torso Incline', angle: torsoAngle },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 2. PUSH-UP MOVEMENT ANALYSIS
  // ==========================================
  private analyzePushup(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftElbow = landmarks[LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[LANDMARKS.RIGHT_ELBOW];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    const isLeftArmReliable =
      isLandmarkValid(leftShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftElbow, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftWrist, CONFIDENCE_THRESHOLDS.RELIABLE);

    const isRightArmReliable =
      isLandmarkValid(rightShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightElbow, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightWrist, CONFIDENCE_THRESHOLDS.RELIABLE);

    if (!isLeftArmReliable && !isRightArmReliable) {
      return {
        exercise: 'pushup',
        exerciseName: 'PUSH-UP',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Position arms and chest clearly in camera frame',
        formBreakdown: {
          metric1Name: 'Elbow Depth',
          metric1Score: 0,
          metric2Name: 'Hip Alignment',
          metric2Score: 0,
          metric3Name: 'Arm Symmetry',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    const leftVis = (leftElbow?.visibility ?? 0) + (leftWrist?.visibility ?? 0);
    const rightVis = (rightElbow?.visibility ?? 0) + (rightWrist?.visibility ?? 0);
    const useLeft = isLeftArmReliable && (!isRightArmReliable || leftVis >= rightVis);

    const shoulder = useLeft ? leftShoulder : rightShoulder;
    const elbow = useLeft ? leftElbow : rightElbow;
    const wrist = useLeft ? leftWrist : rightWrist;
    const hip = useLeft ? leftHip : rightHip;
    const ankle = useLeft ? leftAnkle : rightAnkle;

    const elbowAngle = calculateAngle(shoulder, elbow, wrist);

    // Spine & Plank Check:
    // Requires shoulder, hip, AND ankle to be reliably detected
    const isTorsoPlankReliable =
      isLandmarkValid(shoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(hip, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(ankle, CONFIDENCE_THRESHOLDS.RELIABLE);

    let spineScore = 95;
    let spineAlignmentIssue = false;
    let torsoIssue = false;
    let spineFeedbackText = '';
    const activeIssues: string[] = [];

    let spinePlankAngle = 175;
    if (isTorsoPlankReliable) {
      spinePlankAngle = calculateAngle(shoulder, hip, ankle);
      if (spinePlankAngle < 155) {
        spineAlignmentIssue = true;
        torsoIssue = true;
        spineScore = 70;
        const t = (hip.x - shoulder.x) / ((ankle.x - shoulder.x) || 1);
        const expectedHipY = shoulder.y + t * (ankle.y - shoulder.y);
        if (hip.y > expectedHipY + 0.025) {
          spineFeedbackText = 'Engage core to prevent hip sag';
          activeIssues.push('Hip sag in plank');
        } else {
          spineFeedbackText = 'Lower hips into straight plank line';
          activeIssues.push('Hips elevated above plank line');
        }
      }
    }

    // Depth & Rep cycle:
    // TOP (> 155°) -> DESCENDING -> BOTTOM (<= 95°) -> ASCENDING -> TOP (> 155°)
    let depthScore = 95;
    let depthIssue = false;
    let leftArmIssue = false;
    let rightArmIssue = false;

    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';

    if (elbowAngle > 155) {
      if (this.currentPhase === 'ASCENDING' && this.reachedBottom) {
        const now = Date.now();
        if (now - this.lastRepTime > 800) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedBottom = false;
        this.minAngleInRep = 180;
        phase = 'TOP';
        feedback = 'Rep complete · Lock out';
        this.keyFeedbackHistory.add('Good repetition');
      } else if (this.minAngleInRep < 135 && !this.reachedBottom) {
        this.reachedBottom = false;
        this.minAngleInRep = 180;
        phase = 'TOP';
        feedback = 'Incomplete rep · Lower chest to 90° next rep';
        aiStatus = 'IMPROVE FORM';
      } else {
        phase = 'TOP';
        this.minAngleInRep = 180;
        feedback = 'Plank hold · Lower chest with control';
        aiStatus = 'READY';
      }
      depthScore = 100;
    } else if (elbowAngle <= 155 && elbowAngle > 95) {
      this.minAngleInRep = Math.min(this.minAngleInRep, elbowAngle);

      if (this.reachedBottom) {
        phase = 'ASCENDING';
        feedback = 'Press floor away';
        aiStatus = 'ANALYZING';
        depthScore = 95;
      } else if (this.minAngleInRep > 95 && elbowAngle > this.minAngleInRep + 8 && elbowAngle > 110) {
        // User pressing up early without reaching 90° depth
        phase = 'ASCENDING';
        depthIssue = true;
        leftArmIssue = isLeftArmReliable;
        rightArmIssue = isRightArmReliable;
        depthScore = 70;
        feedback = 'Lower chest to 90° elbow bend';
        aiStatus = 'IMPROVE FORM';
        activeIssues.push('Incomplete push-up depth');
      } else {
        phase = 'DESCENDING';
        feedback = 'Control descent';
        aiStatus = 'ANALYZING';
        depthScore = 95;
      }
    } else if (elbowAngle <= 95) {
      phase = 'BOTTOM';
      this.reachedBottom = true;
      this.minAngleInRep = Math.min(this.minAngleInRep, elbowAngle);
      feedback = 'Solid depth · Press up';
      aiStatus = 'GOOD FORM';
      depthScore = 98;
    }

    if (spineAlignmentIssue && phase !== 'READY') {
      feedback = spineFeedbackText || 'Maintain straight plank line';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add(spineFeedbackText || 'Maintain straight plank');
    } else if (depthIssue) {
      feedback = 'Lower chest to 90° elbow bend';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Lower chest to 90°');
    }

    this.currentPhase = phase;
    const overallForm = Math.round(depthScore * 0.5 + spineScore * 0.5);
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
      torsoIssue,
      leftLegIssue: false,
      rightLegIssue: false,
      leftArmIssue,
      rightArmIssue,
      kneeAlignmentIssue: false,
      depthIssue,
      torsoLeanIssue: false,
      spineAlignmentIssue,
      armStabilityIssue: false,
      activeIssues,
    };

    return {
      exercise: 'pushup',
      exerciseName: 'PUSH-UP',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Elbow Depth',
        metric1Score: depthScore,
        metric2Name: 'Hip Alignment',
        metric2Score: spineScore,
        metric3Name: 'Arm Symmetry',
        metric3Score: 94,
      },
      keyAngles: [
        { label: 'Elbow Angle', angle: elbowAngle },
        { label: 'Hip/Spine Line', angle: spinePlankAngle },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 3. BICEP CURL MOVEMENT ANALYSIS
  // ==========================================
  private analyzeBicepCurl(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftElbow = landmarks[LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[LANDMARKS.RIGHT_ELBOW];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

    const isLeftArmReliable =
      isLandmarkValid(leftShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftElbow, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftWrist, CONFIDENCE_THRESHOLDS.RELIABLE);

    const isRightArmReliable =
      isLandmarkValid(rightShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightElbow, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightWrist, CONFIDENCE_THRESHOLDS.RELIABLE);

    if (!isLeftArmReliable && !isRightArmReliable) {
      return {
        exercise: 'bicep-curl',
        exerciseName: 'BICEP CURL',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Position arms and elbows clearly in camera frame',
        formBreakdown: {
          metric1Name: 'Peak Flexion',
          metric1Score: 0,
          metric2Name: 'Elbow Stability',
          metric2Score: 0,
          metric3Name: 'Full Extension',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    const leftElbowAngle = isLeftArmReliable ? calculateAngle(leftShoulder, leftElbow, leftWrist) : 180;
    const rightElbowAngle = isRightArmReliable ? calculateAngle(rightShoulder, rightElbow, rightWrist) : 180;

    // Pick active curling arm (arm flexing <= 145°, or the more reliable arm)
    let useLeft = true;
    if (isLeftArmReliable && isRightArmReliable) {
      if (leftElbowAngle <= 145 && rightElbowAngle > 145) {
        useLeft = true;
      } else if (rightElbowAngle <= 145 && leftElbowAngle > 145) {
        useLeft = false;
      } else {
        useLeft = leftElbowAngle <= rightElbowAngle;
      }
    } else if (isRightArmReliable) {
      useLeft = false;
    }

    const shoulder = useLeft ? leftShoulder : rightShoulder;
    const elbow = useLeft ? leftElbow : rightElbow;
    const wrist = useLeft ? leftWrist : rightWrist;
    const hip = useLeft ? leftHip : rightHip;
    const elbowAngle = useLeft ? leftElbowAngle : rightElbowAngle;

    // Torso-arm angle (checks if elbow drifts/swings away from ribs)
    const torsoArmAngle = hip && isLandmarkValid(hip, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
      ? calculateAngle(hip, shoulder, elbow)
      : 20;

    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';
    let peakSqueezeScore = 95;
    let extensionScore = 95;

    if (elbowAngle > 145) {
      if (this.currentPhase === 'LOWERING' && this.reachedPeak) {
        const now = Date.now();
        if (now - this.lastRepTime > 800) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedPeak = false;
        this.minAngleInRep = 180;
        feedback = 'Rep complete · Full extension';
        this.keyFeedbackHistory.add('Good repetition');
      } else if (this.minAngleInRep < 130 && !this.reachedPeak) {
        this.reachedPeak = false;
        this.minAngleInRep = 180;
        feedback = 'Incomplete curl · Squeeze all the way to top next rep';
        aiStatus = 'IMPROVE FORM';
      } else {
        phase = 'TOP';
        this.minAngleInRep = 180;
        feedback = 'Extended · Squeeze biceps to curl';
        aiStatus = 'READY';
      }
      extensionScore = 100;
    } else if (elbowAngle <= 145 && elbowAngle > 60) {
      this.minAngleInRep = Math.min(this.minAngleInRep, elbowAngle);

      if (this.reachedPeak) {
        phase = 'LOWERING';
        feedback = 'Control lowering tempo';
        aiStatus = 'ANALYZING';
      } else {
        phase = 'CURLING';
        feedback = 'Curl toward shoulders';
        aiStatus = 'ANALYZING';
      }
    } else if (elbowAngle <= 60) {
      phase = 'PEAK';
      this.reachedPeak = true;
      this.minAngleInRep = Math.min(this.minAngleInRep, elbowAngle);
      feedback = 'Peak contraction · Squeeze';
      aiStatus = 'GOOD FORM';
      peakSqueezeScore = 98;
    }

    let elbowStabilityScore = 95;
    let stabilityIssue = false;
    let leftArmIssue = false;
    let rightArmIssue = false;
    const activeIssues: string[] = [];

    if (
      torsoArmAngle > 40 &&
      (phase === 'CURLING' || phase === 'PEAK')
    ) {
      elbowStabilityScore = 70;
      stabilityIssue = true;
      if (useLeft) leftArmIssue = true;
      else rightArmIssue = true;
      activeIssues.push('Elbow swinging forward');
    }

    if (stabilityIssue) {
      feedback = 'Keep elbows pinned to your sides';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Keep elbows pinned');
    }

    this.currentPhase = phase;
    const overallForm = Math.round(
      peakSqueezeScore * 0.4 + elbowStabilityScore * 0.4 + extensionScore * 0.2
    );
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
      torsoIssue: false,
      leftLegIssue: false,
      rightLegIssue: false,
      leftArmIssue,
      rightArmIssue,
      kneeAlignmentIssue: false,
      depthIssue: false,
      torsoLeanIssue: false,
      spineAlignmentIssue: false,
      armStabilityIssue: stabilityIssue,
      activeIssues,
    };

    return {
      exercise: 'bicep-curl',
      exerciseName: 'BICEP CURL',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Peak Flexion',
        metric1Score: peakSqueezeScore,
        metric2Name: 'Elbow Stability',
        metric2Score: elbowStabilityScore,
        metric3Name: 'Full Extension',
        metric3Score: extensionScore,
      },
      keyAngles: [
        { label: 'Elbow Flexion', angle: elbowAngle },
        { label: 'Torso-Arm Drift', angle: torsoArmAngle },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 4. LUNGE MOVEMENT ANALYSIS
  // ==========================================
  private analyzeLunge(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];

    const isLeftLegReliable =
      isLandmarkValid(leftHip, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftKnee, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftAnkle, CONFIDENCE_THRESHOLDS.RELIABLE);

    const isRightLegReliable =
      isLandmarkValid(rightHip, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightKnee, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightAnkle, CONFIDENCE_THRESHOLDS.RELIABLE);

    if (!isLeftLegReliable && !isRightLegReliable) {
      return {
        exercise: 'lunge',
        exerciseName: 'LUNGE',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Step back so legs are visible in camera frame',
        formBreakdown: {
          metric1Name: 'Front Knee Depth',
          metric1Score: 0,
          metric2Name: 'Torso Upright',
          metric2Score: 0,
          metric3Name: 'Leg Alignment',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    const leftKneeAngle = isLeftLegReliable ? calculateAngle(leftHip, leftKnee, leftAnkle) : 180;
    const rightKneeAngle = isRightLegReliable ? calculateAngle(rightHip, rightKnee, rightAnkle) : 180;

    // In a lunge, the front working leg has the smaller knee angle
    const frontIsLeft = isLeftLegReliable && (!isRightLegReliable || leftKneeAngle <= rightKneeAngle);
    const frontKneeAngle = frontIsLeft ? leftKneeAngle : rightKneeAngle;
    const backKneeAngle = frontIsLeft ? rightKneeAngle : leftKneeAngle;
    const isFrontLegReliable = frontIsLeft ? isLeftLegReliable : isRightLegReliable;

    // Torso angle from vertical
    const refHip = frontIsLeft ? leftHip : rightHip;
    const refShoulder = frontIsLeft ? leftShoulder : rightShoulder;
    const verticalPoint = { x: refHip.x, y: refHip.y - 0.5 };
    const torsoAngle = calculateAngle(verticalPoint, refHip, refShoulder);

    const isTorsoReliable =
      isLandmarkValid(refShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(refHip, CONFIDENCE_THRESHOLDS.RELIABLE);

    let depthScore = 95;
    let depthIssue = false;
    let legIssue = false;

    let torsoScore = 95;
    let torsoLeanIssue = false;
    let torsoIssue = false;
    const activeIssues: string[] = [];

    if (isTorsoReliable && torsoAngle > 35 && this.currentPhase !== 'READY') {
      torsoScore = 70;
      torsoLeanIssue = true;
      torsoIssue = true;
      activeIssues.push('Torso leaning forward');
    }

    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';

    if (frontKneeAngle > 155) {
      if (this.currentPhase === 'ASCENDING' && this.reachedBottom) {
        const now = Date.now();
        if (now - this.lastRepTime > 800) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedBottom = false;
        this.minAngleInRep = 180;
        feedback = 'Rep complete · Stand tall';
        this.keyFeedbackHistory.add('Good repetition');
      } else if (this.minAngleInRep < 135 && !this.reachedBottom) {
        this.reachedBottom = false;
        this.minAngleInRep = 180;
        feedback = 'Incomplete lunge · Lower knee to 90° next rep';
        aiStatus = 'IMPROVE FORM';
      } else {
        phase = 'READY';
        this.minAngleInRep = 180;
        feedback = 'Step forward · Prepare lunge';
        aiStatus = 'READY';
      }
      depthScore = 100;
    } else if (frontKneeAngle <= 155 && frontKneeAngle > 100) {
      this.minAngleInRep = Math.min(this.minAngleInRep, frontKneeAngle);

      if (this.reachedBottom) {
        phase = 'ASCENDING';
        feedback = 'Drive through front heel';
        aiStatus = 'ANALYZING';
      } else if (this.minAngleInRep > 100 && frontKneeAngle > this.minAngleInRep + 8 && frontKneeAngle > 115) {
        // Ascending early without reaching 90° lunge depth
        phase = 'ASCENDING';
        depthIssue = true;
        legIssue = isFrontLegReliable;
        depthScore = 70;
        feedback = 'Lower front knee to 90° bend';
        aiStatus = 'IMPROVE FORM';
        activeIssues.push('Incomplete front knee depth');
      } else {
        phase = 'DESCENDING';
        feedback = 'Drop hips straight down';
        aiStatus = 'ANALYZING';
      }
    } else if (frontKneeAngle <= 100) {
      phase = 'BOTTOM';
      this.reachedBottom = true;
      this.minAngleInRep = Math.min(this.minAngleInRep, frontKneeAngle);
      feedback = 'Solid 90° knee angle · Drive up';
      aiStatus = 'GOOD FORM';
      depthScore = 98;
    }

    if (torsoLeanIssue) {
      feedback = 'Keep torso upright';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Keep torso upright');
    } else if (depthIssue) {
      feedback = 'Lower front knee to 90° bend';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Reach 90° lunge depth');
    }

    this.currentPhase = phase;
    const overallForm = Math.round(depthScore * 0.5 + torsoScore * 0.5);
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
      torsoIssue,
      leftLegIssue: frontIsLeft ? legIssue : false,
      rightLegIssue: !frontIsLeft ? legIssue : false,
      leftArmIssue: false,
      rightArmIssue: false,
      kneeAlignmentIssue: false,
      depthIssue,
      torsoLeanIssue,
      spineAlignmentIssue: false,
      armStabilityIssue: false,
      activeIssues,
    };

    return {
      exercise: 'lunge',
      exerciseName: 'LUNGE',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Front Knee Depth',
        metric1Score: depthScore,
        metric2Name: 'Torso Upright',
        metric2Score: torsoScore,
        metric3Name: 'Leg Alignment',
        metric3Score: 92,
      },
      keyAngles: [
        { label: 'Front Knee', angle: frontKneeAngle },
        { label: 'Back Knee', angle: backKneeAngle },
        { label: 'Torso Angle', angle: torsoAngle },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 5. SHOULDER PRESS MOVEMENT ANALYSIS
  // ==========================================
  private analyzeShoulderPress(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftElbow = landmarks[LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[LANDMARKS.RIGHT_ELBOW];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

    const isLeftArmReliable =
      isLandmarkValid(leftShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftElbow, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftWrist, CONFIDENCE_THRESHOLDS.RELIABLE);

    const isRightArmReliable =
      isLandmarkValid(rightShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightElbow, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightWrist, CONFIDENCE_THRESHOLDS.RELIABLE);

    if (!isLeftArmReliable && !isRightArmReliable) {
      return {
        exercise: 'shoulder-press',
        exerciseName: 'SHOULDER PRESS',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Position shoulders, elbows, and wrists clearly in camera frame',
        formBreakdown: {
          metric1Name: 'Overhead Lockout',
          metric1Score: 0,
          metric2Name: 'Elbow Path',
          metric2Score: 0,
          metric3Name: 'Core Stability',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    const leftElbowAngle = isLeftArmReliable ? calculateAngle(leftShoulder, leftElbow, leftWrist) : 90;
    const rightElbowAngle = isRightArmReliable ? calculateAngle(rightShoulder, rightElbow, rightWrist) : 90;

    const useBoth = isLeftArmReliable && isRightArmReliable;
    const avgElbowAngle = useBoth
      ? Math.round((leftElbowAngle + rightElbowAngle) / 2)
      : isLeftArmReliable
      ? leftElbowAngle
      : rightElbowAngle;

    const refHip = leftHip || rightHip;
    const refShoulder = leftShoulder || rightShoulder;
    const verticalPoint = { x: refHip.x, y: refHip.y - 0.5 };
    const torsoAngle =
      isLandmarkValid(refShoulder, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(refHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
        ? calculateAngle(verticalPoint, refHip, refShoulder)
        : 0;

    let lockoutScore = 95;
    let pathScore = 95;
    let coreScore = 95;
    let leftArmIssue = false;
    let rightArmIssue = false;
    let torsoIssue = false;
    const activeIssues: string[] = [];

    // Core stability check (lumbar hyperextension / backward lean)
    if (torsoAngle > 22) {
      coreScore = 70;
      torsoIssue = true;
      activeIssues.push('Torso leaning backward under load');
    }

    // Arm symmetry check
    if (useBoth && Math.abs(leftElbowAngle - rightElbowAngle) > 24) {
      pathScore = 72;
      if (leftElbowAngle < rightElbowAngle) leftArmIssue = true;
      else rightArmIssue = true;
      activeIssues.push('Asymmetrical press height');
    }

    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';

    // Racked at shoulders: <= 100°
    if (avgElbowAngle <= 100) {
      if ((this.currentPhase === 'DESCENDING' || this.currentPhase === 'TOP') && this.reachedPeak) {
        const now = Date.now();
        if (now - this.lastRepTime > 750) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedPeak = false;
        phase = 'READY';
        feedback = 'Rep complete · Press overhead';
        this.keyFeedbackHistory.add('Good repetition');
      } else {
        phase = 'READY';
        feedback = 'Racked at shoulders · Press overhead';
        aiStatus = 'READY';
      }
      lockoutScore = 95;
    } else if (avgElbowAngle > 100 && avgElbowAngle < 155) {
      if (this.reachedPeak) {
        phase = 'DESCENDING';
        feedback = 'Lower weights with control';
        aiStatus = 'ANALYZING';
      } else {
        phase = 'ASCENDING';
        feedback = 'Drive weights overhead';
        aiStatus = 'ANALYZING';
      }
    } else if (avgElbowAngle >= 155) {
      phase = 'TOP';
      this.reachedPeak = true;
      feedback = 'Full overhead lockout · Lower with control';
      aiStatus = 'GOOD FORM';
      lockoutScore = 98;
    }

    if (torsoIssue) {
      feedback = 'Brace core to prevent arching lower back';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Keep core braced');
    } else if (leftArmIssue || rightArmIssue) {
      feedback = 'Press both arms simultaneously';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Maintain arm symmetry');
    }

    this.currentPhase = phase;
    const overallForm = Math.round(lockoutScore * 0.4 + pathScore * 0.3 + coreScore * 0.3);
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
      torsoIssue,
      leftLegIssue: false,
      rightLegIssue: false,
      leftArmIssue,
      rightArmIssue,
      kneeAlignmentIssue: false,
      depthIssue: false,
      torsoLeanIssue: torsoIssue,
      spineAlignmentIssue: torsoIssue,
      armStabilityIssue: false,
      activeIssues,
    };

    return {
      exercise: 'shoulder-press',
      exerciseName: 'SHOULDER PRESS',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Overhead Lockout',
        metric1Score: lockoutScore,
        metric2Name: 'Elbow Path',
        metric2Score: pathScore,
        metric3Name: 'Core Stability',
        metric3Score: coreScore,
      },
      keyAngles: [
        { label: 'Elbow Lockout', angle: avgElbowAngle },
        { label: 'Torso Angle', angle: torsoAngle },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 6. JUMPING JACK MOVEMENT ANALYSIS
  // ==========================================
  private analyzeJumpingJack(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    const isUpperReliable =
      isLandmarkValid(leftShoulder, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(rightShoulder, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      (isLandmarkValid(leftWrist, CONFIDENCE_THRESHOLDS.MIN_DETECTION) ||
        isLandmarkValid(rightWrist, CONFIDENCE_THRESHOLDS.MIN_DETECTION));

    const isLowerReliable =
      isLandmarkValid(leftHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(rightHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION);

    if (!isUpperReliable || !isLowerReliable) {
      return {
        exercise: 'jumping-jack',
        exerciseName: 'JUMPING JACK',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Step back so full body from head to feet is in camera frame',
        formBreakdown: {
          metric1Name: 'Overhead Reach',
          metric1Score: 0,
          metric2Name: 'Stance Width',
          metric2Score: 0,
          metric3Name: 'Rhythm & Tempo',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    const leftAbduction = isLandmarkValid(leftWrist, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
      ? calculateAngle(leftHip, leftShoulder, leftWrist)
      : 30;
    const rightAbduction = isLandmarkValid(rightWrist, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
      ? calculateAngle(rightHip, rightShoulder, rightWrist)
      : 30;
    const avgAbduction = Math.round((leftAbduction + rightAbduction) / 2);

    const hasAnkles =
      isLandmarkValid(leftAnkle, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(rightAnkle, CONFIDENCE_THRESHOLDS.MIN_DETECTION);

    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) || 0.12;
    const ankleDist = hasAnkles
      ? Math.abs(leftAnkle.x - rightAnkle.x)
      : Math.abs(leftHip.x - rightHip.x) * 1.5;
    const stanceRatio = Math.round((ankleDist / shoulderWidth) * 100) / 100;

    let reachScore = 95;
    let stanceScore = 95;
    let tempoScore = 94;
    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';

    // Closed position: arms down (<45°) AND feet close (<= 1.25x shoulder width)
    if (avgAbduction < 45 && stanceRatio <= 1.25) {
      if (this.reachedPeak) {
        const now = Date.now();
        if (now - this.lastRepTime > 450) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedPeak = false;
        phase = 'STANDING';
        feedback = 'Rep complete · Keep the rhythm';
        this.keyFeedbackHistory.add('Good rhythm');
      } else {
        phase = 'STANDING';
        feedback = 'Feet together, arms at sides · Ready';
        aiStatus = 'READY';
      }
      reachScore = 95;
      stanceScore = 95;
    } else if (avgAbduction >= 130 && stanceRatio >= 1.45) {
      // Open / Peak position
      phase = 'PEAK';
      this.reachedPeak = true;
      feedback = 'Full extension overhead · Land softly';
      aiStatus = 'GOOD FORM';
      reachScore = 98;
      stanceScore = 96;
    } else {
      // In-flight transition
      if (this.reachedPeak) {
        phase = 'DESCENDING';
        feedback = 'Bring feet and arms back together';
        aiStatus = 'ANALYZING';
      } else {
        phase = 'ASCENDING';
        feedback = 'Jump feet wide and raise arms';
        aiStatus = 'ANALYZING';
      }
    }

    this.currentPhase = phase;
    const overallForm = Math.round(reachScore * 0.4 + stanceScore * 0.4 + tempoScore * 0.2);
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
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

    return {
      exercise: 'jumping-jack',
      exerciseName: 'JUMPING JACK',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Overhead Reach',
        metric1Score: reachScore,
        metric2Name: 'Stance Width',
        metric2Score: stanceScore,
        metric3Name: 'Rhythm & Tempo',
        metric3Score: tempoScore,
      },
      keyAngles: [
        { label: 'Arm Reach', angle: avgAbduction },
        { label: 'Stance Ratio', angle: Math.round(stanceRatio * 100) },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 7. CALF RAISE MOVEMENT ANALYSIS
  // ==========================================
  private analyzeCalfRaise(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
    const leftHeel = landmarks[LANDMARKS.LEFT_HEEL];
    const rightHeel = landmarks[LANDMARKS.RIGHT_HEEL];
    const leftFoot = landmarks[LANDMARKS.LEFT_FOOT_INDEX];
    const rightFoot = landmarks[LANDMARKS.RIGHT_FOOT_INDEX];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

    const leftFootReliable =
      isLandmarkValid(leftAnkle, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(leftHeel, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(leftFoot, CONFIDENCE_THRESHOLDS.MIN_DETECTION);

    const rightFootReliable =
      isLandmarkValid(rightAnkle, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(rightHeel, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(rightFoot, CONFIDENCE_THRESHOLDS.MIN_DETECTION);

    if (!leftFootReliable && !rightFootReliable) {
      return {
        exercise: 'calf-raise',
        exerciseName: 'CALF RAISE',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Step back or tilt camera down so feet and ankles are clearly visible',
        formBreakdown: {
          metric1Name: 'Heel Elevation',
          metric1Score: 0,
          metric2Name: 'Knee Extension',
          metric2Score: 0,
          metric3Name: 'Tempo Control',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    // Measure vertical elevation of heels relative to toe index: (y increases downwards)
    const heelRiseLeft = leftFootReliable ? leftFoot.y - leftHeel.y : 0;
    const heelRiseRight = rightFootReliable ? rightFoot.y - rightHeel.y : 0;
    const maxRise = Math.max(leftFootReliable ? heelRiseLeft : 0, rightFootReliable ? heelRiseRight : 0);

    const refHip = leftHip || rightHip;
    const refKnee = leftFootReliable ? leftKnee : rightKnee;
    const refAnkle = leftFootReliable ? leftAnkle : rightAnkle;
    const kneeAngle =
      refHip && refKnee && refAnkle && isLandmarkValid(refKnee, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
        ? calculateAngle(refHip, refKnee, refAnkle)
        : 175;

    let elevationScore = 95;
    let kneeScore = 95;
    let tempoScore = 94;
    let legIssue = false;
    const activeIssues: string[] = [];

    // Knee bending check (user should maintain locked extension)
    if (kneeAngle < 155) {
      kneeScore = 70;
      legIssue = true;
      activeIssues.push('Knees bending to assist raise');
    }

    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';

    // Grounded flat feet
    if (maxRise < 0.035) {
      if ((this.currentPhase === 'LOWERING' || this.currentPhase === 'PEAK') && this.reachedPeak) {
        const now = Date.now();
        if (now - this.lastRepTime > 700) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedPeak = false;
        phase = 'STANDING';
        feedback = 'Rep complete · Lower heels slowly';
        this.keyFeedbackHistory.add('Good repetition');
      } else {
        phase = 'STANDING';
        feedback = 'Heels flat · Drive up onto toes';
        aiStatus = 'READY';
      }
      elevationScore = 95;
    } else if (maxRise >= 0.055) {
      // Peak Plantarflexion
      phase = 'PEAK';
      this.reachedPeak = true;
      feedback = 'Peak calf contraction · Hold briefly';
      aiStatus = 'GOOD FORM';
      elevationScore = 98;
    } else {
      if (this.reachedPeak) {
        phase = 'LOWERING';
        feedback = 'Control lowering tempo';
        aiStatus = 'ANALYZING';
      } else {
        phase = 'ASCENDING';
        feedback = 'Drive through balls of feet';
        aiStatus = 'ANALYZING';
      }
    }

    if (legIssue) {
      feedback = 'Keep knees straight without bending';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Keep knees locked');
    }

    this.currentPhase = phase;
    const overallForm = Math.round(elevationScore * 0.4 + kneeScore * 0.4 + tempoScore * 0.2);
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
      torsoIssue: false,
      leftLegIssue: legIssue,
      rightLegIssue: legIssue,
      leftArmIssue: false,
      rightArmIssue: false,
      kneeAlignmentIssue: false,
      depthIssue: false,
      torsoLeanIssue: false,
      spineAlignmentIssue: false,
      armStabilityIssue: false,
      activeIssues,
    };

    return {
      exercise: 'calf-raise',
      exerciseName: 'CALF RAISE',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Heel Elevation',
        metric1Score: elevationScore,
        metric2Name: 'Knee Extension',
        metric2Score: kneeScore,
        metric3Name: 'Tempo Control',
        metric3Score: tempoScore,
      },
      keyAngles: [
        { label: 'Heel Lift', angle: Math.round(maxRise * 1000) },
        { label: 'Knee Angle', angle: kneeAngle },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 8. LATERAL RAISE MOVEMENT ANALYSIS
  // ==========================================
  private analyzeLateralRaise(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftElbow = landmarks[LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[LANDMARKS.RIGHT_ELBOW];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

    const isLeftArmReliable =
      isLandmarkValid(leftShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(leftElbow, CONFIDENCE_THRESHOLDS.RELIABLE);

    const isRightArmReliable =
      isLandmarkValid(rightShoulder, CONFIDENCE_THRESHOLDS.RELIABLE) &&
      isLandmarkValid(rightElbow, CONFIDENCE_THRESHOLDS.RELIABLE);

    if (!isLeftArmReliable && !isRightArmReliable) {
      return {
        exercise: 'lateral-raise',
        exerciseName: 'LATERAL RAISE',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Position shoulders, elbows, and torso clearly in camera frame',
        formBreakdown: {
          metric1Name: 'Parallel Height',
          metric1Score: 0,
          metric2Name: 'Torso Stability',
          metric2Score: 0,
          metric3Name: 'Elbow Lead',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    const leftAbduction = isLeftArmReliable ? calculateAngle(leftHip, leftShoulder, leftElbow) : 25;
    const rightAbduction = isRightArmReliable ? calculateAngle(rightHip, rightShoulder, rightElbow) : 25;
    const avgAbduction = Math.round((leftAbduction + rightAbduction) / 2);

    const refHip = leftHip || rightHip;
    const refShoulder = leftShoulder || rightShoulder;
    const verticalPoint = { x: refHip.x, y: refHip.y - 0.5 };
    const torsoAngle =
      isLandmarkValid(refShoulder, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(refHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
        ? calculateAngle(verticalPoint, refHip, refShoulder)
        : 0;

    let heightScore = 95;
    let swayScore = 95;
    let leadScore = 94;
    let torsoIssue = false;
    const activeIssues: string[] = [];

    // Torso sway check
    if (torsoAngle > 18) {
      swayScore = 70;
      torsoIssue = true;
      activeIssues.push('Swinging torso for momentum');
    }

    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';

    // Resting at thighs: <= 32°
    if (avgAbduction <= 32) {
      if ((this.currentPhase === 'LOWERING' || this.currentPhase === 'PEAK') && this.reachedPeak) {
        const now = Date.now();
        if (now - this.lastRepTime > 750) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedPeak = false;
        phase = 'STANDING';
        feedback = 'Rep complete · Lower with control';
        this.keyFeedbackHistory.add('Good repetition');
      } else {
        phase = 'STANDING';
        feedback = 'Dumbbells at thighs · Raise to sides';
        aiStatus = 'READY';
      }
      heightScore = 95;
    } else if (avgAbduction >= 78) {
      // Parallel shoulder height
      phase = 'PEAK';
      this.reachedPeak = true;
      feedback = 'Parallel shoulder height · Squeeze lateral delts';
      aiStatus = 'GOOD FORM';
      heightScore = 98;
    } else {
      if (this.reachedPeak) {
        phase = 'LOWERING';
        feedback = 'Control eccentric descent';
        aiStatus = 'ANALYZING';
      } else {
        phase = 'ASCENDING';
        feedback = 'Lift elbows toward shoulder height';
        aiStatus = 'ANALYZING';
      }
    }

    if (torsoIssue) {
      feedback = 'Stand upright without swinging your torso';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Eliminate body swing');
    }

    this.currentPhase = phase;
    const overallForm = Math.round(heightScore * 0.4 + swayScore * 0.3 + leadScore * 0.3);
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
      torsoIssue,
      leftLegIssue: false,
      rightLegIssue: false,
      leftArmIssue: false,
      rightArmIssue: false,
      kneeAlignmentIssue: false,
      depthIssue: false,
      torsoLeanIssue: torsoIssue,
      spineAlignmentIssue: false,
      armStabilityIssue: false,
      activeIssues,
    };

    return {
      exercise: 'lateral-raise',
      exerciseName: 'LATERAL RAISE',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Parallel Height',
        metric1Score: heightScore,
        metric2Name: 'Torso Stability',
        metric2Score: swayScore,
        metric3Name: 'Elbow Lead',
        metric3Score: leadScore,
      },
      keyAngles: [
        { label: 'Shoulder Abduction', angle: avgAbduction },
        { label: 'Torso Sway', angle: torsoAngle },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 9. HIGH KNEES MOVEMENT ANALYSIS
  // ==========================================
  private analyzeHighKnees(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    const isLeftLegReliable =
      isLandmarkValid(leftHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(leftKnee, CONFIDENCE_THRESHOLDS.MIN_DETECTION);

    const isRightLegReliable =
      isLandmarkValid(rightHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(rightKnee, CONFIDENCE_THRESHOLDS.MIN_DETECTION);

    if (!isLeftLegReliable && !isRightLegReliable) {
      return {
        exercise: 'high-knees',
        exerciseName: 'HIGH KNEES',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Step back so legs, hips, and chest are visible in camera frame',
        formBreakdown: {
          metric1Name: 'Knee Height',
          metric1Score: 0,
          metric2Name: 'Upright Posture',
          metric2Score: 0,
          metric3Name: 'Quick Cadence',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    const leftHipFlexion = isLeftLegReliable ? calculateAngle(leftShoulder, leftHip, leftKnee) : 170;
    const rightHipFlexion = isRightLegReliable ? calculateAngle(rightShoulder, rightHip, rightKnee) : 170;

    const refHip = leftHip || rightHip;
    const refShoulder = leftShoulder || rightShoulder;
    const verticalPoint = { x: refHip.x, y: refHip.y - 0.5 };
    const torsoAngle =
      isLandmarkValid(refShoulder, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(refHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
        ? calculateAngle(verticalPoint, refHip, refShoulder)
        : 0;

    let heightScore = 95;
    let postureScore = 95;
    let cadenceScore = 95;
    let torsoIssue = false;
    const activeIssues: string[] = [];

    if (torsoAngle > 20) {
      postureScore = 70;
      torsoIssue = true;
      activeIssues.push('Leaning backward during knee drives');
    }

    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good cadence';
    let aiStatus: AiCamStatus = 'GOOD FORM';

    // Check alternating knee drives: hip angle <= 95°
    const leftDriveActive = leftHipFlexion <= 95 && rightHipFlexion >= 135;
    const rightDriveActive = rightHipFlexion <= 95 && leftHipFlexion >= 135;
    const bothGrounded = leftHipFlexion >= 135 && rightHipFlexion >= 135;

    if (leftDriveActive || rightDriveActive) {
      const activeSide = leftDriveActive ? 'left' : 'right';
      phase = 'PEAK';

      if (this.lastAlternatingSide !== activeSide) {
        const now = Date.now();
        if (now - this.lastRepTime > 320) {
          this.repCount += 1;
          this.lastRepTime = now;
          this.lastAlternatingSide = activeSide;
          feedback = `${activeSide === 'left' ? 'Left' : 'Right'} knee drive · Switch legs`;
          this.keyFeedbackHistory.add('Good knee height');
        }
      }
      heightScore = 98;
    } else if (bothGrounded) {
      phase = 'STANDING';
      feedback = 'Drive knees up to hip height';
      aiStatus = 'READY';
    } else {
      phase = 'ASCENDING';
      feedback = 'Drive knee up';
      aiStatus = 'ANALYZING';
    }

    if (torsoIssue) {
      feedback = 'Stay tall · Avoid leaning backward';
      aiStatus = 'IMPROVE FORM';
      this.keyFeedbackHistory.add('Stay upright');
    }

    this.currentPhase = phase;
    const overallForm = Math.round(heightScore * 0.4 + postureScore * 0.3 + cadenceScore * 0.3);
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
      torsoIssue,
      leftLegIssue: false,
      rightLegIssue: false,
      leftArmIssue: false,
      rightArmIssue: false,
      kneeAlignmentIssue: false,
      depthIssue: false,
      torsoLeanIssue: torsoIssue,
      spineAlignmentIssue: false,
      armStabilityIssue: false,
      activeIssues,
    };

    return {
      exercise: 'high-knees',
      exerciseName: 'HIGH KNEES',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Knee Height',
        metric1Score: heightScore,
        metric2Name: 'Upright Posture',
        metric2Score: postureScore,
        metric3Name: 'Quick Cadence',
        metric3Score: cadenceScore,
      },
      keyAngles: [
        { label: 'Left Hip Drive', angle: leftHipFlexion },
        { label: 'Right Hip Drive', angle: rightHipFlexion },
        { label: 'Torso Angle', angle: torsoAngle },
      ],
      postureFeedback,
    };
  }

  // ==========================================
  // 10. GLUTE BRIDGE MOVEMENT ANALYSIS
  // ==========================================
  private analyzeGluteBridge(landmarks: PoseLandmark[]): PoseAnalysisResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    const isLeftReliable =
      isLandmarkValid(leftShoulder, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(leftHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(leftKnee, CONFIDENCE_THRESHOLDS.MIN_DETECTION);

    const isRightReliable =
      isLandmarkValid(rightShoulder, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(rightHip, CONFIDENCE_THRESHOLDS.MIN_DETECTION) &&
      isLandmarkValid(rightKnee, CONFIDENCE_THRESHOLDS.MIN_DETECTION);

    if (!isLeftReliable && !isRightReliable) {
      return {
        exercise: 'glute-bridge',
        exerciseName: 'GLUTE BRIDGE',
        repCount: this.repCount,
        movementPhase: 'READY',
        overallFormScore: 0,
        aiStatus: 'READY',
        primaryFeedback: 'Set camera with clear side profile view of exercise mat',
        formBreakdown: {
          metric1Name: 'Hip Extension',
          metric1Score: 0,
          metric2Name: 'Apex Squeeze',
          metric2Score: 0,
          metric3Name: 'Foot Placement',
          metric3Score: 0,
        },
        keyAngles: [],
        postureFeedback: null,
      };
    }

    const shoulder = isLeftReliable ? leftShoulder : rightShoulder;
    const hip = isLeftReliable ? leftHip : rightHip;
    const knee = isLeftReliable ? leftKnee : rightKnee;
    const ankle = isLeftReliable ? leftAnkle : rightAnkle;

    const hipAngle = calculateAngle(shoulder, hip, knee);
    const kneeAngle = ankle && isLandmarkValid(ankle, CONFIDENCE_THRESHOLDS.MIN_DETECTION)
      ? calculateAngle(hip, knee, ankle)
      : 90;

    let extensionScore = 95;
    let squeezeScore = 95;
    let footScore = 94;
    let phase: MovementPhase = this.currentPhase;
    let feedback = 'Good form';
    let aiStatus: AiCamStatus = 'GOOD FORM';

    // Supine floor contact: <= 135°
    if (hipAngle <= 135) {
      if ((this.currentPhase === 'DESCENDING' || this.currentPhase === 'PEAK') && this.reachedPeak) {
        const now = Date.now();
        if (now - this.lastRepTime > 750) {
          this.repCount += 1;
          this.lastRepTime = now;
        }
        this.reachedPeak = false;
        phase = 'BOTTOM';
        feedback = 'Rep complete · Drive hips up';
        this.keyFeedbackHistory.add('Good repetition');
      } else {
        phase = 'BOTTOM';
        feedback = 'Supine position · Drive hips up';
        aiStatus = 'READY';
      }
      extensionScore = 95;
    } else if (hipAngle >= 162) {
      // Full hip extension lockout
      phase = 'PEAK';
      this.reachedPeak = true;
      feedback = 'Full hip extension · Squeeze glutes';
      aiStatus = 'GOOD FORM';
      extensionScore = 98;
    } else {
      if (this.reachedPeak) {
        phase = 'DESCENDING';
        feedback = 'Lower hips with control';
        aiStatus = 'ANALYZING';
      } else {
        phase = 'ASCENDING';
        feedback = 'Drive through heels to bridge';
        aiStatus = 'ANALYZING';
      }
    }

    this.currentPhase = phase;
    const overallForm = Math.round(extensionScore * 0.4 + squeezeScore * 0.3 + footScore * 0.3);
    this.updateStats(overallForm);

    const postureFeedback: PostureFeedback = {
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

    return {
      exercise: 'glute-bridge',
      exerciseName: 'GLUTE BRIDGE',
      repCount: this.repCount,
      movementPhase: phase,
      overallFormScore: overallForm,
      aiStatus,
      primaryFeedback: feedback,
      formBreakdown: {
        metric1Name: 'Hip Extension',
        metric1Score: extensionScore,
        metric2Name: 'Apex Squeeze',
        metric2Score: squeezeScore,
        metric3Name: 'Foot Placement',
        metric3Score: footScore,
      },
      keyAngles: [
        { label: 'Hip Extension', angle: hipAngle },
        { label: 'Knee Angle', angle: kneeAngle },
      ],
      postureFeedback,
    };
  }

  private updateStats(formScore: number) {
    if (formScore > 0) {
      this.formScoreSum += formScore;
      this.formScoreCount += 1;
      if (formScore > this.bestFormScore) {
        this.bestFormScore = formScore;
      }
    }
  }
}
