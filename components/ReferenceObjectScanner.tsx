
import React, { useState, useRef } from 'react';
import { Camera, X, Check, RotateCcw, Loader2, Ruler } from 'lucide-react';
import { t } from '../services/i18n';
import { identifyReferenceObject } from '../services/geminiService';
import { StorageService } from '../services/storageService';

interface ReferenceObjectScannerProps {
  onClose: () => void;
  onSave: (name: string, dimensions: string) => void;
}

export const ReferenceObjectScanner: React.FC<ReferenceObjectScannerProps> = ({ onClose, onSave }) => {
  const [isCapturing, setIsCapturing] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ name: string, dimensions: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const settings = StorageService.getSettings();
  const isDark = settings.theme === 'dark';

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error(e);
      alert(t('cameraDenied'));
      onClose();
    }
  };

  React.useEffect(() => {
    if (isCapturing) {
        startCamera();
    }
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
    };
  }, [isCapturing]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setAnalyzing(true);
    setIsCapturing(false);
    
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    
    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.95).split(',')[1];
    
    // Stop stream
    const stream = videoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach(t => t.stop());

    try {
        const data = await identifyReferenceObject(base64);
        setResult(data);
    } catch (e) {
        alert(t('scanError'));
        setIsCapturing(true); // Restart
    } finally {
        setAnalyzing(false);
    }
  };

  const handleRetake = () => {
      setResult(null);
      setIsCapturing(true);
  };

  return (
    <div className="fixed inset-0 bg-black z-[70] flex flex-col items-center justify-center">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <h3 className="text-white font-bold">{t('scanRefObject')}</h3>
            <button onClick={onClose} className="bg-white/20 p-2 rounded-full text-white backdrop-blur">
                <X size={20} />
            </button>
        </div>

        {/* Camera View */}
        {isCapturing ? (
            <div className="relative w-full h-full bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Guidelines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-white/50 border-dashed rounded-xl flex items-center justify-center">
                        <span className="text-white/70 text-xs bg-black/40 px-2 py-1 rounded backdrop-blur">
                            {t('placeRefObjectCenter')}
                        </span>
                    </div>
                </div>

                <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-auto">
                    <button 
                        onClick={captureAndAnalyze}
                        className="bg-white text-black p-5 rounded-full shadow-lg hover:bg-gray-200 transition transform active:scale-95"
                    >
                        <Camera size={28} />
                    </button>
                </div>
            </div>
        ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                {analyzing ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={48} className="text-blue-500 animate-spin" />
                        <p className={`font-medium animate-pulse ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('analyzingObject')}</p>
                    </div>
                ) : result ? (
                    <div className={`rounded-2xl p-8 border max-w-sm w-full animate-in zoom-in duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ruler size={32} className="text-green-500" />
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{result.name}</h2>
                        <div className={`rounded-lg p-3 mb-6 inline-block ${isDark ? 'bg-black/30' : 'bg-gray-100'}`}>
                             <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('dimensions')}</p>
                             <p className="text-blue-500 font-mono text-lg">{result.dimensions}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleRetake}
                                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                            >
                                <RotateCcw size={18} /> {t('retake')}
                            </button>
                            <button
                                onClick={() => onSave(result.name, result.dimensions)}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> {t('useThis')}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        )}
    </div>
  );
};
