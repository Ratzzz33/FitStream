import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Check, HelpCircle, Flame, Pause, Play, Clock, ArrowRight } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';
import { CookingStep, TimerState } from './CookingStep';
import { CookingComplete } from './CookingComplete';
import { ReminderPopup } from './ReminderPopup';
import { generateDishImage } from '../../services/nanaBananaService';
import { t, tf } from '../../services/i18n';
import {
  startTimer as startBackgroundTimer,
  cancelTimer,
  getRemainingTime,
  addTimerCompletionListener,
  getTimerEndTime
} from '../../services/timerService';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface CookingModeProps {
  recipe: GeneratedRecipe;
  onComplete: (caloriesEaten: number) => void;
  onCancel: () => void;
}

interface ActiveReminder {
  message: string;
  icon: string;
}

// Generate unique timer ID for each step
const getTimerId = (recipeId: string, stepIndex: number) =>
  `cooking_${recipeId}_step_${stepIndex}`;

// TTS helper for voice reminders
const speakReminder = (message: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.0;
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
  }
};

export const CookingMode: React.FC<CookingModeProps> = ({
  recipe,
  onComplete,
  onCancel
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [stepImages, setStepImages] = useState<Map<number, string>>(new Map());
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);

  // Timer state - use explicit state instead of boolean
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerDisplayRef = useRef<NodeJS.Timeout | null>(null);
  const reminderTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Overall cooking timeline
  const [cookingStartedAt] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentStep = recipe.steps[currentStepIndex];
  const totalSteps = recipe.steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Get current timer ID
  const currentTimerId = getTimerId(recipe.name, currentStepIndex);

  // Handle timer completion (from background notification or foreground)
  const handleTimerComplete = useCallback(() => {
    setTimerState('completed');
    setTimerSeconds(0);
    // Play notification sound
    playNotificationSound();
    // Speak completion
    speakReminder(t('cookingTimerDone'));
    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  // Sync timer state when app comes to foreground
  const syncTimerState = useCallback(() => {
    const remaining = getRemainingTime(currentTimerId);
    if (remaining > 0) {
      setTimerSeconds(remaining);
      setTimerState('running');
    } else if (getTimerEndTime(currentTimerId)) {
      // Timer existed but completed while in background
      handleTimerComplete();
    }
  }, [currentTimerId, handleTimerComplete]);

  // Listen for app state changes
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground - sync timer
        syncTimerState();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [syncTimerState]);

  // Listen for timer completion notifications
  useEffect(() => {
    const cleanup = addTimerCompletionListener((timerId) => {
      if (timerId === currentTimerId) {
        handleTimerComplete();
      }
    });

    return cleanup;
  }, [currentTimerId, handleTimerComplete]);

  // Load step images progressively
  useEffect(() => {
    recipe.steps.forEach((step, index) => {
      generateDishImage({
        dishName: recipe.name,
        ingredients: recipe.ingredients.map(i => i.name),
        stepDescription: step.instruction
      }).then(image => {
        setStepImages(prev => new Map(prev).set(index, image.url));
      });
    });
  }, [recipe]);

  // Overall cooking timeline tracker
  useEffect(() => {
    const timelineInterval = setInterval(() => {
      if (!isPaused) {
        const now = Date.now();
        const elapsed = Math.floor((now - cookingStartedAt - totalPausedMs) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 1000);

    return () => clearInterval(timelineInterval);
  }, [cookingStartedAt, isPaused, totalPausedMs]);

  // Display timer update (foreground only)
  useEffect(() => {
    if (timerState === 'running' && timerSeconds > 0) {
      timerDisplayRef.current = setInterval(() => {
        const remaining = getRemainingTime(currentTimerId);
        if (remaining > 0) {
          setTimerSeconds(remaining);
        } else {
          // Timer completed
          handleTimerComplete();
          if (timerDisplayRef.current) {
            clearInterval(timerDisplayRef.current);
          }
        }
      }, 1000);
    }

    return () => {
      if (timerDisplayRef.current) {
        clearInterval(timerDisplayRef.current);
      }
    };
  }, [timerState, currentTimerId, handleTimerComplete]);

  // Handle pause/resume
  const togglePause = () => {
    if (isPaused && pausedAt) {
      // Resuming
      const pauseDuration = Date.now() - pausedAt;
      setTotalPausedMs(prev => prev + pauseDuration);
      setPausedAt(null);
    } else {
      // Pausing
      setPausedAt(Date.now());
    }
    setIsPaused(!isPaused);
  };

  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup reminders for current step
  useEffect(() => {
    // Clear existing reminder timers
    reminderTimersRef.current.forEach(t => clearTimeout(t));
    reminderTimersRef.current = [];

    if (!currentStep.reminders) return;

    currentStep.reminders.forEach(reminder => {
      if (reminder.atSeconds) {
        // One-time reminder at specific time
        const timer = setTimeout(() => {
          showReminder(reminder.message, reminder.icon);
        }, reminder.atSeconds * 1000);
        reminderTimersRef.current.push(timer);
      } else if (reminder.intervalSeconds) {
        // Recurring reminder
        const setupRecurring = () => {
          const timer = setInterval(() => {
            showReminder(reminder.message, reminder.icon);
          }, reminder.intervalSeconds! * 1000);
          reminderTimersRef.current.push(timer as unknown as NodeJS.Timeout);
        };
        setupRecurring();
      }
    });

    return () => {
      reminderTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, [currentStepIndex]);

  const showReminder = (message: string, icon: string) => {
    setActiveReminder({ message, icon });
    // Vibrate
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    // Play sound
    playReminderSound();
    // Speak the reminder with TTS
    speakReminder(message);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setActiveReminder(null);
    }, 5000);
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => oscillator.stop(), 300);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const playReminderSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 523.25; // C5
      oscillator.type = 'sine';
      gainNode.gain.value = 0.2;

      oscillator.start();
      setTimeout(() => oscillator.stop(), 150);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const handleStepComplete = async () => {
    // Mark step as complete
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));

    // Cancel any running timer for current step
    await cancelTimer(currentTimerId);

    // Clear display timer
    if (timerDisplayRef.current) {
      clearInterval(timerDisplayRef.current);
    }

    // Move to next step or finish
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
      // Reset timer state for next step
      const nextStep = recipe.steps[currentStepIndex + 1];
      if (nextStep.timerSeconds) {
        // Start background timer for next step
        const nextTimerId = getTimerId(recipe.name, currentStepIndex + 1);
        await startBackgroundTimer(
          nextTimerId,
          nextStep.timerSeconds,
          `${recipe.name}: ${nextStep.instruction.slice(0, 50)}...`
        );
        setTimerSeconds(nextStep.timerSeconds);
        setTimerState('running');
      } else {
        setTimerSeconds(0);
        setTimerState('idle');
      }
    } else {
      // Cooking complete!
      setIsComplete(true);
    }
  };

  const handleGoBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const startTimer = async () => {
    if (currentStep.timerSeconds) {
      // Start background timer with notification
      await startBackgroundTimer(
        currentTimerId,
        currentStep.timerSeconds,
        `${recipe.name}: ${currentStep.instruction.slice(0, 50)}...`
      );
      setTimerSeconds(currentStep.timerSeconds);
      setTimerState('running');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any running timers when leaving cooking mode
      cancelTimer(currentTimerId);
    };
  }, [currentTimerId]);

  // If complete, show completion screen
  if (isComplete) {
    return (
      <CookingComplete
        recipe={recipe}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <div className="font-medium dark:text-white truncate max-w-[200px]">{recipe.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {tf('stepOf', { current: currentStepIndex + 1, total: totalSteps })}
          </div>
        </div>
        {/* Timeline & Pause button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span className={isPaused ? 'text-amber-500' : ''}>
              {formatElapsedTime(elapsedSeconds)}
            </span>
          </div>
          <button
            onClick={togglePause}
            className={`p-2 rounded-full transition-colors ${
              isPaused
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
            }`}
            title={isPaused ? 'Продолжить' : 'Пауза'}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto pb-4">
        <CookingStep
          step={currentStep}
          stepNumber={currentStepIndex + 1}
          imageUrl={stepImages.get(currentStepIndex)}
          timerSeconds={timerSeconds}
          timerState={timerState}
          onStartTimer={startTimer}
          isCompleted={completedSteps.has(currentStepIndex)}
        />

        {/* Previous steps (collapsed) */}
        {currentStepIndex > 0 && (
          <div className="px-4 pb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 opacity-60">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                <span>Шаг {currentStepIndex}: {recipe.steps[currentStepIndex - 1].instruction.slice(0, 50)}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Next steps preview */}
        {currentStepIndex < totalSteps - 1 && (
          <div className="px-4 pb-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs">
                  {currentStepIndex + 2}
                </span>
                <span>{recipe.steps[currentStepIndex + 1].instruction.slice(0, 50)}...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action with safe area padding */}
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {currentStepIndex < totalSteps - 1 ? (
          <button
            onClick={handleStepComplete}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Следующий этап</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={handleStepComplete}
            className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Check className="w-6 h-6" />
            <span>Завершить готовку</span>
          </button>
        )}
      </div>

      {/* Reminder popup */}
      {activeReminder && (
        <ReminderPopup
          message={activeReminder.message}
          icon={activeReminder.icon}
          onDismiss={() => setActiveReminder(null)}
        />
      )}
    </div>
  );
};

export default CookingMode;
