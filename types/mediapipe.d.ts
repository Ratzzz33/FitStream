declare module '@mediapipe/pose' {
  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }

  export interface Results {
    poseLandmarks?: NormalizedLandmark[];
    poseWorldLandmarks?: NormalizedLandmark[];
    segmentationMask?: ImageData;
    image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  }

  export interface PoseConfig {
    locateFile?: (file: string) => string;
  }

  export interface PoseOptions {
    modelComplexity?: 0 | 1 | 2;
    smoothLandmarks?: boolean;
    enableSegmentation?: boolean;
    smoothSegmentation?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export class Pose {
    constructor(config?: PoseConfig);
    setOptions(options: PoseOptions): void;
    onResults(callback: (results: Results) => void): void;
    send(inputs: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }): Promise<void>;
    close(): void;
  }

  export const POSE_CONNECTIONS: [number, number][];
}

declare module '@mediapipe/camera_utils' {
  export interface CameraConfig {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
    facingMode?: 'user' | 'environment';
  }

  export class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      config: CameraConfig
    );
    start(): Promise<void>;
    stop(): void;
  }
}

declare module '@mediapipe/drawing_utils' {
  import { NormalizedLandmark } from '@mediapipe/pose';

  export interface DrawingOptions {
    color?: string;
    lineWidth?: number;
    radius?: number;
    fillColor?: string;
    visibilityMin?: number;
  }

  export function drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    connections: [number, number][],
    options?: DrawingOptions
  ): void;

  export function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    options?: DrawingOptions
  ): void;
}
