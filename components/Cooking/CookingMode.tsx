import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Check, HelpCircle, Flame, Pause, Play, Clock, ArrowRight } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';
import { CookingStep, TimerState } from './CookingStep';
import { CookingComplete } from './CookingComplete';
import { ReminderPopup } from './ReminderPopup';
import { generateDishImage } from '../../services/nanaBananaService';
import { t, tf } from '../../services/i18n';

interface CookingModeProps {
  recipe: GeneratedRecipe;
  onComplete: (caloriesEaten: number) => void;
  onCancel: () => void;
}

interface ActiveReminder {
  message: string;
  icon: string;
}

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Handle timer
  useEffect(() => {
    if (timerState === 'running' && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerState('completed');
            // Play notification sound
            playNotificationSound();
            // Speak completion
            speakReminder(t('cookingTimerDone'));
            // Vibrate if available
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState, timerSeconds]);

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

  const handleStepComplete = () => {
    // Mark step as complete
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));

    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Move to next step or finish
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
      // Reset timer state for next step
      const nextStep = recipe.steps[currentStepIndex + 1];
      if (nextStep.timerSeconds) {
        setTimerSeconds(nextStep.timerSeconds);
        setTimerState('running'); // Auto-start for next step
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

  const startTimer = () => {
    if (currentStep.timerSeconds) {
      setTimerSeconds(currentStep.timerSeconds);
      setTimerState('running');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
