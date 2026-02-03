import React, { useState } from 'react';
import { Clock, Flame, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface StepData {
  order: number;
  instruction: string;
  timerSeconds?: number;
  heatLevel?: 1 | 2 | 3;
  tip?: string;
  technique?: string;
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

export type TimerState = 'idle' | 'running' | 'completed';

interface CookingStepProps {
  step: StepData;
  stepNumber: number;
  imageUrl?: string;
  timerSeconds: number;
  timerState: TimerState;
  onStartTimer: () => void;
  isCompleted: boolean;
}

export const CookingStep: React.FC<CookingStepProps> = ({
  step,
  stepNumber,
  imageUrl,
  timerSeconds,
  timerState,
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
      case 1: return 'Low heat';
      case 2: return 'Medium heat';
      case 3: return 'High heat';
      default: return null;
    }
  };

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
      {imageUrl && (
        <div className="rounded-xl overflow-hidden mb-4 bg-gray-200 dark:bg-gray-700">
          <img
            src={imageUrl}
            alt={`Step ${stepNumber}`}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full text-xl">
            🍳
          </div>
          <div className="flex-1">
            <h3 className="font-semibold dark:text-white text-lg leading-tight">
              {step.instruction}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {step.heatLevel && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex">{getHeatIcons(step.heatLevel)}</div>
              <span className="text-sm text-orange-700 dark:text-orange-300 ml-1">
                {getHeatLabel(step.heatLevel)}
              </span>
            </div>
          )}

          {step.timerSeconds && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {Math.floor(step.timerSeconds / 60)} min
              </span>
            </div>
          )}

          {reminderIcons.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              title={r.message}
            >
              <span>{r.icon}</span>
              {r.interval && (
                <span className="text-xs text-purple-700 dark:text-purple-300">
                  every {Math.floor(r.interval / 60)}m
                </span>
              )}
            </div>
          ))}
        </div>

        {step.doneWhen && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
            <span className="text-lg">✅</span>
            <div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">Done when:</div>
              <div className="text-sm text-green-600 dark:text-green-400">{step.doneWhen}</div>
            </div>
          </div>
        )}

        {step.timerSeconds && (
          <div className="mb-4">
            {timerState === 'running' ? (
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000"
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-mono font-bold dark:text-white">
                    {formatTime(timerSeconds)}
                  </span>
                </div>
              </div>
            ) : timerState === 'completed' ? (
              <div className="text-center py-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="text-green-700 dark:text-green-300 font-medium">
                  ✅ Timer done!
                </span>
              </div>
            ) : (
              <button
                onClick={onStartTimer}
                className="w-full py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Start timer ({Math.floor(step.timerSeconds / 60)} min)
              </button>
            )}
          </div>
        )}

        {step.technique && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
            <span className="text-lg">🔪</span>
            <div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Technique:</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">{step.technique}</div>
            </div>
          </div>
        )}
      </div>

      {step.tip && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-4 overflow-hidden">
          <button
            onClick={() => setShowTip(!showTip)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-amber-700 dark:text-amber-300">Tip</span>
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

      {step.troubleshoot && step.troubleshoot.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🆘</span>
              <span className="font-medium text-red-700 dark:text-red-300">Help</span>
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
                  <span className="text-red-700 dark:text-red-300">{item.solution}</span>
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
