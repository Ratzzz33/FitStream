/**
 * PoseTracker - Local ML-based exercise recognition using MediaPipe Pose
 *
 * Detects 33 body landmarks and tracks exercise repetitions by analyzing
 * joint angles. Works completely offline on device.
 *
 * Features:
 * - Bilateral tracking (uses both left and right sides)
 * - 3D angle calculation with z-coordinate
 * - Camera angle calibration (phone on floor, chest level, etc.)
 * - Adaptive thresholds based on camera orientation
 * - Automatic detection of which body side is more visible
 *
 * Supported exercises:
 * - Squats (knee angle)
 * - Push-ups (elbow angle)
 * - Sit-ups (torso-hip angle)
 * - Jumping jacks (arm spread + leg spread)
 * - Lunges (front knee angle)
 */

import { Pose, Results, NormalizedLandmark } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

// Exercise types we can track
export type TrackableExercise =
  | 'SQUATS'
  | 'PUSHUPS'
  | 'SITUPS'
  | 'JUMPING_JACKS'
  | 'LUNGES'
  | 'PLANK'
  | 'BURPEES'
  | 'HIGH_KNEES'
  | 'MOUNTAIN_CLIMBERS'
  | 'LEG_RAISES'
  | 'GLUTE_BRIDGES'
  | 'CALF_RAISES'
  | 'WALL_SIT'
  | 'SIDE_LUNGES'
  | 'TRICEP_DIPS';

// Camera placement options
export type CameraPlacement =
  | 'floor_front'       // Phone on floor, looking up at front of person
  | 'floor_front_left'  // Phone on floor, front-left diagonal
  | 'floor_front_right' // Phone on floor, front-right diagonal
  | 'floor_side'        // Phone on floor, looking up at side of person
  | 'chest_front'       // Phone at chest level, front view
  | 'chest_front_left'  // Phone at chest level, front-left diagonal
  | 'chest_front_right' // Phone at chest level, front-right diagonal
  | 'chest_side'        // Phone at chest level, side view
  | 'auto';             // Automatically detect

// Landmark indices (MediaPipe Pose has 33 landmarks)
const LANDMARKS = {
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
};

// Exercise state machine
type RepPhase = 'up' | 'down' | 'transition';

// Detected orientation of the person relative to camera
type BodyOrientation =
  | 'front'           // Facing camera directly
  | 'front_left'      // Facing camera from front-left diagonal
  | 'front_right'     // Facing camera from front-right diagonal
  | 'back'            // Back to camera
  | 'back_left'       // Back to camera from back-left diagonal
  | 'back_right'      // Back to camera from back-right diagonal
  | 'left_side'       // Left side to camera
  | 'right_side'      // Right side to camera
  | 'unknown';

interface ExerciseState {
  phase: RepPhase;
  repCount: number;
  lastAngle: number;
  leftAngle: number;      // Left side angle
  rightAngle: number;     // Right side angle
  formScore: number;      // 0-100
  formFeedback: string[];
  plankStartTime?: number;
  bodyOrientation: BodyOrientation;
  activeSide: 'left' | 'right' | 'both';
  cameraAngleOffset: number; // Degrees offset from horizontal
}

// Camera calibration data
interface CameraCalibration {
  placement: CameraPlacement;
  verticalAngle: number;      // -90 (floor looking up) to 90 (ceiling looking down)
  horizontalOffset: number;   // Left/right offset from center
  distanceEstimate: number;   // Estimated distance in normalized units
  isCalibrated: boolean;
}

// Personal angle calibration data (learned from user's demo rep)
export interface PersonalCalibration {
  exercise: TrackableExercise;
  upAngle: number;           // User's personal UP angle (standing/extended)
  downAngle: number;         // User's personal DOWN angle (squat/bent)
  calibratedAt: number;      // Timestamp
  repCount: number;          // How many reps used to calibrate
}

// Rep counting improvements
interface RepCountingState {
  lastRepTime: number;           // Timestamp of last counted rep
  stableFrameCount: number;      // Frames in stable position
  currentPhaseStartTime: number; // When current phase started
  minAngleInRep: number;         // Track min angle during rep
  maxAngleInRep: number;         // Track max angle during rep
}

// Constants for improved rep counting
const MIN_REP_INTERVAL_MS = 400;     // Minimum time between reps (debounce)
const STABLE_FRAMES_REQUIRED = 2;    // Frames required in stable position
const HYSTERESIS_BUFFER = 8;         // Degrees buffer for phase transitions

