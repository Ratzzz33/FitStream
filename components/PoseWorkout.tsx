import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Camera, Zap, Settings, Info, ChevronDown, ChevronUp } from 'lucide-react';
import {
  PoseTracker,
  TrackableExercise,
  getExerciseNameRu,
  isExerciseTrackable,
  isTimeBased,
  getCameraPlacementTips,
  getCameraPlacementNameRu,
  CameraPlacement,
  CameraCalibration,
  BodyOrientation
} from '../services/poseTracker';
import { NormalizedLandmark } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

interface PoseWorkoutProps {
  exercise: TrackableExercise;
  targetReps?: number;
  targetSeconds?: number; // For plank
  onComplete: (reps: number, formScore: number) => void;
  onCancel: () => void;
  initialCameraPlacement?: CameraPlacement;
}

export const PoseWorkout: React.FC<PoseWorkoutProps> = ({
  exercise,
  targetReps = 10,
  targetSeconds = 60,
  onComplete,
  onCancel,
  initialCameraPlacement = 'auto'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<PoseTracker | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [leftAngle, setLeftAngle] = useState(0);
  const [rightAngle, setRightAngle] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [plankTime, setPlankTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // New states for improved tracking
  const [cameraPlacement, setCameraPlacement] = useState<CameraPlacement>(initialCameraPlacement);
  const [calibration, setCalibration] = useState<CameraCalibration | null>(null);
  const [bodyOrientation, setBodyOrientation] = useState<BodyOrientation>('unknown');
  const [activeSide, setActiveSide] = useState<'left' | 'right' | 'both'>('both');
  const [showSettings, setShowSettings] = useState(false);
  const [showTips, setShowTips] = useState(true);

  // Audio for rep counting
  const beepAudio = useRef<HTMLAudioElement | null>(null);

  // Get camera tips for this exercise
  const cameraTips = getCameraPlacementTips(exercise);

  useEffect(() => {
    // Create beep sound
    beepAudio.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAw/l9zZo3gMP5fc2aN4DD+X3NmjeAw/l9zZo3gMP5fc2aN4DD+X3NmjeAw/');
  }, []);

  // Initialize tracker
  useEffect(() => {
    if (!videoRef.current) return;

    const tracker = new PoseTracker(
      exercise,
      {
        onRepComplete: (count, score) => {
          setRepCount(count);
          setFormScore(score);
          // Play beep
          if (soundEnabled && beepAudio.current) {
            beepAudio.current.currentTime = 0;
            beepAudio.current.play().catch(() => {});
          }
          // Check if target reached
          if (!isTimeBased(exercise) && count >= targetReps) {
            handleComplete();
          }
        },
        onFormFeedback: (fb) => {
          setFeedback(fb);
          // Clear feedback after 3 seconds
          setTimeout(() => setFeedback([]), 3000);
        },
        onPoseUpdate: (landmarks, angle, left, right) => {
          setCurrentAngle(Math.round(angle));
          if (left !== undefined) setLeftAngle(Math.round(left));
          if (right !== undefined) setRightAngle(Math.round(right));
          drawPose(landmarks);
        },
        onPlankTime: (seconds) => {
          setPlankTime(seconds);
          if (seconds >= targetSeconds) {
            handleComplete();
          }
        },
        onCalibrationUpdate: (cal) => {
          setCalibration(cal);
          // Hide tips once calibrated
          if (cal.isCalibrated) {
            setShowTips(false);
          }
        },
        onOrientationDetected: (orientation, side) => {
          setBodyOrientation(orientation);
          setActiveSide(side);
        }
      },
      {
        cameraPlacement: cameraPlacement,
        useCalibration: cameraPlacement === 'auto',
        smoothingFactor: 0.3
      }
    );

    trackerRef.current = tracker;

    tracker.initialize(videoRef.current).then(() => {
      setIsInitialized(true);
    }).catch((err) => {
      console.error('Failed to initialize pose tracker:', err);
    });

    return () => {
      tracker.stop();
    };
  }, [exercise, cameraFacing, cameraPlacement]);

  // Update camera placement on tracker when changed
  const handleCameraPlacementChange = (placement: CameraPlacement) => {
    setCameraPlacement(placement);
    if (trackerRef.current) {
      trackerRef.current.setCameraPlacement(placement);
    }
  };

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

  const progress = isTimeBased(exercise)
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
              onClick={() => setShowTips(!showTips)}
              className={`p-2 rounded-full backdrop-blur-sm ${showTips ? 'bg-blue-500' : 'bg-white/20'}`}
              title="Подсказки"
            >
              <Info className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full backdrop-blur-sm ${showSettings ? 'bg-blue-500' : 'bg-white/20'}`}
              title="Настройки камеры"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
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
          {isTimeBased(exercise) ? (
            <div className="text-8xl font-bold text-white drop-shadow-lg">
              {Math.floor(plankTime / 60)}:{(plankTime % 60).toString().padStart(2, '0')}
            </div>
          ) : (
            <div className="text-9xl font-bold text-white drop-shadow-lg">
              {repCount}
            </div>
          )}
          <div className="text-xl text-white/80 mt-2">
            {isTimeBased(exercise) ? `/ ${targetSeconds}с` : `/ ${targetReps}`}
          </div>
        </div>

        {/* Angle indicator with bilateral info */}
        <div className="absolute top-20 right-4 bg-black/60 rounded-lg px-3 py-2 backdrop-blur-sm">
          <div className="text-white text-sm font-medium">Угол: {currentAngle}°</div>
          {activeSide === 'both' && (
            <div className="flex gap-2 text-xs mt-1">
              <span className={`${Math.abs(leftAngle - rightAngle) > 15 ? 'text-amber-400' : 'text-white/70'}`}>
                Л: {leftAngle}°
              </span>
              <span className={`${Math.abs(leftAngle - rightAngle) > 15 ? 'text-amber-400' : 'text-white/70'}`}>
                П: {rightAngle}°
              </span>
            </div>
          )}
          <div className="text-green-400 text-sm mt-1">Форма: {formScore}%</div>
          {calibration && (
            <div className="text-blue-300 text-xs mt-1">
              📷 {getCameraPlacementNameRu(calibration.placement)}
            </div>
          )}
          {bodyOrientation !== 'unknown' && (
            <div className="text-purple-300 text-xs">
              {bodyOrientation === 'front' ? '👤 Спереди' :
               bodyOrientation === 'back' ? '🔙 Сзади' :
               bodyOrientation === 'left_side' ? '◀️ Левый бок' :
               bodyOrientation === 'right_side' ? '▶️ Правый бок' : ''}
            </div>
          )}
        </div>

        {/* Camera tips panel (collapsible) */}
        {showTips && !isRunning && (
          <div className="absolute top-20 left-4 right-20 bg-blue-900/80 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-300" />
                <span className="text-white text-sm font-medium">Как расположить камеру</span>
              </div>
              <button
                onClick={() => setShowTips(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-white/80 text-xs space-y-1">
              {cameraTips.tips.slice(0, 2).map((tip, i) => (
                <p key={i}>• {tip}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {cameraTips.recommended.map(placement => (
                <button
                  key={placement}
                  onClick={() => handleCameraPlacementChange(placement)}
                  className={`text-xs px-2 py-1 rounded ${
                    cameraPlacement === placement
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white/80'
                  }`}
                >
                  {getCameraPlacementNameRu(placement)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div className="absolute top-20 left-4 right-4 bg-gray-900/90 rounded-lg p-4 backdrop-blur-sm z-20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Настройки камеры</span>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white/70 text-sm block mb-2">Расположение камеры</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['auto', 'floor_front', 'floor_side', 'chest_front', 'chest_side'] as CameraPlacement[]).map(placement => (
                    <button
                      key={placement}
                      onClick={() => handleCameraPlacementChange(placement)}
                      className={`text-sm px-3 py-2 rounded ${
                        cameraPlacement === placement
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {getCameraPlacementNameRu(placement)}
                    </button>
                  ))}
                </div>
              </div>

              {calibration && (
                <div className="text-white/60 text-xs">
                  Статус: {calibration.isCalibrated ? '✓ Откалибровано' : 'Калибровка...'}
                </div>
              )}
            </div>
          </div>
        )}

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
