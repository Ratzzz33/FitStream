import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Camera, Zap } from 'lucide-react';
import { PoseTracker, TrackableExercise, getExerciseNameRu, isExerciseTrackable } from '../services/poseTracker';
import { NormalizedLandmark } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

interface PoseWorkoutProps {
  exercise: TrackableExercise;
  targetReps?: number;
  targetSeconds?: number; // For plank
  onComplete: (reps: number, formScore: number) => void;
  onCancel: () => void;
}

export const PoseWorkout: React.FC<PoseWorkoutProps> = ({
  exercise,
  targetReps = 10,
  targetSeconds = 60,
  onComplete,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<PoseTracker | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [plankTime, setPlankTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // Audio for rep counting
  const beepAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create beep sound
    beepAudio.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAw/l9zZo3gMP5fc2aN4DD+X3NmjeAw/l9zZo3gMP5fc2aN4DD+X3NmjeAw/');
  }, []);

  // Initialize tracker
  useEffect(() => {
    if (!videoRef.current) return;

    const tracker = new PoseTracker(exercise, {
      onRepComplete: (count, score) => {
        setRepCount(count);
        setFormScore(score);
        // Play beep
        if (soundEnabled && beepAudio.current) {
          beepAudio.current.currentTime = 0;
          beepAudio.current.play().catch(() => {});
        }
        // Check if target reached
        if (exercise !== 'PLANK' && count >= targetReps) {
          handleComplete();
        }
      },
      onFormFeedback: (fb) => {
        setFeedback(fb);
        // Clear feedback after 3 seconds
        setTimeout(() => setFeedback([]), 3000);
      },
      onPoseUpdate: (landmarks, angle) => {
        setCurrentAngle(Math.round(angle));
        drawPose(landmarks);
      },
      onPlankTime: (seconds) => {
        setPlankTime(seconds);
        if (seconds >= targetSeconds) {
          handleComplete();
        }
      }
    });

    trackerRef.current = tracker;

    tracker.initialize(videoRef.current).then(() => {
      setIsInitialized(true);
    }).catch((err) => {
      console.error('Failed to initialize pose tracker:', err);
    });

    return () => {
      tracker.stop();
    };
  }, [exercise, cameraFacing]);

  const drawPose = useCallback((landmarks: NormalizedLandmark[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw skeleton
    drawConnectors(ctx, landmarks, POSE_CONNECTIONS, {
      color: '#00FF00',
      lineWidth: 4
    });

    // Draw landmarks
    drawLandmarks(ctx, landmarks, {
      color: '#FF0000',
      lineWidth: 2,
      radius: 6
    });
  }, []);

  const handleStart = async () => {
    if (!trackerRef.current || !isInitialized) return;
    await trackerRef.current.start();
    setIsRunning(true);
  };

  const handlePause = () => {
    if (!trackerRef.current) return;
    trackerRef.current.stop();
    setIsRunning(false);
  };

  const handleReset = () => {
    if (!trackerRef.current) return;
    trackerRef.current.reset();
    setRepCount(0);
    setFormScore(100);
    setPlankTime(0);
    setFeedback([]);
  };

  const handleComplete = () => {
    if (trackerRef.current) {
      trackerRef.current.stop();
    }
    onComplete(repCount, formScore);
  };

  const toggleCamera = async () => {
    handlePause();
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  const progress = exercise === 'PLANK'
    ? (plankTime / targetSeconds) * 100
    : (repCount / targetReps) * 100;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <h2 className="text-white font-bold text-lg">
            {getExerciseNameRu(exercise)}
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-white" />
              ) : (
                <VolumeX className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={toggleCamera}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Video with overlay */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Rep counter overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          {exercise === 'PLANK' ? (
            <div className="text-8xl font-bold text-white drop-shadow-lg">
              {Math.floor(plankTime / 60)}:{(plankTime % 60).toString().padStart(2, '0')}
            </div>
          ) : (
            <div className="text-9xl font-bold text-white drop-shadow-lg">
              {repCount}
            </div>
          )}
          <div className="text-xl text-white/80 mt-2">
            {exercise === 'PLANK' ? `/ ${targetSeconds}с` : `/ ${targetReps}`}
          </div>
        </div>

        {/* Angle indicator (debug) */}
        <div className="absolute top-20 right-4 bg-black/50 rounded-lg px-3 py-2">
          <div className="text-white text-sm">Угол: {currentAngle}°</div>
          <div className="text-green-400 text-sm">Форма: {formScore}%</div>
        </div>

        {/* Form feedback */}
        {feedback.length > 0 && (
          <div className="absolute top-1/3 left-0 right-0 flex justify-center">
            <div className="bg-amber-500/90 text-white px-6 py-3 rounded-xl text-lg font-medium animate-pulse">
              {feedback[0]}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-24 left-4 right-4">
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handleReset}
            className="p-4 rounded-full bg-white/20 backdrop-blur-sm"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </button>

          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={!isInitialized}
              className="p-6 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 transition-colors"
            >
              <Play className="w-10 h-10 text-white" fill="white" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="p-6 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors"
            >
              <Pause className="w-10 h-10 text-white" fill="white" />
            </button>
          )}

          <button
            onClick={handleComplete}
            className="p-4 rounded-full bg-blue-500 hover:bg-blue-600"
          >
            <Zap className="w-6 h-6 text-white" />
          </button>
        </div>

        {!isInitialized && (
          <div className="text-center mt-4">
            <div className="text-white/60 text-sm">Загрузка модели...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoseWorkout;
