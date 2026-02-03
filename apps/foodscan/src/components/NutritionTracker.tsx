import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Plus, Droplets, Utensils, X, CheckCircle, Loader2, AlertCircle, GlassWater, Milk, Coffee, Lock, PenTool, Scan, FileText, ChevronRight, AlertTriangle, Wand2, WifiOff, CloudOff, Image, ChefHat, Package, Wallet, ArrowLeft, RefreshCw, Hand, CreditCard, Flame, RotateCcw, Edit3, Clock, DollarSign, Heart, SwitchCamera, Zap, ZapOff, Check, ImagePlus } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { analyzeFood, calculateNutritionFromText, FoodAnalysisResult, FoodAnalysisWithCost, detectPhotoType, PhotoContentType } from '../services/geminiService';
import { NutritionLog } from '@fitstream/shared';
import { t } from '@fitstream/shared';

interface NutritionTrackerProps {
  onRequestPro: () => void;
  openCameraOnMount?: boolean;
  onCameraOpened?: () => void;
}

type ScanMode = 'IDLE' | 'CAMERA_FOOD' | 'CAMERA_UNIVERSAL' | 'ANALYZING' | 'DETECTING_TYPE' | 'RESULT_FOOD' | 'OFFLINE_PHOTO';
type ScanErrorType = 'offline' | 'no_api_key' | 'no_balance' | null;

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({ onRequestPro, openCameraOnMount, onCameraOpened }) => {
    const [needsUpdate, setNeedsUpdate] = useState(0);
    const [mode, setMode] = useState<ScanMode>('IDLE');

    // Result States
    const [scannedFood, setScannedFood] = useState<NutritionLog | null>(null);
    const [scannedFoodCost, setScannedFoodCost] = useState<FoodAnalysisWithCost | null>(null);

    // Offline States
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | null>(null);

    // Detection state
    const [detectedType, setDetectedType] = useState<PhotoContentType | null>(null);

    // UI Logic
    const [showRefWarning, setShowRefWarning] = useState(false);
    const [showRefNotDetected, setShowRefNotDetected] = useState(false);
    const [pendingFoodResult, setPendingFoodResult] = useState<FoodAnalysisResult | null>(null);
    const [pendingPhotoBase64, setPendingPhotoBase64] = useState<string | null>(null);

    // Home-made food verification
    const [showHomeMadeDialog, setShowHomeMadeDialog] = useState(false);
    const [missingIngredients, setMissingIngredients] = useState<string[]>([]);

    // Alternative reference objects with SVG icons
    const alternativeObjects = [
        { id: 'fork', label: 'alternativeFork', dimensions: '19cm length', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="3" y1="6" x2="11" y2="6" /></svg>
        )},
        { id: 'spoon', label: 'alternativeSpoon', dimensions: '15cm length', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="6" rx="5" ry="4" /><path d="M12 10v12" /></svg>
        )},
        { id: 'hand', label: 'alternativeHand', dimensions: 'average adult hand', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 00-4 0v4M14 10V4a2 2 0 00-4 0v6M10 10V5a2 2 0 00-4 0v9" /><path d="M6 14v-3a2 2 0 00-4 0v5a8 8 0 0016 0v-5a2 2 0 00-4 0" /></svg>
        )},
        { id: 'card', label: 'alternativeCard', dimensions: '85.6mm x 53.98mm', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
        )},
        { id: 'coin', label: 'alternativeCoin', dimensions: '25mm diameter', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 6v2M12 16v2M8 12h8" /></svg>
        )},
        { id: 'lighter', label: 'alternativeLighter', dimensions: '8cm height', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="8" width="12" height="14" rx="2" /><path d="M12 8V4M9 4h6" /><circle cx="12" cy="14" r="2" /></svg>
        )},
    ];

    // State for custom reference object modal
    const [showAddCustomRef, setShowAddCustomRef] = useState(false);
    const [customRefName, setCustomRefName] = useState('');
    const [customRefDimensions, setCustomRefDimensions] = useState('');

    // Fullscreen camera state
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
    const [selectedRefObject, setSelectedRefObject] = useState<string>('Hand');

    // Error type tracking
    const [scanError, setScanError] = useState<ScanErrorType>(null);

    // Gallery file input ref
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

    // Manual Entry State
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualAmount, setManualAmount] = useState('');
    const [manualCals, setManualCals] = useState('');
    const [manualProt, setManualProt] = useState('');
    const [manualCarbs, setManualCarbs] = useState('');
    const [manualFat, setManualFat] = useState('');
    const [isCalculatingManual, setIsCalculatingManual] = useState(false);

    const settings = StorageService.getSettings();
    const dailyNeeds = StorageService.calculateDailyNeeds();
    const todayStats = StorageService.getTodayNutrition();

    const today = new Date().toISOString().split('T')[0];
    const todayLogs = StorageService.getNutritionLogs().filter(
        (log: NutritionLog) => log.date === today && log.type === 'FOOD'
    );

    // Check Trial/Pro Status
    const parsedInstallDate = new Date(settings.installDate);
    const installDate = isNaN(parsedInstallDate.getTime()) ? Date.now() : parsedInstallDate.getTime();
    const daysSinceInstall = (Date.now() - installDate) / (1000 * 60 * 60 * 24);
    const isTrialActive = daysSinceInstall < 7;
    const isScannerUnlocked = settings.isPro || isTrialActive;

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

    // Initialize selected reference object from settings
    useEffect(() => {
        if (settings.referenceObject) setSelectedRefObject(settings.referenceObject);
    }, [settings.referenceObject]);

    // Auto-open camera when triggered
    useEffect(() => {
        if (openCameraOnMount && isScannerUnlocked) {
            const timer = setTimeout(() => { handleUniversalScanClick(); onCameraOpened?.(); }, 100);
            return () => clearTimeout(timer);
        } else if (openCameraOnMount && !isScannerUnlocked) {
            onRequestPro();
            onCameraOpened?.();
        }
    }, [openCameraOnMount]);

    const addWater = (amount: number, name: string) => {
        const log: NutritionLog = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], timestamp: Date.now(), type: 'WATER', name, calories: 0, amount };
        StorageService.saveNutrition(log);
        setNeedsUpdate(prev => prev + 1);
    };

    // Universal scan handler
    const handleUniversalScanClick = () => {
        if (!isScannerUnlocked) { onRequestPro(); return; }
        setDetectedType(null);
        setScanError(null);
        startCamera('CAMERA_UNIVERSAL');
    };

    const startCamera = async (targetMode: ScanMode, facing?: 'user' | 'environment') => {
        setMode(targetMode);
        setCapturedPreview(null);
        const useFacing = facing || facingMode;
        try {
            if (videoRef.current?.srcObject) {
                const oldStream = videoRef.current.srcObject as MediaStream;
                oldStream.getTracks().forEach(t => t.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: useFacing, width: { ideal: 2560 }, height: { ideal: 1440 } }
            });
            if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
        } catch (e) {
            console.error(e);
            setMode('IDLE');
            alert(t('cameraDenied'));
        }
    };

    const switchCamera = () => {
        const newFacing = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacing);
        if (mode === 'CAMERA_FOOD' || mode === 'CAMERA_UNIVERSAL') startCamera(mode, newFacing);
    };

    const toggleFlash = async () => {
        if (!videoRef.current?.srcObject) return;
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as any;
        if (capabilities?.torch) {
            const newFlashState = !flashEnabled;
            await track.applyConstraints({ advanced: [{ torch: newFlashState }] } as any);
            setFlashEnabled(newFlashState);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context?.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.95).split(',')[1];
        setCapturedPreview(base64);
    };

    const usePhoto = async () => {
        if (!capturedPreview) return;
        const base64 = capturedPreview;

        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
        setCapturedPreview(null);

        if (!navigator.onLine) {
            setCapturedPhotoBase64(base64);
            setScanError('offline');
            setMode('OFFLINE_PHOTO');
            return;
        }

        // Detect content type with AI
        setMode('DETECTING_TYPE');
        try {
            const detection = await detectPhotoType(base64);
            setDetectedType(detection.type);

            // Default to food analysis
            setMode('ANALYZING');
            const result = await analyzeFood(base64, selectedRefObject || 'Hand');

            if (selectedRefObject && !result.referenceDetected && result.confidenceLevel === 'LOW') {
                setPendingFoodResult(result);
                setPendingPhotoBase64(base64);
                setShowRefNotDetected(true);
                return;
            }

            if (checkHomeMadeVerification(result)) {
                setPendingFoodResult(result);
                setPendingPhotoBase64(base64);
                setShowHomeMadeDialog(true);
                return;
            }

            await saveFoodResult(result, base64);
        } catch (e) {
            handleScanError(e, base64);
        }
    };

    const retakePreview = () => { setCapturedPreview(null); };

    const classifyScanError = (e: unknown): ScanErrorType => {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('INSUFFICIENT_BALANCE')) return 'no_balance';
        if (msg.includes('API Key missing') || msg.includes('API_KEY')) return 'no_api_key';
        return 'offline';
    };

    const handleScanError = (e: unknown, base64: string) => {
        console.error('Scan error:', e);
        const errorType = classifyScanError(e);
        setScanError(errorType);
        setCapturedPhotoBase64(base64);
        setMode('OFFLINE_PHOTO');
    };

    const handleGallerySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        event.target.value = '';

        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            if (!base64) return;

            if (!navigator.onLine) {
                setCapturedPhotoBase64(base64);
                setScanError('offline');
                setMode('OFFLINE_PHOTO');
                return;
            }

            setMode('DETECTING_TYPE');
            try {
                const detection = await detectPhotoType(base64);
                setDetectedType(detection.type);

                setMode('ANALYZING');
                const result = await analyzeFood(base64, selectedRefObject || 'Hand');

                if (selectedRefObject && !result.referenceDetected && result.confidenceLevel === 'LOW') {
                    setPendingFoodResult(result);
                    setPendingPhotoBase64(base64);
                    setShowRefNotDetected(true);
                    return;
                }

                if (checkHomeMadeVerification(result)) {
                    setPendingFoodResult(result);
                    setPendingPhotoBase64(base64);
                    setShowHomeMadeDialog(true);
                    return;
                }

                await saveFoodResult(result, base64);
            } catch (e) {
                handleScanError(e, base64);
            }
        };
        reader.readAsDataURL(file);
    };

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
        setCapturedPhotoBase64(base64);
        setScannedFood(foodLog);
        setMode('RESULT_FOOD');
    };

    const handleContinueWithoutRef = async () => {
        if (pendingFoodResult && pendingPhotoBase64) await saveFoodResult(pendingFoodResult, pendingPhotoBase64);
        setShowRefNotDetected(false);
        setPendingFoodResult(null);
        setPendingPhotoBase64(null);
    };

    const handleRetakePhoto = () => {
        setShowRefNotDetected(false);
        setPendingFoodResult(null);
        setPendingPhotoBase64(null);
        startCamera('CAMERA_FOOD');
    };

    const handleUseAlternative = async (altObject: { id: string; label: string; dimensions: string }) => {
        if (!pendingPhotoBase64) return;
        setShowRefNotDetected(false);
        setMode('ANALYZING');
        const objectName = altObject.id === 'custom' ? altObject.label : t(altObject.label as any);
        try {
            const result = await analyzeFood(pendingPhotoBase64, objectName, altObject.dimensions);
            await saveFoodResult(result, pendingPhotoBase64);
        } catch (e) {
            handleScanError(e, pendingPhotoBase64);
        } finally {
            setPendingFoodResult(null);
            setPendingPhotoBase64(null);
        }
    };

    const checkHomeMadeVerification = (result: FoodAnalysisResult): boolean => {
        if (!result.isHomeMade) return false;
        const inventory = StorageService.getActiveInventory();
        const inventoryNames = inventory.map(item => item.name.toLowerCase());
        const missing = (result.ingredients || []).filter(ingredient => {
            const ingredientLower = ingredient.toLowerCase();
            return !inventoryNames.some(invName => invName.includes(ingredientLower) || ingredientLower.includes(invName));
        });
        if (missing.length > 0) { setMissingIngredients(missing); return true; }
        return false;
    };

    const handleConfirmHomeMade = async () => {
        if (pendingFoodResult && pendingPhotoBase64) await saveFoodResult(pendingFoodResult, pendingPhotoBase64);
        setShowHomeMadeDialog(false);
        setMissingIngredients([]);
        setPendingFoodResult(null);
        setPendingPhotoBase64(null);
    };

    const handleConfirmOutside = async () => {
        if (pendingFoodResult && pendingPhotoBase64) await saveFoodResult(pendingFoodResult, pendingPhotoBase64);
        setShowHomeMadeDialog(false);
        setMissingIngredients([]);
        setPendingFoodResult(null);
        setPendingPhotoBase64(null);
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

    const retakePhoto = () => {
        setScannedFood(null);
        setScannedFoodCost(null);
        setCapturedPhotoBase64(null);
        startCamera('CAMERA_FOOD');
    };

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

    const handleAiLookup = async () => {
        if (!manualName) return;
        setIsCalculatingManual(true);
        try {
            const result = await calculateNutritionFromText(manualName, manualAmount);
            setManualCals(result.calories.toString());
            setManualProt(result.protein.toString());
            setManualCarbs(result.carbs.toString());
            setManualFat(result.fat.toString());
        } catch (e) { console.error(e); }
        finally { setIsCalculatingManual(false); }
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
            amount: parseInt(manualAmount) || undefined,
            manualEntry: true
        };
        StorageService.saveNutrition(log);
        setShowManualEntry(false);
        setManualName(''); setManualAmount(''); setManualCals(''); setManualProt(''); setManualCarbs(''); setManualFat('');
        setCapturedPhotoBase64(null);
        setNeedsUpdate(prev => prev + 1);
    };

    const openManualWithPhoto = () => { setMode('IDLE'); setShowManualEntry(true); };

    return (
        <div className="flex flex-col h-full">
            {/* Compact Summary Bar */}
            <div className="px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {!isOnline && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-yellow-600 dark:text-yellow-400">
                        <WifiOff size={12} /> <span>{t('offlineMode') || 'Offline'}</span>
                    </div>
                )}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Flame size={12} className="text-orange-500" /> {t('calories')}</span>
                            <span className="text-xs font-medium dark:text-white">{todayStats.calories}/{dailyNeeds.calories}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${todayStats.calories > dailyNeeds.calories ? 'bg-red-500' : todayStats.calories > dailyNeeds.calories * 0.8 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (todayStats.calories / dailyNeeds.calories) * 100)}%` }} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Droplets size={12} className="text-blue-500" /> {t('water')}</span>
                            <span className="text-xs font-medium dark:text-white">{todayStats.water}/{dailyNeeds.water}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (todayStats.water / dailyNeeds.water) * 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
                {/* Quick Water Buttons */}
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
                    <Droplets size={16} className="text-blue-500 shrink-0" />
                    <div className="flex-1 flex gap-2">
                        <button onClick={() => addWater(150, 'Glass')} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-2 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1"><GlassWater size={14} />+150</button>
                        <button onClick={() => addWater(250, 'Cup')} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-2 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1"><Coffee size={14} />+250</button>
                        <button onClick={() => addWater(500, 'Bottle')} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-2 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1"><Milk size={14} />+500</button>
                    </div>
                </div>

                {/* Universal Scan Button */}
                {mode === 'IDLE' && (
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex gap-2">
                            <button onClick={handleUniversalScanClick} className="relative flex-1 bg-gradient-to-br from-orange-500 via-red-500 to-purple-500 hover:from-orange-400 hover:via-red-400 hover:to-purple-400 text-white p-5 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-4">
                                <div className="flex items-center gap-2"><Camera size={32} /><span className="text-xl font-bold">Scan Food</span></div>
                                {!isScannerUnlocked && (<div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center rounded-xl"><Lock size={20} className="text-white/80" /></div>)}
                            </button>
                            <button onClick={() => { if (!isScannerUnlocked) { onRequestPro(); return; } galleryInputRef.current?.click(); }} className="relative bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white p-5 rounded-xl shadow-lg transition active:scale-[0.98] flex flex-col items-center justify-center gap-1">
                                <ImagePlus size={28} /><span className="text-xs font-medium">Gallery</span>
                                {!isScannerUnlocked && (<div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center rounded-xl"><Lock size={16} className="text-white/80" /></div>)}
                            </button>
                        </div>
                        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGallerySelect} />

                        {/* Today's log preview */}
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Today</span>
                                <button onClick={() => setShowManualEntry(true)} className="text-xs text-blue-500 flex items-center gap-1 hover:text-blue-600"><PenTool size={12} /> {t('manualEntry')}</button>
                            </div>
                            <div className="flex-1 overflow-auto">
                                {todayLogs.length > 0 ? (
                                    <div className="space-y-1">
                                        {todayLogs.slice(0, 5).map((log, i) => (
                                            <div key={log.id || i} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                                                <span className="truncate text-gray-700 dark:text-gray-300">{log.name}</span>
                                                <span className="text-xs font-medium text-orange-500 ml-2 shrink-0">{log.calories} kcal</span>
                                            </div>
                                        ))}
                                        {todayLogs.length > 5 && <div className="text-xs text-center text-gray-400 py-1">+{todayLogs.length - 5} more</div>}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No entries yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* FULLSCREEN CAMERA MODAL */}
                {(mode === 'CAMERA_FOOD' || mode === 'CAMERA_UNIVERSAL') && (
                    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
                        <div className="flex-1 relative overflow-hidden">
                            {!capturedPreview ? (
                                <>
                                    <div className="w-full h-full" onClick={async (e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                        setFocusPoint({ x, y });
                                        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
                                        focusTimeoutRef.current = setTimeout(() => setFocusPoint(null), 1500);
                                    }}>
                                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                        {focusPoint && <div className="absolute w-16 h-16 border-2 border-yellow-400 rounded-lg pointer-events-none animate-pulse" style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%`, transform: 'translate(-50%, -50%)' }} />}
                                    </div>
                                    <canvas ref={canvasRef} className="hidden" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-72 h-72 border-2 border-white/60 rounded-2xl">
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <img src={`data:image/jpeg;base64,${capturedPreview}`} alt="Preview" className="w-full h-full object-cover" />
                            )}
                        </div>

                        {/* Top controls */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                            <button onClick={() => { const stream = videoRef.current?.srcObject as MediaStream; stream?.getTracks().forEach(t => t.stop()); setCapturedPreview(null); setMode('IDLE'); }} className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"><X size={24} /></button>
                            {!capturedPreview && (
                                <div className="flex gap-3">
                                    <button onClick={toggleFlash} className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full">{flashEnabled ? <Zap size={24} className="text-yellow-400" /> : <ZapOff size={24} />}</button>
                                    <button onClick={switchCamera} className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"><SwitchCamera size={24} /></button>
                                </div>
                            )}
                        </div>

                        {mode === 'CAMERA_UNIVERSAL' && !capturedPreview && (
                            <div className="absolute top-20 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 text-white/80 text-xs"><CreditCard size={16} /><span>Place card for scale</span></div>
                        )}

                        {/* Bottom controls */}
                        <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
                            {!capturedPreview ? (
                                <div className="flex justify-center items-center gap-6">
                                    <button onClick={() => galleryInputRef.current?.click()} className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white active:scale-95 transition"><ImagePlus size={22} /></button>
                                    <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition border-4 border-white/50"><div className="w-16 h-16 rounded-full bg-white border-4 border-gray-300" /></button>
                                    <div className="w-12 h-12" />
                                </div>
                            ) : (
                                <div className="flex justify-center gap-8 px-4">
                                    <button onClick={retakePreview} className="flex flex-col items-center gap-2 text-white">
                                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"><RotateCcw size={28} /></div>
                                        <span className="text-sm">{t('retake') || 'Retake'}</span>
                                    </button>
                                    <button onClick={usePhoto} className="flex flex-col items-center gap-2 text-white">
                                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"><Check size={32} /></div>
                                        <span className="text-sm">{t('usePhoto') || 'Use Photo'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* DETECTING TYPE */}
                {mode === 'DETECTING_TYPE' && (
                    <div className="h-64 rounded-xl bg-gradient-to-br from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30 flex flex-col items-center justify-center text-center p-6">
                        <Loader2 size={32} className="text-purple-500 animate-spin mb-3" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">Detecting type...</p>
                    </div>
                )}

                {/* ANALYZING */}
                {mode === 'ANALYZING' && (
                    <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-center p-6 animate-pulse">
                        <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium dark:text-gray-300">{t('analyzingFood')}</p>
                    </div>
                )}

                {/* OFFLINE PHOTO */}
                {mode === 'OFFLINE_PHOTO' && capturedPhotoBase64 && (
                    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 border ${scanError === 'no_balance' ? 'border-red-200 dark:border-red-900/50' : scanError === 'no_api_key' ? 'border-orange-200 dark:border-orange-900/50' : 'border-yellow-200 dark:border-yellow-900/50'}`}>
                        <div className={`flex items-center gap-2 mb-4 ${scanError === 'no_balance' ? 'text-red-600 dark:text-red-400' : scanError === 'no_api_key' ? 'text-orange-600 dark:text-orange-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                            {scanError === 'no_balance' ? <Wallet size={20} /> : scanError === 'no_api_key' ? <AlertTriangle size={20} /> : <WifiOff size={20} />}
                            <span className="font-bold">{scanError === 'no_balance' ? 'Subscription expired' : scanError === 'no_api_key' ? 'Configuration error' : (t('offlineMode') || 'Offline')}</span>
                        </div>
                        <div className="relative rounded-lg overflow-hidden mb-4 aspect-square max-h-48 mx-auto">
                            <img src={`data:image/jpeg;base64,${capturedPhotoBase64}`} alt="Captured food" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-3">
                            {scanError === 'no_balance' && (
                                <button onClick={() => { setCapturedPhotoBase64(null); setScanError(null); setMode('IDLE'); onRequestPro(); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg flex items-center justify-center gap-2"><Wallet size={18} />Top up balance</button>
                            )}
                            <button onClick={retakePhoto} className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center gap-2"><RotateCcw size={18} />{t('retake') || 'Retake'}</button>
                            <button onClick={openManualWithPhoto} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg flex items-center justify-center gap-2"><PenTool size={18} />{t('enterManually') || 'Enter Manually'}</button>
                            <button onClick={() => { setCapturedPhotoBase64(null); setScanError(null); setMode('IDLE'); }} className="w-full py-2 text-sm text-gray-500">{t('dismiss')}</button>
                        </div>
                    </div>
                )}

                {/* RESULT: FOOD */}
                {mode === 'RESULT_FOOD' && scannedFood && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-orange-200 dark:border-orange-900/50 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                        {capturedPhotoBase64 && (
                            <div className="relative rounded-lg overflow-hidden mb-4 aspect-video max-h-40 mx-auto">
                                <img src={`data:image/jpeg;base64,${capturedPhotoBase64}`} alt="Captured food" className="w-full h-full object-cover" />
                                <button onClick={retakePhoto} className="absolute top-2 left-2 bg-black/60 text-white p-2 rounded-full backdrop-blur"><RotateCcw size={16} /></button>
                                <button onClick={editScannedFood} className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full backdrop-blur"><Edit3 size={16} /></button>
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h4 className="text-xl font-bold text-gray-900 dark:text-white">{scannedFood.name}</h4>
                                 <p className="text-orange-500 font-mono font-bold text-lg">{scannedFood.calories} {t('unitKcal')}</p>
                             </div>
                             <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-bold">{t('aiEst')}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center"><span className="block text-xs text-gray-500">{t('protShort')}</span><span className="font-bold text-gray-800 dark:text-white">{scannedFood.protein}{t('unitG')}</span></div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center"><span className="block text-xs text-gray-500">{t('carbShort')}</span><span className="font-bold text-gray-800 dark:text-white">{scannedFood.carbs}{t('unitG')}</span></div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center"><span className="block text-xs text-gray-500">{t('fatShort')}</span><span className="font-bold text-gray-800 dark:text-white">{scannedFood.fat}{t('unitG')}</span></div>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <button onClick={retakePhoto} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium flex items-center justify-center gap-1.5 text-sm"><RotateCcw size={14} />{t('retake') || 'Retake'}</button>
                            <button onClick={editScannedFood} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium flex items-center justify-center gap-1.5 text-sm"><Edit3 size={14} />{t('edit') || 'Edit'}</button>
                        </div>
                        <button onClick={() => { setScannedFood(null); setCapturedPhotoBase64(null); setMode('IDLE'); }} className="w-full py-2 text-sm text-gray-500 mb-2">{t('dismiss')}</button>
                        <button onClick={saveFood} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">{t('save')}</button>
                    </div>
                )}
            </div>

            {/* Reference Not Detected Modal */}
            {showRefNotDetected && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} className="text-amber-600 dark:text-amber-400" /></div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('refNotDetected')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t('refNotDetectedBody')}</p>
                            </div>
                            <div className="flex flex-col gap-3 mb-6">
                                <button onClick={handleRetakePhoto} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><RefreshCw size={18} />{t('retakePhoto')}</button>
                                <button onClick={handleContinueWithoutRef} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl">{t('continueWithoutRef')}</button>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">{t('orUseCommonObject')}</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {alternativeObjects.map(obj => (
                                        <button key={obj.id} onClick={() => handleUseAlternative(obj)} className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 p-3 rounded-xl flex flex-col items-center gap-1 transition active:scale-95">
                                            <div className="w-8 h-8 text-gray-600 dark:text-gray-300 flex items-center justify-center">{obj.icon}</div>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">{t(obj.label as any)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => { setShowRefNotDetected(false); setPendingFoodResult(null); setPendingPhotoBase64(null); }} className="w-full text-sm text-gray-500 py-3 mt-4">{t('dismiss')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Home-Made Verification Dialog */}
            {showHomeMadeDialog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><ChefHat size={32} className="text-orange-600 dark:text-orange-400" /></div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('homeMadeQuestion')}</h3>
                            {missingIngredients.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t('ingredientsNotInInventory')}:</p>
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {missingIngredients.slice(0, 5).map((ing, idx) => (<span key={idx} className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2 py-1 rounded-full">{ing}</span>))}
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col gap-3">
                                <button onClick={handleConfirmHomeMade} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><ChefHat size={18} />{t('homeMadeYes')}</button>
                                <button onClick={handleConfirmOutside} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Package size={18} />{t('homeMadeNo')}</button>
                                <button onClick={() => { setShowHomeMadeDialog(false); setMissingIngredients([]); setPendingFoodResult(null); setPendingPhotoBase64(null); }} className="text-sm text-gray-500 py-2">{t('dismiss')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Entry Modal */}
            {showManualEntry && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><PenTool size={16} /> {t('manualEntry')}</h3>
                            <button onClick={() => setShowManualEntry(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('foodName')}</label>
                                <div className="flex gap-2">
                                    <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder={t('foodPlaceholder')} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" autoFocus />
                                    <button onClick={handleAiLookup} disabled={!manualName || isCalculatingManual} className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-200 transition">
                                        {isCalculatingManual ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('weightG') || 'Weight'} ({t('unitG')})</label>
                                <input type="number" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} placeholder="200" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('calories')}</label><input type="number" value={manualCals} onChange={(e) => setManualCals(e.target.value)} placeholder="0" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                                <div><label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('protShort')}</label><input type="number" value={manualProt} onChange={(e) => setManualProt(e.target.value)} placeholder="0" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                                <div><label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('carbShort')}</label><input type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} placeholder="0" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                                <div><label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('fatShort')}</label><input type="number" value={manualFat} onChange={(e) => setManualFat(e.target.value)} placeholder="0" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                            </div>
                            <button onClick={saveManualFood} disabled={!manualName || !manualCals} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition">{t('save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
