// MenuScanner - Camera + menu analysis workflow component

import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, X, RotateCcw, ImagePlus, SwitchCamera, Zap, AlertCircle } from 'lucide-react';
import { useTheme } from '@fitstream/shared';
import { analyzeMenuWithCache, detectPhotoType } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { MenuResults } from './MenuResults';
import type {
  MenuRecommendation,
  MenuItemAnalysis,
  MenuAnalysisResult,
  PhotoContentType,
  NutritionLog,
  GeoLocation,
  MenuScanEntry,
} from '../types';

type ScanState = 'IDLE' | 'CAMERA' | 'DETECTING' | 'ANALYZING' | 'RESULTS' | 'ERROR';

interface MenuScannerProps {
  onMealLogged?: (log: NutritionLog) => void;
}

export function MenuScanner({ onMealLogged }: MenuScannerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [state, setState] = useState<ScanState>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Results
  const [analysisResult, setAnalysisResult] = useState<MenuAnalysisResult | null>(null);

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Geolocation
  const [location, setLocation] = useState<GeoLocation | null>(null);

  const startCamera = useCallback(async () => {
    setState('CAMERA');
    setErrorMsg(null);

    // Try to get location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setState('ERROR');
      setErrorMsg('Could not access camera. Please check permissions.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(base64);
    stopCamera();
    analyzePhoto(base64);
  }, [stopCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCapturedPhoto(base64);
      analyzePhoto(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzePhoto = async (base64: string) => {
    setState('DETECTING');
    setErrorMsg(null);

    try {
      // First detect what type of photo this is
      const detection = await detectPhotoType(base64);

      if (detection.type === 'MENU' || detection.type === 'QR_MENU') {
        // It's a menu - analyze it
        setState('ANALYZING');
        const result = await analyzeMenuWithCache(base64, {
          location: location || undefined,
        });
        setAnalysisResult(result);

        // Save to history
        const entry: MenuScanEntry = {
          id: `scan_${Date.now()}`,
          restaurantName: result.restaurantName || 'Unknown Restaurant',
          scannedAt: new Date().toISOString(),
          recommendations: result.recommendations,
          allItems: result.allItems,
          location: location || undefined,
          fromCache: result.fromCache,
        };
        StorageService.saveMenuScan(entry);

        setState('RESULTS');
      } else if (detection.type === 'FOOD') {
        setErrorMsg('This looks like a food photo, not a menu. MenuScan is designed for restaurant menus. Take a photo of the menu instead.');
        setState('ERROR');
      } else {
        setErrorMsg('Could not detect a menu in this photo. Please take a clear photo of a restaurant menu.');
        setState('ERROR');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err.message === 'INSUFFICIENT_BALANCE') {
        setErrorMsg('Insufficient balance for menu scan. Please top up your account.');
      } else if (err.message?.includes('API Key')) {
        setErrorMsg('API key not configured. Please add your Gemini API key.');
      } else {
        setErrorMsg('Failed to analyze the menu. Please try again.');
      }
      setState('ERROR');
    }
  };

  const handleLogMeal = (item: MenuRecommendation | MenuItemAnalysis) => {
    const name = 'dishName' in item ? item.dishName : item.name;
    const log: NutritionLog = {
      id: `menu_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      type: 'FOOD',
      name: name,
      calories: item.calories,
      protein: item.protein,
      carbs: ('carbs' in item ? item.carbs : undefined) || 0,
      fat: ('fat' in item ? item.fat : undefined) || 0,
      manualEntry: false,
    };
    StorageService.saveNutrition(log);
    onMealLogged?.(log);
  };

  const reset = () => {
    stopCamera();
    setState('IDLE');
    setCapturedPhoto(null);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startCamera(), 100);
  };

  // -- Render --

  // Results view
  if (state === 'RESULTS' && analysisResult) {
    return (
      <div className="space-y-4">
        <MenuResults
          recommendations={analysisResult.recommendations}
          allItems={analysisResult.allItems}
          restaurantName={analysisResult.restaurantName}
          fromCache={analysisResult.fromCache}
          onLogMeal={handleLogMeal}
          onClose={reset}
        />
      </div>
    );
  }

  // Camera view
  if (state === 'CAMERA') {
    return (
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[3/4] object-cover rounded-2xl bg-black"
        />
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6">
          <button
            onClick={reset}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>
          <button
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full bg-white border-4 border-rose-400 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-rose-400" />
          </button>
          <button
            onClick={switchCamera}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
          >
            <SwitchCamera size={20} />
          </button>
        </div>
        {/* Guide overlay */}
        <div className="absolute top-4 inset-x-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-white text-sm">
            <Camera size={14} />
            Point at restaurant menu
          </div>
        </div>
      </div>
    );
  }

  // Analyzing / Detecting state
  if (state === 'DETECTING' || state === 'ANALYZING') {
    return (
      <div className="space-y-4">
        {capturedPhoto && (
          <img src={capturedPhoto} alt="Captured menu" className="w-full aspect-[4/3] object-cover rounded-2xl opacity-50" />
        )}
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 size={32} className="text-rose-400 animate-spin" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {state === 'DETECTING' ? 'Detecting photo type...' : 'Analyzing menu...'}
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'ERROR') {
    return (
      <div className="space-y-4">
        {capturedPhoto && (
          <img src={capturedPhoto} alt="Captured" className="w-full aspect-[4/3] object-cover rounded-2xl opacity-30" />
        )}
        <div className={`rounded-xl p-4 ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{errorMsg}</p>
              <button
                onClick={reset}
                className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-400 hover:text-rose-300"
              >
                <RotateCcw size={14} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Idle state - scan button
  return (
    <div className="space-y-4">
      {/* Main scan button */}
      <button
        onClick={() => startCamera()}
        className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-2 border-dashed border-rose-500/30 flex flex-col items-center justify-center gap-3 hover:from-rose-500/25 hover:to-pink-500/25 transition-all active:scale-[0.98]"
      >
        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
          <Camera size={32} className="text-rose-400" />
        </div>
        <span className="text-lg font-semibold">Scan Menu</span>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Take a photo of a restaurant menu
        </span>
      </button>

      {/* Upload from gallery */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-4 rounded-xl flex items-center gap-3 transition-colors ${
          isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <ImagePlus size={24} className="text-rose-400" />
        <div className="text-left">
          <div className="font-medium">Upload Photo</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Choose menu photo from gallery
          </div>
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Today's nutrition summary */}
      <TodayNutritionCard />
    </div>
  );
}

// Sub-component: today's nutrition from restaurant meals
function TodayNutritionCard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const today = StorageService.getTodayNutritionDetailed();
  const needs = StorageService.calculateDailyNeeds();

  if (today.meals === 0) return null;

  const percentage = Math.min(Math.round((today.calories / needs.calories) * 100), 100);

  return (
    <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
      <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        Today's Intake
      </h3>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span>{today.calories} kcal</span>
            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{needs.calories} goal</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className={`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="font-semibold text-sm text-blue-400">{today.protein}g</div>
          Protein
        </div>
        <div className={`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="font-semibold text-sm text-amber-400">{today.carbs}g</div>
          Carbs
        </div>
        <div className={`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="font-semibold text-sm text-red-400">{today.fat}g</div>
          Fat
        </div>
      </div>
    </div>
  );
}