// Thresholds for each exercise - now with bilateral support
const EXERCISE_CONFIG: Record<TrackableExercise, {
  upAngleMin: number;
  downAngleMax: number;
  // Left side joints
  jointA_L: keyof typeof LANDMARKS;
  jointB_L: keyof typeof LANDMARKS;
  jointC_L: keyof typeof LANDMARKS;
  // Right side joints
  jointA_R: keyof typeof LANDMARKS;
  jointB_R: keyof typeof LANDMARKS;
  jointC_R: keyof typeof LANDMARKS;
  // Use 3D angle calculation (better for floor camera)
  use3D: boolean;
  // Angle adjustment per camera placement
  angleAdjustments: Partial<Record<CameraPlacement, { upOffset: number; downOffset: number }>>;
  formChecks: (landmarks: NormalizedLandmark[], orientation: BodyOrientation) => string[];
}> = {
  SQUATS: {
    upAngleMin: 160,    // Standing: knee nearly straight
    downAngleMax: 100,  // Squat: knee bent
    jointA_L: 'LEFT_HIP',
    jointB_L: 'LEFT_KNEE',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_HIP',
    jointB_R: 'RIGHT_KNEE',
    jointC_R: 'RIGHT_ANKLE',
    use3D: true,        // Important for floor camera
    angleAdjustments: {
      floor_front: { upOffset: -10, downOffset: -15 },       // Floor camera sees more bent angles
      floor_front_left: { upOffset: -8, downOffset: -12 },   // Diagonal has less distortion
      floor_front_right: { upOffset: -8, downOffset: -12 },
      floor_side: { upOffset: -5, downOffset: -10 },
      chest_front: { upOffset: 0, downOffset: 0 },
      chest_front_left: { upOffset: -3, downOffset: -5 },
      chest_front_right: { upOffset: -3, downOffset: -5 },
      chest_side: { upOffset: 0, downOffset: 0 },
    },
    formChecks: (landmarks, orientation) => {
      const feedback: string[] = [];

      // Check both knees based on orientation
      const useLeft = orientation !== 'right_side';
      const useRight = orientation !== 'left_side';

      if (useLeft) {
        const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
        const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
        const leftFoot = landmarks[LANDMARKS.LEFT_FOOT_INDEX];

        // Use foot index for better "past toes" detection
        const ankleX = leftFoot?.x ?? leftAnkle.x;
        if (leftKnee.x < ankleX - 0.03) {
          feedback.push('Левое колено выходит за носок');
        }
      }

      if (useRight) {
        const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
        const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
        const rightFoot = landmarks[LANDMARKS.RIGHT_FOOT_INDEX];

        const ankleX = rightFoot?.x ?? rightAnkle.x;
        if (rightKnee.x > ankleX + 0.03) {
          feedback.push('Правое колено выходит за носок');
        }
      }

      // Check knee alignment (knees should track over toes)
      if (useLeft && useRight) {
        const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
        const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
        const leftHip = landmarks[LANDMARKS.LEFT_HIP];
        const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

        const hipWidth = Math.abs(rightHip.x - leftHip.x);
        const kneeWidth = Math.abs(rightKnee.x - leftKnee.x);

        // Knees collapsing inward
        if (kneeWidth < hipWidth * 0.7) {
          feedback.push('Колени не должны заваливаться внутрь');
        }
      }

      // Check depth consistency between legs
      if (useLeft && useRight) {
        const leftHip = landmarks[LANDMARKS.LEFT_HIP];
        const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
        const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
        const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];

        const leftDepth = leftHip.y - leftKnee.y;
        const rightDepth = rightHip.y - rightKnee.y;

        if (Math.abs(leftDepth - rightDepth) > 0.08) {
          feedback.push('Приседай равномерно на обе ноги');
        }
      }

      return feedback;
    }
  },
  PUSHUPS: {
    upAngleMin: 160,    // Arms extended
    downAngleMax: 90,   // Arms bent at 90°
    jointA_L: 'LEFT_SHOULDER',
    jointB_L: 'LEFT_ELBOW',
    jointC_L: 'LEFT_WRIST',
    jointA_R: 'RIGHT_SHOULDER',
    jointB_R: 'RIGHT_ELBOW',
    jointC_R: 'RIGHT_WRIST',
    use3D: true,
    angleAdjustments: {
      floor_front: { upOffset: -5, downOffset: -10 },
      floor_side: { upOffset: 0, downOffset: -5 },
    },
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const leftHip = landmarks[LANDMARKS.LEFT_HIP];
      const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
      const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
      const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
      const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
      const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

      // Use average positions for better accuracy
      const hipY = (leftHip.y + rightHip.y) / 2;
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

      const hipOffset = Math.abs(hipY - ((shoulderY + ankleY) / 2));
      if (hipOffset > 0.1) {
        feedback.push('Держи тело прямо, не прогибай поясницу');
      }
      return feedback;
    }
  },
  SITUPS: {
    upAngleMin: 70,     // Sitting up
    downAngleMax: 160,  // Lying down
    jointA_L: 'LEFT_SHOULDER',
    jointB_L: 'LEFT_HIP',
    jointC_L: 'LEFT_KNEE',
    jointA_R: 'RIGHT_SHOULDER',
    jointB_R: 'RIGHT_HIP',
    jointC_R: 'RIGHT_KNEE',
    use3D: false,
    angleAdjustments: {},
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const nose = landmarks[LANDMARKS.NOSE];
      const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
      const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
      const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
      if (Math.abs(nose.x - shoulderX) > 0.15) {
        feedback.push('Не тяни шею, руки за головой');
      }
      return feedback;
    }
  },
  JUMPING_JACKS: {
    upAngleMin: 150,    // Arms up, legs spread
    downAngleMax: 30,   // Arms down, legs together
    jointA_L: 'LEFT_WRIST',
    jointB_L: 'LEFT_SHOULDER',
    jointC_L: 'LEFT_HIP',
    jointA_R: 'RIGHT_WRIST',
    jointB_R: 'RIGHT_SHOULDER',
    jointC_R: 'RIGHT_HIP',
    use3D: false,
    angleAdjustments: {},
    formChecks: () => []
  },
  LUNGES: {
    upAngleMin: 160,    // Standing
    downAngleMax: 95,   // Lunge position
    jointA_L: 'LEFT_HIP',
    jointB_L: 'LEFT_KNEE',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_HIP',
    jointB_R: 'RIGHT_KNEE',
    jointC_R: 'RIGHT_ANKLE',
    use3D: true,
    angleAdjustments: {
      floor_front: { upOffset: -5, downOffset: -10 },
    },
    formChecks: (landmarks, orientation) => {
      const feedback: string[] = [];
      const useLeft = orientation !== 'right_side';
      const useRight = orientation !== 'left_side';

      if (useLeft) {
        const knee = landmarks[LANDMARKS.LEFT_KNEE];
        const ankle = landmarks[LANDMARKS.LEFT_ANKLE];
        if (knee.x < ankle.x - 0.08) {
          feedback.push('Левое колено не должно выходить за носок');
        }
      }
      if (useRight) {
        const knee = landmarks[LANDMARKS.RIGHT_KNEE];
        const ankle = landmarks[LANDMARKS.RIGHT_ANKLE];
        if (knee.x > ankle.x + 0.08) {
          feedback.push('Правое колено не должно выходить за носок');
        }
      }
      return feedback;
    }
  },
  PLANK: {
    upAngleMin: 170,    // Body straight
    downAngleMax: 150,  // Slight bend allowed
    jointA_L: 'LEFT_SHOULDER',
    jointB_L: 'LEFT_HIP',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_SHOULDER',
    jointB_R: 'RIGHT_HIP',
    jointC_R: 'RIGHT_ANKLE',
    use3D: true,
    angleAdjustments: {},
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const hipY = (landmarks[LANDMARKS.LEFT_HIP].y + landmarks[LANDMARKS.RIGHT_HIP].y) / 2;
      const shoulderY = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
      const ankleY = (landmarks[LANDMARKS.LEFT_ANKLE].y + landmarks[LANDMARKS.RIGHT_ANKLE].y) / 2;
      const hipOffset = Math.abs(hipY - ((shoulderY + ankleY) / 2));
      if (hipOffset > 0.08) {
        feedback.push('Держи тело ровно');
      }
      return feedback;
    }
  },
  BURPEES: {
    upAngleMin: 160,
    downAngleMax: 60,
    jointA_L: 'LEFT_HIP',
    jointB_L: 'LEFT_KNEE',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_HIP',
    jointB_R: 'RIGHT_KNEE',
    jointC_R: 'RIGHT_ANKLE',
    use3D: true,
    angleAdjustments: {},
    formChecks: () => []
  },
  HIGH_KNEES: {
    upAngleMin: 160,
    downAngleMax: 70,
    jointA_L: 'LEFT_HIP',
    jointB_L: 'LEFT_KNEE',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_HIP',
    jointB_R: 'RIGHT_KNEE',
    jointC_R: 'RIGHT_ANKLE',
    use3D: false,
    angleAdjustments: {},
    formChecks: (landmarks, orientation) => {
      const feedback: string[] = [];
      const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
      const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
      const leftHip = landmarks[LANDMARKS.LEFT_HIP];
      const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

      // Check whichever leg is raised higher
      const leftRaised = leftHip.y - leftKnee.y;
      const rightRaised = rightHip.y - rightKnee.y;

      if (leftRaised < 0.05 && rightRaised < 0.05) {
        feedback.push('Поднимай колени выше');
      }
      return feedback;
    }
  },
  MOUNTAIN_CLIMBERS: {
    upAngleMin: 160,
    downAngleMax: 80,
    jointA_L: 'LEFT_HIP',
    jointB_L: 'LEFT_KNEE',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_HIP',
    jointB_R: 'RIGHT_KNEE',
    jointC_R: 'RIGHT_ANKLE',
    use3D: false,
    angleAdjustments: {},
    formChecks: () => []
  },
  LEG_RAISES: {
    upAngleMin: 160,
    downAngleMax: 80,
    jointA_L: 'LEFT_SHOULDER',
    jointB_L: 'LEFT_HIP',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_SHOULDER',
    jointB_R: 'RIGHT_HIP',
    jointC_R: 'RIGHT_ANKLE',
    use3D: false,
    angleAdjustments: {},
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
      const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
      const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
      const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

      const leftBend = Math.abs(leftKnee.y - leftAnkle.y);
      const rightBend = Math.abs(rightKnee.y - rightAnkle.y);

      if (leftBend > 0.1 || rightBend > 0.1) {
        feedback.push('Держи ноги прямыми');
      }
      return feedback;
    }
  },
  GLUTE_BRIDGES: {
    upAngleMin: 160,
    downAngleMax: 100,
    jointA_L: 'LEFT_SHOULDER',
    jointB_L: 'LEFT_HIP',
    jointC_L: 'LEFT_KNEE',
    jointA_R: 'RIGHT_SHOULDER',
    jointB_R: 'RIGHT_HIP',
    jointC_R: 'RIGHT_KNEE',
    use3D: false,
    angleAdjustments: {},
    formChecks: () => []
  },
  CALF_RAISES: {
    upAngleMin: 175,
    downAngleMax: 160,
    jointA_L: 'LEFT_KNEE',
    jointB_L: 'LEFT_ANKLE',
    jointC_L: 'LEFT_HEEL',
    jointA_R: 'RIGHT_KNEE',
    jointB_R: 'RIGHT_ANKLE',
    jointC_R: 'RIGHT_HEEL',
    use3D: false,
    angleAdjustments: {},
    formChecks: () => []
  },
  WALL_SIT: {
    upAngleMin: 100,
    downAngleMax: 80,
    jointA_L: 'LEFT_HIP',
    jointB_L: 'LEFT_KNEE',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_HIP',
    jointB_R: 'RIGHT_KNEE',
    jointC_R: 'RIGHT_ANKLE',
    use3D: false,
    angleAdjustments: {},
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const leftHip = landmarks[LANDMARKS.LEFT_HIP];
      const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
      const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
      const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];

      const hipY = (leftHip.y + rightHip.y) / 2;
      const kneeY = (leftKnee.y + rightKnee.y) / 2;

      if (Math.abs(hipY - kneeY) > 0.15) {
        feedback.push('Бёдра параллельно полу');
      }
      return feedback;
    }
  },
  SIDE_LUNGES: {
    upAngleMin: 160,
    downAngleMax: 100,
    jointA_L: 'LEFT_HIP',
    jointB_L: 'LEFT_KNEE',
    jointC_L: 'LEFT_ANKLE',
    jointA_R: 'RIGHT_HIP',
    jointB_R: 'RIGHT_KNEE',
    jointC_R: 'RIGHT_ANKLE',
    use3D: true,
    angleAdjustments: {},
    formChecks: () => []
  },
  TRICEP_DIPS: {
    upAngleMin: 160,
    downAngleMax: 90,
    jointA_L: 'LEFT_SHOULDER',
    jointB_L: 'LEFT_ELBOW',
    jointC_L: 'LEFT_WRIST',
    jointA_R: 'RIGHT_SHOULDER',
    jointB_R: 'RIGHT_ELBOW',
    jointC_R: 'RIGHT_WRIST',
    use3D: false,
    angleAdjustments: {},
    formChecks: () => []
  }
};

