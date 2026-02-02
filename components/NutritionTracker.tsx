

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Plus, Droplets, Utensils, X, CheckCircle, Loader2, AlertCircle, GlassWater, Milk, Coffee, Lock, PenTool, Scan, FileText, ChevronRight, AlertTriangle, Wand2, WifiOff, CloudOff, Image, ChefHat, Package, Wallet, ArrowLeft, RefreshCw, Hand, CreditCard, Flame, RotateCcw, Edit3, Clock, DollarSign, Heart, SwitchCamera, Zap, ZapOff, Check, QrCode, ImagePlus, MapPin } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { analyzeFood, analyzeMenuWithCache, MenuAnalysisResult, calculateNutritionFromText, MenuRecommendation, FoodAnalysisResult, FoodAnalysisWithCost, detectPhotoType, PhotoContentType } from '../services/geminiService';
import { findRestaurant, getCacheStats } from '../services/menuCacheService';
import { NutritionLog, GeoLocation, CachedRestaurant } from '../types';
import { t } from '../services/i18n';
import { AchievementRing } from './AchievementRings';
import { syncQueue } from '../services/syncQueue';
import { offlineStorage } from '../services/offlineStorage';
import { Kitchen } from './Kitchen';
import { Cooking } from './Cooking';
import { FoodFinance } from './Finance';
import jsQR from 'jsqr';

interface NutritionTrackerProps {
  onRequestPro: () => void;
  openCameraOnMount?: boolean;
  onCameraOpened?: () => void;
  initialToolSheet?: 'kitchen' | 'recipes' | 'finance' | null;
}

type ScanMode = 'IDLE' | 'CAMERA_FOOD' | 'CAMERA_MENU' | 'CAMERA_UNIVERSAL' | 'ANALYZING' | 'DETECTING_TYPE' | 'RESULT_FOOD' | 'RESULT_MENU' | 'OFFLINE_PHOTO';
type ToolSheet = 'kitchen' | 'recipes' | 'finance' | null;

