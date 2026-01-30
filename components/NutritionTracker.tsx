

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Droplets, Utensils, X, CheckCircle, Loader2, AlertCircle, GlassWater, Milk, Coffee, Lock, PenTool, Scan, FileText, ChevronRight, AlertTriangle, Wand2, WifiOff, CloudOff, Image, ChefHat, Package, Wallet } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { analyzeFood, analyzeMenu, calculateNutritionFromText, MenuRecommendation } from '../services/geminiService';
import { NutritionLog, NutritionSubTab } from '../types';
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

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({ onRequestPro }) => {
    const [needsUpdate, setNeedsUpdate] = useState(0);
    const [mode, setMode] = useState<ScanMode>('IDLE');
    const [activeSubTab, setActiveSubTab] = useState<NutritionSubTab>('diary');

    // Result States
    const [scannedFood, setScannedFood] = useState<NutritionLog | null>(null);
    const [menuRecommendations, setMenuRecommendations] = useState<MenuRecommendation[]>([]);

    // Offline States
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | null>(null);
    
    // UI Logic
    const [showRefWarning, setShowRefWarning] = useState(false);
    
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

        try {
            if (currentMode === 'CAMERA_FOOD') {
                const result = await analyzeFood(base64, settings.referenceObject || 'Hand');
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

    const saveFood = () => {
        if (scannedFood) {
            StorageService.saveNutrition(scannedFood);
            setScannedFood(null);
            setMode('IDLE');
            setNeedsUpdate(prev => prev + 1);
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
                    {/* Goal explanation */}
                    {dailyNeeds.deficit > 0 && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {t('tdeeInfo') || `TDEE: ${dailyNeeds.tdee} ккал`} · {t('deficitInfo') || `Дефицит: -${dailyNeeds.deficit} ккал`}
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-Tab Navigation - PRD: Дневник | Кухня | Рецепты | Финансы */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-2">
                {([
                    { id: 'diary' as const, label: t('diary') || 'Дневник', icon: <Camera className="w-4 h-4" />, color: 'orange' },
                    { id: 'kitchen' as const, label: t('kitchen') || 'Кухня', icon: <Package className="w-4 h-4" />, color: 'blue' },
                    { id: 'recipes' as const, label: t('recipes') || 'Рецепты', icon: <ChefHat className="w-4 h-4" />, color: 'green' },
                    { id: 'finance' as const, label: t('finance') || 'Финансы', icon: <Wallet className="w-4 h-4" />, color: 'purple' }
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors
                            ${activeSubTab === tab.id
                                ? `text-${tab.color}-600 dark:text-${tab.color}-400 border-b-2 border-${tab.color}-600 dark:border-${tab.color}-400`
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                {/* Kitchen Tab - PRD: Инвентарь продуктов */}
                {activeSubTab === 'kitchen' && (
                    <Kitchen />
                )}

                {/* Recipes Tab - PRD: Рецепты + Таймеры (includes cooking mode) */}
                {activeSubTab === 'recipes' && (
                    <Cooking
                        caloriesRemaining={Math.max(0, dailyNeeds.calories - todayStats.calories)}
                        onCaloriesLogged={handleCaloriesLogged}
                    />
                )}

                {/* Finance Tab - PRD: Контроль затрат на еду */}
                {activeSubTab === 'finance' && (
                    <FoodFinance />
                )}

                {/* Diary Tab - PRD: Дневник питания (food log + water + menu scan) */}
                {activeSubTab === 'diary' && (
                    <div className="p-4 space-y-6 pb-24">
                        {/* Top Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-around">
                <div className="flex flex-col items-center">
                    <AchievementRing
                        radius={50}
                        stroke={8}
                        progress={todayStats.calories}
                        total={dailyNeeds.calories}
                        color="#f59e0b"
                        label={t('unitKcal')}
                        compact
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
                        color="#3b82f6"
                        label={t('unitMl')}
                        compact
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

                        {/* Photo Preview */}
                        <div className="relative rounded-lg overflow-hidden mb-4 aspect-square max-h-48 mx-auto">
                            <img
                                src={`data:image/jpeg;base64,${capturedPhotoBase64}`}
                                alt="Captured food"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                                <Image size={12} />
                                {t('photoSaved') || 'Photo saved'}
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                            {t('offlinePhotoHint') || 'You can enter data manually now or save the photo for AI analysis when you are back online.'}
                        </p>

                        <div className="space-y-3">
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
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h4 className="text-xl font-bold text-gray-900 dark:text-white">{scannedFood.name}</h4>
                                 <p className="text-orange-500 font-mono font-bold text-lg">{scannedFood.calories} {t('unitKcal')}</p>
                             </div>
                             <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-bold">
                                 {t('aiEst')}
                             </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-6">
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
                        <div className="flex gap-2">
                            <button onClick={() => setMode('IDLE')} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800">
                                {t('dismiss')}
                            </button>
                            <button onClick={saveFood} className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">
                                {t('save')}
                            </button>
                        </div>
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

            {/* Reference Object Warning Modal */}
            {showRefWarning && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('missingRefObject')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                {t('missingRefWarningBody')}
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={confirmRefWarning}
                                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold py-3 rounded-xl transition"
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
                    </div>
                )}
            </div>
        </div>
    );
};