// Calculate 2D angle between three points (x, y only)
function calculateAngle2D(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Calculate 3D angle between three points (x, y, z)
// This is crucial for floor-mounted camera where perspective distortion is significant
function calculateAngle3D(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  // Vector from b to a
  const ba = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: (a.z || 0) - (b.z || 0)
  };

  // Vector from b to c
  const bc = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: (c.z || 0) - (b.z || 0)
  };

  // Dot product
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;

  // Magnitudes
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y + ba.z * ba.z);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z);

  if (magBA === 0 || magBC === 0) return 180;

  // Clamp to avoid NaN from acos
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// Calculate angle with optional 3D support
function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark,
  use3D: boolean = false
): number {
  if (use3D && a.z !== undefined && b.z !== undefined && c.z !== undefined) {
    return calculateAngle3D(a, b, c);
  }
  return calculateAngle2D(a, b, c);
}

// Determine which side of the body is more visible to camera
function getMoreVisibleSide(landmarks: NormalizedLandmark[]): 'left' | 'right' | 'both' {
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

  // Calculate visibility scores (higher is better)
  const leftVis = (leftShoulder.visibility || 0) + (leftHip.visibility || 0);
  const rightVis = (rightShoulder.visibility || 0) + (rightHip.visibility || 0);

  const threshold = 0.3; // Visibility difference threshold

  if (Math.abs(leftVis - rightVis) < threshold) {
    return 'both';
  }
  return leftVis > rightVis ? 'left' : 'right';
}

