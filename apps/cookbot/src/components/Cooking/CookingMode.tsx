import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Check, Pause, Play, Clock, ArrowRight } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';
import { CookingStep, TimerState } from './CookingStep';
import { CookingComplete } from './CookingComplete';
import { ReminderPopup } from './ReminderPopup';

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
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = navigator.language || 'en-US';
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
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reminderTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Overall cooking timeline
  const [cookingStartedAt] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentStep = recipe.steps[currentStepIndex];
  const totalSteps = recipe.steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setTimerState('completed');
    setTimerSeconds(0);
    playNotificationSound();
    speakReminder('Timer done!');
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

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

  // Timer countdown
  useEffect(() => {
    if (timerState === 'running' && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerState, handleTimerComplete]);

  // Handle pause/resume
  const togglePause = () => {
    if (isPaused && pausedAt) {
      const pauseDuration = Date.now() - pausedAt;
      setTotalPausedMs(prev => prev + pauseDuration);
      setPausedAt(null);
    } else {
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
    reminderTimersRef.current.forEach(t => clearTimeout(t));
    reminderTimersRef.current = [];

    if (!currentStep.reminders) return;

    currentStep.reminders.forEach(reminder => {
      if (reminder.atSeconds) {
        const timer = setTimeout(() => {
          showReminder(reminder.message, reminder.icon);
        }, reminder.atSeconds * 1000);
        reminderTimersRef.current.push(timer);
      } else if (reminder.intervalSeconds) {
        const timer = setInterval(() => {
          showReminder(reminder.message, reminder.icon);
        }, reminder.intervalSeconds * 1000);
        reminderTimersRef.current.push(timer as unknown as ReturnType<typeof setTimeout>);
      }
    });

    return () => {
      reminderTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, [currentStepIndex]);

  const showReminder = (message: string, icon: string) => {
    setActiveReminder({ message, icon });
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    playReminderSound();
    speakReminder(message);

    setTimeout(() => {
      setActiveReminder(null);
    }, 5000);
  };

  const playNotificationSound = () => {
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
      oscillator.frequency.value = 523.25;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.2;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 150);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));

    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
      const nextStep = recipe.steps[currentStepIndex + 1];
      if (nextStep.timerSeconds) {
        setTimerSeconds(nextStep.timerSeconds);
        setTimerState('running');
      } else {
        setTimerSeconds(0);
        setTimerState('idle');
      }
    } else {
      setIsComplete(true);
    }
  };

  const startTimer = () => {
    if (currentStep.timerSeconds) {
      setTimerSeconds(currentStep.timerSeconds);
      setTimerState('running');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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
            Step {currentStepIndex + 1} of {totalSteps}
          </div>
        </div>
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
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto pb-4">
        <CookingStep
          step={currentStep}
          stepNumber={currentStepIndex + 1}
          timerSeconds={timerSeconds}
          timerState={timerState}
          onStartTimer={startTimer}
          isCompleted={completedSteps.has(currentStepIndex)}
        />

        {currentStepIndex > 0 && (
          <div className="px-4 pb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 opacity-60">
              <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Step {currentStepIndex}: {recipe.steps[currentStepIndex - 1].instruction}</span>
              </div>
            </div>
          </div>
        )}

        {currentStepIndex < totalSteps - 1 && (
          <div className="px-4 pb-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex items-start gap-2 text-sm text-gray-400 dark:text-gray-500">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs flex-shrink-0">
                  {currentStepIndex + 2}
                </span>
                <span>{recipe.steps[currentStepIndex + 1].instruction}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {currentStepIndex < totalSteps - 1 ? (
          <button
            onClick={handleStepComplete}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Next step</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={handleStepComplete}
            className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Check className="w-6 h-6" />
            <span>Finish cooking</span>
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
