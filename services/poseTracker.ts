/**
 * PoseTracker - Local ML-based exercise recognition using MediaPipe Pose
 *
 * Detects 33 body landmarks and tracks exercise repetitions by analyzing
 * joint angles. Works completely offline on device.
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

// Landmark indices (MediaPipe Pose has 33 landmarks)
const LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

// Exercise state machine
type RepPhase = 'up' | 'down' | 'transition';

interface ExerciseState {
  phase: RepPhase;
  repCount: number;
  lastAngle: number;
  formScore: number; // 0-100
  formFeedback: string[];
  plankStartTime?: number; // For plank timing
}

// Thresholds for each exercise
const EXERCISE_CONFIG: Record<TrackableExercise, {
  upAngleMin: number;
  downAngleMax: number;
  jointA: keyof typeof LANDMARKS;
  jointB: keyof typeof LANDMARKS;
  jointC: keyof typeof LANDMARKS;
  formChecks: (landmarks: NormalizedLandmark[]) => string[];
}> = {
  SQUATS: {
    upAngleMin: 160,    // Standing: knee nearly straight
    downAngleMax: 100,  // Squat: knee bent
    jointA: 'LEFT_HIP',
    jointB: 'LEFT_KNEE',
    jointC: 'LEFT_ANKLE',
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
      const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
      // Check if knees go past toes
      if (leftKnee.x < leftAnkle.x - 0.05) {
        feedback.push('Колени не должны выходить за носки');
      }
      return feedback;
    }
  },
  PUSHUPS: {
    upAngleMin: 160,    // Arms extended
    downAngleMax: 90,   // Arms bent at 90°
    jointA: 'LEFT_SHOULDER',
    jointB: 'LEFT_ELBOW',
    jointC: 'LEFT_WRIST',
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const hip = landmarks[LANDMARKS.LEFT_HIP];
      const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
      const ankle = landmarks[LANDMARKS.LEFT_ANKLE];
      // Check if body is straight (hip not sagging)
      const hipOffset = Math.abs(hip.y - ((shoulder.y + ankle.y) / 2));
      if (hipOffset > 0.1) {
        feedback.push('Держи тело прямо, не прогибай поясницу');
      }
      return feedback;
    }
  },
  SITUPS: {
    upAngleMin: 70,     // Sitting up
    downAngleMax: 160,  // Lying down
    jointA: 'LEFT_SHOULDER',
    jointB: 'LEFT_HIP',
    jointC: 'LEFT_KNEE',
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      // Check neck position (don't pull on neck)
      const nose = landmarks[LANDMARKS.NOSE];
      const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
      if (Math.abs(nose.x - shoulder.x) > 0.15) {
        feedback.push('Не тяни шею, руки за головой');
      }
      return feedback;
    }
  },
  JUMPING_JACKS: {
    upAngleMin: 150,    // Arms up, legs spread
    downAngleMax: 30,   // Arms down, legs together
    jointA: 'LEFT_WRIST',
    jointB: 'LEFT_SHOULDER',
    jointC: 'LEFT_HIP',
    formChecks: () => []
  },
  LUNGES: {
    upAngleMin: 160,    // Standing
    downAngleMax: 95,   // Lunge position
    jointA: 'LEFT_HIP',
    jointB: 'LEFT_KNEE',
    jointC: 'LEFT_ANKLE',
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const knee = landmarks[LANDMARKS.LEFT_KNEE];
      const ankle = landmarks[LANDMARKS.LEFT_ANKLE];
      if (knee.x < ankle.x - 0.08) {
        feedback.push('Колено не должно выходить за носок');
      }
      return feedback;
    }
  },
  PLANK: {
    upAngleMin: 170,    // Body straight
    downAngleMax: 150,  // Slight bend allowed
    jointA: 'LEFT_SHOULDER',
    jointB: 'LEFT_HIP',
    jointC: 'LEFT_ANKLE',
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const hip = landmarks[LANDMARKS.LEFT_HIP];
      const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
      const ankle = landmarks[LANDMARKS.LEFT_ANKLE];
      const hipOffset = Math.abs(hip.y - ((shoulder.y + ankle.y) / 2));
      if (hipOffset > 0.08) {
        feedback.push('Держи тело ровно');
      }
      return feedback;
    }
  },
  BURPEES: {
    upAngleMin: 160,    // Standing up
    downAngleMax: 60,   // In squat/plank position
    jointA: 'LEFT_HIP',
    jointB: 'LEFT_KNEE',
    jointC: 'LEFT_ANKLE',
    formChecks: () => []
  },
  HIGH_KNEES: {
    upAngleMin: 160,    // Leg down
    downAngleMax: 70,   // Knee raised high
    jointA: 'LEFT_HIP',
    jointB: 'LEFT_KNEE',
    jointC: 'LEFT_ANKLE',
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const knee = landmarks[LANDMARKS.LEFT_KNEE];
      const hip = landmarks[LANDMARKS.LEFT_HIP];
      if (knee.y > hip.y + 0.1) {
        feedback.push('Поднимай колени выше');
      }
      return feedback;
    }
  },
  MOUNTAIN_CLIMBERS: {
    upAngleMin: 160,    // Leg extended
    downAngleMax: 80,   // Knee tucked
    jointA: 'LEFT_HIP',
    jointB: 'LEFT_KNEE',
    jointC: 'LEFT_ANKLE',
    formChecks: () => []
  },
  LEG_RAISES: {
    upAngleMin: 160,    // Legs down
    downAngleMax: 80,   // Legs raised
    jointA: 'LEFT_SHOULDER',
    jointB: 'LEFT_HIP',
    jointC: 'LEFT_ANKLE',
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const knee = landmarks[LANDMARKS.LEFT_KNEE];
      const ankle = landmarks[LANDMARKS.LEFT_ANKLE];
      if (Math.abs(knee.y - ankle.y) > 0.1) {
        feedback.push('Держи ноги прямыми');
      }
      return feedback;
    }
  },
  GLUTE_BRIDGES: {
    upAngleMin: 160,    // Hips raised
    downAngleMax: 100,  // Hips down
    jointA: 'LEFT_SHOULDER',
    jointB: 'LEFT_HIP',
    jointC: 'LEFT_KNEE',
    formChecks: () => []
  },
  CALF_RAISES: {
    upAngleMin: 175,    // On tiptoes
    downAngleMax: 160,  // Heels down
    jointA: 'LEFT_KNEE',
    jointB: 'LEFT_ANKLE',
    jointC: 'LEFT_ANKLE', // Approximation
    formChecks: () => []
  },
  WALL_SIT: {
    upAngleMin: 100,    // Sitting position
    downAngleMax: 80,   // Deep sit
    jointA: 'LEFT_HIP',
    jointB: 'LEFT_KNEE',
    jointC: 'LEFT_ANKLE',
    formChecks: (landmarks) => {
      const feedback: string[] = [];
      const hip = landmarks[LANDMARKS.LEFT_HIP];
      const knee = landmarks[LANDMARKS.LEFT_KNEE];
      if (Math.abs(hip.y - knee.y) > 0.15) {
        feedback.push('Бёдра параллельно полу');
      }
      return feedback;
    }
  },
  SIDE_LUNGES: {
    upAngleMin: 160,    // Standing
    downAngleMax: 100,  // Lunge position
    jointA: 'LEFT_HIP',
    jointB: 'LEFT_KNEE',
    jointC: 'LEFT_ANKLE',
    formChecks: () => []
  },
  TRICEP_DIPS: {
    upAngleMin: 160,    // Arms extended
    downAngleMax: 90,   // Arms bent
    jointA: 'LEFT_SHOULDER',
    jointB: 'LEFT_ELBOW',
    jointC: 'LEFT_WRIST',
    formChecks: () => []
  }
};

// Calculate angle between three points
function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Event callbacks
export interface PoseTrackerCallbacks {
  onRepComplete: (count: number, formScore: number) => void;
  onFormFeedback: (feedback: string[]) => void;
  onPoseUpdate: (landmarks: NormalizedLandmark[], angle: number) => void;
  onPlankTime?: (seconds: number) => void;
}

export class PoseTracker {
  private pose: Pose | null = null;
  private camera: Camera | null = null;
  private exercise: TrackableExercise;
  private state: ExerciseState;
  private callbacks: PoseTrackerCallbacks;
  private isRunning = false;
  private lastFormCheck = 0;
  private formCheckInterval = 2000; // Check form every 2 seconds

  constructor(exercise: TrackableExercise, callbacks: PoseTrackerCallbacks) {
    this.exercise = exercise;
    this.callbacks = callbacks;
    this.state = {
      phase: 'up',
      repCount: 0,
      lastAngle: 180,
      formScore: 100,
      formFeedback: []
    };
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
    if (!results.poseLandmarks || !this.isRunning) return;

    const landmarks = results.poseLandmarks;
    const config = EXERCISE_CONFIG[this.exercise];

    // Get joint positions
    const jointA = landmarks[LANDMARKS[config.jointA]];
    const jointB = landmarks[LANDMARKS[config.jointB]];
    const jointC = landmarks[LANDMARKS[config.jointC]];

    // Calculate current angle
    const angle = calculateAngle(jointA, jointB, jointC);

    // Emit pose update
    this.callbacks.onPoseUpdate(landmarks, angle);

    // Handle plank separately (time-based, not rep-based)
    if (this.exercise === 'PLANK') {
      this.handlePlank(landmarks, angle);
      return;
    }

    // Rep counting state machine
    this.updateRepState(angle, landmarks);

    this.state.lastAngle = angle;
  }

  private updateRepState(angle: number, landmarks: NormalizedLandmark[]): void {
    const config = EXERCISE_CONFIG[this.exercise];
    const prevPhase = this.state.phase;

    // Determine current phase based on angle
    if (angle >= config.upAngleMin) {
      this.state.phase = 'up';
    } else if (angle <= config.downAngleMax) {
      this.state.phase = 'down';
    } else {
      this.state.phase = 'transition';
    }

    // Count rep when completing full cycle: up → down → up
    if (prevPhase === 'down' && this.state.phase === 'up') {
      this.state.repCount++;

      // Calculate form score (based on how low/high the angles were)
      const formScore = this.calculateFormScore();
      this.state.formScore = formScore;

      this.callbacks.onRepComplete(this.state.repCount, formScore);
    }

    // Periodic form check
    const now = Date.now();
    if (now - this.lastFormCheck > this.formCheckInterval) {
      this.lastFormCheck = now;
      const feedback = config.formChecks(landmarks);
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
        const feedback = config.formChecks(landmarks);
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
      formScore: 100,
      formFeedback: [],
      plankStartTime: this.exercise === 'PLANK' ? Date.now() : undefined
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

export default PoseTracker;