// Detect body orientation relative to camera (including diagonals)
function detectBodyOrientation(landmarks: NormalizedLandmark[]): BodyOrientation {
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
  const nose = landmarks[LANDMARKS.NOSE];
  const leftHip = landmarks[LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

  // Calculate shoulder width in normalized coords
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);

  // Use z-depth to determine facing direction
  const leftZ = leftShoulder.z || 0;
  const rightZ = rightShoulder.z || 0;
  const zDiff = leftZ - rightZ; // Positive = left shoulder further from camera

  // Use nose z relative to shoulders to determine front/back
  const noseZ = nose.z || 0;
  const shoulderAvgZ = (leftZ + rightZ) / 2;
  const isFacingCamera = noseZ < shoulderAvgZ - 0.02;
  const isFacingAway = noseZ > shoulderAvgZ + 0.02;

  // Categorize by shoulder width (visibility)
  // Very narrow = side view, wide = front/back, medium = diagonal

  if (shoulderWidth < 0.08) {
    // Pure side view - shoulders almost aligned
    if (zDiff > 0.03) return 'right_side';
    if (zDiff < -0.03) return 'left_side';
    return 'unknown';
  }

  if (shoulderWidth > 0.18) {
    // Wide shoulders = mostly front or back view
    if (isFacingCamera) {
      // Check for slight diagonal
      if (zDiff > 0.02) return 'front_right'; // Left shoulder further = person's right side closer
      if (zDiff < -0.02) return 'front_left';  // Right shoulder further = person's left side closer
      return 'front';
    } else if (isFacingAway) {
      if (zDiff > 0.02) return 'back_left';
      if (zDiff < -0.02) return 'back_right';
      return 'back';
    }
    return 'front'; // Default
  }

  // Medium width (0.08 - 0.18) = diagonal view
  if (isFacingCamera) {
    if (zDiff > 0.01) return 'front_right';
    if (zDiff < -0.01) return 'front_left';
    return 'front';
  } else if (isFacingAway) {
    if (zDiff > 0.01) return 'back_left';
    if (zDiff < -0.01) return 'back_right';
    return 'back';
  }

  // Can't determine front/back - use side indicators
  if (zDiff > 0.03) return 'right_side';
  if (zDiff < -0.03) return 'left_side';

  return 'unknown';
}

// Auto-detect camera placement from body position
function detectCameraPlacement(landmarks: NormalizedLandmark[]): CameraPlacement {
  const nose = landmarks[LANDMARKS.NOSE];
  const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];

  const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

  // Determine vertical position (floor vs chest level)
  const isFloorLevel = ankleY < 0.75; // Ankles not at very bottom = camera low

  // Check shoulder width to determine angle
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

  // Check z-depth difference for diagonal detection
  const leftZ = leftShoulder.z || 0;
  const rightZ = rightShoulder.z || 0;
  const zDiff = leftZ - rightZ;

  // Determine horizontal angle
  let horizontalType: 'front' | 'front_left' | 'front_right' | 'side';

  if (shoulderWidth < 0.1) {
    // Very narrow = side view
    horizontalType = 'side';
  } else if (shoulderWidth > 0.16) {
    // Wide = mostly front
    if (Math.abs(zDiff) < 0.02) {
      horizontalType = 'front';
    } else if (zDiff > 0) {
      horizontalType = 'front_right'; // Left shoulder further = camera on person's right
    } else {
      horizontalType = 'front_left';
    }
  } else {
    // Medium = diagonal
    if (zDiff > 0.01) {
      horizontalType = 'front_right';
    } else if (zDiff < -0.01) {
      horizontalType = 'front_left';
    } else {
      horizontalType = 'front';
    }
  }

  // Combine vertical and horizontal
  if (isFloorLevel) {
    switch (horizontalType) {
      case 'front': return 'floor_front';
      case 'front_left': return 'floor_front_left';
      case 'front_right': return 'floor_front_right';
      case 'side': return 'floor_side';
    }
  } else {
    switch (horizontalType) {
      case 'front': return 'chest_front';
      case 'front_left': return 'chest_front_left';
      case 'front_right': return 'chest_front_right';
      case 'side': return 'chest_side';
    }
  }

  return 'auto';
}

// Get adjusted angle thresholds based on camera placement
function getAdjustedThresholds(
  config: typeof EXERCISE_CONFIG[TrackableExercise],
  placement: CameraPlacement
): { upAngleMin: number; downAngleMax: number } {
  const adjustment = config.angleAdjustments[placement];

  if (adjustment) {
    return {
      upAngleMin: config.upAngleMin + adjustment.upOffset,
      downAngleMax: config.downAngleMax + adjustment.downOffset
    };
  }

  return {
    upAngleMin: config.upAngleMin,
    downAngleMax: config.downAngleMax
  };
}

// Event callbacks
export interface PoseTrackerCallbacks {
  onRepComplete: (count: number, formScore: number) => void;
  onFormFeedback: (feedback: string[]) => void;
  onPoseUpdate: (landmarks: NormalizedLandmark[], angle: number, leftAngle?: number, rightAngle?: number) => void;
  onPlankTime?: (seconds: number) => void;
  onCalibrationUpdate?: (calibration: CameraCalibration) => void;
  onOrientationDetected?: (orientation: BodyOrientation, activeSide: 'left' | 'right' | 'both') => void;
  onPersonalCalibrationProgress?: (phase: 'waiting' | 'down' | 'up' | 'done', angle: number) => void;
  onPersonalCalibrationComplete?: (calibration: PersonalCalibration) => void;
}

export interface PoseTrackerOptions {
  cameraPlacement?: CameraPlacement;
  useCalibration?: boolean;
  smoothingFactor?: number; // 0-1, higher = more smoothing
}

export class PoseTracker {
  private pose: Pose | null = null;
  private camera: Camera | null = null;
  private exercise: TrackableExercise;
  private state: ExerciseState;
  private callbacks: PoseTrackerCallbacks;
  private options: PoseTrackerOptions;
  private calibration: CameraCalibration;
  private isRunning = false;
  private lastFormCheck = 0;
  private formCheckInterval = 2000;
  private isCalibrationMode = false;
  private calibrationResolve: (() => void) | null = null;

  // Smoothing for angle calculations
  private angleHistory: { left: number[]; right: number[] } = { left: [], right: [] };
  private readonly maxHistoryLength = 5;

  // Calibration samples for auto-detection
  private calibrationSamples: CameraPlacement[] = [];
  private readonly calibrationSampleCount = 10;

  // Personal angle calibration
  private personalCalibration: PersonalCalibration | null = null;
  private isPersonalCalibrationMode = false;
  private personalCalibrationPhase: 'waiting' | 'down' | 'up' | 'done' = 'waiting';
  private personalCalibrationAngles: number[] = [];
  private personalCalibrationMinAngle = 999;
  private personalCalibrationMaxAngle = 0;

  // Improved rep counting state
  private repCountingState: RepCountingState = {
    lastRepTime: 0,
    stableFrameCount: 0,
    currentPhaseStartTime: 0,
    minAngleInRep: 999,
    maxAngleInRep: 0
  };

  // Hysteresis thresholds (calculated from base or personal calibration)
  private hysteresisThresholds = {
    upEnter: 160,
    upExit: 152,
    downEnter: 100,
    downExit: 108
  };

  constructor(
    exercise: TrackableExercise,
    callbacks: PoseTrackerCallbacks,
    options: PoseTrackerOptions = {}
  ) {
    this.exercise = exercise;
    this.callbacks = callbacks;
    this.options = {
      cameraPlacement: 'auto',
      useCalibration: true,
      smoothingFactor: 0.3,
      ...options
    };

    this.calibration = {
      placement: options.cameraPlacement || 'auto',
      verticalAngle: 0,
      horizontalOffset: 0,
      distanceEstimate: 1,
      isCalibrated: options.cameraPlacement !== 'auto'
    };

    this.state = {
      phase: 'up',
      repCount: 0,
      lastAngle: 180,
      leftAngle: 180,
      rightAngle: 180,
      formScore: 100,
      formFeedback: [],
      bodyOrientation: 'unknown',
      activeSide: 'both',
      cameraAngleOffset: 0
    };
  }

