import React, { useState, useRef, useEffect } from 'react';
import {
    ShoppingCart, ChefHat, Users, Clock, Loader2, Camera, Check, X,
    AlertTriangle, Sparkles, ChevronRight, ChevronDown, ChevronUp,
    ScanLine, RefreshCw, Heart, AlertCircle, Eye, Package
} from 'lucide-react';
import { t } from '../services/i18n';
import {
    ShoppingPreferences,
    ShoppingSession,
    ShoppingListItem,
    PlannedMeal,
    CookingDifficulty,
    CookingTime,
    ShoppingCategory,
    InventoryItem,
    ProductVerification
} from '../types';
import {
    generateMealPlanForShopping,
    verifyProductPhoto,
    scanStoreShelf,
    suggestProductAlternative,
    checkDuplicateInInventory,
    ShelfScanResult
} from '../services/geminiService';
import { StorageService } from '../services/storageService';

type ShoppingView = 'home' | 'planning' | 'list' | 'shopping' | 'verify' | 'shelf' | 'complete';

const CATEGORY_ICONS: Record<ShoppingCategory, string> = {
    dairy: '🥛',
    meat: '🥩',
    fish: '🐟',
    vegetables: '🥬',
    fruits: '🍎',
    grains: '🌾',
    bread: '🍞',
    frozen: '🧊',
    drinks: '🥤',
    snacks: '🍪',
    spices: '🧂',
    other: '📦'
};

const HEALTH_COLORS = {
    1: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-500' },
    2: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500' },
    3: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500' }
};

interface Props {
    onRequestPro?: () => void;
}

