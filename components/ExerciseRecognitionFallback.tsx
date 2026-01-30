import React, { useState } from 'react';
import { Camera, Download, Smartphone, Plus, Minus, Check, AlertTriangle, ExternalLink, ArrowUpRight, Globe } from 'lucide-react';
import { platformService } from '../services/platformService';
import { TrackableExercise, getExerciseNameRu } from '../services/poseTracker';

interface ExerciseRecognitionFallbackProps {
  exercise: TrackableExercise;
  targetReps?: number;
  targetSeconds?: number;
  onManualEntry: (reps: number, formScore: number) => void;
  onCancel: () => void;
}

export const ExerciseRecognitionFallback: React.FC<ExerciseRecognitionFallbackProps> = ({
  exercise,
  targetReps = 10,
  targetSeconds = 60,
  onManualEntry,
  onCancel
}) => {
  const [manualReps, setManualReps] = useState(targetReps);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [tryingDeepLink, setTryingDeepLink] = useState(false);

  const info = platformService.getInfo();
  const reason = platformService.getExerciseRecognitionUnavailableReason();
  const exerciseName = getExerciseNameRu(exercise);
  const isTimeBased = exercise === 'PLANK' || exercise === 'WALL_SIT';

  const appStoreUrl = 'https://apps.apple.com/app/fitstream'; // Replace with actual URL
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.fitstream'; // Replace with actual URL

  const handleDownloadApp = () => {
    const url = info.isIOS ? appStoreUrl : playStoreUrl;
    window.open(url, '_blank');
  };

  const handleOpenInApp = async () => {
    setTryingDeepLink(true);
    // Try to open native app with deep link to this exercise
    const deepLinkPath = `workout/${exercise.toLowerCase()}`;
    const opened = await platformService.tryOpenNativeApp(deepLinkPath);

    if (!opened) {
      // App not installed, show download prompt
      handleDownloadApp();
    }
    setTryingDeepLink(false);
  };

  const handleOpenInBrowser = () => {
    const url = platformService.getOpenInBrowserUrl();
    window.open(url, '_blank');
  };

  const handleManualSubmit = () => {
    // For manual entry, we give a default form score of 80%
    onManualEntry(manualReps, 80);
  };

  const incrementReps = () => setManualReps(prev => prev + 1);
  const decrementReps = () => setManualReps(prev => Math.max(1, prev - 1));

  // Get appropriate icon based on browser type
  const getWarningIcon = () => {
    if (info.isTelegramMiniApp || info.isInAppBrowser) {
      return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
    }
    return <Camera className="w-12 h-12 text-yellow-500" />;
  };

  if (showManualEntry) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <button
            onClick={() => setShowManualEntry(false)}
            className="text-gray-400 hover:text-white"
          >
            Назад
          </button>
          <h2 className="text-white font-medium">{exerciseName}</h2>
          <div className="w-16" />
        </div>

        {/* Manual Entry Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-gray-400 mb-8 text-center">
            {isTimeBased
              ? 'Сколько секунд вы удерживали позицию?'
              : 'Сколько повторений вы сделали?'
            }
          </p>

          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={decrementReps}
              className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors active:scale-95"
            >
              <Minus className="w-8 h-8" />
            </button>

            <div className="text-center min-w-[120px]">
              <span className="text-6xl font-bold text-white tabular-nums">{manualReps}</span>
              <p className="text-gray-500 mt-2">
                {isTimeBased ? 'секунд' : 'повторений'}
              </p>
            </div>

            <button
              onClick={incrementReps}
              className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors active:scale-95"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          {/* Quick select buttons */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {(isTimeBased ? [30, 45, 60, 90, 120] : [5, 10, 15, 20, 25, 30]).map(value => (
              <button
                key={value}
                onClick={() => setManualReps(value)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  manualReps === value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualSubmit}
            className="w-full max-w-xs bg-green-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-500 transition-colors active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            Сохранить результат
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white"
        >
          Отмена
        </button>
        <h2 className="text-white font-medium">{exerciseName}</h2>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6 flex-shrink-0">
          {getWarningIcon()}
        </div>

        {/* Title and message */}
        <h3 className="text-xl font-bold text-white mb-3 text-center">
          {reason.title}
        </h3>
        <p className="text-gray-400 text-center mb-2 max-w-sm">
          {reason.message}
        </p>
        <p className="text-gray-500 text-sm text-center mb-8 max-w-sm">
          {reason.action}
        </p>

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-3">
          {/* Try to open in native app (deep link) */}
          <button
            onClick={handleOpenInApp}
            disabled={tryingDeepLink}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-green-500 transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {tryingDeepLink ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Открываем...
              </>
            ) : (
              <>
                <ArrowUpRight className="w-5 h-5" />
                Открыть в приложении FitStream
              </>
            )}
          </button>

          {/* Open in browser - only for in-app browsers */}
          {info.isInAppBrowser && (
            <button
              onClick={handleOpenInBrowser}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-blue-500 transition-colors active:scale-[0.98]"
            >
              <Globe className="w-5 h-5" />
              Открыть в браузере
            </button>
          )}

          {/* Download app button */}
          <button
            onClick={handleDownloadApp}
            className="w-full bg-gray-800 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-gray-700 transition-colors active:scale-[0.98]"
          >
            {info.isIOS ? (
              <>
                <Download className="w-5 h-5" />
                Скачать в App Store
              </>
            ) : (
              <>
                <Smartphone className="w-5 h-5" />
                Скачать в Google Play
              </>
            )}
            <ExternalLink className="w-4 h-4 opacity-60" />
          </button>

          {/* Manual entry button */}
          <button
            onClick={() => setShowManualEntry(true)}
            className="w-full bg-gray-800 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-gray-700 transition-colors active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Добавить результат вручную
          </button>

          {/* Cancel button */}
          <button
            onClick={onCancel}
            className="w-full text-gray-500 py-3 text-sm hover:text-gray-400 transition-colors"
          >
            Отмена
          </button>
        </div>

        {/* In-app browser tip */}
        {(info.isTelegramMiniApp || info.isInAppBrowser) && (
          <div className="mt-8 p-4 bg-gray-900 rounded-xl max-w-sm flex-shrink-0">
            <p className="text-gray-400 text-sm text-center">
              <span className="text-blue-400">Совет:</span> В нативном приложении доступно автоматическое
              распознавание упражнений с подсчётом повторений и оценкой техники в реальном времени.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseRecognitionFallback;