  // Set camera placement manually (skip auto-detection)
  setCameraPlacement(placement: CameraPlacement): void {
    this.calibration.placement = placement;
    this.calibration.isCalibrated = placement !== 'auto';
    this.callbacks.onCalibrationUpdate?.(this.calibration);
  }

  // Get current calibration status
  getCalibration(): CameraCalibration {
    return { ...this.calibration };
  }

  // ===== PERSONAL ANGLE CALIBRATION =====

  // Set personal calibration (loaded from storage)
  setPersonalCalibration(calibration: PersonalCalibration | null): void {
    this.personalCalibration = calibration;
    if (calibration) {
      this.updateHysteresisThresholds(calibration.upAngle, calibration.downAngle);
    }
  }

  // Get current personal calibration
  getPersonalCalibration(): PersonalCalibration | null {
    return this.personalCalibration;
  }

  // Start personal calibration mode (user does 1 demo rep)
  startPersonalCalibration(): void {
    this.isPersonalCalibrationMode = true;
    this.personalCalibrationPhase = 'waiting';
    this.personalCalibrationAngles = [];
    this.personalCalibrationMinAngle = 999;
    this.personalCalibrationMaxAngle = 0;
    this.isRunning = true;
  }

  // Stop personal calibration mode
  stopPersonalCalibration(): void {
    this.isPersonalCalibrationMode = false;
    this.personalCalibrationPhase = 'waiting';
  }

  // Check if in personal calibration mode
  isInPersonalCalibrationMode(): boolean {
    return this.isPersonalCalibrationMode;
  }

  // Update hysteresis thresholds from calibration data
  private updateHysteresisThresholds(upAngle: number, downAngle: number): void {
    // Add hysteresis buffer to prevent flickering
    this.hysteresisThresholds = {
      upEnter: upAngle - HYSTERESIS_BUFFER,      // Need to reach this to enter UP
      upExit: upAngle - HYSTERESIS_BUFFER * 2,   // Must go below this to exit UP
      downEnter: downAngle + HYSTERESIS_BUFFER,  // Need to reach this to enter DOWN
      downExit: downAngle + HYSTERESIS_BUFFER * 2 // Must go above this to exit DOWN
    };
  }

  // Process frame during personal calibration
  private processPersonalCalibration(angle: number): void {
    this.personalCalibrationAngles.push(angle);

    // Track min/max angles
    if (angle < this.personalCalibrationMinAngle) {
      this.personalCalibrationMinAngle = angle;
    }
    if (angle > this.personalCalibrationMaxAngle) {
      this.personalCalibrationMaxAngle = angle;
    }

    const config = EXERCISE_CONFIG[this.exercise];
    const defaultUp = config.upAngleMin;
    const defaultDown = config.downAngleMax;

    // State machine for calibration rep
    switch (this.personalCalibrationPhase) {
      case 'waiting':
        // Wait for user to go down (angle decreasing toward DOWN threshold)
        if (angle < defaultUp - 20) {
          this.personalCalibrationPhase = 'down';
          this.callbacks.onPersonalCalibrationProgress?.('down', angle);
        }
        break;

      case 'down':
        // Wait for user to hit bottom and start coming up
        if (angle < defaultDown + 30) {
          // User is in the down position, track minimum
        }
        // Detect when coming back up (angle increasing significantly)
        if (angle > this.personalCalibrationMinAngle + 25) {
          this.personalCalibrationPhase = 'up';
          this.callbacks.onPersonalCalibrationProgress?.('up', angle);
        }
        break;

      case 'up':
        // Wait for user to return to standing
        if (angle > this.personalCalibrationMaxAngle - 10 || angle > defaultUp - 10) {
          this.personalCalibrationPhase = 'done';
          this.finishPersonalCalibration();
        }
        break;
    }

    this.callbacks.onPersonalCalibrationProgress?.(this.personalCalibrationPhase, angle);
  }

  // Complete personal calibration and save
  private finishPersonalCalibration(): void {
    // Calculate personal thresholds with some margin
    const upAngle = Math.min(this.personalCalibrationMaxAngle, 175);
    const downAngle = Math.max(this.personalCalibrationMinAngle, 60);

    // Validate calibration (should have reasonable range)
    const range = upAngle - downAngle;
    if (range < 30 || range > 120) {
      // Invalid calibration, reset
      this.personalCalibrationPhase = 'waiting';
      this.personalCalibrationMinAngle = 999;
      this.personalCalibrationMaxAngle = 0;
      return;
    }

    const calibration: PersonalCalibration = {
      exercise: this.exercise,
      upAngle: upAngle - 5,      // Add small margin
      downAngle: downAngle + 5,  // Add small margin
      calibratedAt: Date.now(),
      repCount: 1
    };

    this.personalCalibration = calibration;
    this.updateHysteresisThresholds(calibration.upAngle, calibration.downAngle);

    // Notify completion
    this.callbacks.onPersonalCalibrationComplete?.(calibration);

    // Exit calibration mode
    this.isPersonalCalibrationMode = false;
  }

  // Start calibration mode - collects samples during countdown
  startCalibration(): void {
    this.calibration.isCalibrated = false;
    this.calibrationSamples = [];
    // Reduce sample count for faster calibration during countdown
    this.isRunning = true; // Enable processing but don't count reps
  }

  // Force calibration from current frame
  calibrateNow(landmarks: NormalizedLandmark[]): void {
    const placement = detectCameraPlacement(landmarks);
    const orientation = detectBodyOrientation(landmarks);

    this.calibration.placement = placement;
    this.calibration.isCalibrated = true;

    this.state.bodyOrientation = orientation;
    this.state.activeSide = getMoreVisibleSide(landmarks);

    this.callbacks.onCalibrationUpdate?.(this.calibration);
    this.callbacks.onOrientationDetected?.(orientation, this.state.activeSide);
  }

