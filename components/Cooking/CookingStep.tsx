import React, { useState } from 'react';
import { Clock, Flame, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, HelpCircle } from 'lucide-react';

interface StepData {
  order: number;
  instruction: string;
  timerSeconds?: number;
  heatLevel?: 1 | 2 | 3;
  tip?: string;
  doneWhen?: string;
  reminders?: {
    type: string;
    intervalSeconds?: number;
    atSeconds?: number;
    message: string;
    icon: string;
  }[];
  troubleshoot?: {
    problem: string;
    solution: string;
  }[];
}

interface CookingStepProps {
  step: StepData;
  stepNumber: number;
  imageUrl?: string;
  timerSeconds: number;
  timerActive: boolean;
  onStartTimer: () => void;
  isCompleted: boolean;
}

export const CookingStep: React.FC<CookingStepProps> = ({
  step,
  stepNumber,
  imageUrl,
  timerSeconds,
  timerActive,
  onStartTimer,
  isCompleted
}) => {
  const [showTip, setShowTip] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHeatIcons = (level?: number) => {
    if (!level) return null;
    const flames = [];
    for (let i = 0; i < level; i++) {
      flames.push(
        <Flame key={i} className="w-5 h-5 text-orange-500" />
      );
    }
    return flames;
  };

  const getHeatLabel = (level?: number) => {
    switch (level) {
      case 1: return 'Слабый огонь';
      case 2: return 'Средний огонь';
      case 3: return 'Сильный огонь';
      default: return null;
    }
  };

  // Extract reminders info for display
  const reminderIcons = step.reminders?.map(r => ({
    icon: r.icon,
    message: r.message,
    interval: r.intervalSeconds
  })) || [];

  const timerProgress = step.timerSeconds
    ? ((step.timerSeconds - timerSeconds) / step.timerSeconds) * 100
    : 0;

  return (
    <div className="p-4">
      {/* Step image */}
      {imageUrl && (
        <div className="rounded-xl overflow-hidden mb-4 bg-gray-200 dark:bg-gray-700">
          <img
            src={imageUrl}
            alt={`Шаг ${stepNumber}`}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Main instruction card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
        {/* Step header with emoji */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 rounded-full text-xl">
            🍳
          </div>
          <div className="flex-1">
            <h3 className="font-semibold dark:text-white text-lg leading-tight">
              {step.instruction}
            </h3>
          </div>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Heat level */}
          {step.heatLevel && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex">{getHeatIcons(step.heatLevel)}</div>
              <span className="text-sm text-orange-700 dark:text-orange-300 ml-1">
                {getHeatLabel(step.heatLevel)}
              </span>
            </div>
          )}

          {/* Timer info */}
          {step.timerSeconds && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {Math.floor(step.timerSeconds / 60)} мин
              </span>
            </div>
          )}

          {/* Reminder icons */}
          {reminderIcons.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              title={r.message}
            >
              <span>{r.icon}</span>
              {r.interval && (
                <span className="text-xs text-purple-700 dark:text-purple-300">
                  каждые {Math.floor(r.interval / 60)}м
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Done when indicator */}
        {step.doneWhen && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
            <span className="text-lg">✅</span>
            <div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">Готово когда:</div>
              <div className="text-sm text-green-600 dark:text-green-400">{step.doneWhen}</div>
            </div>
          </div>
        )}

        {/* Timer display */}
        {step.timerSeconds && (
          <div className="mb-4">
            {timerActive ? (
              <div className="space-y-2">
                {/* Progress bar */}
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000"
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
                {/* Time remaining */}
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-mono font-bold dark:text-white">
                    {formatTime(timerSeconds)}
                  </span>
                </div>
              </div>
            ) : timerSeconds === 0 && timerProgress > 0 ? (
              <div className="text-center py-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="text-green-700 dark:text-green-300 font-medium">
                  ✅ Таймер завершён!
                </span>
              </div>
            ) : (
              <button
                onClick={onStartTimer}
                className="w-full py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Запустить таймер ({Math.floor(step.timerSeconds / 60)} мин)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tip section (collapsible) */}
      {step.tip && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-4 overflow-hidden">
          <button
            onClick={() => setShowTip(!showTip)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-amber-700 dark:text-amber-300">Подсказка</span>
            </div>
            {showTip ? (
              <ChevronUp className="w-5 h-5 text-amber-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-500" />
            )}
          </button>
          {showTip && (
            <div className="px-4 pb-4 text-sm text-amber-700 dark:text-amber-300">
              {step.tip}
            </div>
          )}
        </div>
      )}

      {/* Troubleshoot section (collapsible) */}
      {step.troubleshoot && step.troubleshoot.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-700 dark:text-red-300">Что-то не так?</span>
            </div>
            {showTroubleshoot ? (
              <ChevronUp className="w-5 h-5 text-red-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-red-500" />
            )}
          </button>
          {showTroubleshoot && (
            <div className="px-4 pb-4 space-y-2">
              {step.troubleshoot.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                    [{item.problem}]
                  </span>
                  <span className="text-red-700 dark:text-red-300">→ {item.solution}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CookingStep;
