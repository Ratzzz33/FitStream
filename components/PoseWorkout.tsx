import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Camera, Check, Settings, Info, User, AlertCircle, Mic, MicOff, Vibrate, Eye, BarChart3, ChevronRight } from 'lucide-react';
import {
  PoseTracker,
  TrackableExercise,
  getExerciseNameRu,
  isExerciseTrackable,
  isTimeBased,
  getCameraPlacementTips,
  getCameraPlacementNameRu,
  getBodyOrientationNameRu,
  CameraPlacement,
  CameraCalibration,
  BodyOrientation
} from '../services/poseTracker';
import { NormalizedLandmark } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { platformService, CameraCapability } from '../services/platformService';
import { ExerciseRecognitionFallback } from './ExerciseRecognitionFallback';

// Russian number words for voice counting
const RUSSIAN_NUMBERS = [
  '', 'один', 'два', 'три', 'четыре', 'пять',
  'шесть', 'семь', 'восемь', 'девять', 'десять',
  'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
  'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать', 'двадцать',
  'двадцать один', 'двадцать два', 'двадцать три', 'двадцать четыре', 'двадцать пять',
  'двадцать шесть', 'двадцать семь', 'двадцать восемь', 'двадцать девять', 'тридцать'
];

// Exercise demonstration data (key poses for preview)
const EXERCISE_DEMOS: Record<TrackableExercise, {
  description: string;
  steps: string[];
  keyPoints: string[];
}> = {
  SQUATS: {
    description: 'Базовое упражнение для ног и ягодиц',
    steps: [
      'Встаньте прямо, ноги на ширине плеч',
      'Медленно опускайтесь, сгибая колени',
      'Опуститесь до угла 90° в коленях',
      'Вернитесь в исходное положение'
    ],
    keyPoints: ['Спина прямая', 'Колени не выходят за носки', 'Пятки на полу']
  },
  PUSHUPS: {
    description: 'Упражнение для груди, плеч и трицепсов',
    steps: [
      'Примите упор лёжа, руки на ширине плеч',
      'Опуститесь, сгибая локти до 90°',
      'Вернитесь в исходное положение'
    ],
    keyPoints: ['Тело прямое', 'Локти под углом 45°', 'Не прогибайте поясницу']
  },
  SITUPS: {
    description: 'Упражнение для пресса',
    steps: [
      'Лягте на спину, ноги согнуты',
      'Руки за головой или на груди',
      'Поднимите корпус к коленям',
      'Медленно опуститесь'
    ],
    keyPoints: ['Не тяните шею руками', 'Поясница прижата к полу', 'Дышите ровно']
  },
  JUMPING_JACKS: {
    description: 'Кардио упражнение для всего тела',
    steps: [
      'Встаньте прямо, ноги вместе',
      'Прыжком разведите ноги и поднимите руки',
      'Прыжком вернитесь в исходное положение'
    ],
    keyPoints: ['Приземляйтесь мягко', 'Руки полностью вверх', 'Держите ритм']
  },
  LUNGES: {
    description: 'Упражнение для ног и баланса',
    steps: [
      'Встаньте прямо',
      'Сделайте широкий шаг вперёд',
      'Опуститесь до 90° в колене',
      'Вернитесь и повторите с другой ногой'
    ],
    keyPoints: ['Колено не выходит за носок', 'Спина прямая', 'Чередуйте ноги']
  },
  PLANK: {
    description: 'Статическое упражнение для кора',
    steps: [
      'Примите упор на локтях',
      'Тело прямое от головы до пяток',
      'Удерживайте положение'
    ],
    keyPoints: ['Не прогибайте поясницу', 'Не поднимайте таз', 'Дышите ровно']
  },
  BURPEES: {
    description: 'Комплексное кардио упражнение',
    steps: ['Присед', 'Выпрыг в планку', 'Отжимание', 'Прыжок в присед', 'Выпрыг вверх'],
    keyPoints: ['Быстрый темп', 'Полная амплитуда', 'Мягкое приземление']
  },
  HIGH_KNEES: {
    description: 'Кардио упражнение с высоким подъёмом колен',
    steps: ['Бег на месте', 'Колени поднимать до уровня бёдер'],
    keyPoints: ['Быстрый темп', 'Колени высоко', 'Работайте руками']
  },
  MOUNTAIN_CLIMBERS: {
    description: 'Динамическая планка',
    steps: ['Упор лёжа', 'Поочерёдно подтягивайте колени к груди'],
    keyPoints: ['Быстрый темп', 'Спина прямая', 'Бёдра не поднимать']
  },
  LEG_RAISES: {
    description: 'Упражнение для нижнего пресса',
    steps: ['Лягте на спину', 'Поднимите прямые ноги до 90°', 'Медленно опустите'],
    keyPoints: ['Ноги прямые', 'Поясница прижата', 'Контролируйте опускание']
  },
  GLUTE_BRIDGES: {
    description: 'Упражнение для ягодиц',
    steps: ['Лягте на спину, ноги согнуты', 'Поднимите таз вверх', 'Опустите'],
    keyPoints: ['Сжимайте ягодицы наверху', 'Не прогибайте поясницу']
  },
  CALF_RAISES: {
    description: 'Упражнение для икр',
    steps: ['Встаньте прямо', 'Поднимитесь на носки', 'Опуститесь'],
    keyPoints: ['Полная амплитуда', 'Держите баланс', 'Медленный темп']
  },
  WALL_SIT: {
    description: 'Статическое упражнение для ног',
    steps: ['Прислонитесь к стене', 'Присядьте до 90° в коленях', 'Удерживайте'],
    keyPoints: ['Бёдра параллельно полу', 'Спина прижата к стене']
  },
  SIDE_LUNGES: {
    description: 'Боковые выпады',
    steps: ['Широкий шаг в сторону', 'Присядьте на одну ногу', 'Вернитесь'],
    keyPoints: ['Носки смотрят вперёд', 'Спина прямая']
  },
  TRICEP_DIPS: {
    description: 'Обратные отжимания для трицепсов',
    steps: ['Упор сзади на скамью/стул', 'Опуститесь, сгибая локти', 'Поднимитесь'],
    keyPoints: ['Локти назад', 'Не разводите локти в стороны']
  }
};