  // Process a single frame for calibration (without rep counting)
  processCalibrationFrame(videoElement: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      if (!this.pose) {
        resolve();
        return;
      }

      // Set calibration mode - processResults will handle differently
      this.isCalibrationMode = true;
      this.calibrationResolve = resolve;

      this.pose.send({ image: videoElement }).then(() => {
        // Mode will be reset when results are processed
      });
    });
  }

  // Handle calibration results (called from processResults when in calibration mode)
  private handleCalibrationResults(results: Results): void {
    if (results.poseLandmarks) {
      // Update calibration
      this.updateCalibration(results.poseLandmarks);

      // Detect and report orientation
      const orientation = detectBodyOrientation(results.poseLandmarks);
      const visibleSide = getMoreVisibleSide(results.poseLandmarks);

      if (orientation !== this.state.bodyOrientation) {
        this.state.bodyOrientation = orientation;
        this.state.activeSide = visibleSide;
        this.callbacks.onOrientationDetected?.(orientation, visibleSide);
      }

      // Draw pose without counting
      this.callbacks.onPoseUpdate(results.poseLandmarks, 0, 0, 0);
    }

    // Exit calibration mode
    this.isCalibrationMode = false;
    if (this.calibrationResolve) {
      this.calibrationResolve();
      this.calibrationResolve = null;
    }
  }

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    // Initialize MediaPipe Pose
    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 1, // 0=lite, 1=full, 2=heavy
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.pose.onResults((results) => this.processResults(results));

    // Initialize camera
    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.pose && this.isRunning) {
          await this.pose.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480
    });
  }

  async start(): Promise<void> {
    if (!this.camera) {
      throw new Error('PoseTracker not initialized. Call initialize() first.');
    }
    this.isRunning = true;
    await this.camera.start();

    // Start plank timer if needed
    if (this.exercise === 'PLANK') {
      this.state.plankStartTime = Date.now();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.camera) {
      this.camera.stop();
    }
  }

  getState(): ExerciseState {
    return { ...this.state };
  }

  private processResults(results: Results): void {
    // Handle calibration mode separately
    if (this.isCalibrationMode) {
      this.handleCalibrationResults(results);
      return;
    }

    if (!results.poseLandmarks || !this.isRunning) return;

    // Handle personal calibration mode
    if (this.isPersonalCalibrationMode) {
      const landmarks = results.poseLandmarks;
      const config = EXERCISE_CONFIG[this.exercise];

      // Calculate current angle
      const jointA_L = landmarks[LANDMARKS[config.jointA_L]];
      const jointB_L = landmarks[LANDMARKS[config.jointB_L]];
      const jointC_L = landmarks[LANDMARKS[config.jointC_L]];
      const jointA_R = landmarks[LANDMARKS[config.jointA_R]];
      const jointB_R = landmarks[LANDMARKS[config.jointB_R]];
      const jointC_R = landmarks[LANDMARKS[config.jointC_R]];

      const leftAngle = calculateAngle(jointA_L, jointB_L, jointC_L, config.use3D);
      const rightAngle = calculateAngle(jointA_R, jointB_R, jointC_R, config.use3D);
      const avgAngle = (leftAngle + rightAngle) / 2;

      // Still emit pose for visualization
      this.callbacks.onPoseUpdate(landmarks, avgAngle, leftAngle, rightAngle);

      // Process calibration
      this.processPersonalCalibration(avgAngle);

      // Exit if calibration is done
      if (this.personalCalibrationPhase === 'done') {
        return;
      }
      return;
    }

    const landmarks = results.poseLandmarks;
    const config = EXERCISE_CONFIG[this.exercise];

    // Auto-detect camera placement if not calibrated
    if (!this.calibration.isCalibrated && this.options.useCalibration) {
      this.updateCalibration(landmarks);
    }

    // Detect body orientation
    const orientation = detectBodyOrientation(landmarks);
    const visibleSide = getMoreVisibleSide(landmarks);

    // Update state if orientation changed
    if (orientation !== this.state.bodyOrientation || visibleSide !== this.state.activeSide) {
      this.state.bodyOrientation = orientation;
      this.state.activeSide = visibleSide;
      this.callbacks.onOrientationDetected?.(orientation, visibleSide);
    }

    // Calculate angles for BOTH sides
    const jointA_L = landmarks[LANDMARKS[config.jointA_L]];
    const jointB_L = landmarks[LANDMARKS[config.jointB_L]];
    const jointC_L = landmarks[LANDMARKS[config.jointC_L]];

    const jointA_R = landmarks[LANDMARKS[config.jointA_R]];
    const jointB_R = landmarks[LANDMARKS[config.jointB_R]];
    const jointC_R = landmarks[LANDMARKS[config.jointC_R]];

    // Calculate angles with 3D support if enabled
    let leftAngle = calculateAngle(jointA_L, jointB_L, jointC_L, config.use3D);
    let rightAngle = calculateAngle(jointA_R, jointB_R, jointC_R, config.use3D);

    // Apply smoothing
    leftAngle = this.smoothAngle(leftAngle, 'left');
    rightAngle = this.smoothAngle(rightAngle, 'right');

    this.state.leftAngle = leftAngle;
    this.state.rightAngle = rightAngle;

    // Determine which angle(s) to use based on visibility
    let effectiveAngle: number;

    switch (visibleSide) {
      case 'left':
        effectiveAngle = leftAngle;
        break;
      case 'right':
        effectiveAngle = rightAngle;
        break;
      case 'both':
      default:
        // For bilateral exercises like squats, use the average
        // This ensures both legs are working equally
        effectiveAngle = (leftAngle + rightAngle) / 2;
        break;
    }

    // Apply camera placement adjustments
    const adjustedThresholds = getAdjustedThresholds(config, this.calibration.placement);

    // Emit pose update with both angles
    this.callbacks.onPoseUpdate(landmarks, effectiveAngle, leftAngle, rightAngle);

    // Handle plank separately (time-based, not rep-based)
    if (this.exercise === 'PLANK' || this.exercise === 'WALL_SIT') {
      this.handlePlank(landmarks, effectiveAngle);
      return;
    }

    // Rep counting state machine with adjusted thresholds
    this.updateRepState(effectiveAngle, landmarks, adjustedThresholds);

    this.state.lastAngle = effectiveAngle;
  }

  // Smooth angle to reduce jitter
  private smoothAngle(angle: number, side: 'left' | 'right'): number {
    const history = this.angleHistory[side];
    history.push(angle);

    if (history.length > this.maxHistoryLength) {
      history.shift();
    }

    // Weighted moving average (recent values have more weight)
    const factor = this.options.smoothingFactor || 0.3;
    let smoothed = angle;

    for (let i = history.length - 2; i >= 0; i--) {
      smoothed = smoothed * (1 - factor) + history[i] * factor;
    }

    return smoothed;
  }

  // Update camera calibration from detected placement
  private updateCalibration(landmarks: NormalizedLandmark[]): void {
    const detectedPlacement = detectCameraPlacement(landmarks);
    this.calibrationSamples.push(detectedPlacement);

    if (this.calibrationSamples.length >= this.calibrationSampleCount) {
      // Find most common placement
      const counts = new Map<CameraPlacement, number>();
      for (const sample of this.calibrationSamples) {
        counts.set(sample, (counts.get(sample) || 0) + 1);
      }

      let maxCount = 0;
      let mostCommon: CameraPlacement = 'auto';

      for (const [placement, count] of counts) {
        if (count > maxCount) {
          maxCount = count;
          mostCommon = placement;
        }
      }

      // Only calibrate if we have confident detection
      if (maxCount >= this.calibrationSampleCount * 0.6) {
        this.calibration.placement = mostCommon;
        this.calibration.isCalibrated = true;
        this.callbacks.onCalibrationUpdate?.(this.calibration);
      }

      this.calibrationSamples = [];
    }
  }

  private updateRepState(
    angle: number,
    landmarks: NormalizedLandmark[],
    thresholds: { upAngleMin: number; downAngleMax: number }
  ): void {
    const config = EXERCISE_CONFIG[this.exercise];
    const prevPhase = this.state.phase;
    const now = Date.now();

    // Use personal calibration if available, otherwise use adjusted thresholds
    let effectiveUp = thresholds.upAngleMin;
    let effectiveDown = thresholds.downAngleMax;

    if (this.personalCalibration && this.personalCalibration.exercise === this.exercise) {
      effectiveUp = this.personalCalibration.upAngle;
      effectiveDown = this.personalCalibration.downAngle;
    }

    // Track min/max angles during current rep
    if (angle < this.repCountingState.minAngleInRep) {
      this.repCountingState.minAngleInRep = angle;
    }
    if (angle > this.repCountingState.maxAngleInRep) {
      this.repCountingState.maxAngleInRep = angle;
    }

    // Determine current phase with HYSTERESIS to prevent flickering
    let newPhase: RepPhase = this.state.phase;

    if (this.state.phase === 'up') {
      // In UP state - need to go significantly down to transition
      if (angle <= effectiveDown + HYSTERESIS_BUFFER) {
        newPhase = 'down';
      } else if (angle < effectiveUp - HYSTERESIS_BUFFER) {
        newPhase = 'transition';
      }
    } else if (this.state.phase === 'down') {
      // In DOWN state - need to go significantly up to transition
      if (angle >= effectiveUp - HYSTERESIS_BUFFER) {
        newPhase = 'up';
      } else if (angle > effectiveDown + HYSTERESIS_BUFFER) {
        newPhase = 'transition';
      }
    } else {
      // In TRANSITION state
      if (angle >= effectiveUp - HYSTERESIS_BUFFER / 2) {
        newPhase = 'up';
      } else if (angle <= effectiveDown + HYSTERESIS_BUFFER / 2) {
        newPhase = 'down';
      }
    }

    // Track stable frames in same phase
    if (newPhase === this.state.phase) {
      this.repCountingState.stableFrameCount++;
    } else {
      this.repCountingState.stableFrameCount = 1;
      this.repCountingState.currentPhaseStartTime = now;
    }

    // Only transition phase if stable for required frames
    if (this.repCountingState.stableFrameCount >= STABLE_FRAMES_REQUIRED) {
      this.state.phase = newPhase;
    }

    // Count rep when completing full cycle: down → up
    // With DEBOUNCE to prevent double counting
    if (prevPhase === 'down' && this.state.phase === 'up') {
      const timeSinceLastRep = now - this.repCountingState.lastRepTime;

      // Check debounce AND that we actually went through a meaningful range
      const repRange = this.repCountingState.maxAngleInRep - this.repCountingState.minAngleInRep;
      const minRequiredRange = (effectiveUp - effectiveDown) * 0.5; // At least 50% of full range

      if (timeSinceLastRep >= MIN_REP_INTERVAL_MS && repRange >= minRequiredRange) {
        this.state.repCount++;
        this.repCountingState.lastRepTime = now;

        // Calculate form score with bilateral consideration
        const formScore = this.calculateFormScore();
        this.state.formScore = formScore;

        this.callbacks.onRepComplete(this.state.repCount, formScore);

        // Reset min/max tracking for next rep
        this.repCountingState.minAngleInRep = 999;
        this.repCountingState.maxAngleInRep = 0;
      }
    }

    // Periodic form check with orientation awareness
    if (now - this.lastFormCheck > this.formCheckInterval) {
      this.lastFormCheck = now;
      const feedback = config.formChecks(landmarks, this.state.bodyOrientation);

      // Add bilateral balance feedback for squats/lunges
      if (this.state.activeSide === 'both') {
        const angleDiff = Math.abs(this.state.leftAngle - this.state.rightAngle);
        if (angleDiff > 15) {
          feedback.push('Работай обеими ногами равномерно');
        }
      }

      if (feedback.length > 0) {
        this.state.formFeedback = feedback;
        this.callbacks.onFormFeedback(feedback);
      }
    }
  }

  private handlePlank(landmarks: NormalizedLandmark[], angle: number): void {
    const config = EXERCISE_CONFIG.PLANK;

    // Check if in plank position
    const isInPosition = angle >= config.downAngleMax && angle <= config.upAngleMin;

    if (isInPosition && this.state.plankStartTime) {
      const seconds = Math.floor((Date.now() - this.state.plankStartTime) / 1000);
      this.callbacks.onPlankTime?.(seconds);

      // Check form periodically
      const now = Date.now();
      if (now - this.lastFormCheck > this.formCheckInterval) {
        this.lastFormCheck = now;
        const feedback = config.formChecks(landmarks, this.state.bodyOrientation);
        if (feedback.length > 0) {
          this.callbacks.onFormFeedback(feedback);
        }
      }
    }
  }

  private calculateFormScore(): number {
    // Score based on how consistently the user hit the target angles
    // This is a simplified version - could be enhanced with more metrics
    return Math.max(60, Math.min(100, 100 - this.state.formFeedback.length * 10));
  }

  reset(): void {
    this.state = {
      phase: 'up',
      repCount: 0,
      lastAngle: 180,
      leftAngle: 180,
      rightAngle: 180,
      formScore: 100,
      formFeedback: [],
      plankStartTime: (this.exercise === 'PLANK' || this.exercise === 'WALL_SIT') ? Date.now() : undefined,
      bodyOrientation: 'unknown',
      activeSide: 'both',
      cameraAngleOffset: 0
    };

    // Reset angle history
    this.angleHistory = { left: [], right: [] };

    // Reset rep counting state
    this.repCountingState = {
      lastRepTime: 0,
      stableFrameCount: 0,
      currentPhaseStartTime: 0,
      minAngleInRep: 999,
      maxAngleInRep: 0
    };

    // Reset calibration if auto
    if (this.options.cameraPlacement === 'auto') {
      this.calibration.isCalibrated = false;
      this.calibrationSamples = [];
    }
  }

  // Get detailed state for debugging/display
  getDetailedState(): ExerciseState & {
    calibration: CameraCalibration;
    thresholds: { upAngleMin: number; downAngleMax: number };
    personalCalibration: PersonalCalibration | null;
    isPersonallyCalibrated: boolean;
  } {
    const config = EXERCISE_CONFIG[this.exercise];
    const baseThresholds = getAdjustedThresholds(config, this.calibration.placement);

    // Use personal calibration if available
    const effectiveThresholds = this.personalCalibration
      ? { upAngleMin: this.personalCalibration.upAngle, downAngleMax: this.personalCalibration.downAngle }
      : baseThresholds;

    return {
      ...this.state,
      calibration: { ...this.calibration },
      thresholds: effectiveThresholds,
      personalCalibration: this.personalCalibration,
      isPersonallyCalibrated: this.personalCalibration !== null
    };
  }
}

