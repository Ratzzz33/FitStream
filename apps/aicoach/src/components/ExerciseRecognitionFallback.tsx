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
  const isTimeBasedExercise = exercise === 'PLANK' || exercise === 'WALL_SIT';

  const handleOpenInApp = async () => {
    setTryingDeepLink(true);
    const deepLinkPath = `workout/${exercise.toLowerCase()}`;
    const opened = await platformService.tryOpenNativeApp(deepLinkPath);
    if (!opened) {
      window.open(info.isIOS ? 'https://apps.apple.com/app/fitstream' : 'https://play.google.com/store/apps/details?id=com.fitstream', '_blank');
    }
    setTryingDeepLink(false);
  };

  const handleOpenInBrowser = () => {
    const url = platformService.getOpenInBrowserUrl();
    window.open(url, '_blank');
  };

  const handleManualSubmit = () => {
    onManualEntry(manualReps, 80);
  };

  if (showManualEntry) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <button onClick={() => setShowManualEntry(false)} className="text-gray-400 hover:text-white">Назад</button>
          <h2 className="text-white font-medium">{exerciseName}</h2>
          <div className="w-16" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-gray-400 mb-8 text-center">
            {isTimeBasedExercise ? 'Сколько секунд вы удерживали позицию?' : 'Сколько повторений вы сделали?'}
          </p>
          <div className="flex items-center gap-6 mb-8">
            <button onClick={() => setManualReps(prev => Math.max(1, prev - 1))} className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors active:scale-95">
              <Minus className="w-8 h-8" />
            </button>
            <div className="text-center min-w-[120px]">
              <span className="text-6xl font-bold text-white tabular-nums">{manualReps}</span>
              <p className="text-gray-500 mt-2">{isTimeBasedExercise ? 'секунд' : 'повторений'}</p>
            </div>
            <button onClick={() => setManualReps(prev => prev + 1)} className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors active:scale-95">
              <Plus className="w-8 h-8" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {(isTimeBasedExercise ? [30, 45, 60, 90, 120] : [5, 10, 15, 20, 25, 30]).map(value => (
              <button key={value} onClick={() => setManualReps(value)} className={`px-4 py-2 rounded-full text-sm transition-colors ${manualReps === value ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                {value}
              </button>
            ))}
          </div>
          <button onClick={handleManualSubmit} className="w-full max-w-xs bg-green-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-500 transition-colors active:scale-[0.98]">
            <Check className="w-5 h-5" />Сохранить результат
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <button onClick={onCancel} className="text-gray-400 hover:text-white">Отмена</button>
        <h2 className="text-white font-medium">{exerciseName}</h2>
        <div className="w-16" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6 flex-shrink-0">
          {info.isTelegramMiniApp || info.isInAppBrowser ? <AlertTriangle className="w-12 h-12 text-yellow-500" /> : <Camera className="w-12 h-12 text-yellow-500" />}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 text-center">{reason.title}</h3>
        <p className="text-gray-400 text-center mb-2 max-w-sm">{reason.message}</p>
        <p className="text-gray-500 text-sm text-center mb-8 max-w-sm">{reason.action}</p>
        <div className="w-full max-w-sm space-y-3">
          <button onClick={handleOpenInApp} disabled={tryingDeepLink} className="w-full bg-green-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-green-500 transition-colors disabled:opacity-50 active:scale-[0.98]">
            <ArrowUpRight className="w-5 h-5" />Открыть в приложении FitStream
          </button>
          {info.isInAppBrowser && (
            <button onClick={handleOpenInBrowser} className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-blue-500 transition-colors active:scale-[0.98]">
              <Globe className="w-5 h-5" />Открыть в браузере
            </button>
          )}
          <button onClick={() => setShowManualEntry(true)} className="w-full bg-gray-800 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-gray-700 transition-colors active:scale-[0.98]">
            <Plus className="w-5 h-5" />Добавить результат вручную
          </button>
          <button onClick={onCancel} className="w-full text-gray-500 py-3 text-sm hover:text-gray-400 transition-colors">Отмена</button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseRecognitionFallback;
