import React, { useState, useRef, useEffect } from 'react';
import {
    ShoppingCart, ChefHat, Users, Clock, Loader2, Camera, Check, X,
    AlertTriangle, Sparkles, ChevronRight, ChevronDown, ChevronUp,
    RefreshCw, Heart, AlertCircle, Eye, Repeat, Plus, Minus
} from 'lucide-react';
import { t, tf } from '../services/i18n';
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
    generateMealAlternatives,
    MealAlternative,
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
    const [verifyImage, setVerifyImage] = useState<string | null>(null);

    // Shelf scan state
    const [shelfResult, setShelfResult] = useState<ShelfScanResult | null>(null);
    const [shelfImage, setShelfImage] = useState<string | null>(null);

    // File input refs (photo only, no live video)
    const verifyInputRef = useRef<HTMLInputElement>(null);
    const shelfInputRef = useRef<HTMLInputElement>(null);

    // Expanded meal days
    const [expandedDays, setExpandedDays] = useState<number[]>([1]);

    // Generation progress state
    const [generationStage, setGenerationStage] = useState<1 | 2 | 3>(1);
    const [generationProgress, setGenerationProgress] = useState(0);

    // Meal replacement state
    const [selectedMealForReplacement, setSelectedMealForReplacement] = useState<PlannedMeal | null>(null);
    const [mealAlternatives, setMealAlternatives] = useState<MealAlternative[]>([]);
    const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
    const [productChanges, setProductChanges] = useState<{ added: string[]; removed: string[] } | null>(null);

    // Load inventory
    const inventory = StorageService.getInventory?.() || [];

    // Photo handling (file input, no live camera)
    const handlePhotoSelect = (
        e: React.ChangeEvent<HTMLInputElement>,
        callback: (base64: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            callback(base64);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    // Generate meal plan with progress stages
    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError(null);
        setGenerationStage(1);
        setGenerationProgress(0);

        // Animate progress through stages
        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev < 30) {
                    return prev + 2;
                } else if (prev < 70) {
                    setGenerationStage(2);
                    return prev + 1.5;
                } else if (prev < 95) {
                    setGenerationStage(3);
                    return prev + 0.5;
                }
                return prev;
            });
        }, 100);

        try {
            const result = await generateMealPlanForShopping(inventory, preferences);
            clearInterval(progressInterval);
            setGenerationProgress(100);

            const newSession: ShoppingSession = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                preferences,
                mealPlan: result.meals,
                shoppingList: result.shoppingList,
                status: 'planning',
                totalEstimatedCost: result.totalEstimatedCost
            };

            // Small delay to show 100% before switching view
            setTimeout(() => {
                setSession(newSession);
                setView('list');
                setGenerationProgress(0);
                setGenerationStage(1);
            }, 300);
        } catch (e) {
            clearInterval(progressInterval);
            setError(String(e));
            setGenerationProgress(0);
            setGenerationStage(1);
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

    // Open meal replacement modal
    const handleOpenMealReplacement = async (meal: PlannedMeal) => {
        setSelectedMealForReplacement(meal);
        setMealAlternatives([]);
        setIsLoadingAlternatives(true);
        setProductChanges(null);

        try {
            const result = await generateMealAlternatives(meal, preferences, inventory);
            setMealAlternatives(result.alternatives);
        } catch (e) {
            setError(String(e));
        } finally {
            setIsLoadingAlternatives(false);
        }
    };

    // Replace meal with alternative
    const handleReplaceMeal = (alternative: MealAlternative) => {
        if (!session || !selectedMealForReplacement) return;

        // Get old ingredients from the meal being replaced
        const oldIngredients = selectedMealForReplacement.ingredients.map(i => i.name.toLowerCase());

        // Create new PlannedMeal from alternative
        const newMeal: PlannedMeal = {
            ...selectedMealForReplacement,
            recipeName: alternative.recipeName,
            recipeDescription: alternative.recipeDescription,
            cookingTime: alternative.cookingTime,
            calories: alternative.calories,
            difficulty: alternative.difficulty,
            ingredients: alternative.ingredients.map(ing => ({
                ...ing,
                inInventory: false,
                needToBuy: ing.quantity
            }))
        };

        // Update meal plan
        const updatedMealPlan = session.mealPlan.map(m =>
            m.id === selectedMealForReplacement.id ? newMeal : m
        );

        // Recalculate shopping list
        const allIngredients = new Map<string, ShoppingListItem>();

        // First, remove items that were only for the replaced meal
        session.shoppingList.forEach(item => {
            const wasOnlyForReplacedMeal = item.forRecipes.length === 1 &&
                item.forRecipes[0] === selectedMealForReplacement.recipeName;

            if (!wasOnlyForReplacedMeal) {
                // Update forRecipes to remove old meal name
                const updatedForRecipes = item.forRecipes.filter(r => r !== selectedMealForReplacement.recipeName);
                if (updatedForRecipes.length > 0) {
                    allIngredients.set(item.name.toLowerCase(), {
                        ...item,
                        forRecipes: updatedForRecipes
                    });
                }
            }
        });

        // Track changes
        const removedProducts: string[] = [];
        const addedProducts: string[] = [];

        // Check what was removed
        session.shoppingList.forEach(item => {
            if (!allIngredients.has(item.name.toLowerCase())) {
                removedProducts.push(`${item.emoji} ${item.name}`);
            }
        });

        // Add new ingredients from the alternative
        alternative.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase();
            if (allIngredients.has(key)) {
                const existing = allIngredients.get(key)!;
                allIngredients.set(key, {
                    ...existing,
                    quantity: existing.quantity + ing.quantity,
                    forRecipes: [...existing.forRecipes, alternative.recipeName]
                });
            } else {
                addedProducts.push(`${ing.emoji} ${ing.name}`);
                allIngredients.set(key, {
                    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: ing.name,
                    emoji: ing.emoji,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    category: 'other' as ShoppingCategory,
                    forRecipes: [alternative.recipeName],
                    healthScore: 1,
                    isChecked: false
                });
            }
        });

        const updatedShoppingList = Array.from(allIngredients.values());

        setSession({
            ...session,
            mealPlan: updatedMealPlan,
            shoppingList: updatedShoppingList
        });

        setProductChanges({
            added: addedProducts,
            removed: removedProducts
        });

        setSelectedMealForReplacement(null);
        setMealAlternatives([]);
    };

    // Close meal replacement modal
    const handleCloseMealReplacement = () => {
        setSelectedMealForReplacement(null);
        setMealAlternatives([]);
        setProductChanges(null);
    };

    // Toggle item checked
    const toggleItemChecked = (itemId: string) => {
        if (!session) return;
        const updatedList = session.shoppingList.map(item =>
            item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
        );
        setSession({ ...session, shoppingList: updatedList });
    };

    // Verify product photo (photo only, no live video)
    const handleVerifyProduct = (item: ShoppingListItem) => {
        setCurrentItem(item);
        setVerificationResult(null);
        setVerifyImage(null);
        setView('verify');
    };

    const onVerifyPhotoSelected = async (base64: string) => {
        if (!currentItem) return;
        setVerifyImage(base64);
        setIsVerifying(true);
        try {
            const result = await verifyProductPhoto(base64, currentItem);
            setVerificationResult(result);
        } catch (e) {
            setError(String(e));
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
        setView('shopping');
        setCurrentItem(null);
        setVerificationResult(null);
        setVerifyImage(null);
    };

    // Scan shelf (photo only, no live video)
    const handleScanShelf = () => {
        setShelfResult(null);
        setShelfImage(null);
        setView('shelf');
    };

    const onShelfPhotoSelected = async (base64: string) => {
        if (!session) return;
        setShelfImage(base64);
        setIsLoading(true);
        try {
            const result = await scanStoreShelf(base64, session.shoppingList);
            setShelfResult(result);
        } catch (e) {
            setShelfResult({ products: [], notRecognized: true, notRecognizedReason: String(e) });
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

            {/* Generation Progress */}
            {isLoading && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {generationStage === 1 && t('generatingStage1')}
                            {generationStage === 2 && t('generatingStage2')}
                            {generationStage === 3 && t('generatingStage3')}
                        </span>
                        <span className="text-sm font-bold text-emerald-500">
                            {Math.round(generationProgress)}%
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-200 ease-out"
                            style={{ width: `${generationProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                        <span className={generationStage >= 1 ? 'text-emerald-500 font-medium' : ''}>
                            🔍 Холодильник
                        </span>
                        <span className={generationStage >= 2 ? 'text-emerald-500 font-medium' : ''}>
                            📋 Меню
                        </span>
                        <span className={generationStage >= 3 ? 'text-emerald-500 font-medium' : ''}>
                            🛒 Продукты
                        </span>
                    </div>
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
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 dark:text-white">{meal.recipeName}</p>
                                                    {meal.recipeDescription && (
                                                        <p className="text-xs text-gray-500 mt-1">{meal.recipeDescription}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleOpenMealReplacement(meal)}
                                                    className="ml-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 hover:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
                                                    title={t('replaceMeal')}
                                                >
                                                    <Repeat size={16} />
                                                </button>
                                            </div>
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

            {/* Product Changes Notification */}
            {productChanges && (productChanges.added.length > 0 || productChanges.removed.length > 0) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <RefreshCw size={16} /> {t('productsChanged')}
                        </h4>
                        <button
                            onClick={() => setProductChanges(null)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full"
                        >
                            <X size={16} className="text-blue-500" />
                        </button>
                    </div>
                    {productChanges.added.length > 0 && (
                        <div className="mb-2">
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                <Plus size={12} /> {t('addedProducts')}:
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {productChanges.added.join(', ')}
                            </p>
                        </div>
                    )}
                    {productChanges.removed.length > 0 && (
                        <div>
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                <Minus size={12} /> {t('removedProducts')}:
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {productChanges.removed.join(', ')}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Meal Replacement Modal */}
            {selectedMealForReplacement && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {t('chooseMealAlternative')}
                            </h3>
                            <button
                                onClick={handleCloseMealReplacement}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Current meal */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 mb-1">Текущее блюдо:</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                                {selectedMealForReplacement.recipeName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {selectedMealForReplacement.cookingTime} мин • {selectedMealForReplacement.calories} ккал
                            </p>
                        </div>

                        <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
                            {isLoadingAlternatives ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 size={32} className="animate-spin text-emerald-500 mb-3" />
                                    <p className="text-gray-500">{t('loadingAlternatives')}</p>
                                </div>
                            ) : (
                                <>
                                    {mealAlternatives.map((alt, idx) => (
                                        <button
                                            key={alt.id || idx}
                                            onClick={() => handleReplaceMeal(alt)}
                                            className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-left hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {alt.recipeName}
                                                </p>
                                                <ChevronRight size={18} className="text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">
                                                {alt.recipeDescription}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span>⏱ {alt.cookingTime} мин</span>
                                                <span>🔥 {alt.calories} ккал</span>
                                                <span>
                                                    {alt.difficulty === 'easy' && '😊 Просто'}
                                                    {alt.difficulty === 'medium' && '👨‍🍳 Средне'}
                                                    {alt.difficulty === 'hard' && '🎯 Сложно'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}

                                    <button
                                        onClick={handleCloseMealReplacement}
                                        className="w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 font-medium"
                                    >
                                        {t('keepOriginal')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-50 flex flex-col">
            {/* Hidden file input */}
            <input
                ref={verifyInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoSelect(e, onVerifyPhotoSelected)}
            />

            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <button onClick={() => setView('shopping')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={24} className="text-gray-500" />
                    </button>
                    {currentItem && (
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full">
                            <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                                {currentItem.emoji} {currentItem.name}
                            </span>
                        </div>
                    )}
                    <div className="w-10" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {!verifyImage && !verificationResult && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 max-w-sm">
                            <Camera size={64} className="mx-auto mb-4 text-emerald-500" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('isThisIt')}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Сфоткай продукт, чтобы проверить - это то, что нужно
                            </p>
                            <button
                                onClick={() => verifyInputRef.current?.click()}
                                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Camera size={20} /> {t('takePhoto')}
                            </button>
                        </div>
                    </div>
                )}

                {isVerifying && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" />
                        <p className="text-gray-500">{t('analyzing')}</p>
                    </div>
                )}

                {verifyImage && verificationResult && (
                    <div className="space-y-4">
                        {/* Photo preview */}
                        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                                src={`data:image/jpeg;base64,${verifyImage}`}
                                className="w-full h-48 object-cover"
                                alt="Product"
                            />
                        </div>

                        {/* Result */}
                        <div className={`p-4 rounded-2xl ${verificationResult.isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            <div className={`flex items-center gap-3 ${verificationResult.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {verificationResult.isCorrect ? <Check size={32} /> : <X size={32} />}
                                <div>
                                    <p className="text-xl font-bold">
                                        {verificationResult.isCorrect ? t('correctProduct') : t('wrongProduct')}
                                    </p>
                                    <p className="text-sm opacity-80">{verificationResult.productName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Health score */}
                        <div className={`p-4 rounded-2xl ${HEALTH_COLORS[verificationResult.healthScore].bg}`}>
                            <div className={`flex items-center gap-2 ${HEALTH_COLORS[verificationResult.healthScore].text}`}>
                                <Heart size={20} />
                                <span className="font-bold">
                                    {verificationResult.healthScore === 1 && t('healthyChoice')}
                                    {verificationResult.healthScore === 2 && t('moderateChoice')}
                                    {verificationResult.healthScore === 3 && t('unhealthyChoice')}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{verificationResult.healthAnalysis}</p>
                        </div>

                        {/* Expiry warning */}
                        {verificationResult.expiryWarning && (
                            <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center gap-3 text-orange-600 dark:text-orange-400">
                                <AlertTriangle size={24} />
                                <p className="font-bold">{verificationResult.expiryWarning}</p>
                            </div>
                        )}

                        {/* Better alternative */}
                        {verificationResult.betterAlternative && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                                <p className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                                    💡 {t('betterAlternative')}
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                    {verificationResult.betterAlternative.name}
                                </p>
                                <p className="text-sm text-gray-500">{verificationResult.betterAlternative.reason}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => { setVerificationResult(null); setVerifyImage(null); }}
                                className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300"
                            >
                                {t('retake')}
                            </button>
                            <button
                                onClick={() => confirmVerification(verificationResult.isCorrect)}
                                className={`flex-1 py-4 rounded-xl font-bold text-white ${
                                    verificationResult.isCorrect ? 'bg-emerald-500' : 'bg-gray-500'
                                }`}
                            >
                                {verificationResult.isCorrect ? t('itemChecked') : 'OK'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderShelfScan = () => (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-50 flex flex-col">
            {/* Hidden file input */}
            <input
                ref={shelfInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoSelect(e, onShelfPhotoSelected)}
            />

            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <button onClick={() => setView('shopping')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={24} className="text-gray-500" />
                    </button>
                    <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full">
                        <span className="text-blue-700 dark:text-blue-300 font-bold flex items-center gap-2">
                            <Eye size={16} /> {t('showShelf')}
                        </span>
                    </div>
                    <div className="w-10" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {!shelfImage && !shelfResult && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 max-w-sm">
                            <Eye size={64} className="mx-auto mb-4 text-blue-500" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('photoShelfHeading')}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                {t('photoShelfInstr')}
                            </p>
                            <button
                                onClick={() => shelfInputRef.current?.click()}
                                className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Camera size={20} /> {t('takePhoto')}
                            </button>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                        <p className="text-gray-500">{t('analyzing')}</p>
                    </div>
                )}

                {shelfImage && shelfResult && (
                    <div className="space-y-4">
                        {/* Photo with markers */}
                        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                            <img
                                src={`data:image/jpeg;base64,${shelfImage}`}
                                className="w-full"
                                alt="Shelf"
                            />

                            {/* Product markers */}
                            {!shelfResult.notRecognized && shelfResult.products.map((product, idx) => (
                                <div
                                    key={idx}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                                        product.isNeeded
                                            ? 'bg-emerald-500 ring-4 ring-emerald-500/50 animate-pulse'
                                            : 'bg-gray-500/70'
                                    } text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg`}
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

                        {/* Result */}
                        {shelfResult.notRecognized ? (
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-2xl text-center">
                                <AlertTriangle size={48} className="mx-auto mb-3 text-yellow-500" />
                                <p className="font-bold text-gray-900 dark:text-white mb-2">
                                    {t('couldNotRecognize')}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {shelfResult.notRecognizedReason || t('tryCloserPhoto')}
                                </p>
                            </div>
                        ) : (
                            <>
                                {shelfResult.tip && (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-2xl">
                                        <p className="text-emerald-700 dark:text-emerald-300">
                                            💡 {shelfResult.tip}
                                        </p>
                                    </div>
                                )}

                                <p className="text-sm text-gray-500">
                                    {tf('productsFound', { count: shelfResult.products.length })}
                                </p>

                                {/* Needed products */}
                                <div className="space-y-2">
                                    {shelfResult.products.filter(p => p.isNeeded).map((product, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl"
                                        >
                                            <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                                {product.emoji} {product.name}
                                            </span>
                                            <button
                                                onClick={() => product.matchedListItem && markItemFromShelf(product.matchedListItem)}
                                                className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold"
                                            >
                                                {t('takeIt')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => { setShelfResult(null); setShelfImage(null); }}
                                className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} /> {t('photoMore')}
                            </button>
                            <button
                                onClick={() => setView('shopping')}
                                className="flex-1 py-4 bg-blue-500 text-white rounded-xl font-bold"
                            >
                                {t('done')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
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
                    {totalCount} {t('productsBought')}
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
                {t('done')}
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
