

import React, { useState, useRef } from 'react';
import { Camera, Loader2, Smartphone, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { scanScaleDisplay } from '../services/geminiService';
import { WeightLog } from '../types';
import { t } from '../services/i18n';

export const WeightTracker: React.FC = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<{raw: number, net: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = StorageService.getSettings();

  const startCamera = async () => {
    setLastSaved(null);
    setError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
    
    setLoading(true);
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    
    const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
    
    const stream = videoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);

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
  };

  return (
    <div className="p-4 space-y-6 pb-24">
       <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
               <Smartphone size={20} className="text-purple-500"/>
               {t('deviceProfile')}
           </h2>
           <div className="flex justify-between items-center mb-2">
               <p className="text-gray-500 dark:text-gray-400 text-sm">{t('registeredDevice')}</p>
               {settings.phoneModel && <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded font-bold">-{settings.phoneWeight}kg</span>}
           </div>
           
           <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-purple-600 dark:text-purple-200 font-mono text-sm border border-purple-200 dark:border-purple-500/30">
               {settings.phoneModel || "Unknown Model"}
           </div>
           <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
               {t('calibrationInfo')}
           </p>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('logWeight')}</h2>
          
          <div className="flex flex-col gap-4">
              {isCameraOpen ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black shadow-inner">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-64 h-32 border-2 border-white/50 rounded-lg"></div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-auto">
                          <button 
                            onClick={captureAndScan}
                            disabled={loading}
                            className="bg-white text-black p-4 rounded-full shadow-lg hover:bg-gray-200 transition transform active:scale-95"
                          >
                             {loading ? <Loader2 className="animate-spin"/> : <Camera size={24} />}
                          </button>
                      </div>
                  </div>
              ) : (
                  <button 
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center gap-3 w-full py-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-gray-400 dark:text-gray-300 group"
                  >
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-110 transition">
                        <Camera size={32} className="text-blue-500" />
                      </div>
                      <span className="font-medium">{t('scanScale')}</span>
                  </button>
              )}

              {/* Success Result Display */}
              {lastSaved !== null && !isCameraOpen && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                       <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800 mb-3">
                           <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-300" />
                       </div>
                       <p className="text-emerald-800 dark:text-emerald-200 font-bold text-lg">{t('weightSaved')}</p>
                       
                       <div className="flex flex-col items-center mt-2">
                           {settings.phoneModel && (
                               <div className="text-xs text-gray-500 line-through mb-1">
                                   {lastSaved.raw} kg
                               </div>
                           )}
                           <p className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
                               {lastSaved.net} <span className="text-lg text-gray-500 font-normal">kg</span>
                           </p>
                           {settings.phoneModel && (
                               <p className="text-[10px] text-gray-400 mt-1">
                                   {t('phoneDeduction')}: -{settings.phoneWeight}kg
                               </p>
                           )}
                       </div>

                       <button 
                         onClick={() => setLastSaved(null)}
                         className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 w-full"
                       >
                         <RefreshCw size={14} /> {t('scanScale')}
                       </button>
                  </div>
              )}
          </div>
       </div>

       {/* Error Modal */}
       {error && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-gray-200 dark:border-gray-800 transform transition-all scale-100">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Oops!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition"
              >
                {t('dismiss')}
              </button>
           </div>
         </div>
       )}
    </div>
  );
};