// Utility: Check if exercise is trackable locally
export function isExerciseTrackable(exerciseType: string): boolean {
  const trackable: string[] = ['SQUATS', 'PUSHUPS', 'SITUPS', 'JUMPING_JACKS', 'LUNGES', 'PLANK'];
  return trackable.includes(exerciseType.toUpperCase());
}

// Utility: Get Russian name for exercise
export function getExerciseNameRu(exercise: TrackableExercise): string {
  const names: Record<TrackableExercise, string> = {
    SQUATS: 'Приседания',
    PUSHUPS: 'Отжимания',
    SITUPS: 'Пресс',
    JUMPING_JACKS: 'Джампинг Джек',
    LUNGES: 'Выпады',
    PLANK: 'Планка',
    BURPEES: 'Бёрпи',
    HIGH_KNEES: 'Высокие колени',
    MOUNTAIN_CLIMBERS: 'Скалолаз',
    LEG_RAISES: 'Подъём ног',
    GLUTE_BRIDGES: 'Ягодичный мост',
    CALF_RAISES: 'Подъём на носки',
    WALL_SIT: 'Стульчик',
    SIDE_LUNGES: 'Боковые выпады',
    TRICEP_DIPS: 'Обратные отжимания'
  };
  return names[exercise];
}

// Utility: Check if exercise is time-based (not rep-based)
export function isTimeBased(exercise: TrackableExercise): boolean {
  return exercise === 'PLANK' || exercise === 'WALL_SIT';
}

