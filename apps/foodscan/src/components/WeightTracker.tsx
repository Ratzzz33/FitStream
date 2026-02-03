import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Smartphone, CheckCircle, AlertCircle, X, RefreshCw, PenTool, WifiOff, CloudOff, Image, Bluetooth } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { scanScaleDisplay } from '../services/geminiService';
import { WeightLog, UserSettings } from '@fitstream/shared';
import { t } from '@fitstream/shared';
import SmartScale from './SmartScale';
import { BodyCompositionCharts } from './BodyCompositionCharts';

interface WeightTrackerProps {
  onWeightLogged?: (log: WeightLog) => void;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({ onWeightLogged }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<{raw: number, net: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const settings = StorageService.getSettings();

  // Offline states
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Manual entry states
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualWeight, setManualWeight] = useState('');

  // Smart scale states
  const [inputMode, setInputMode] = useState<'camera' | 'smart_scale'>('camera');

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startCamera = async () => {
    setLastSaved(null);
    setError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 2560 }, height: { ideal: 1440 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error(e);
      setIsCameraOpen(false);
      setError(t('cameraDenied'));
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);

    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.95).split(',')[1];

    const stream = videoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);

    if (!navigator.onLine) {
      setError(t('offlineMode') || 'Offline - cannot analyze');
      return;
    }

    setLoading(true);
    try {
      const result = await scanScaleDisplay(base64);
      setLoading(false);
      if (result.weight) {
        const phoneWeight = settings.phoneWeight || 0;
        const netWeight = Math.max(0, result.weight - phoneWeight);
        const log: WeightLog = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          timestamp: Date.now(),
          weight: Number(netWeight.toFixed(1))
        };
        StorageService.saveWeight(log);
        setLastSaved({ raw: result.weight, net: Number(netWeight.toFixed(1)) });
      } else {
        setError(t('scanError'));
      }
    } catch (e) {
      setLoading(false);
      setError(t('scanError'));
    }
  };

  const saveManualWeight = async () => {
    if (!manualWeight) return;
    const weight = parseFloat(manualWeight);
    if (isNaN(weight) || weight <= 0) return;
    const log: WeightLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      weight: Number(weight.toFixed(1)),
      manualEntry: true
    };
    StorageService.saveWeight(log);
    setLastSaved({ raw: weight, net: weight });
    setShowManualEntry(false);
    setManualWeight('');
  };

  const handleSmartScaleWeight = (log: WeightLog) => {
    setLastSaved({ raw: log.weight, net: log.weight });
    onWeightLogged?.(log);
  };

  return (
    <div className="p-4 space-y-6 pb-4">
       {!isOnline && (
         <div className="rounded-xl p-3 flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
           <WifiOff size={16} className="text-yellow-600 dark:text-yellow-400" />
           <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">{t('offlineMode') || 'Offline Mode'}</span>
         </div>
       )}

       <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
               <Smartphone size={20} className="text-purple-500"/>
               {t('deviceProfile')}
           </h2>
           <div className="flex justify-between items-center mb-2">
               <p className="text-gray-500 dark:text-gray-400 text-sm">{t('registeredDevice')}</p>
               {settings.phoneModel && <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded font-bold">-{settings.phoneWeight}{t('unitKg')}</span>}
           </div>
           <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-purple-600 dark:text-purple-200 font-mono text-sm border border-purple-200 dark:border-purple-500/30">
               {settings.phoneModel || "Unknown Model"}
           </div>
           <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('calibrationInfo')}</p>
       </div>

       {/* Body Composition Trends */}
       <BodyCompositionCharts weights={StorageService.getWeights()} isPro={settings.isPro} />

       {/* Camera/AI Scan Section */}
       <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('logWeight')}</h2>

          <div className="flex flex-col gap-4">
              {isCameraOpen ? (
                  <div
                      className="relative rounded-xl overflow-hidden aspect-video bg-black shadow-inner"
                      onClick={async (e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          setFocusPoint({ x, y });
                          if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
                          focusTimeoutRef.current = setTimeout(() => setFocusPoint(null), 1500);
                      }}
                  >
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      <canvas ref={canvasRef} className="hidden" />
                      {focusPoint && (
                          <div className="absolute w-16 h-16 border-2 border-yellow-400 rounded-lg pointer-events-none animate-pulse" style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%`, transform: 'translate(-50%, -50%)' }} />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-64 h-32 border-2 border-white/50 rounded-lg"></div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-auto">
                          <button onClick={captureAndScan} disabled={loading} className="bg-white text-black p-4 rounded-full shadow-lg hover:bg-gray-200 transition transform active:scale-95">
                             {loading ? <Loader2 className="animate-spin"/> : <Camera size={24} />}
                          </button>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-3">
                    <button onClick={startCamera} className="flex flex-col items-center justify-center gap-3 w-full py-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-gray-400 dark:text-gray-300 group">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-110 transition">
                          <Camera size={32} className="text-blue-500" />
                        </div>
                        <span className="font-medium">{t('scanScale')}</span>
                    </button>
                    <button onClick={() => setShowManualEntry(true)} className="flex items-center justify-center gap-2 w-full py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                      <PenTool size={14} /> {t('manualEntry') || 'Manual Entry'}
                    </button>
                  </div>
              )}

              {lastSaved !== null && !isCameraOpen && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                       <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800 mb-3">
                           <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-300" />
                       </div>
                       <p className="text-emerald-800 dark:text-emerald-200 font-bold text-lg">{t('weightSaved')}</p>
                       <div className="flex flex-col items-center mt-2">
                           {settings.phoneModel && <div className="text-xs text-gray-500 line-through mb-1">{lastSaved.raw} {t('unitKg')}</div>}
                           <p className="text-4xl font-mono font-bold text-gray-900 dark:text-white">{lastSaved.net} <span className="text-lg text-gray-500 font-normal">{t('unitKg')}</span></p>
                           {settings.phoneModel && <p className="text-[10px] text-gray-400 mt-1">{t('phoneDeduction')}: -{settings.phoneWeight}{t('unitKg')}</p>}
                       </div>
                       <button onClick={() => setLastSaved(null)} className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 w-full">
                         <RefreshCw size={14} /> {t('scanScale')}
                       </button>
                  </div>
              )}
          </div>
       </div>

       {/* Error Modal */}
       {error && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-gray-200 dark:border-gray-800">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Oops!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
              <button onClick={() => setError(null)} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition">{t('dismiss')}</button>
           </div>
         </div>
       )}

       {/* Manual Entry Modal */}
       {showManualEntry && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl">
             <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
               <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><PenTool size={16} /> {t('manualEntry') || 'Manual Entry'}</h3>
               <button onClick={() => { setShowManualEntry(false); setManualWeight(''); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={20} /></button>
             </div>
             <div className="p-4 space-y-4">
               <div>
                 <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('weight') || 'Weight'} ({t('unitKg')})</label>
                 <input type="number" step="0.1" value={manualWeight} onChange={(e) => setManualWeight(e.target.value)} placeholder="70.5" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-lg font-mono outline-none focus:border-blue-500 text-center" autoFocus />
               </div>
               <button onClick={saveManualWeight} disabled={!manualWeight} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition">{t('save') || 'Save'}</button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};