export const ShoppingAssistant: React.FC<Props> = ({ onRequestPro }) => {
    const [view, setView] = useState<ShoppingView>('home');
    const [session, setSession] = useState<ShoppingSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Planning state
    const [preferences, setPreferences] = useState<ShoppingPreferences>({
        daysCount: 3,
        peopleCount: 2,
        cookingDifficulty: 'easy',
        maxCookingTime: 'quick',
        budget: undefined
    });

    // Verification state
    const [currentItem, setCurrentItem] = useState<ShoppingListItem | null>(null);
    const [verificationResult, setVerificationResult] = useState<ProductVerification | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Shelf scan state
    const [shelfResult, setShelfResult] = useState<ShelfScanResult | null>(null);
    const [shelfImage, setShelfImage] = useState<string | null>(null);

    // Camera refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // Expanded meal days
    const [expandedDays, setExpandedDays] = useState<number[]>([1]);

    // Load inventory
    const inventory = StorageService.getInventory?.() || [];

    // Camera functions
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setCameraActive(true);
            }
        } catch (e) {
            setError(t('cameraDenied'));
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    const capturePhoto = (): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg').split(',')[1];
    };

    // Generate meal plan
    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateMealPlanForShopping(inventory, preferences);
            const newSession: ShoppingSession = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                preferences,
                mealPlan: result.meals,
                shoppingList: result.shoppingList,
                status: 'planning',
                totalEstimatedCost: result.totalEstimatedCost
            };
            setSession(newSession);
            setView('list');
        } catch (e) {
            setError(String(e));
        } finally {
            setIsLoading(false);
        }
    };

    // Start shopping mode
    const handleStartShopping = () => {
        if (session) {
            setSession({ ...session, status: 'shopping' });
            setView('shopping');
        }
    };

    // Toggle item checked
    const toggleItemChecked = (itemId: string) => {
        if (!session) return;
        const updatedList = session.shoppingList.map(item =>
            item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
        );
        setSession({ ...session, shoppingList: updatedList });
    };

    // Verify product photo
    const handleVerifyProduct = async (item: ShoppingListItem) => {
        setCurrentItem(item);
        setVerificationResult(null);
        setView('verify');
        await startCamera();
    };

    const captureAndVerify = async () => {
        if (!currentItem) return;
        setIsVerifying(true);
        const photo = capturePhoto();
        if (photo) {
            try {
                const result = await verifyProductPhoto(photo, currentItem);
                setVerificationResult(result);
            } catch (e) {
                setError(String(e));
            }
        }
        setIsVerifying(false);
    };

    const confirmVerification = (isCorrect: boolean) => {
        if (!session || !currentItem) return;
        const updatedList = session.shoppingList.map(item =>
            item.id === currentItem.id
                ? {
                    ...item,
                    isChecked: isCorrect,
                    verificationStatus: isCorrect ? 'correct' as const : 'wrong' as const,
                    healthScore: verificationResult?.healthScore
                }
                : item
        );
        setSession({ ...session, shoppingList: updatedList });
        stopCamera();
        setView('shopping');
        setCurrentItem(null);
        setVerificationResult(null);
    };

    // Scan shelf
    const handleScanShelf = async () => {
        setShelfResult(null);
        setShelfImage(null);
        setView('shelf');
        await startCamera();
    };

    const captureAndScanShelf = async () => {
        if (!session) return;
        setIsLoading(true);
        const photo = capturePhoto();
        if (photo) {
            setShelfImage(photo);
            try {
                const result = await scanStoreShelf(photo, session.shoppingList);
                setShelfResult(result);
            } catch (e) {
                setShelfResult({ products: [], notRecognized: true, notRecognizedReason: String(e) });
            }
        }
        setIsLoading(false);
    };

    // Mark item from shelf scan
    const markItemFromShelf = (listItemId: string) => {
        if (!session) return;
        const updatedList = session.shoppingList.map(item =>
            item.id === listItemId ? { ...item, isChecked: true, verificationStatus: 'correct' as const } : item
        );
        setSession({ ...session, shoppingList: updatedList });
    };

    // Finish shopping
    const handleFinishShopping = () => {
        if (session) {
            setSession({ ...session, status: 'completed' });
            setView('complete');
        }
    };

    // Cleanup camera on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    // Group shopping list by category
    const groupedList = session?.shoppingList.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<ShoppingCategory, ShoppingListItem[]>) || {};

    // Progress
    const checkedCount = session?.shoppingList.filter(i => i.isChecked).length || 0;
    const totalCount = session?.shoppingList.length || 0;
    const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

    // Render functions
    const renderHome = () => (
        <div className="px-4 space-y-6 pb-24">
            <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <ShoppingCart size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('shoppingAssistant')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('wifeTip')} 👩‍🍳
                </p>
            </div>

            <button
                onClick={() => setView('planning')}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between hover:from-emerald-400 hover:to-teal-400 transition transform active:scale-[0.98]"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <ChefHat size={28} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-lg">{t('goShopping')}</p>
                        <p className="text-sm text-white/80">{t('planMeals')}</p>
                    </div>
                </div>
                <ChevronRight size={24} />
            </button>

            {session && session.status !== 'completed' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            {t('shoppingList')}
                        </h3>
                        <span className="text-sm text-gray-500">
                            {checkedCount}/{totalCount}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <button
                        onClick={() => setView(session.status === 'shopping' ? 'shopping' : 'list')}
                        className="w-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 py-2 rounded-xl font-bold"
                    >
                        {session.status === 'shopping' ? t('startShopping') : t('shoppingList')}
                    </button>
                </div>
            )}

            <div className="text-center text-xs text-gray-400 pt-4">
                {t('startNewShopping')}
            </div>
        </div>
    );

    const renderPlanning = () => (
        <div className="px-4 space-y-6 pb-24">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <X size={24} className="text-gray-500" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('planMeals')}</h2>
            </div>

            {/* Days */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('howManyDays')}
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 5, 7].map(d => (
                        <button
                            key={d}
                            onClick={() => setPreferences({ ...preferences, daysCount: d })}
                            className={`flex-1 py-3 rounded-xl font-bold transition ${
                                preferences.daysCount === d
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* People */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('howManyPeople')}
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(p => (
                        <button
                            key={p}
                            onClick={() => setPreferences({ ...preferences, peopleCount: p })}
                            className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                                preferences.peopleCount === p
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <Users size={16} /> {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('cookingDifficulty')}
                </label>
                <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as CookingDifficulty[]).map(d => (
                        <button
                            key={d}
                            onClick={() => setPreferences({ ...preferences, cookingDifficulty: d })}
                            className={`flex-1 py-3 rounded-xl font-bold transition ${
                                preferences.cookingDifficulty === d
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {d === 'easy' && '😊'} {d === 'medium' && '👨‍🍳'} {d === 'hard' && '🎯'}
                            <span className="ml-1">{t(d)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Time */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('cookingTime')}
                </label>
                <div className="flex flex-col gap-2">
                    {(['quick', 'medium', 'long'] as CookingTime[]).map(time => (
                        <button
                            key={time}
                            onClick={() => setPreferences({ ...preferences, maxCookingTime: time })}
                            className={`py-3 px-4 rounded-xl font-medium transition flex items-center gap-3 ${
                                preferences.maxCookingTime === time
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <Clock size={18} />
                            {time === 'quick' && t('quick')}
                            {time === 'medium' && t('mediumTime')}
                            {time === 'long' && t('long')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Budget */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('budget')} <span className="text-gray-400">({t('optional')})</span>
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={preferences.budget || ''}
                        onChange={e => setPreferences({
                            ...preferences,
                            budget: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        placeholder="5000"
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-emerald-500"
                    />
                    <span className="text-gray-500">₽</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-2">
                    <AlertTriangle size={20} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            <button
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        {t('generatingPlan')}
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        {t('generatePlan')}
                    </>
                )}
            </button>
        </div>
    );

    const renderList = () => (
        <div className="px-4 space-y-4 pb-24">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <X size={24} className="text-gray-500" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('mealPlan')}</h2>
                <div className="w-10" />
            </div>

            {/* Meal Plan */}
            {session?.mealPlan && (
                <div className="space-y-3">
                    {Array.from(new Set(session.mealPlan.map(m => m.day))).map(day => (
                        <div key={day} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button
                                onClick={() => setExpandedDays(
                                    expandedDays.includes(day)
                                        ? expandedDays.filter(d => d !== day)
                                        : [...expandedDays, day]
                                )}
                                className="w-full p-4 flex items-center justify-between"
                            >
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {t('day')} {day}
                                </span>
                                {expandedDays.includes(day) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            {expandedDays.includes(day) && (
                                <div className="px-4 pb-4 space-y-3">
                                    {session.mealPlan.filter(m => m.day === day).map(meal => (
                                        <div key={meal.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-500 uppercase">
                                                    {meal.mealType === 'breakfast' && '🌅 ' + t('breakfast')}
                                                    {meal.mealType === 'lunch' && '☀️ ' + t('lunch')}
                                                    {meal.mealType === 'dinner' && '🌙 ' + t('dinner')}
                                                    {meal.mealType === 'snack' && '🍎 ' + t('snack')}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {meal.cookingTime} мин • {meal.calories} ккал
                                                </span>
                                            </div>
                                            <p className="font-bold text-gray-900 dark:text-white">{meal.recipeName}</p>
                                            {meal.recipeDescription && (
                                                <p className="text-xs text-gray-500 mt-1">{meal.recipeDescription}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Shopping List Summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <ShoppingCart size={18} /> {t('shoppingList')}
                    </h3>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">
                        {session?.shoppingList.length} товаров
                    </span>
                </div>
                <p className="text-emerald-700 dark:text-emerald-400 text-sm mb-3">
                    {t('estimatedCost')}: ~{session?.totalEstimatedCost} ₽
                </p>

                {/* Categories preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(groupedList).map(([cat, items]) => (
                        <span key={cat} className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                            {CATEGORY_ICONS[cat as ShoppingCategory]} {items.length}
                        </span>
                    ))}
                </div>

                <button
                    onClick={handleStartShopping}
                    className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                    <ShoppingCart size={18} /> {t('startShopping')}
                </button>
            </div>
        </div>
    );

    const renderShopping = () => (
        <div className="px-4 space-y-4 pb-24">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <X size={24} className="text-gray-500" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('shoppingList')}</h2>
                <button
                    onClick={handleScanShelf}
                    className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600"
                >
                    <Eye size={20} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{checkedCount}/{totalCount} товаров</span>
                    <span className="text-sm font-bold text-emerald-500">{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Categories */}
            {Object.entries(groupedList).map(([category, items]) => (
                <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <span className="text-xl">{CATEGORY_ICONS[category as ShoppingCategory]}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {t(category as any)}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                            {items.filter(i => i.isChecked).length}/{items.length}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map(item => (
                            <div
                                key={item.id}
                                className={`p-3 flex items-center gap-3 transition ${
                                    item.isChecked ? 'bg-gray-50 dark:bg-gray-900/50 opacity-60' : ''
                                }`}
                            >
                                <button
                                    onClick={() => toggleItemChecked(item.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                                        item.isChecked
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                >
                                    {item.isChecked && <Check size={14} />}
                                </button>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={item.isChecked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}>
                                            {item.emoji} {item.name}
                                        </span>
                                        {item.healthScore && (
                                            <span className={`w-2 h-2 rounded-full ${
                                                item.healthScore === 1 ? 'bg-green-500' :
                                                item.healthScore === 2 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`} />
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <span>{item.quantity} {item.unit}</span>
                                        {item.expiryReminder && (
                                            <span className="text-orange-500 flex items-center gap-0.5">
                                                <AlertCircle size={10} /> {t('checkExpiry')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!item.isChecked && (
                                    <button
                                        onClick={() => handleVerifyProduct(item)}
                                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-emerald-500"
                                    >
                                        <Camera size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {checkedCount === totalCount && totalCount > 0 && (
                <button
                    onClick={handleFinishShopping}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-bold shadow-lg"
                >
                    {t('finishShopping')} ✓
                </button>
            )}
        </div>
    );

    const renderVerify = () => (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                    <button onClick={() => { stopCamera(); setView('shopping'); }} className="p-2 bg-white/20 rounded-full backdrop-blur">
                        <X size={20} className="text-white" />
                    </button>
                    {currentItem && (
                        <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                            <span className="text-white font-bold">
                                {currentItem.emoji} {currentItem.name}
                            </span>
                        </div>
                    )}
                    <div className="w-10" />
                </div>
            </div>

            {/* Camera */}
            <div className="flex-1 relative">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay */}
                {!verificationResult && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-2 border-emerald-500/50 border-dashed rounded-2xl flex items-center justify-center">
                            <span className="bg-black/40 text-white text-sm px-3 py-1 rounded-full backdrop-blur">
                                {t('isThisIt')}
                            </span>
                        </div>
                    </div>
                )}

                {/* Result overlay */}
                {verificationResult && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
                            {/* Status */}
                            <div className={`text-center mb-4 ${verificationResult.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                                {verificationResult.isCorrect ? (
                                    <>
                                        <Check size={48} className="mx-auto mb-2" />
                                        <p className="text-xl font-bold">{t('correctProduct')}</p>
                                    </>
                                ) : (
                                    <>
                                        <X size={48} className="mx-auto mb-2" />
                                        <p className="text-xl font-bold">{t('wrongProduct')}</p>
                                    </>
                                )}
                            </div>

                            {/* Product info */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                                <p className="font-bold text-gray-900 dark:text-white mb-2">
                                    {verificationResult.productName}
                                </p>

                                {/* Health score */}
                                <div className={`flex items-center gap-2 mb-2 ${HEALTH_COLORS[verificationResult.healthScore].text}`}>
                                    <Heart size={16} />
                                    <span className="text-sm">
                                        {verificationResult.healthScore === 1 && t('healthyChoice')}
                                        {verificationResult.healthScore === 2 && t('moderateChoice')}
                                        {verificationResult.healthScore === 3 && t('unhealthyChoice')}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-500">{verificationResult.healthAnalysis}</p>

                                {/* Expiry warning */}
                                {verificationResult.expiryWarning && (
                                    <div className="mt-2 flex items-center gap-2 text-orange-500 text-sm">
                                        <AlertTriangle size={14} />
                                        {verificationResult.expiryWarning}
                                    </div>
                                )}

                                {/* Better alternative */}
                                {verificationResult.betterAlternative && (
                                    <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                            💡 {t('betterAlternative')}: {verificationResult.betterAlternative.name}
                                        </p>
                                        <p className="text-xs text-emerald-500">{verificationResult.betterAlternative.reason}</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setVerificationResult(null)}
                                    className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300"
                                >
                                    {t('retake')}
                                </button>
                                <button
                                    onClick={() => confirmVerification(verificationResult.isCorrect)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-white ${
                                        verificationResult.isCorrect ? 'bg-emerald-500' : 'bg-gray-500'
                                    }`}
                                >
                                    {verificationResult.isCorrect ? t('itemChecked') : 'OK'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Capture button */}
            {!verificationResult && (
                <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                    <button
                        onClick={captureAndVerify}
                        disabled={isVerifying}
                        className="bg-white text-black p-5 rounded-full shadow-lg hover:bg-gray-100 transition transform active:scale-95"
                    >
                        {isVerifying ? <Loader2 className="animate-spin" size={28} /> : <Camera size={28} />}
                    </button>
                </div>
            )}
        </div>
    );

    const renderShelfScan = () => (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                    <button onClick={() => { stopCamera(); setView('shopping'); }} className="p-2 bg-white/20 rounded-full backdrop-blur">
                        <X size={20} className="text-white" />
                    </button>
                    <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                        <span className="text-white font-bold flex items-center gap-2">
                            <Eye size={16} /> Покажи витрину
                        </span>
                    </div>
                    <div className="w-10" />
                </div>
            </div>

            {/* Camera / Result */}
            <div className="flex-1 relative">
                {!shelfResult ? (
                    <>
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-80 h-64 border-2 border-emerald-500/50 border-dashed rounded-2xl flex items-center justify-center">
                                <span className="bg-black/40 text-white text-sm px-3 py-1 rounded-full backdrop-blur">
                                    📸 Сфоткай полку/витрину
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full relative">
                        {/* Shelf image with markers */}
                        {shelfImage && (
                            <div className="relative w-full h-full">
                                <img
                                    src={`data:image/jpeg;base64,${shelfImage}`}
                                    className="w-full h-full object-cover"
                                    alt="Shelf"
                                />

                                {/* Product markers */}
                                {!shelfResult.notRecognized && shelfResult.products.map((product, idx) => (
                                    <div
                                        key={idx}
                                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                                            product.isNeeded
                                                ? 'bg-emerald-500 ring-4 ring-emerald-500/50 animate-pulse'
                                                : 'bg-gray-500/70'
                                        } text-white px-2 py-1 rounded-full text-xs font-bold`}
                                        style={{
                                            left: `${product.positionX}%`,
                                            top: `${product.positionY}%`
                                        }}
                                        onClick={() => {
                                            if (product.isNeeded && product.matchedListItem) {
                                                markItemFromShelf(product.matchedListItem);
                                            }
                                        }}
                                    >
                                        {product.emoji} {product.isNeeded && '✓'}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Result panel */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-4 max-h-[50%] overflow-y-auto">
                            {shelfResult.notRecognized ? (
                                <div className="text-center py-6">
                                    <AlertTriangle size={48} className="mx-auto mb-3 text-yellow-500" />
                                    <p className="font-bold text-gray-900 dark:text-white mb-2">
                                        Не удалось распознать
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {shelfResult.notRecognizedReason || 'Попробуй сфоткать ближе или при лучшем освещении'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {shelfResult.tip && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl mb-3">
                                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                                💡 {shelfResult.tip}
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-500 mb-2">
                                        Найдено товаров: {shelfResult.products.length}
                                    </p>

                                    {/* Needed products */}
                                    <div className="space-y-2">
                                        {shelfResult.products.filter(p => p.isNeeded).map((product, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl"
                                            >
                                                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                                    {product.emoji} {product.name}
                                                </span>
                                                <button
                                                    onClick={() => product.matchedListItem && markItemFromShelf(product.matchedListItem)}
                                                    className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm"
                                                >
                                                    Взять ✓
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <button
                                onClick={() => { setShelfResult(null); setShelfImage(null); }}
                                className="w-full mt-4 bg-gray-200 dark:bg-gray-700 py-3 rounded-xl font-bold"
                            >
                                <RefreshCw size={16} className="inline mr-2" />
                                Сканировать ещё
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Capture button */}
            {!shelfResult && (
                <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                    <button
                        onClick={captureAndScanShelf}
                        disabled={isLoading}
                        className="bg-white text-black p-5 rounded-full shadow-lg hover:bg-gray-100 transition transform active:scale-95"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={28} /> : <ScanLine size={28} />}
                    </button>
                </div>
            )}
        </div>
    );

    const renderComplete = () => (
        <div className="px-4 space-y-6 pb-24 text-center">
            <div className="py-12">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <Check size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('shoppingComplete')} 🎉
                </h2>
                <p className="text-gray-500">
                    {totalCount} товаров куплено
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">{t('estimatedCost')}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {session?.totalEstimatedCost} ₽
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('savedAmount')}</p>
                        <p className="text-2xl font-bold text-emerald-500">
                            ~{Math.round((session?.totalEstimatedCost || 0) * 0.15)} ₽
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={() => { setSession(null); setView('home'); }}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold"
            >
                Готово
            </button>
        </div>
    );

    // Main render
    return (
        <div className="min-h-screen pb-20">
            {view === 'home' && renderHome()}
            {view === 'planning' && renderPlanning()}
            {view === 'list' && renderList()}
            {view === 'shopping' && renderShopping()}
            {view === 'verify' && renderVerify()}
            {view === 'shelf' && renderShelfScan()}
            {view === 'complete' && renderComplete()}
        </div>
    );
};

export default ShoppingAssistant;