// Utility: Get camera placement recommendations for an exercise
export function getCameraPlacementTips(exercise: TrackableExercise): {
  recommended: CameraPlacement[];
  tips: string[];
} {
  const tips: Record<TrackableExercise, { recommended: CameraPlacement[]; tips: string[] }> = {
    SQUATS: {
      recommended: ['floor_front_left', 'floor_front_right', 'floor_side', 'chest_front'],
      tips: [
        'Диагональный вид (спереди-сбоку) — лучший для приседаний',
        'Видно и глубину приседа, и выравнивание коленей',
        'Поставьте телефон на пол под углом 45° на расстоянии 2м',
        'После нажатия "Начать" у вас будет 5 секунд занять позицию'
      ]
    },
    PUSHUPS: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид позволяет отслеживать глубину отжимания и положение тела',
        'Поставьте камеру на уровне вашего тела сбоку'
      ]
    },
    SITUPS: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид показывает полную амплитуду движения',
        'Убедитесь, что видно от головы до колен'
      ]
    },
    JUMPING_JACKS: {
      recommended: ['chest_front', 'floor_front'],
      tips: [
        'Фронтальный вид лучше показывает разведение рук и ног',
        'Встаньте на расстоянии 2-3м от камеры'
      ]
    },
    LUNGES: {
      recommended: ['floor_side', 'chest_side', 'floor_front'],
      tips: [
        'Боковой вид идеален для отслеживания угла колена',
        'Фронтальный вид помогает проверить баланс'
      ]
    },
    PLANK: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид показывает прямоту тела',
        'Камера должна быть на уровне вашего тела'
      ]
    },
    BURPEES: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид охватывает все фазы упражнения',
        'Оставьте достаточно места в кадре для прыжков'
      ]
    },
    HIGH_KNEES: {
      recommended: ['chest_front', 'floor_front'],
      tips: [
        'Фронтальный вид показывает высоту подъёма коленей',
        'Встаньте на расстоянии 2м от камеры'
      ]
    },
    MOUNTAIN_CLIMBERS: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид показывает движение ног',
        'Убедитесь, что видно полное тело'
      ]
    },
    LEG_RAISES: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид показывает амплитуду подъёма ног',
        'Лягте так, чтобы камера видела от плеч до стоп'
      ]
    },
    GLUTE_BRIDGES: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид показывает подъём бёдер',
        'Камера на уровне пола сбоку'
      ]
    },
    CALF_RAISES: {
      recommended: ['chest_side', 'floor_side'],
      tips: [
        'Боковой вид показывает подъём на носки',
        'Камера на уровне стоп'
      ]
    },
    WALL_SIT: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид показывает угол в коленях',
        'Убедитесь, что видно от головы до стоп'
      ]
    },
    SIDE_LUNGES: {
      recommended: ['chest_front', 'floor_front'],
      tips: [
        'Фронтальный вид показывает боковое движение',
        'Встаньте на расстоянии 2.5м от камеры'
      ]
    },
    TRICEP_DIPS: {
      recommended: ['floor_side', 'chest_side'],
      tips: [
        'Боковой вид показывает сгибание локтей',
        'Камера на уровне рук'
      ]
    }
  };

  return tips[exercise];
}

// Utility: Get camera placement name in Russian
export function getCameraPlacementNameRu(placement: CameraPlacement): string {
  const names: Record<CameraPlacement, string> = {
    floor_front: 'На полу спереди',
    floor_front_left: 'На полу спереди-слева',
    floor_front_right: 'На полу спереди-справа',
    floor_side: 'На полу сбоку',
    chest_front: 'На уровне груди спереди',
    chest_front_left: 'На уровне груди спереди-слева',
    chest_front_right: 'На уровне груди спереди-справа',
    chest_side: 'На уровне груди сбоку',
    auto: 'Автоопределение'
  };
  return names[placement];
}

// Utility: Get body orientation name in Russian
export function getBodyOrientationNameRu(orientation: BodyOrientation): string {
  const names: Record<BodyOrientation, string> = {
    front: 'Лицом к камере',
    front_left: 'Лицом, левым боком ближе',
    front_right: 'Лицом, правым боком ближе',
    back: 'Спиной к камере',
    back_left: 'Спиной, левым боком ближе',
    back_right: 'Спиной, правым боком ближе',
    left_side: 'Левым боком',
    right_side: 'Правым боком',
    unknown: 'Не определено'
  };
  return names[orientation];
}

// Export types and functions
export type { CameraCalibration, BodyOrientation, ExerciseState };
export { detectBodyOrientation, detectCameraPlacement, getMoreVisibleSide };

export default PoseTracker;