// Default city/country for Georgia (can be detected later)
const DEFAULT_CITY = 'Tbilisi';
const DEFAULT_COUNTRY = 'GE';

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({ onRequestPro, openCameraOnMount, onCameraOpened, initialToolSheet }) => {
    const [needsUpdate, setNeedsUpdate] = useState(0);
    const [mode, setMode] = useState<ScanMode>('IDLE');
    const [activeToolSheet, setActiveToolSheet] = useState<ToolSheet>(initialToolSheet ?? null);

    // Result States
    const [scannedFood, setScannedFood] = useState<NutritionLog | null>(null);
    const [scannedFoodCost, setScannedFoodCost] = useState<FoodAnalysisWithCost | null>(null);
    const [menuRecommendations, setMenuRecommendations] = useState<MenuRecommendation[]>([]);

    // Offline States
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | null>(null);

    // Multi-page menu state
    const [menuPages, setMenuPages] = useState<string[]>([]);
    const [isCapturingMenuPages, setIsCapturingMenuPages] = useState(false);

    // Detection state
    const [detectedType, setDetectedType] = useState<PhotoContentType | null>(null);
    const [qrUrl, setQrUrl] = useState<string | null>(null);

    // Geolocation for menu cache
    const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
    const [cachedMenuFound, setCachedMenuFound] = useState<CachedRestaurant | null>(null);
    const [menuFromCache, setMenuFromCache] = useState(false);
    const [tokensSavedTotal, setTokensSavedTotal] = useState(0);

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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="3" y1="6" x2="11" y2="6" />
            </svg>
        )},
        { id: 'spoon', label: 'alternativeSpoon', dimensions: '15cm length', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="6" rx="5" ry="4" /><path d="M12 10v12" />
            </svg>
        )},
        { id: 'hand', label: 'alternativeHand', dimensions: 'average adult hand', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 00-4 0v4M14 10V4a2 2 0 00-4 0v6M10 10V5a2 2 0 00-4 0v9" />
                <path d="M6 14v-3a2 2 0 00-4 0v5a8 8 0 0016 0v-5a2 2 0 00-4 0" />
            </svg>
        )},
        { id: 'card', label: 'alternativeCard', dimensions: '85.6mm x 53.98mm', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
        )},
        { id: 'coin', label: 'alternativeCoin', dimensions: '25mm diameter', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 6v2M12 16v2M8 12h8" />
            </svg>
        )},
        { id: 'lighter', label: 'alternativeLighter', dimensions: '8cm height', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="8" width="12" height="14" rx="2" /><path d="M12 8V4M9 4h6" /><circle cx="12" cy="14" r="2" />
            </svg>
        )},
        { id: 'earbuds', label: 'alternativeEarbuds', dimensions: '5.4 x 4.5 x 2.1 cm', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="6" width="16" height="12" rx="4" />
                <line x1="4" y1="10" x2="20" y2="10" />
                <circle cx="9" cy="14" r="1.5" />
                <circle cx="15" cy="14" r="1.5" />
                <path d="M9 14v-2M15 14v-2" />
            </svg>
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
    const [showCameraRefSelector, setShowCameraRefSelector] = useState(false);
    const [selectedRefObject, setSelectedRefObject] = useState<string>('Hand');

    // Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Tap-to-focus state
    const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

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

    // Today's food logs for compact preview
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = StorageService.getNutritionLogs().filter(
        (log: NutritionLog) => log.date === today && log.type === 'FOOD'
    );

    // Open tool sheet when navigating from dashboard
    useEffect(() => {
        if (initialToolSheet) {
            setActiveToolSheet(initialToolSheet);
        }
    }, [initialToolSheet]);

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
        if (settings.referenceObject) {
            setSelectedRefObject(settings.referenceObject);
        }
    }, [settings.referenceObject]);

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

    // Auto-open camera when triggered from Dashboard - universal mode, no warnings
    useEffect(() => {
        if (openCameraOnMount && isScannerUnlocked) {
            // Small delay to ensure component is mounted
            const timer = setTimeout(() => {
                // Use universal camera directly - no reference object warning
                handleUniversalScanClick();
                onCameraOpened?.();
            }, 100);
            return () => clearTimeout(timer);
        } else if (openCameraOnMount && !isScannerUnlocked) {
            onRequestPro();
            onCameraOpened?.();
        }
    }, [openCameraOnMount]);

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

    // Universal scan handler - one button for food/menu/QR
    const handleUniversalScanClick = () => {
        if (!isScannerUnlocked) {
            onRequestPro();
            return;
        }
        // Reset multi-page state
        setMenuPages([]);
        setIsCapturingMenuPages(false);
        setDetectedType(null);
        setQrUrl(null);
        setCachedMenuFound(null);

        // Get geolocation for menu cache
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc: GeoLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    };
                    setCurrentLocation(loc);
                    // Check for cached menu at this location using menuCacheService
                    const cached = findRestaurant(undefined, loc);
                    if (cached) {
                        setCachedMenuFound(cached);
                        // Update tokens saved stats
                        const stats = getCacheStats();
                        setTokensSavedTotal(stats.tokensSaved);
                    }
                },
                () => setCurrentLocation(null),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }

        startCamera('CAMERA_UNIVERSAL');
    };

    // Legacy handlers for backwards compatibility
    const handleScanFoodClick = () => {
        handleUniversalScanClick();
    };

    const handleScanMenuClick = () => {
        handleUniversalScanClick();
    };

    const confirmRefWarning = () => {
        setShowRefWarning(false);
        startCamera('CAMERA_UNIVERSAL');
    };

    // QR code detection using jsQR
    const detectQRCode = useCallback((imageData: ImageData): string | null => {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
            return code.data;
        }
        return null;
    }, []);

    // Add more menu pages
    const addMenuPage = () => {
        if (capturedPreview) {
            setMenuPages(prev => [...prev, capturedPreview]);
            setCapturedPreview(null);
            // Continue capturing
        }
    };

    // Finish menu capture and analyze all pages
    const finishMenuCapture = async () => {
        setIsCapturingMenuPages(false);
        if (menuPages.length === 0 && capturedPreview) {
            // Single page
            setMenuPages([capturedPreview]);
        }

        const allPages = capturedPreview ? [...menuPages, capturedPreview] : menuPages;
        if (allPages.length === 0) return;

        // Stop stream
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
        setCapturedPreview(null);
        setMode('ANALYZING');

        try {
            // Analyze with caching - automatically saves to cache if location provided
            const result = await analyzeMenuWithCache(allPages[0], {
                location: currentLocation || undefined,
                city: DEFAULT_CITY,
                country: DEFAULT_COUNTRY
            });

            setMenuRecommendations(result.recommendations);
            setMenuFromCache(result.fromCache);

            // Update tokens saved counter
            if (result.fromCache) {
                const stats = getCacheStats();
                setTokensSavedTotal(stats.tokensSaved);
            }

            setMode('RESULT_MENU');
            setMenuPages([]);
        } catch (e) {
            setCapturedPhotoBase64(allPages[0]);
            setMode('OFFLINE_PHOTO');
            setMenuPages([]);
        }
    };

    // Use cached menu instead of scanning
    const useCachedMenu = () => {
        if (cachedMenuFound) {
            // Convert cached items to recommendations
            const recommendations: MenuRecommendation[] = cachedMenuFound.menuItems
                .filter(item => item.healthScore <= 2)
                .sort((a, b) => a.healthScore - b.healthScore)
                .slice(0, 3)
                .map(item => ({
                    dishName: item.name,
                    calories: item.calories,
                    protein: item.protein,
                    category: item.category === 'REGULAR' ? 'LESSER_OF_EVILS' as const : item.category,
                    reasoning: `Health: ${item.healthScore === 1 ? '🟢' : '🟡'}`
                }));

            setMenuRecommendations(recommendations);
            setMenuFromCache(true);

            // Stop stream
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
            setMode('RESULT_MENU');
            setCachedMenuFound(null);

            // Update tokens saved
            const stats = getCacheStats();
            setTokensSavedTotal(stats.tokensSaved);
        }
    };

    const startCamera = async (targetMode: ScanMode, facing?: 'user' | 'environment') => {
        setMode(targetMode);
        setCapturedPreview(null);
        const useFacing = facing || facingMode;
        try {
            // Stop any existing stream first
            if (videoRef.current?.srcObject) {
                const oldStream = videoRef.current.srcObject as MediaStream;
                oldStream.getTracks().forEach(t => t.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: useFacing,
                    width: { ideal: 2560 },
                    height: { ideal: 1440 }
                }
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

    // Switch between front and back camera
    const switchCamera = () => {
        const newFacing = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacing);
        if (mode === 'CAMERA_FOOD' || mode === 'CAMERA_MENU' || mode === 'CAMERA_UNIVERSAL') {
            startCamera(mode, newFacing);
        }
    };

    // Toggle flash (if supported)
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

    // Capture photo but show preview first
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context?.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.95).split(',')[1];
        setCapturedPreview(base64);
    };

    // Use the captured photo and analyze
    const usePhoto = async () => {
        if (!capturedPreview) return;

        const base64 = capturedPreview;
        const currentMode = mode;

        // For multi-page menu capture - add page and continue
        if (isCapturingMenuPages) {
            addMenuPage();
            return;
        }

        // Stop stream
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }

        setCapturedPreview(null);

        // If offline, save photo and show manual entry
        if (!navigator.onLine) {
            setCapturedPhotoBase64(base64);
            setMode('OFFLINE_PHOTO');
            return;
        }

        // Step 1: Try local QR detection first (saves AI tokens!)
        if (currentMode === 'CAMERA_UNIVERSAL' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
                const qrResult = detectQRCode(imageData);
                if (qrResult) {
                    // QR code detected locally!
                    setQrUrl(qrResult);
                    setDetectedType('QR_MENU');
                    setMode('RESULT_MENU');
                    // Open QR URL in new tab
                    window.open(qrResult, '_blank');
                    return;
                }
            }
        }

        // Step 2: For universal mode, detect content type with AI
        if (currentMode === 'CAMERA_UNIVERSAL') {
            setMode('DETECTING_TYPE');
            try {
                const detection = await detectPhotoType(base64);
                setDetectedType(detection.type);

                if (detection.type === 'QR_MENU' && detection.qrUrl) {
                    setQrUrl(detection.qrUrl);
                    setMode('RESULT_MENU');
                    window.open(detection.qrUrl, '_blank');
                    return;
                }

                if (detection.type === 'MENU') {
                    // Analyze as menu with caching
                    setMode('ANALYZING');
                    const result = await analyzeMenuWithCache(base64, {
                        location: currentLocation || undefined,
                        city: DEFAULT_CITY,
                        country: DEFAULT_COUNTRY
                    });
                    setMenuRecommendations(result.recommendations);
                    setMenuFromCache(result.fromCache);

                    if (result.fromCache) {
                        const stats = getCacheStats();
                        setTokensSavedTotal(stats.tokensSaved);
                    }

                    setMode('RESULT_MENU');
                    return;
                }

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
                setCapturedPhotoBase64(base64);
                setMode('OFFLINE_PHOTO');
            }
            return;
        }

        // Legacy mode handling (CAMERA_FOOD / CAMERA_MENU)
        setMode('ANALYZING');

        try {
            if (currentMode === 'CAMERA_FOOD') {
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
            } else {
                // Legacy menu mode with caching
                const result = await analyzeMenuWithCache(base64, {
                    location: currentLocation || undefined,
                    city: DEFAULT_CITY,
                    country: DEFAULT_COUNTRY
                });
                setMenuRecommendations(result.recommendations);
                setMenuFromCache(result.fromCache);

                if (result.fromCache) {
                    const stats = getCacheStats();
                    setTokensSavedTotal(stats.tokensSaved);
                }

                setMode('RESULT_MENU');
            }
        } catch (e) {
            setCapturedPhotoBase64(base64);
            setMode('OFFLINE_PHOTO');
        }
    };

    // Retake photo - go back to camera
    const retakePreview = () => {
        setCapturedPreview(null);
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const currentMode = mode; // Capture before state change

        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context?.drawImage(videoRef.current, 0, 0);

        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.95).split(',')[1];

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

                // Check home-made status and ingredients
                const needsHomeMadeVerification = checkHomeMadeVerification(result);
                if (needsHomeMadeVerification) {
                    setPendingFoodResult(result);
                    setPendingPhotoBase64(base64);
                    setShowHomeMadeDialog(true);
                    setMode('IDLE');
                    return;
                }

                // Reference detected or not configured - proceed normally
                await saveFoodResult(result, base64);
            } else if (currentMode === 'CAMERA_MENU') {
                const result = await analyzeMenuWithCache(base64, {
                    location: currentLocation || undefined,
                    city: DEFAULT_CITY,
                    country: DEFAULT_COUNTRY
                });
                setMenuRecommendations(result.recommendations);
                setMenuFromCache(result.fromCache);
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
    const handleUseAlternative = async (altObject: { id: string; label: string; dimensions: string; icon?: React.ReactNode }) => {
        if (!pendingPhotoBase64) return;

        setShowRefNotDetected(false);
        setMode('ANALYZING');

        // For predefined objects, translate the label; for custom ones, use as-is
        const objectName = altObject.id === 'custom' ? altObject.label : t(altObject.label as any);

        try {
            const result = await analyzeFood(pendingPhotoBase64, objectName, altObject.dimensions);
            // Skip reference check - user explicitly chose an alternative, just save the result
            await saveFoodResult(result, pendingPhotoBase64);
        } catch (e) {
            setCapturedPhotoBase64(pendingPhotoBase64);
            setMode('OFFLINE_PHOTO');
        } finally {
            setPendingFoodResult(null);
            setPendingPhotoBase64(null);
        }
    };

    // Check if we need to verify home-made status
    const checkHomeMadeVerification = (result: FoodAnalysisResult): boolean => {
        // If AI determined it's NOT home-made, no need to verify
        if (!result.isHomeMade) {
            return false;
        }

        // If home-made, check if ingredients exist in inventory
        const inventory = StorageService.getActiveInventory();
        const inventoryNames = inventory.map(item => item.name.toLowerCase());

        const missing = (result.ingredients || []).filter(ingredient => {
            const ingredientLower = ingredient.toLowerCase();
            // Check if any inventory item contains this ingredient name
            return !inventoryNames.some(invName =>
                invName.includes(ingredientLower) || ingredientLower.includes(invName)
            );
        });

        if (missing.length > 0) {
            setMissingIngredients(missing);
            return true;
        }

        return false;
    };

    // Handle "Yes, home-made" - save food and don't deduct from inventory
    const handleConfirmHomeMade = async () => {
        if (pendingFoodResult && pendingPhotoBase64) {
            await saveFoodResult(pendingFoodResult, pendingPhotoBase64);
        }
        setShowHomeMadeDialog(false);
        setMissingIngredients([]);
        setPendingFoodResult(null);
        setPendingPhotoBase64(null);
    };

    // Handle "No, from outside" - save food without inventory deduction
    const handleConfirmOutside = async () => {
        if (pendingFoodResult && pendingPhotoBase64) {
            await saveFoodResult(pendingFoodResult, pendingPhotoBase64);
        }
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
            {/* Compact Summary Bar - Calories + Water + Offline indicator */}
            <div className="px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {/* Offline indicator - compact */}
                {(!isOnline || pendingCount > 0) && (
                    <div className={`flex items-center gap-2 mb-2 text-xs ${!isOnline ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {!isOnline ? <WifiOff size={12} /> : <Loader2 size={12} className="animate-spin" />}
                        <span>{!isOnline ? (t('offlineMode') || 'Offline') : (t('syncing') || 'Syncing')}</span>
                        {pendingCount > 0 && <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>}
                    </div>
                )}

                {/* Dual progress bars - Calories & Water in one row */}
                <div className="flex gap-3">
                    {/* Calories */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Flame size={12} className="text-orange-500" /> {t('calories')}
                            </span>
                            <span className="text-xs font-medium dark:text-white">{todayStats.calories}/{dailyNeeds.calories}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    todayStats.calories > dailyNeeds.calories ? 'bg-red-500'
                                    : todayStats.calories > dailyNeeds.calories * 0.8 ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, (todayStats.calories / dailyNeeds.calories) * 100)}%` }}
                            />
                        </div>
                    </div>
                    {/* Water */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Droplets size={12} className="text-blue-500" /> {t('water')}
                            </span>
                            <span className="text-xs font-medium dark:text-white">{todayStats.water}/{dailyNeeds.water}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${Math.min(100, (todayStats.water / dailyNeeds.water) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - No scroll layout */}
            <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
                {/* Quick Water Buttons - Compact horizontal row */}
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
                    <Droplets size={16} className="text-blue-500 shrink-0" />
                    <div className="flex-1 flex gap-2">
                        <button onClick={() => addWater(150, 'Glass')} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-2 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1">
                            <GlassWater size={14} />+150
                        </button>
                        <button onClick={() => addWater(250, 'Cup')} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-2 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1">
                            <Coffee size={14} />+250
                        </button>
                        <button onClick={() => addWater(500, 'Bottle')} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-2 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1">
                            <Milk size={14} />+500
                        </button>
                    </div>
                </div>

                {/* Universal Scan Button - Food/Menu/QR auto-detection */}
                {mode === 'IDLE' && (
                    <div className="flex-1 flex flex-col gap-3">
                        <button
                            onClick={handleUniversalScanClick}
                            className="relative bg-gradient-to-br from-orange-500 via-red-500 to-purple-500 hover:from-orange-400 hover:via-red-400 hover:to-purple-400 text-white p-5 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-4"
                        >
                            <div className="flex items-center gap-2">
                                <Camera size={32} />
                                <span className="text-xl font-bold">Фото еды/меню</span>
                            </div>
                            <div className="flex gap-1 opacity-70">
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">🍕 Еда</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">📋 Меню</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">📱 QR</span>
                            </div>
                            {!isScannerUnlocked && (
                                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                    <Lock size={20} className="text-white/80" />
                                </div>
                            )}
                        </button>

                        {/* Manual entry + Today's log preview */}
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Сегодня</span>
                                <button
                                    onClick={() => setShowManualEntry(true)}
                                    className="text-xs text-blue-500 flex items-center gap-1 hover:text-blue-600"
                                >
                                    <PenTool size={12} /> {t('manualEntry')}
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto">
                                {todayLogs.length > 0 ? (
                                    <div className="space-y-1">
                                        {todayLogs.slice(0, 5).map((log, i) => (
                                            <div key={log.id || i} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                                                <span className="truncate text-gray-700 dark:text-gray-300">{log.name}</span>
                                                <span className="text-xs font-medium text-orange-500 ml-2 shrink-0">{log.calories} ккал</span>
                                            </div>
                                        ))}
                                        {todayLogs.length > 5 && (
                                            <div className="text-xs text-center text-gray-400 py-1">+{todayLogs.length - 5} ещё</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                        Нет записей
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 2. FULLSCREEN CAMERA MODAL --- */}
                {(mode === 'CAMERA_FOOD' || mode === 'CAMERA_MENU' || mode === 'CAMERA_UNIVERSAL') && (
                    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
                        {/* Video / Preview */}
                        <div className="flex-1 relative overflow-hidden">
                            {!capturedPreview ? (
                                <>
                                    {/* Tap-to-focus wrapper */}
                                    <div
                                        className="w-full h-full"
                                        onClick={async (e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                                            setFocusPoint({ x, y });

                                            // Apply real camera focus if supported
                                            if (videoRef.current?.srcObject) {
                                                const stream = videoRef.current.srcObject as MediaStream;
                                                const track = stream.getVideoTracks()[0];
                                                const capabilities = track.getCapabilities?.() as any;
                                                if (capabilities?.focusMode?.includes('manual') || capabilities?.focusMode?.includes('single-shot')) {
                                                    try {
                                                        await track.applyConstraints({
                                                            advanced: [{
                                                                focusMode: 'manual',
                                                                pointsOfInterest: [{ x: x / 100, y: y / 100 }]
                                                            }]
                                                        } as any);
                                                    } catch (err) {
                                                        console.log('Focus not supported:', err);
                                                    }
                                                }
                                            }

                                            // Hide focus square after 1.5s
                                            if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
                                            focusTimeoutRef.current = setTimeout(() => setFocusPoint(null), 1500);
                                        }}
                                    >
                                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                        {/* Focus indicator */}
                                        {focusPoint && (
                                            <div
                                                className="absolute w-16 h-16 border-2 border-yellow-400 rounded-lg pointer-events-none animate-pulse"
                                                style={{
                                                    left: `${focusPoint.x}%`,
                                                    top: `${focusPoint.y}%`,
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                            />
                                        )}
                                    </div>
                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Frame guide */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className={`border-2 border-white/60 rounded-2xl ${mode === 'CAMERA_MENU' ? 'w-[85%] h-[70%]' : 'w-72 h-72'}`}>
                                            {/* Corner accents */}
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
                                        </div>
                                    </div>

                                    {/* Top hint */}
                                    {mode === 'CAMERA_FOOD' && (
                                        <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
                                            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                                                {t('placeObjectInfo')} <span className="font-bold text-yellow-400">{selectedRefObject}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Photo Preview */
                                <img
                                    src={`data:image/jpeg;base64,${capturedPreview}`}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        {/* Top controls */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                            <button
                                onClick={() => {
                                    const stream = videoRef.current?.srcObject as MediaStream;
                                    stream?.getTracks().forEach(t => t.stop());
                                    setCapturedPreview(null);
                                    setMode('IDLE');
                                }}
                                className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"
                            >
                                <X size={24} />
                            </button>

                            {!capturedPreview && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={toggleFlash}
                                        className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"
                                    >
                                        {flashEnabled ? <Zap size={24} className="text-yellow-400" /> : <ZapOff size={24} />}
                                    </button>
                                    <button
                                        onClick={switchCamera}
                                        className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"
                                    >
                                        <SwitchCamera size={24} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Small reference hint in corner for universal mode */}
                        {mode === 'CAMERA_UNIVERSAL' && !capturedPreview && (
                            <div className="absolute top-20 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 text-white/80 text-xs">
                                <CreditCard size={16} />
                                <span>Положите карту для масштаба</span>
                            </div>
                        )}

                        {/* Cached menu notification */}
                        {cachedMenuFound && mode === 'CAMERA_UNIVERSAL' && !capturedPreview && (
                            <div className="absolute top-32 left-4 right-4">
                                <div className="bg-green-500/90 backdrop-blur-sm rounded-xl p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-white">
                                            <MapPin size={18} />
                                            <div>
                                                <span className="text-sm font-medium block">{cachedMenuFound.name}</span>
                                                <span className="text-xs opacity-80">
                                                    {cachedMenuFound.menuItems.length} блюд • {cachedMenuFound.healthyItemsCount} полезных
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={useCachedMenu}
                                            className="bg-white text-green-600 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1"
                                        >
                                            <Zap size={14} />
                                            Открыть
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Multi-page menu indicator */}
                        {menuPages.length > 0 && (
                            <div className="absolute top-20 left-4 bg-purple-500/90 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
                                📄 Страниц: {menuPages.length}
                            </div>
                        )}

                        {/* Bottom controls */}
                        <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
                            {!capturedPreview ? (
                                <>
                                    {/* Reference object selector (legacy food mode only) */}
                                    {mode === 'CAMERA_FOOD' && (
                                        <div className="px-4 mb-4">
                                            <button
                                                onClick={() => setShowCameraRefSelector(!showCameraRefSelector)}
                                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white text-sm flex items-center justify-between"
                                            >
                                                <span>{t('referenceObject')}: <b>{selectedRefObject}</b></span>
                                                <ChevronRight size={18} className={`transition-transform ${showCameraRefSelector ? 'rotate-90' : ''}`} />
                                            </button>

                                            {showCameraRefSelector && (
                                                <div className="mt-2 bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {alternativeObjects.map(obj => (
                                                            <button
                                                                key={obj.id}
                                                                onClick={() => {
                                                                    setSelectedRefObject(t(obj.label as any));
                                                                    setShowCameraRefSelector(false);
                                                                }}
                                                                className={`p-2 rounded-lg flex flex-col items-center gap-1 transition ${
                                                                    selectedRefObject === t(obj.label as any)
                                                                        ? 'bg-white/20 ring-2 ring-white'
                                                                        : 'bg-white/5 hover:bg-white/10'
                                                                }`}
                                                            >
                                                                <div className="w-6 h-6 text-white">{obj.icon}</div>
                                                                <span className="text-[10px] text-white/80 truncate w-full text-center">
                                                                    {t(obj.label as any)}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mode indicator for universal camera */}
                                    {mode === 'CAMERA_UNIVERSAL' && (
                                        <div className="flex justify-center mb-4">
                                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 flex gap-3 text-white/80 text-xs">
                                                <span>🍕 Еда</span>
                                                <span>📋 Меню</span>
                                                <span>📱 QR</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Capture button */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={capturePhoto}
                                            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition border-4 border-white/50"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-300" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* Preview actions - with multi-page support for menus */
                                <div className="flex flex-col gap-4">
                                    {/* Multi-page menu controls */}
                                    {mode === 'CAMERA_UNIVERSAL' && (
                                        <div className="flex justify-center gap-2 px-4">
                                            <button
                                                onClick={() => {
                                                    setMenuPages(prev => [...prev, capturedPreview!]);
                                                    setCapturedPreview(null);
                                                    setIsCapturingMenuPages(true);
                                                }}
                                                className="flex items-center gap-2 bg-purple-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm"
                                            >
                                                <ImagePlus size={18} />
                                                <span>+ Страница меню</span>
                                            </button>
                                            {menuPages.length > 0 && (
                                                <button
                                                    onClick={finishMenuCapture}
                                                    className="flex items-center gap-2 bg-green-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm"
                                                >
                                                    <Check size={18} />
                                                    <span>Готово ({menuPages.length + 1})</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-center gap-8 px-4">
                                        <button
                                            onClick={retakePreview}
                                            className="flex flex-col items-center gap-2 text-white"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                                <RotateCcw size={28} />
                                            </div>
                                            <span className="text-sm">{t('retake') || 'Переснять'}</span>
                                        </button>
                                        <button
                                            onClick={usePhoto}
                                            className="flex flex-col items-center gap-2 text-white"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                                                <Check size={32} />
                                            </div>
                                            <span className="text-sm">{t('usePhoto') || 'Использовать'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- 3. DETECTING TYPE STATE --- */}
                {mode === 'DETECTING_TYPE' && (
                    <div className="h-64 rounded-xl bg-gradient-to-br from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30 flex flex-col items-center justify-center text-center p-6">
                        <div className="flex gap-4 mb-4">
                            <div className="animate-bounce delay-0">🍕</div>
                            <div className="animate-bounce delay-100">📋</div>
                            <div className="animate-bounce delay-200">📱</div>
                        </div>
                        <Loader2 size={32} className="text-purple-500 animate-spin mb-3" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">Определяю тип...</p>
                        <p className="text-xs text-gray-400 mt-1">Еда, меню или QR-код?</p>
                    </div>
                )}

                {/* --- 3.5. ANALYZING STATE --- */}
                {mode === 'ANALYZING' && (
                    <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-center p-6 animate-pulse">
                        <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium dark:text-gray-300">
                            {detectedType === 'FOOD' && '🍕 Анализирую еду...'}
                            {detectedType === 'MENU' && '📋 Анализирую меню...'}
                            {!detectedType && t('analyzingFood')}
                        </p>
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
                             <div>
                                 <h4 className="font-bold text-gray-900 dark:text-white">{t('menuRecs')}</h4>
                                 {menuFromCache && (
                                     <div className="flex items-center gap-2 mt-1">
                                         <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                             <Zap size={12} />
                                             Из кэша • Токенов сэкономлено: {tokensSavedTotal}
                                         </span>
                                     </div>
                                 )}
                             </div>
                             <button onClick={() => { setMode('IDLE'); setMenuFromCache(false); }} className="text-gray-500"><X size={20}/></button>
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
                            <div className="flex justify-center gap-3 mb-6">
                                {alternativeObjects.slice(0, 4).map(obj => (
                                    <div key={obj.id} className="w-10 h-10 text-gray-500 dark:text-gray-400" title={t(obj.label as any)}>
                                        {obj.icon}
                                    </div>
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
                                            <div className="w-8 h-8 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                                                {obj.icon}
                                            </div>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                                                {t(obj.label as any)}
                                            </span>
                                        </button>
                                    ))}
                                    {/* Add custom object button */}
                                    <button
                                        onClick={() => setShowAddCustomRef(true)}
                                        className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 p-3 rounded-xl flex flex-col items-center gap-1 transition active:scale-95"
                                    >
                                        <div className="w-8 h-8 text-gray-400 dark:text-gray-500 flex items-center justify-center">
                                            <Plus size={24} />
                                        </div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate w-full text-center">
                                            {t('addCustom') || 'Своё'}
                                        </span>
                                    </button>
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

            {/* Add Custom Reference Object Modal */}
            {showAddCustomRef && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[85] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                                {t('addCustomRefObject') || 'Добавить свой предмет'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">
                                        {t('objectName') || 'Название'}
                                    </label>
                                    <input
                                        type="text"
                                        value={customRefName}
                                        onChange={(e) => setCustomRefName(e.target.value)}
                                        placeholder={t('exampleAirpods') || 'Напр: AirPods, IQOS'}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">
                                        {t('dimensions') || 'Размеры'}
                                    </label>
                                    <input
                                        type="text"
                                        value={customRefDimensions}
                                        onChange={(e) => setCustomRefDimensions(e.target.value)}
                                        placeholder={t('exampleDimensions') || 'Напр: 5.4 x 4.5 см'}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAddCustomRef(false);
                                        setCustomRefName('');
                                        setCustomRefDimensions('');
                                    }}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        if (customRefName.trim()) {
                                            handleUseAlternative({
                                                id: 'custom',
                                                label: customRefName,
                                                dimensions: customRefDimensions || 'custom size'
                                            });
                                            setShowAddCustomRef(false);
                                            setCustomRefName('');
                                            setCustomRefDimensions('');
                                        }
                                    }}
                                    disabled={!customRefName.trim()}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white font-bold py-3 rounded-xl transition"
                                >
                                    {t('add')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Home-Made Verification Dialog */}
            {showHomeMadeDialog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ChefHat size={32} className="text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('homeMadeQuestion')}</h3>

                            {missingIngredients.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                                        {t('ingredientsNotInInventory')}:
                                    </p>
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {missingIngredients.slice(0, 5).map((ing, idx) => (
                                            <span key={idx} className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2 py-1 rounded-full">
                                                {ing}
                                            </span>
                                        ))}
                                        {missingIngredients.length > 5 && (
                                            <span className="text-gray-400 text-xs">+{missingIngredients.length - 5}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirmHomeMade}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    <ChefHat size={18} />
                                    {t('homeMadeYes')}
                                </button>
                                <button
                                    onClick={handleConfirmOutside}
                                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    <Package size={18} />
                                    {t('homeMadeNo')}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowHomeMadeDialog(false);
                                        setMissingIngredients([]);
                                        setPendingFoodResult(null);
                                        setPendingPhotoBase64(null);
                                    }}
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
                                onOpenKitchenCamera={() => setActiveToolSheet('kitchen')}
                                onOpenManualAdd={() => setActiveToolSheet('kitchen')}
                                onOpenShopping={() => setActiveToolSheet('finance')}
                            />
                        )}
                        {activeToolSheet === 'finance' && <FoodFinance />}
                    </div>
                </div>
            )}
        </div>
    );
};
