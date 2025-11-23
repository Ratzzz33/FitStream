

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Droplets, Utensils, X, CheckCircle, Loader2, AlertCircle, GlassWater, Milk, Coffee, Lock, PenTool } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { analyzeFood } from '../services/geminiService';
import { NutritionLog } from '../types';
import { t } from '../services/i18n';
import { AchievementRing } from './AchievementRings';

interface NutritionTrackerProps {
  onRequestPro: () => void;
}

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({ onRequestPro }) => {
    const [needsUpdate, setNeedsUpdate] = useState(0);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [scannedFood, setScannedFood] = useState<NutritionLog | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Manual Entry State
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualCals, setManualCals] = useState('');
    const [manualProt, setManualProt] = useState('');
    const [manualCarbs, setManualCarbs] = useState('');
    const [manualFat, setManualFat] = useState('');

    const settings = StorageService.getSettings();
    const dailyNeeds = StorageService.calculateDailyNeeds();
    const todayStats = StorageService.getTodayNutrition();

    // Check Trial Status
    const installDate = new Date(settings.installDate).getTime();
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

    const startCamera = async () => {
        setIsCameraOpen(true);
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
            setIsCameraOpen(false);
        }
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        setAnalyzing(true);
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context?.drawImage(videoRef.current, 0, 0);
        
        const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        setIsCameraOpen(false);

        try {
            const result = await analyzeFood(base64, settings.referenceObject || 'Hand');
            setScannedFood({
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),
                type: 'FOOD',
                name: result.name,
                calories: result.calories,
                protein: result.protein,
                carbs: result.carbs,
                fat: result.fat
            });
        } catch (e) {
            alert(t('scanError'));
        } finally {
            setAnalyzing(false);
        }
    };

    const saveFood = () => {
        if (scannedFood) {
            StorageService.saveNutrition(scannedFood);
            setScannedFood(null);
            setNeedsUpdate(prev => prev + 1);
        }
    };

    const saveManualFood = () => {
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
            fat: parseInt(manualFat) || 0
        };
        StorageService.saveNutrition(log);
        setShowManualEntry(false);
        setManualName('');
        setManualCals('');
        setManualProt('');
        setManualCarbs('');
        setManualFat('');
        setNeedsUpdate(prev => prev + 1);
    };

    return (
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
                    <span className="text-xs text-gray-500 mt-2">{todayStats.water}ml / {dailyNeeds.water}ml</span>
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
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{t('waterGoal')}: {dailyNeeds.water}ml</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    {/* Glass 150ml */}
                    <button 
                        onClick={() => addWater(150, 'Glass')}
                        className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition active:scale-95 shadow-sm group"
                    >
                        <div className="relative">
                            <GlassWater size={20} className="text-blue-400" />
                            <div className="absolute -top-1 -right-2 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                                <Plus size={8} strokeWidth={4} />
                            </div>
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('glass')}</span>
                        <span className="text-[10px] text-gray-400">150ml</span>
                    </button>

                    {/* Cup 200ml */}
                    <button 
                        onClick={() => addWater(200, 'Cup')}
                        className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition active:scale-95 shadow-sm group"
                    >
                        <div className="relative">
                            <Coffee size={24} className="text-blue-500" />
                            <div className="absolute -top-1 -right-2 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                                <Plus size={8} strokeWidth={4} />
                            </div>
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('cup')}</span>
                        <span className="text-[10px] text-gray-400">200ml</span>
                    </button>

                    {/* Bottle 500ml */}
                    <button 
                        onClick={() => addWater(500, 'Bottle')}
                        className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition active:scale-95 shadow-sm group"
                    >
                        <div className="relative">
                            <Milk size={24} className="text-blue-600" />
                            <div className="absolute -top-1 -right-2 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                                <Plus size={8} strokeWidth={4} />
                            </div>
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('bottle')}</span>
                        <span className="text-[10px] text-gray-400">500ml</span>
                    </button>
                </div>
            </div>

            {/* Food Tracker */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Utensils size={20} className="text-orange-500" />
                    {t('nutritionTracker')}
                </h3>

                {isCameraOpen ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black shadow-inner">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-white/50 border-dashed rounded-lg mb-4"></div>
                            <div className="bg-black/60 px-3 py-1 rounded text-white text-xs backdrop-blur">
                                {t('placeObjectInfo')} <span className="font-bold text-yellow-400">({settings.referenceObject})</span>
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-auto">
                            <button 
                                onClick={captureAndAnalyze}
                                className="bg-white text-black p-4 rounded-full shadow-lg hover:bg-gray-200 transition transform active:scale-95"
                            >
                                <Camera size={24} />
                            </button>
                        </div>
                    </div>
                ) : analyzing ? (
                    <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-center p-6 animate-pulse">
                        <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">{t('analyzingFood')}</p>
                        <p className="text-xs text-gray-400 mt-2">Using "{settings.referenceObject}" for scale</p>
                    </div>
                ) : scannedFood ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-orange-200 dark:border-orange-900/50 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h4 className="text-xl font-bold text-gray-900 dark:text-white">{scannedFood.name}</h4>
                                 <p className="text-orange-500 font-mono font-bold text-lg">{scannedFood.calories} kcal</p>
                             </div>
                             <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-bold">
                                 AI Est.
                             </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center">
                                <span className="block text-xs text-gray-500">Prot</span>
                                <span className="font-bold text-gray-800 dark:text-white">{scannedFood.protein}g</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center">
                                <span className="block text-xs text-gray-500">Carb</span>
                                <span className="font-bold text-gray-800 dark:text-white">{scannedFood.carbs}g</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-center">
                                <span className="block text-xs text-gray-500">Fat</span>
                                <span className="font-bold text-gray-800 dark:text-white">{scannedFood.fat}g</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setScannedFood(null)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800">
                                {t('dismiss')}
                            </button>
                            <button onClick={saveFood} className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20">
                                {t('save')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                         {isScannerUnlocked ? (
                            <button 
                                onClick={startCamera}
                                className="w-full py-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-300 group"
                            >
                                <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full group-hover:scale-110 transition">
                                    <Camera size={32} className="text-orange-500" />
                                </div>
                                <span className="font-medium">{t('scanFood')}</span>
                            </button>
                         ) : (
                             // LOCKED SCANNER STATE
                             <div className="space-y-3">
                                <button 
                                    onClick={onRequestPro}
                                    className="w-full py-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 relative overflow-hidden group hover:border-orange-300 dark:hover:border-orange-700 transition"
                                >
                                    <div className="absolute top-2 right-2 text-xs bg-black text-white px-2 py-0.5 rounded font-bold">{t('trialEnded')}</div>
                                    <Lock size={24} className="text-gray-400 mb-1 group-hover:text-orange-500 transition-colors" />
                                    <span className="font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">{t('scannerLocked')}</span>
                                    <span className="text-xs text-orange-500 font-medium">{t('upgradeToScan')}</span>
                                </button>
                                
                                <button
                                    onClick={() => setShowManualEntry(true)}
                                    className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 transition"
                                >
                                    <PenTool size={18} />
                                    <span className="font-medium">{t('manualEntry')}</span>
                                </button>
                                <p className="text-[10px] text-center text-gray-400 px-4">{t('manualEntryDesc')}</p>
                             </div>
                         )}
                    </div>
                )}
            </div>

            {/* Reference Object Warning if missing */}
            {!settings.referenceObject && isScannerUnlocked && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg flex items-start gap-3 border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Missing Reference Object</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Go to Settings to define your reference object (e.g., Keys) for accurate AI sizing.
                        </p>
                    </div>
                </div>
            )}

            {/* Manual Entry Modal */}
            {showManualEntry && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                                <input 
                                    type="text" 
                                    value={manualName}
                                    onChange={(e) => setManualName(e.target.value)}
                                    placeholder="e.g. Banana"
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                    autoFocus
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
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Protein (g)</label>
                                    <input 
                                        type="number" 
                                        value={manualProt}
                                        onChange={(e) => setManualProt(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Carbs (g)</label>
                                    <input 
                                        type="number" 
                                        value={manualCarbs}
                                        onChange={(e) => setManualCarbs(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Fat (g)</label>
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
    );
};