// Rep statistics for summary
interface RepStat {
  repNumber: number;
  angle: number;
  formScore: number;
  timestamp: number;
}

interface WorkoutStats {
  reps: RepStat[];
  totalTime: number;
  averageFormScore: number;
  bestRep: number;
  worstRep: number;
}

interface PoseWorkoutProps {
  exercise: TrackableExercise;
  targetReps?: number;
  targetSeconds?: number; // For plank
  onComplete: (reps: number, formScore: number, stats?: WorkoutStats) => void;
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

  // Countdown states
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const countdownDuration = 5; // seconds to get into position

  // UI states
  const [isPersonVisible, setIsPersonVisible] = useState(false);
  const [lastPoseTime, setLastPoseTime] = useState(0);

  // New feature states
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [voiceCountEnabled, setVoiceCountEnabled] = useState(true);
  const [coachModeEnabled, setCoachModeEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(true); // Show exercise preview first
  const [showSummary, setShowSummary] = useState(false);

  // Camera availability for Telegram/browser fallback
  const [cameraCapability, setCameraCapability] = useState<CameraCapability | null>(null);
  const [checkingCamera, setCheckingCamera] = useState(true);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({
    reps: [],
    totalTime: 0,
    averageFormScore: 100,
    bestRep: 0,
    worstRep: 0
  });
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(0);
  const [lastCoachFeedbackTime, setLastCoachFeedbackTime] = useState(0);

  // Audio for rep counting
  const beepAudio = useRef<HTMLAudioElement | null>(null);
  const countdownAudio = useRef<HTMLAudioElement | null>(null);
  const calibrationInterval = useRef<NodeJS.Timeout | null>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  // Get camera tips for this exercise
  const cameraTips = getCameraPlacementTips(exercise);
  const exerciseDemo = EXERCISE_DEMOS[exercise];

  // Check camera availability on mount
  useEffect(() => {
    const checkCamera = async () => {
      setCheckingCamera(true);
      const capability = await platformService.checkCameraCapability();
      setCameraCapability(capability);
      setCheckingCamera(false);
    };
    checkCamera();
  }, []);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }
  }, []);

  // Speak text using Web Speech API
  const speak = useCallback((text: string, priority: boolean = false) => {
    if (!speechSynthesis.current || !voiceCountEnabled) return;

    if (priority) {
      speechSynthesis.current.cancel(); // Cancel current speech for priority messages
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    // Try to find Russian voice
    const voices = speechSynthesis.current.getVoices();
    const russianVoice = voices.find(v => v.lang.startsWith('ru'));
    if (russianVoice) {
      utterance.voice = russianVoice;
    }

    speechSynthesis.current.speak(utterance);
  }, [voiceCountEnabled]);

  // Vibrate device
  const vibrate = useCallback((pattern: number | number[]) => {
    if (vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [vibrationEnabled]);

  // Coach feedback with voice
  const coachFeedback = useCallback((message: string) => {
    if (!coachModeEnabled) return;

    const now = Date.now();
    // Don't spam feedback - minimum 3 seconds between voice tips
    if (now - lastCoachFeedbackTime < 3000) return;

    setLastCoachFeedbackTime(now);
    speak(message, false);
  }, [coachModeEnabled, lastCoachFeedbackTime, speak]);

  useEffect(() => {
    // Create beep sound for reps
    beepAudio.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAw/l9zZo3gMP5fc2aN4DD+X3NmjeAw/l9zZo3gMP5fc2aN4DD+X3NmjeAw/');
    // Create countdown beep (shorter, higher pitch)
    countdownAudio.current = new Audio('data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoFAABhgoODg4WIioqLi4uLioqIhoOBfXt5eHd4eXt9f4KFh4mKioqKiomHhYJ/');
  }, []);

  // Track person visibility - if no pose update for 1.5 seconds, consider person gone
  useEffect(() => {
    const checkVisibility = setInterval(() => {
      if (lastPoseTime > 0 && Date.now() - lastPoseTime > 1500) {
        setIsPersonVisible(false);
      }
    }, 500);

    return () => clearInterval(checkVisibility);
  }, [lastPoseTime]);

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

          // Vibrate on rep
          vibrate(score >= 80 ? 100 : [50, 50, 50]); // Short vibrate for good form, triple for bad

          // Voice count
          if (count <= 30) {
            speak(RUSSIAN_NUMBERS[count], true);
          } else {
            speak(count.toString(), true);
          }

          // Record rep stats
          setWorkoutStats(prev => {
            const newRep: RepStat = {
              repNumber: count,
              angle: currentAngle,
              formScore: score,
              timestamp: Date.now()
            };
            const newReps = [...prev.reps, newRep];
            const scores = newReps.map(r => r.formScore);
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            const bestIdx = scores.indexOf(Math.max(...scores));
            const worstIdx = scores.indexOf(Math.min(...scores));

            return {
              ...prev,
              reps: newReps,
              averageFormScore: Math.round(avgScore),
              bestRep: bestIdx + 1,
              worstRep: worstIdx + 1
            };
          });

          // Check if target reached
          if (!isTimeBased(exercise) && count >= targetReps) {
            handleComplete();
          }
        },
        onFormFeedback: (fb) => {
          setFeedback(fb);
          // Clear feedback after 3 seconds
          setTimeout(() => setFeedback([]), 3000);

          // Coach voice feedback
          if (fb.length > 0) {
            coachFeedback(fb[0]);
          }
        },
        onPoseUpdate: (landmarks, angle, left, right) => {
          setCurrentAngle(Math.round(angle));
          if (left !== undefined) setLeftAngle(Math.round(left));
          if (right !== undefined) setRightAngle(Math.round(right));
          drawPose(landmarks);

          // Track if person is visible in frame
          if (landmarks && landmarks.length > 0) {
            setIsPersonVisible(true);
            setLastPoseTime(Date.now());
          }
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
      if (calibrationInterval.current) {
        clearInterval(calibrationInterval.current);
      }
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

  // Start countdown with calibration
  const handleStart = async () => {
    if (!trackerRef.current || !isInitialized) return;

    // Start countdown
    setCountdown(countdownDuration);
    setIsCalibrating(true);
    setCalibrationProgress(0);
    setShowTips(false);
    setShowSettings(false);

    // Start the tracker in calibration mode (process frames without counting)
    trackerRef.current.startCalibration();

    // Start calibration frame processing
    if (videoRef.current) {
      calibrationInterval.current = setInterval(async () => {
        if (trackerRef.current && videoRef.current) {
          await trackerRef.current.processCalibrationFrame(videoRef.current);
          setCalibrationProgress(prev => Math.min(100, prev + 10));
        }
      }, 200); // Process 5 frames per second during calibration
    }

    // Countdown timer
    let remaining = countdownDuration;

    const countdownTimer = setInterval(() => {
      remaining--;
      setCountdown(remaining);

      // Play countdown beep
      if (soundEnabled && countdownAudio.current && remaining > 0) {
        countdownAudio.current.currentTime = 0;
        countdownAudio.current.play().catch(() => {});
      }

      if (remaining <= 0) {
        clearInterval(countdownTimer);

        // Stop calibration interval
        if (calibrationInterval.current) {
          clearInterval(calibrationInterval.current);
          calibrationInterval.current = null;
        }

        setCountdown(null);
        setIsCalibrating(false);

        // Play start sound (louder/different)
        if (soundEnabled && beepAudio.current) {
          beepAudio.current.currentTime = 0;
          beepAudio.current.play().catch(() => {});
        }

        // Actually start the workout
        trackerRef.current?.start();
        setIsRunning(true);
        setWorkoutStartTime(Date.now());

        // Announce start
        speak('Начали!', true);
      }
    }, 1000);
  };

  // Start from preview screen
  const handleStartFromPreview = () => {
    setShowPreview(false);
    // Small delay then start
    setTimeout(() => {
      handleStart();
    }, 300);
  };

  const handlePause = () => {
    if (!trackerRef.current) return;
    trackerRef.current.stop();
    setIsRunning(false);

    // Cancel countdown if running
    if (countdown !== null) {
      setCountdown(null);
      setIsCalibrating(false);
      if (calibrationInterval.current) {
        clearInterval(calibrationInterval.current);
        calibrationInterval.current = null;
      }
    }
  };

  const handleReset = () => {
    if (!trackerRef.current) return;
    trackerRef.current.reset();
    setRepCount(0);
    setFormScore(100);
    setPlankTime(0);
    setFeedback([]);
    setCountdown(null);
    setIsCalibrating(false);
    setCalibrationProgress(0);
  };

  const handleComplete = () => {
    if (trackerRef.current) {
      trackerRef.current.stop();
    }

    // Calculate final stats
    const totalTime = workoutStartTime > 0 ? Math.round((Date.now() - workoutStartTime) / 1000) : 0;
    const finalStats: WorkoutStats = {
      ...workoutStats,
      totalTime
    };
    setWorkoutStats(finalStats);

    // Show summary instead of immediately completing
    setShowSummary(true);
    setIsRunning(false);

    // Speak completion
    speak('Отлично! Тренировка завершена', true);
    vibrate([100, 50, 100, 50, 200]); // Victory vibration pattern
  };

  // Actually finish and return to parent
  const handleFinishWorkout = () => {
    onComplete(repCount, formScore, workoutStats);
  };

  const toggleCamera = async () => {
    handlePause();
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  const progress = isTimeBased(exercise)
    ? (plankTime / targetSeconds) * 100
    : (repCount / targetReps) * 100;

  // ==================== PREVIEW SCREEN ====================
  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="p-2 rounded-full bg-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white font-bold text-lg">Подготовка</h2>
          <div className="w-10" />
        </div>

        {/* Exercise info */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Exercise name and icon */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {getExerciseNameRu(exercise)}
            </h1>
            <p className="text-white/60">{exerciseDemo.description}</p>
          </div>

          {/* Target */}
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">
                {isTimeBased(exercise) ? `${targetSeconds} сек` : `${targetReps} раз`}
              </div>
              <div className="text-white/60 text-sm">Цель</div>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <h3 className="text-white font-medium mb-3">Как выполнять:</h3>
            <div className="space-y-2">
              {exerciseDemo.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-white/80 text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key points */}
          <div className="bg-amber-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-amber-400 font-medium mb-2">Важно:</h3>
            <ul className="space-y-1">
              {exerciseDemo.keyPoints.map((point, i) => (
                <li key={i} className="text-white/80 text-sm flex gap-2">
                  <span className="text-amber-400">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Settings toggles */}
          <div className="bg-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-medium mb-2">Настройки тренировки:</h3>

            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="w-5 h-5 text-white/60" />
                <span className="text-white/80">Вибрация</span>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-white/60" />
                <span className="text-white/80">Голосовой счёт</span>
              </div>
              <input
                type="checkbox"
                checked={voiceCountEnabled}
                onChange={(e) => setVoiceCountEnabled(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-white/60" />
                <span className="text-white/80">Голосовой тренер</span>
              </div>
              <input
                type="checkbox"
                checked={coachModeEnabled}
                onChange={(e) => setCoachModeEnabled(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
            </label>
          </div>
        </div>

        {/* Start button */}
        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <button
            onClick={handleStartFromPreview}
            disabled={!isInitialized}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            {isInitialized ? (
              <>
                <Play className="w-6 h-6" fill="white" />
                Начать тренировку
              </>
            ) : (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Загрузка камеры...
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==================== SUMMARY SCREEN ====================
  if (showSummary) {
    const avgFormScore = workoutStats.reps.length > 0
      ? Math.round(workoutStats.reps.reduce((a, b) => a + b.formScore, 0) / workoutStats.reps.length)
      : formScore;

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 text-center">
          <h2 className="text-white font-bold text-xl">Тренировка завершена!</h2>
        </div>

        {/* Stats */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Main result */}
          <div className="text-center mb-6">
            <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <div>
                <div className="text-4xl font-bold text-white">
                  {isTimeBased(exercise) ? `${Math.floor(plankTime / 60)}:${(plankTime % 60).toString().padStart(2, '0')}` : repCount}
                </div>
                <div className="text-white/80 text-sm">
                  {isTimeBased(exercise) ? 'время' : 'повторов'}
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {getExerciseNameRu(exercise)}
            </h1>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{avgFormScore}%</div>
              <div className="text-white/60 text-sm">Средняя форма</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {Math.floor(workoutStats.totalTime / 60)}:{(workoutStats.totalTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-white/60 text-sm">Время</div>
            </div>
            {workoutStats.reps.length > 0 && (
              <>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    #{workoutStats.bestRep}
                  </div>
                  <div className="text-white/60 text-sm">Лучший повтор</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    #{workoutStats.worstRep}
                  </div>
                  <div className="text-white/60 text-sm">Требует внимания</div>
                </div>
              </>
            )}
          </div>

          {/* Form score chart */}
          {workoutStats.reps.length > 1 && (
            <div className="bg-white/10 rounded-xl p-4 mb-6">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Форма по повторам
              </h3>
              <div className="flex items-end gap-1 h-24">
                {workoutStats.reps.map((rep, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${rep.formScore}%`,
                      backgroundColor: rep.formScore >= 80 ? '#22c55e' :
                                       rep.formScore >= 60 ? '#eab308' : '#ef4444'
                    }}
                    title={`Повтор ${rep.repNumber}: ${rep.formScore}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-white/40 text-xs mt-1">
                <span>1</span>
                <span>{workoutStats.reps.length}</span>
              </div>
            </div>
          )}

          {/* Feedback summary */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4">
            <p className="text-white/90 text-center">
              {avgFormScore >= 80 ? '🎉 Отличная работа! Продолжай в том же духе!' :
               avgFormScore >= 60 ? '👍 Хорошо! Следи за техникой для лучших результатов.' :
               '💪 Не сдавайся! Практика делает мастера.'}
            </p>
          </div>
        </div>

        {/* Finish button */}
        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <button
            onClick={handleFinishWorkout}
            className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-6 h-6" />
            Сохранить результат
          </button>
        </div>
      </div>
    );
  }

  // ==================== CAMERA UNAVAILABLE - SHOW FALLBACK ====================
  // Show loading while checking camera
  if (checkingCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Проверка камеры...</p>
        </div>
      </div>
    );
  }

  // Show fallback if camera is not available
  if (cameraCapability && !cameraCapability.available) {
    return (
      <ExerciseRecognitionFallback
        exercise={exercise}
        targetReps={targetReps}
        targetSeconds={targetSeconds}
        onManualEntry={(reps, formScore) => {
          onComplete(reps, formScore, {
            reps: [],
            totalTime: 0,
            averageFormScore: formScore,
            bestRep: 0,
            worstRep: 0
          });
        }}
        onCancel={onCancel}
      />
    );
  }

  // ==================== MAIN WORKOUT SCREEN ====================
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
              onClick={() => setVoiceCountEnabled(!voiceCountEnabled)}
              className={`p-2 rounded-full backdrop-blur-sm ${voiceCountEnabled ? 'bg-blue-500' : 'bg-white/20'}`}
              title="Голосовой счёт"
            >
              {voiceCountEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full backdrop-blur-sm ${showSettings ? 'bg-blue-500' : 'bg-white/20'}`}
              title="Настройки"
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
        {/* Video feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Dark overlay for better UI visibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%),
              linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.5) 100%)
            `
          }}
        />

        {/* Pose skeleton canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Person not visible indicator */}
        {!isPersonVisible && isInitialized && !countdown && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {/* Silhouette placeholder */}
              <div className="relative mx-auto w-32 h-48 mb-4">
                <User className="w-32 h-48 text-white/20" strokeWidth={0.5} />
                <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-xl" />
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>Встаньте в кадр камеры</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <div className="text-white/80">Загрузка камеры...</div>
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30">
            <div className="text-center">
              <div className="text-9xl font-bold text-white animate-pulse">
                {countdown}
              </div>
              <div className="text-2xl text-white/90 mt-4">
                Займите позицию
              </div>

              {/* Calibration status */}
              <div className="mt-8 bg-white/10 rounded-xl p-4 mx-4 max-w-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm">Калибровка камеры</span>
                  <span className="text-green-400 text-sm">
                    {calibration?.isCalibrated ? '✓' : `${calibrationProgress}%`}
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-200"
                    style={{ width: `${calibrationProgress}%` }}
                  />
                </div>

                {bodyOrientation !== 'unknown' && (
                  <div className="mt-3 text-white/70 text-sm">
                    Позиция: {getBodyOrientationNameRu(bodyOrientation)}
                  </div>
                )}

                {calibration?.placement && calibration.placement !== 'auto' && (
                  <div className="mt-1 text-blue-300 text-sm">
                    Камера: {getCameraPlacementNameRu(calibration.placement)}
                  </div>
                )}

                {activeSide !== 'both' && (
                  <div className="mt-1 text-amber-300 text-sm">
                    Видна {activeSide === 'left' ? 'левая' : 'правая'} сторона
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rep counter overlay (only when running, not during countdown) */}
        {countdown === null && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            {isTimeBased(exercise) ? (
              <div
                className="text-8xl font-bold text-white"
                style={{
                  textShadow: '0 0 20px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.5), 0 0 60px rgba(0,0,0,0.4)'
                }}
              >
                {Math.floor(plankTime / 60)}:{(plankTime % 60).toString().padStart(2, '0')}
              </div>
            ) : (
              <div
                className="text-9xl font-bold text-white"
                style={{
                  textShadow: '0 0 20px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.5), 0 0 60px rgba(0,0,0,0.4)'
                }}
              >
                {repCount}
              </div>
            )}
            <div
              className="text-xl text-white/90 mt-2"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
            >
              {isTimeBased(exercise) ? `/ ${targetSeconds}с` : `/ ${targetReps}`}
            </div>
          </div>
        )}

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
               bodyOrientation === 'front_left' ? '↖️ Спереди-слева' :
               bodyOrientation === 'front_right' ? '↗️ Спереди-справа' :
               bodyOrientation === 'back' ? '🔙 Сзади' :
               bodyOrientation === 'back_left' ? '↙️ Сзади-слева' :
               bodyOrientation === 'back_right' ? '↘️ Сзади-справа' :
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
      <div className="bg-gradient-to-t from-black/80 to-transparent p-4 pb-6">
        <div className="flex items-end justify-center gap-4">
          {/* Reset button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleReset}
              className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
              disabled={!isInitialized}
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            <span className="text-white/60 text-xs">Сброс</span>
          </div>

          {/* Main action button */}
          <div className="flex flex-col items-center gap-1">
            {!isRunning && countdown === null ? (
              <button
                onClick={handleStart}
                disabled={!isInitialized}
                className="p-5 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 transition-colors shadow-lg shadow-green-500/30"
              >
                <Play className="w-10 h-10 text-white" fill="white" />
              </button>
            ) : countdown !== null ? (
              <button
                onClick={handlePause}
                className="p-5 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                <X className="w-10 h-10 text-white" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="p-5 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
              >
                <Pause className="w-10 h-10 text-white" fill="white" />
              </button>
            )}
            <span className="text-white/60 text-xs">
              {!isRunning && countdown === null ? 'Начать' :
               countdown !== null ? 'Отмена' : 'Пауза'}
            </span>
          </div>

          {/* Complete button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleComplete}
              disabled={repCount === 0 && plankTime === 0}
              className="p-3 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:opacity-50 transition-colors"
              title="Завершить тренировку"
            >
              <Check className="w-6 h-6 text-white" />
            </button>
            <span className="text-white/60 text-xs">Готово</span>
          </div>
        </div>

        {/* Status text */}
        {!isInitialized && (
          <div className="text-center mt-3">
            <div className="text-white/60 text-sm">Загрузка модели...</div>
          </div>
        )}

        {/* Person visibility status */}
        {isInitialized && !isRunning && countdown === null && (
          <div className="text-center mt-3">
            <div className={`text-sm ${isPersonVisible ? 'text-green-400' : 'text-amber-400'}`}>
              {isPersonVisible ? '✓ Вы в кадре' : '⚠ Встаньте перед камерой'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoseWorkout;
