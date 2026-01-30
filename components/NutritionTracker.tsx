

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Droplets, Utensils, X, CheckCircle, Loader2, AlertCircle, GlassWater, Milk, Coffee, Lock, PenTool, Scan, FileText, ChevronRight, AlertTriangle, Wand2, WifiOff, CloudOff, Image, ChefHat, Package, Wallet, ArrowLeft, Wrench, RefreshCw, Hand, CreditCard, Flame } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { analyzeFood, analyzeMenu, calculateNutritionFromText, MenuRecommendation, FoodAnalysisResult } from '../services/geminiService';
import { NutritionLog } from '../types';
import { t } from '../services/i18n';
import { AchievementRing } from './AchievementRings';
import { syncQueue } from '../services/syncQueue';
import { offlineStorage } from '../services/offlineStorage';
import { Kitchen } from './Kitchen';
import { Cooking } from './Cooking';
import { FoodFinance } from './Finance';

interface NutritionTrackerProps {
  onRequestPro: () => void;
}

type ScanMode = 'IDLE' | 'CAMERA_FOOD' | 'CAMERA_MENU' | 'ANALYZING' | 'RESULT_FOOD' | 'RESULT_MENU' | 'OFFLINE_PHOTO';
type ToolSheet = 'kitchen' | 'recipes' | 'finance' | null;

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({ onRequestPro }) => {
    const [needsUpdate, setNeedsUpdate] = useState(0);
    const [mode, setMode] = useState<ScanMode>('IDLE');
    const [activeToolSheet, setActiveToolSheet] = useState<ToolSheet>(null);

    // Result States
    const [scannedFood, setScannedFood] = useState<NutritionLog | null>(null);
    const [scannedFoodCost, setScannedFoodCost] = useState<FoodAnalysisWithCost | null>(null);
    const [menuRecommendations, setMenuRecommendations] = useState<MenuRecommendation[]>([]);

    // Offline States
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | null>(null);

    // UI Logic
    const [showRefWarning, setShowRefWarning] = useState(false);
    const [showRefNotDetected, setShowRefNotDetected] = useState(false);
    const [pendingFoodResult, setPendingFoodResult] = useState<FoodAnalysisResult | null>(null);
    const [pendingPhotoBase64, setPendingPhotoBase64] = useState<string | null>(null);

    // Alternative reference objects
    const alternativeObjects = [
        { id: 'fork', emoji: '🍴', label: 'alternativeFork', dimensions: '19cm length' },
        { id: 'spoon', emoji: '🥄', label: 'alternativeSpoon', dimensions: '15cm length' },
        { id: 'hand', emoji: '✋', label: 'alternativeHand', dimensions: 'average adult hand' },
        { id: 'card', emoji: '💳', label: 'alternativeCard', dimensions: '85.6mm x 53.98mm' },
        { id: 'coin', emoji: '🪙', label: 'alternativeCoin', dimensions: '25mm diameter' },
        { id: 'lighter', emoji: '🔥', label: 'alternativeLighter', dimensions: '8cm height' },
    ];

    // Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Manual Entry State
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualAmount, setManualAmount] = useState(''); // Weight in grams
    const [manualCals, setManualCals] = useState('');
    const [manualProt, setManualProt] = useState('');
    const [manualCarbs, setManualCarbs] = useState('');
    const [manualFat, setManualFat] = useState('');
    const [isCalculatingManual, setIsCalculatingManual] = useState(false);

    const settings = StorageService.getSettings();
    const dailyNeeds = StorageService.calculateDailyNeeds();
    const todayStats = StorageService.getTodayNutrition();

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

    // Track pending items count
    useEffect(() => {
        const unsubscribe = syncQueue.subscribe((state) => {
            setPendingCount(state.pendingCount);
        });
        return unsubscribe;
    }, []);

    // Check Trial/Pro Status
    const parsedInstallDate = new Date(settings.installDate);
    const installDate = isNaN(parsedInstallDate.getTime()) ? Date.now() : parsedInstallDate.getTime();
    const daysSinceInstall = (Date.now() - installDate) / (1000 * 60 * 60 * 24);
    const isTrialActive = daysSinceInstall < 7;
    const isScannerUnlocked = settings.isPro || isTrialActive;

    const addWater = (amount: number, name: string) => {
        const log: NutritionLog = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            type: 'WATER',
            name: name,
            calories: 0,
            amount: amount
        };
        StorageService.saveNutrition(log);
        setNeedsUpdate(prev => prev + 1);
    };

    // --- Interaction Handlers ---

    const handleScanFoodClick = () => {
        if (!isScannerUnlocked) {
            onRequestPro();
            return;
        }
        if (!settings.referenceObject) {
            setShowRefWarning(true);
        } else {
            startCamera('CAMERA_FOOD');
        }
    };

    const handleScanMenuClick = () => {
        if (!isScannerUnlocked) {
            onRequestPro();
            return;
        }
        startCamera('CAMERA_MENU');
    };

    const confirmRefWarning = () => {
        setShowRefWarning(false);
        startCamera('CAMERA_FOOD');
    };

    const startCamera = async (targetMode: ScanMode) => {
        setMode(targetMode);
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
            setMode('IDLE');
            alert(t('cameraDenied'));
        }
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const currentMode = mode; // Capture before state change

        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context?.drawImage(videoRef.current, 0, 0);

        const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());

        // If offline, save photo and show manual entry with photo
        if (!navigator.onLine) {
            setCapturedPhotoBase64(base64);
            setMode('OFFLINE_PHOTO');
            return;
        }

        setMode('ANALYZING');

        // Save photo for preview in result screen
        setCapturedPhotoBase64(base64);

        try {
            if (currentMode === 'CAMERA_FOOD') {
                const result = await analyzeFood(base64, settings.referenceObject || 'Hand');

                // Check if ANY reference object was detected (only warn if LOW confidence)
                if (settings.referenceObject && !result.referenceDetected && result.confidenceLevel === 'LOW') {
                    // No reference object found at all - show warning
                    setPendingFoodResult(result);
                    setPendingPhotoBase64(base64);
                    setShowRefNotDetected(true);
                    setMode('IDLE');
                    return;
                }

                // Reference detected or not configured - proceed normally
                await saveFoodResult(result, base64);
            } else if (currentMode === 'CAMERA_MENU') {
                const recs = await analyzeMenu(base64);
                setMenuRecommendations(recs);
                setMode('RESULT_MENU');
            }
        } catch (e) {
            // If analysis fails (maybe went offline during), offer manual entry with photo
            setCapturedPhotoBase64(base64);
            setMode('OFFLINE_PHOTO');
        }
    };

    // Helper to save food result
    const saveFoodResult = async (result: FoodAnalysisResult, base64: string) => {
        const foodLog: NutritionLog = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            type: 'FOOD',
            name: result.name,
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat
        };
        // Save photo with the log
        const photoId = await offlineStorage.savePhoto(base64, 'image/jpeg', foodLog.id, 'NUTRITION');
        foodLog.photoId = photoId;
        setScannedFood(foodLog);
        setMode('RESULT_FOOD');
    };

    // Handle "Continue without scale" from ref not detected modal
    const handleContinueWithoutRef = async () => {
        if (pendingFoodResult && pendingPhotoBase64) {
            await saveFoodResult(pendingFoodResult, pendingPhotoBase64);
        }
        setShowRefNotDetected(false);
        setPendingFoodResult(null);
        setPendingPhotoBase64(null);
    };

    // Handle "Retake photo" from ref not detected modal
    const handleRetakePhoto = () => {
        setShowRefNotDetected(false);
        setPendingFoodResult(null);
        setPendingPhotoBase64(null);
        startCamera('CAMERA_FOOD');
    };

    // Handle selecting an alternative object and re-analyze
    const handleUseAlternative = async (altObject: typeof alternativeObjects[0]) => {
        if (!pendingPhotoBase64) return;

        setShowRefNotDetected(false);
        setMode('ANALYZING');

        try {
            const result = await analyzeFood(pendingPhotoBase64, altObject.emoji + ' ' + t(altObject.label as any), altObject.dimensions);
            await saveFoodResult(result, pendingPhotoBase64);
        } catch (e) {
            setCapturedPhotoBase64(pendingPhotoBase64);
            setMode('OFFLINE_PHOTO');
        } finally {
            setPendingFoodResult(null);
            setPendingPhotoBase64(null);
        }
    };

    const saveFood = () => {
        if (scannedFood) {
            StorageService.saveNutrition(scannedFood);
            setScannedFood(null);
            setScannedFoodCost(null);
            setCapturedPhotoBase64(null);
            setMode('IDLE');
            setNeedsUpdate(prev => prev + 1);
        }
    };

    // Retake photo - go back to camera
    const retakePhoto = () => {
        setScannedFood(null);
        setScannedFoodCost(null);
        setCapturedPhotoBase64(null);
        startCamera('CAMERA_FOOD');
    };

    // Edit scanned food - open manual entry with pre-filled data
    const editScannedFood = () => {
        if (scannedFood) {
            setManualName(scannedFood.name);
            setManualCals(scannedFood.calories.toString());
            setManualProt((scannedFood.protein || 0).toString());
            setManualCarbs((scannedFood.carbs || 0).toString());
            setManualFat((scannedFood.fat || 0).toString());
            setManualAmount('');
            setScannedFood(null);
            setScannedFoodCost(null);
            setMode('IDLE');
            setShowManualEntry(true);
        }
    };

    const selectMenuRecommendation = (dish: MenuRecommendation) => {
        setManualName(dish.dishName);
        setManualCals(dish.calories.toString());
        setManualProt(dish.protein.toString());
        // Simple heuristic for others as menu analysis is focused on main macros
        setManualCarbs('0');
        setManualFat('0');

        setMode('IDLE');
        setShowManualEntry(true);
    };

    const handleAiLookup = async () => {
        if (!manualName) return;
        setIsCalculatingManual(true);
        try {
            const result = await calculateNutritionFromText(manualName, manualAmount);
            setManualCals(result.calories.toString());
            setManualProt(result.protein.toString());
            setManualCarbs(result.carbs.toString());
            setManualFat(result.fat.toString());
        } catch (e) {
            console.error(e);
        } finally {
            setIsCalculatingManual(false);
        }
    };

    const saveManualFood = async () => {
        if (!manualName || !manualCals) return;
        const log: NutritionLog = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            type: 'FOOD',
            name: manualName,
            calories: parseInt(manualCals) || 0,
            protein: parseInt(manualProt) || 0,
            carbs: parseInt(manualCarbs) || 0,
            fat: parseInt(manualFat) || 0,
            amount: parseInt(manualAmount) || undefined, // Store weight in amount field
            manualEntry: true
        };

        // If we have a captured photo, save it with the log
        if (capturedPhotoBase64) {
            const photoId = await offlineStorage.savePhoto(capturedPhotoBase64, 'image/jpeg', log.id, 'NUTRITION');
            log.photoId = photoId;
        }

        StorageService.saveNutrition(log);
        setShowManualEntry(false);
        setManualName('');
        setManualAmount('');
        setManualCals('');
        setManualProt('');
        setManualCarbs('');
        setManualFat('');
        setCapturedPhotoBase64(null);
        setNeedsUpdate(prev => prev + 1);
    };

    // Save photo for later AI analysis when online
    const savePhotoForLater = async () => {
        if (!capturedPhotoBase64) return;

        const log: NutritionLog = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            type: 'FOOD',
            name: t('pendingAnalysis') || 'Pending Analysis',
            calories: 0,
            pendingAiAnalysis: true
        };

        // Save to queue for AI analysis when online
        await syncQueue.queueNutritionLog(log, capturedPhotoBase64, true);

        setCapturedPhotoBase64(null);
        setMode('IDLE');
        setNeedsUpdate(prev => prev + 1);
    };

    // Open manual entry with captured photo
    const openManualWithPhoto = () => {
        setMode('IDLE');
        setShowManualEntry(true);
    };

    // Handle calories logged from cooking
    const handleCaloriesLogged = (calories: number) => {
        setNeedsUpdate(prev => prev + 1);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Top Summary - Always visible */}
            <div className="p-4 pb-2">
                {/* Offline / Pending Sync Indicator */}
                {(!isOnline || pendingCount > 0) && (
                    <div className={`rounded-xl p-3 flex items-center justify-between mb-4 ${
                        !isOnline
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                    }`}>
                        <div className="flex items-center gap-2">
                            {!isOnline ? (
                                <>
                                    <WifiOff size={16} className="text-yellow-600 dark:text-yellow-400" />
                                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                        {t('offlineMode') || 'Offline Mode'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Loader2 size={16} className="text-blue-600 dark:text-blue-400 animate-spin" />
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        {t('syncing') || 'Syncing...'}
                                    </span>
                                </>
                            )}
                        </div>
                        {pendingCount > 0 && (
                            <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-full font-bold text-gray-600 dark:text-gray-300">
                                {pendingCount} {t('pending') || 'pending'}
                            </span>
                        )}
                    </div>
                )}

                {/* Calories Progress Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('calories')}</span>
                        <span className="text-sm font-medium dark:text-white">
                            {todayStats.calories} / {dailyNeeds.calories} {t('unitKcal')}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                todayStats.calories > dailyNeeds.calories
                                    ? 'bg-red-500'
                                    : todayStats.calories > dailyNeeds.calories * 0.8
                                        ? 'bg-amber-500'
                                        : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (todayStats.calories / dailyNeeds.calories) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content - Diary */}
            <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-6 pb-24">
                        {/* Top Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-around">
                <div className="flex flex-col items-center">
                    <AchievementRing
                        radius={50}
                        stroke={8}
                        progress={todayStats.calories}
                        total={dailyNeeds.calories}
                        color="#f59e0b" // Amber for Cals
                        label={t('calories')}
                    />
                    <span className="text-xs text-gray-500 mt-2">{todayStats.calories} / {dailyNeeds.calories}</span>
                </div>
                <div className="h-20 w-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex flex-col items-center">
                    <AchievementRing
                        radius={50}
                        stroke={8}
                        progress={todayStats.water}
                        total={dailyNeeds.water}
                        color="#3b82f6" // Blue for Water
                        label={t('water')}
                    />
                    <span className="text-xs text-gray-500 mt-2">{todayStats.water}{t('unitMl')} / {dailyNeeds.water}{t('unitMl')}</span>
                </div>
            </div>

            {/* Water Tracker */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Droplets size={20} className="text-blue-500" />
                            {t('water')}
                        </h3>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{t('waterGoal')}: {dailyNeeds.water}{t('unitMl')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => addWater(150, 'Glass')} className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition active:scale-95 shadow-sm group">
                        <GlassWater size={20} className="text-blue-400" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('glass')}</span>
                    </button>
                    <button onClick={() => addWater(200, 'Cup')} className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition active:scale-95 shadow-sm group">
                        <Coffee size={24} className="text-blue-500" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('cup')}</span>
                    </button>
                    <button onClick={() => addWater(500, 'Bottle')} className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition active:scale-95 shadow-sm group">
                        <Milk size={24} className="text-blue-600" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('bottle')}</span>
                    </button>
                </div>
            </div>

            {/* Food Tracker Logic Switch */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Utensils size={20} className="text-orange-500" />
                    {t('nutritionTracker')}
                </h3>

                {/* --- 1. IDLE STATE: Dual Buttons --- */}
                {mode === 'IDLE' && (
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={handleScanFoodClick}
                            className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white p-6 rounded-2xl shadow-lg transition transform active:scale-[0.98] group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col items-start gap-1">
                                    <h4 className="text-xl font-bold flex items-center gap-2">
                                        <Camera size={24} /> {t('scanFood')}
                                    </h4>
                                    <p className="text-xs text-orange-100 opacity-90">{t('aiNutritionScanDesc')}</p>
                                </div>
                                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                            </div>

                            {!isScannerUnlocked && (
                                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
                                    <div className="bg-black/50 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold border border-white/20">
                                        <Lock size={12} /> {t('upgradeToScan')}
                                    </div>
                                </div>
                            )}
                        </button>

                        <button
                            onClick={handleScanMenuClick}
                            className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition transform active:scale-[0.98] group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col items-start gap-1 text-gray-800 dark:text-white">
                                    <h4 className="text-xl font-bold flex items-center gap-2">
                                        <Camera size={24} className="text-blue-500" /> {t('analyzeMenu')}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('menuRecs')}</p>
                                </div>
                                <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1" />
                            </div>

                            {!isScannerUnlocked && (
                                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                    <div className="bg-black/50 text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold border border-white/20">
                                        <Lock size={12} /> {t('upgradeToScan')}
                                    </div>
                                </div>
                            )}
                        </button>

                        <div className="flex justify-center pt-2">
                            <button
                                onClick={() => setShowManualEntry(true)}
                                className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition"
                            >
                                <PenTool size={14} /> {t('manualEntry')}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 2. CAMERA STATE --- */}
                {(mode === 'CAMERA_FOOD' || mode === 'CAMERA_MENU') && (
                    <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-black shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />

                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => {
                                // Stop tracks
                                const stream = videoRef.current?.srcObject as MediaStream;
                                stream?.getTracks().forEach(t => t.stop());
                                setMode('IDLE');
                            }} className="bg-black/40 text-white p-2 rounded-full backdrop-blur">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className={`w-64 h-64 border-2 border-white/50 border-dashed rounded-lg mb-4 ${mode === 'CAMERA_MENU' ? 'w-3/4 h-3/4' : ''}`}></div>
                            <div className="bg-black/60 px-3 py-1 rounded text-white text-xs backdrop-blur text-center max-w-[80%]">
                                {mode === 'CAMERA_FOOD'
                                    ? <>{t('placeObjectInfo')} <span className="font-bold text-yellow-400">({settings.referenceObject || 'Hand'})</span></>
                                    : t('analyzingMenu')}
                            </div>
                        </div>
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
                            <button
                                onClick={captureAndAnalyze}
                                className="bg-white text-black p-5 rounded-full shadow-lg hover:bg-gray-200 transition transform active:scale-95 border-4 border-gray-300/50"
                            >
                                <Camera size={32} />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 3. ANALYZING STATE --- */}
                {mode === 'ANALYZING' && (
                    <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-center p-6 animate-pulse">
                        <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium dark:text-gray-300">{t('analyzingFood')}</p>
                    </div>
                )}

                {/* --- 3.5. OFFLINE PHOTO STATE --- */}
                {mode === 'OFFLINE_PHOTO' && capturedPhotoBase64 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-yellow-200 dark:border-yellow-900/50 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-4 text-yellow-600 dark:text-yellow-400">
                            <WifiOff size={20} />
                            <span className="font-bold">{t('offlineMode') || 'Offline Mode'}</span>
                        </div>

                        {/* Photo Preview with retake button */}
                        <div className="relative rounded-lg overflow-hidden mb-4 aspect-square max-h-48 mx-auto">
                            <img
                                src={`data:image/jpeg;base64,${capturedPhotoBase64}`}
                                alt="Captured food"
                                className="w-full h-full object-cover"
                            />
                            {/* Retake button overlay */}
                            <button
                                onClick={retakePhoto}
                                className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur transition"
                                title={t('retake') || 'Retake'}
                            >
                                <RotateCcw size={16} />
                            </button>
                            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                                <Image size={12} />
                                {t('photoSaved') || 'Photo saved'}
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                            {t('offlinePhotoHint') || 'You can enter data manually now or save the photo for AI analysis when you are back online.'}
                        </p>

                        <div className="space-y-3">
                            {/* Retake button - prominent option */}
                            <button
                                onClick={retakePhoto}
                                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600"
                            >
                                <RotateCcw size={18} />
                                {t('retake') || 'Retake Photo'}
                            </button>

                            <button
                                onClick={openManualWithPhoto}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <PenTool size={18} />
                                {t('enterManually') || 'Enter Manually'}
                            </button>

                            <button
                                onClick={savePhotoForLater}
                                className="w-full py-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 font-bold border border-yellow-200 dark:border-yellow-800 flex items-center justify-center gap-2"
                            >
                                <CloudOff size={18} />
                                {t('saveForLater') || 'Analyze When Online'}
                            </button>

                            <button
                                onClick={() => {
                                    setCapturedPhotoBase64(null);
                                    setMode('IDLE');
                                }}
                                className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            >
                                {t('dismiss')}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 4. RESULT: FOOD --- */}
                {mode === 'RESULT_FOOD' && scannedFood && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-orange-200 dark:border-orange-900/50 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                        {/* Photo Preview */}
                        {capturedPhotoBase64 && (
                            <div className="relative rounded-lg overflow-hidden mb-4 aspect-video max-h-40 mx-auto">
                                <img
                                    src={`data:image/jpeg;base64,${capturedPhotoBase64}`}
                                    alt="Captured food"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={retakePhoto}
                                    className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur transition"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={editScannedFood}
                                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur transition"
                                >
                                    <Edit3 size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h4 className="text-xl font-bold text-gray-900 dark:text-white">{scannedFood.name}</h4>
                                 <p className="text-orange-500 font-mono font-bold text-lg">{scannedFood.calories} {t('unitKcal')}</p>
                             </div>
                             <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-bold">
                                 {t('aiEst')}
                             </div>
                        </div>

                        {/* КБЖУ */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center">
                                <span className="block text-xs text-gray-500">{t('protShort')}</span>
                                <span className="font-bold text-gray-800 dark:text-white">{scannedFood.protein}{t('unitG')}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center">
                                <span className="block text-xs text-gray-500">{t('carbShort')}</span>
                                <span className="font-bold text-gray-800 dark:text-white">{scannedFood.carbs}{t('unitG')}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center">
                                <span className="block text-xs text-gray-500">{t('fatShort')}</span>
                                <span className="font-bold text-gray-800 dark:text-white">{scannedFood.fat}{t('unitG')}</span>
                            </div>
                        </div>

                        {/* Cost Breakdown - only if supported currency */}
                        {scannedFoodCost && scannedFoodCost.ingredients.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {t('ingredients') || 'Ингредиенты'}
                                    </h5>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {scannedFoodCost.cookingTimeMinutes} {t('min') || 'мин'}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded ${
                                            scannedFoodCost.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            scannedFoodCost.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {scannedFoodCost.difficulty === 'easy' ? (t('easy') || 'легко') :
                                             scannedFoodCost.difficulty === 'medium' ? (t('medium') || 'средне') :
                                             (t('hard') || 'сложно')}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                    {scannedFoodCost.ingredients.map((ing, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {ing.emoji} {ing.name}
                                                <span className="text-gray-400 ml-1">
                                                    {ing.quantity}{ing.unit}
                                                </span>
                                            </span>
                                            <span className="font-mono text-gray-600 dark:text-gray-400">
                                                {Math.round(ing.totalPrice)}₽
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {/* Total Cost */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
                                        <DollarSign size={16} className="text-green-600" />
                                        {t('totalCost') || 'Себестоимость'}
                                    </span>
                                    <span className="font-bold font-mono text-lg text-green-600">
                                        ~{Math.round(scannedFoodCost.totalCost)}₽
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={retakePhoto}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5 text-sm"
                            >
                                <RotateCcw size={14} />
                                {t('retake') || 'Переснять'}
                            </button>
                            <button
                                onClick={editScannedFood}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5 text-sm"
                            >
                                <Edit3 size={14} />
                                {t('edit') || 'Изменить'}
                            </button>
                            {scannedFoodCost && (
                                <button
                                    onClick={() => {
                                        const recipe = {
                                            id: Date.now().toString(),
                                            name: scannedFoodCost.name,
                                            description: scannedFoodCost.briefRecipe,
                                            servings: 1,
                                            totalTime: scannedFoodCost.cookingTimeMinutes,
                                            caloriesPerServing: scannedFoodCost.calories,
                                            ingredients: scannedFoodCost.ingredients.map(i => ({
                                                name: i.name,
                                                emoji: i.emoji,
                                                quantity: i.quantity,
                                                unit: i.unit,
                                                available: false
                                            })),
                                            steps: [],
                                            createdAt: new Date().toISOString()
                                        };
                                        StorageService.addSavedRecipe(recipe as any);
                                        alert(t('savedToFavorites') || 'Сохранено в избранное!');
                                    }}
                                    className="flex-1 py-2.5 rounded-xl border border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 font-medium hover:bg-pink-50 dark:hover:bg-pink-900/30 flex items-center justify-center gap-1.5 text-sm"
                                >
                                    <Heart size={14} />
                                    {t('favorite') || 'В избранное'}
                                </button>
                            )}
                        </div>

                        {/* Dismiss */}
                        <button
                            onClick={() => {
                                setScannedFood(null);
                                setScannedFoodCost(null);
                                setCapturedPhotoBase64(null);
                                setMode('IDLE');
                            }}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                        >
                            {t('dismiss')}
                        </button>

                        {/* Save button */}
                        <button onClick={saveFood} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">
                            {t('save')}
                        </button>
                    </div>
                )}

                {/* --- 5. RESULT: MENU --- */}
                {mode === 'RESULT_MENU' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center">
                             <h4 className="font-bold text-gray-900 dark:text-white">{t('menuRecs')}</h4>
                             <button onClick={() => setMode('IDLE')} className="text-gray-500"><X size={20}/></button>
                        </div>

                        <div className="grid gap-3">
                            {menuRecommendations.map((dish, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => selectMenuRecommendation(dish)}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-bold text-gray-900 dark:text-white text-lg">{dish.dishName}</h5>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                                            dish.category === 'BEST_CHOICE' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                            dish.category === 'HIGH_PROTEIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                            'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                        }`}>
                                            {dish.category === 'BEST_CHOICE' ? t('bestChoice') :
                                             dish.category === 'HIGH_PROTEIN' ? t('highProtein') :
                                             t('lesserEvil')}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-sm font-mono text-gray-600 dark:text-gray-300 mb-2">
                                        <span>~{dish.calories} {t('unitKcal')}</span>
                                        <span>~{dish.protein}{t('unitG')} {t('protShort')}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 italic">
                                        <span className="font-bold">{t('whyThis')}</span>{dish.reasoning}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {menuRecommendations.length === 0 && (
                            <div className="text-center text-gray-500 py-8">{t('scanError')}</div>
                        )}
                    </div>
                )}

            </div>

            {/* Reference Object Warning Modal - No object configured */}
            {showRefWarning && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('missingRefObject')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                {t('missingRefWarningBody')}
                            </p>

                            {/* Common objects hint */}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                                {t('orUseCommonObject')}
                            </p>
                            <div className="flex justify-center gap-2 mb-6">
                                {alternativeObjects.slice(0, 4).map(obj => (
                                    <span key={obj.id} className="text-2xl" title={t(obj.label as any)}>
                                        {obj.emoji}
                                    </span>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmRefWarning}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-orange-500/20"
                                >
                                    {t('continueAnyway')}
                                </button>
                                <button
                                    onClick={() => setShowRefWarning(false)}
                                    className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white py-2"
                                >
                                    {t('dismiss')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reference Not Detected Modal - Object configured but not found in photo */}
            {showRefNotDetected && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('refNotDetected')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                                    {t('refNotDetectedBody')}
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                                    {t('usingForScale')} <span className="font-bold">{settings.referenceObject}</span>
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col gap-3 mb-6">
                                <button
                                    onClick={handleRetakePhoto}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={18} />
                                    {t('retakePhoto')}
                                </button>
                                <button
                                    onClick={handleContinueWithoutRef}
                                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl transition"
                                >
                                    {t('continueWithoutRef')}
                                </button>
                            </div>

                            {/* Alternative objects */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
                                    {t('orUseCommonObject')}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {alternativeObjects.map(obj => (
                                        <button
                                            key={obj.id}
                                            onClick={() => handleUseAlternative(obj)}
                                            className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 p-3 rounded-xl flex flex-col items-center gap-1 transition active:scale-95"
                                        >
                                            <span className="text-2xl">{obj.emoji}</span>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                                                {t(obj.label as any)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowRefNotDetected(false);
                                    setPendingFoodResult(null);
                                    setPendingPhotoBase64(null);
                                }}
                                className="w-full text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white py-3 mt-4"
                            >
                                {t('dismiss')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Entry Modal */}
            {showManualEntry && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <PenTool size={16} /> {t('manualEntry')}
                            </h3>
                            <button onClick={() => setShowManualEntry(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('foodName')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        placeholder={t('foodPlaceholder')}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAiLookup}
                                        disabled={!manualName || isCalculatingManual}
                                        className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                                    >
                                        {isCalculatingManual ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('weightG')} ({t('unitG')})</label>
                                <input
                                    type="number"
                                    value={manualAmount}
                                    onChange={(e) => setManualAmount(e.target.value)}
                                    placeholder={t('weightPlaceholder')}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('calories')}</label>
                                    <input
                                        type="number"
                                        value={manualCals}
                                        onChange={(e) => setManualCals(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('protein')} ({t('unitG')})</label>
                                    <input
                                        type="number"
                                        value={manualProt}
                                        onChange={(e) => setManualProt(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('carbs')} ({t('unitG')})</label>
                                    <input
                                        type="number"
                                        value={manualCarbs}
                                        onChange={(e) => setManualCarbs(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('fat')} ({t('unitG')})</label>
                                    <input
                                        type="number"
                                        value={manualFat}
                                        onChange={(e) => setManualFat(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={saveManualFood}
                                disabled={!manualName || !manualCals}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {t('addFood')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tools Section */}
            <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <Wrench size={20} className="text-gray-500" />
                    {t('tools') || 'Инструменты'}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    {/* Kitchen Card */}
                    <button
                        onClick={() => setActiveToolSheet('kitchen')}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl text-left hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98] group"
                    >
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Package size={20} className="text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{t('kitchen') || 'Кухня'}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {t('kitchenDesc') || 'Что есть в холодильнике'}
                        </p>
                    </button>

                    {/* Recipes Card */}
                    <button
                        onClick={() => setActiveToolSheet('recipes')}
                        className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-green-200 dark:border-green-800 p-4 rounded-2xl text-left hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98] group"
                    >
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <ChefHat size={20} className="text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{t('recipes') || 'Рецепты'}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {t('recipesDesc') || 'Готовь с учётом КБЖУ'}
                        </p>
                    </button>

                    {/* Finance Card - Full Width */}
                    <button
                        onClick={() => setActiveToolSheet('finance')}
                        className="col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 p-4 rounded-2xl text-left hover:shadow-lg hover:scale-[1.01] transition-all active:scale-[0.99] group flex items-center gap-4"
                    >
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Wallet size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-0.5">{t('finance') || 'Финансы'}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('financeDesc') || 'Сколько тратишь на еду'}
                            </p>
                        </div>
                        <ChevronRight size={20} className="text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
                    </div>
            </div>

            {/* Tool Sheets (Fullscreen Overlays) */}
            {activeToolSheet && (
                <div className="fixed inset-0 bg-white dark:bg-gray-950 z-[60] flex flex-col animate-in slide-in-from-right duration-200">
                    {/* Sheet Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
                        <button
                            onClick={() => setActiveToolSheet(null)}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {activeToolSheet === 'kitchen' && (t('kitchen') || 'Кухня')}
                            {activeToolSheet === 'recipes' && (t('recipes') || 'Рецепты')}
                            {activeToolSheet === 'finance' && (t('finance') || 'Финансы')}
                        </h2>
                    </div>

                    {/* Sheet Content */}
                    <div className="flex-1 overflow-auto">
                        {activeToolSheet === 'kitchen' && <Kitchen />}
                        {activeToolSheet === 'recipes' && (
                            <Cooking
                                caloriesRemaining={Math.max(0, dailyNeeds.calories - todayStats.calories)}
                                onCaloriesLogged={handleCaloriesLogged}
                            />
                        )}
                        {activeToolSheet === 'finance' && <FoodFinance />}
                    </div>
                </div>
            )}
        </div>
    );
};
