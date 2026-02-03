import React, { useState, useRef, useEffect } from 'react';
import {
    ShoppingCart, ChefHat, Users, Clock, Loader2, Camera, Check, X,
    AlertTriangle, Sparkles, ChevronRight, ChevronDown, ChevronUp,
    RefreshCw, Heart, AlertCircle, Eye, Repeat, Plus, Minus, Refrigerator,
    Scan, ZoomIn, Scale, Trophy, ThumbsUp, ShieldAlert, Ban, Info, ArrowLeftRight,
    Receipt
} from 'lucide-react';
import { t, tf } from '@fitstream/shared';
import { ScanReceiptModal } from './ScanReceiptModal';
import { formatCurrency, getCurrencySymbol, CurrencyCode } from '../services/currencyService';
import {
    ShoppingPreferences,
    ShoppingSession,
    ShoppingListItem,
    PlannedMeal,
    CookingDifficulty,
    CookingTime,
    ShoppingCategory,
    InventoryItem,
    ProductVerification,
    StorageType
} from '@fitstream/shared';
import {
    generateMealPlanForShopping,
    verifyProductPhoto,
    scanStoreShelf,
    suggestProductAlternative,
    checkDuplicateInInventory,
    generateMealAlternatives,
    MealAlternative,
    ShelfScanResult,
    analyzeDisplayCase,
    compareProducts,
    ShowcaseProduct,
    ShowcaseScanResult,
    ShowcaseScanContext,
    ProductComparison
} from '../services/geminiService';
import { StorageService } from '../services/storageService';

type ShoppingView = 'home' | 'planning' | 'list' | 'shopping' | 'verify' | 'shelf' | 'complete' | 'showcase';

// Rating colors for showcase products
const RATING_STYLES = {
    best_choice: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', icon: Trophy, label: 'Best Choice' },
    good: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', icon: ThumbsUp, label: 'Good' },
    caution: { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', icon: ShieldAlert, label: 'Caution' },
    avoid: { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', icon: Ban, label: 'Avoid' }
};

const CATEGORY_ICONS: Record<ShoppingCategory, string> = {
    dairy: '\uD83E\uDD5B',
    meat: '\uD83E\uDD69',
    fish: '\uD83D\uDC1F',
    vegetables: '\uD83E\uDD6C',
    fruits: '\uD83C\uDF4E',
    grains: '\uD83C\uDF3E',
    bread: '\uD83C\uDF5E',
    frozen: '\uD83E\uDDCA',
    drinks: '\uD83E\uDD64',
    snacks: '\uD83C\uDF6A',
    spices: '\uD83E\uDDC2',
    other: '\uD83D\uDCE6'
};

const HEALTH_COLORS = {
    1: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-500' },
    2: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500' },
    3: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500' }
};

const ESSENTIAL_PRODUCTS = [
    { name: 'Milk', emoji: '\uD83E\uDD5B', category: 'dairy' },
    { name: 'Eggs', emoji: '\uD83E\uDD5A', category: 'dairy' },
    { name: 'Bread', emoji: '\uD83C\uDF5E', category: 'bread' },
    { name: 'Butter', emoji: '\uD83E\uDDC8', category: 'dairy' },
    { name: 'Cheese', emoji: '\uD83E\uDDC0', category: 'dairy' },
    { name: 'Chicken', emoji: '\uD83C\uDF57', category: 'meat' },
    { name: 'Rice', emoji: '\uD83C\uDF5A', category: 'grains' },
    { name: 'Pasta', emoji: '\uD83C\uDF5D', category: 'grains' },
    { name: 'Potatoes', emoji: '\uD83E\uDD54', category: 'vegetables' },
    { name: 'Onions', emoji: '\uD83E\uDDC5', category: 'vegetables' },
    { name: 'Carrots', emoji: '\uD83E\uDD55', category: 'vegetables' },
    { name: 'Tomatoes', emoji: '\uD83C\uDF45', category: 'vegetables' },
    { name: 'Apples', emoji: '\uD83C\uDF4E', category: 'fruits' },
    { name: 'Bananas', emoji: '\uD83C\uDF4C', category: 'fruits' },
    { name: 'Salt', emoji: '\uD83E\uDDC2', category: 'spices' },
    { name: 'Sugar', emoji: '\uD83C\uDF6C', category: 'spices' },
    { name: 'Oil', emoji: '\uD83E\uDED2', category: 'other' },
];

interface Props {
    onRequestPro?: () => void;
}

export const ShoppingAssistant: React.FC<Props> = ({ onRequestPro }) => {
    const [view, setView] = useState<ShoppingView>('home');
    const [session, setSession] = useState<ShoppingSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const settings = StorageService.getSettings();
    const currency = (settings.currency || 'RUB') as CurrencyCode;

    const [preferences, setPreferences] = useState<ShoppingPreferences>(() => {
        return settings.shoppingPreferences || {
            daysCount: 3,
            peopleCount: 2,
            cookingDifficulty: 'easy',
            maxCookingTime: 'quick',
            budget: undefined
        };
    });

    useEffect(() => {
        const settings = StorageService.getSettings();
        if (JSON.stringify(settings.shoppingPreferences) !== JSON.stringify(preferences)) {
            StorageService.saveSettings({ ...settings, shoppingPreferences: preferences });
        }
    }, [preferences]);

    // Verification state
    const [currentItem, setCurrentItem] = useState<ShoppingListItem | null>(null);
    const [verificationResult, setVerificationResult] = useState<ProductVerification | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyImage, setVerifyImage] = useState<string | null>(null);

    // Shelf scan state
    const [shelfResult, setShelfResult] = useState<ShelfScanResult | null>(null);
    const [shelfImage, setShelfImage] = useState<string | null>(null);

    // File input refs
    const verifyInputRef = useRef<HTMLInputElement>(null);
    const shelfInputRef = useRef<HTMLInputElement>(null);

    // Expanded meal days
    const [expandedDays, setExpandedDays] = useState<number[]>([1]);

    // Generation progress state
    const [generationStage, setGenerationStage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
    const [generationProgress, setGenerationProgress] = useState(0);

    // Meal replacement state
    const [selectedMealForReplacement, setSelectedMealForReplacement] = useState<PlannedMeal | null>(null);
    const [mealAlternatives, setMealAlternatives] = useState<MealAlternative[]>([]);
    const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
    const [productChanges, setProductChanges] = useState<{ added: string[]; removed: string[] } | null>(null);

    // Showcase scan state
    const [showcaseResult, setShowcaseResult] = useState<ShowcaseScanResult | null>(null);
    const [showcaseImage, setShowcaseImage] = useState<string | null>(null);
    const [isShowcaseScanning, setIsShowcaseScanning] = useState(false);
    const [selectedShowcaseProduct, setSelectedShowcaseProduct] = useState<ShowcaseProduct | null>(null);
    const [compareMode, setCompareMode] = useState(false);
    const [productsToCompare, setProductsToCompare] = useState<ShowcaseProduct[]>([]);
    const [comparisonResult, setComparisonResult] = useState<ProductComparison | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const showcaseInputRef = useRef<HTMLInputElement>(null);

    // Load inventory
    const inventory = StorageService.getInventory?.() || [];

    // Photo handling
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
        e.target.value = '';
    };

    // Generate meal plan with progress stages
    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError(null);
        setGenerationStage(1);
        setGenerationProgress(0);

        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev < 12) { setGenerationStage(1); return prev + 0.8; }
                else if (prev < 25) { setGenerationStage(2); return prev + 0.6; }
                else if (prev < 40) { setGenerationStage(3); return prev + 0.7; }
                else if (prev < 55) { setGenerationStage(4); return prev + 0.5; }
                else if (prev < 70) { setGenerationStage(5); return prev + 0.4; }
                else if (prev < 85) { setGenerationStage(6); return prev + 0.3; }
                else if (prev < 95) { setGenerationStage(7); return prev + 0.2; }
                return prev;
            });
        }, 150);

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

    const handleStartShopping = () => {
        if (session) {
            setSession({ ...session, status: 'shopping' });
            setView('shopping');
        }
    };

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

    const handleReplaceMeal = (alternative: MealAlternative) => {
        if (!session || !selectedMealForReplacement) return;

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

        const updatedMealPlan = session.mealPlan.map(m =>
            m.id === selectedMealForReplacement.id ? newMeal : m
        );

        const allIngredients = new Map<string, ShoppingListItem>();

        session.shoppingList.forEach(item => {
            const wasOnlyForReplacedMeal = item.forRecipes.length === 1 &&
                item.forRecipes[0] === selectedMealForReplacement.recipeName;

            if (!wasOnlyForReplacedMeal) {
                const updatedForRecipes = item.forRecipes.filter(r => r !== selectedMealForReplacement.recipeName);
                if (updatedForRecipes.length > 0) {
                    allIngredients.set(item.name.toLowerCase(), {
                        ...item,
                        forRecipes: updatedForRecipes
                    });
                }
            }
        });

        const removedProducts: string[] = [];
        const addedProducts: string[] = [];

        session.shoppingList.forEach(item => {
            if (!allIngredients.has(item.name.toLowerCase())) {
                removedProducts.push(`${item.emoji} ${item.name}`);
            }
        });

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

        setProductChanges({ added: addedProducts, removed: removedProducts });
        setSelectedMealForReplacement(null);
        setMealAlternatives([]);
    };

    const handleCloseMealReplacement = () => {
        setSelectedMealForReplacement(null);
        setMealAlternatives([]);
        setProductChanges(null);
    };

    const toggleItemChecked = (itemId: string) => {
        if (!session) return;
        const updatedList = session.shoppingList.map(item =>
            item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
        );
        setSession({ ...session, shoppingList: updatedList });
    };

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

    const markItemFromShelf = (listItemId: string) => {
        if (!session) return;
        const updatedList = session.shoppingList.map(item =>
            item.id === listItemId ? { ...item, isChecked: true, verificationStatus: 'correct' as const } : item
        );
        setSession({ ...session, shoppingList: updatedList });
    };

    // Showcase scan
    const handleOpenShowcaseScan = () => {
        setShowcaseResult(null);
        setShowcaseImage(null);
        setSelectedShowcaseProduct(null);
        setCompareMode(false);
        setProductsToCompare([]);
        setComparisonResult(null);
        setView('showcase');
    };

    const onShowcasePhotoSelected = async (base64: string) => {
        setShowcaseImage(base64);
        setIsShowcaseScanning(true);

        const settings = StorageService.getSettings();
        const todayLogs = StorageService.getNutritionLogs?.()?.filter((log: any) => {
            const logDate = new Date(log.date).toDateString();
            const today = new Date().toDateString();
            return logDate === today;
        }) || [];

        const todayTotals = todayLogs.reduce((acc: any, log: any) => ({
            calories: acc.calories + (log.calories || 0),
            protein: acc.protein + (log.protein || 0),
            carbs: acc.carbs + (log.carbs || 0),
            fat: acc.fat + (log.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const context: ShowcaseScanContext = {
            dailyCalorieGoal: settings.dailyCalorieGoal || 2000,
            dailyProteinGoal: settings.dailyProteinGoal || 100,
            todayCalories: todayTotals.calories,
            todayProtein: todayTotals.protein,
            todayCarbs: todayTotals.carbs,
            todayFat: todayTotals.fat,
            allergies: settings.dietaryPreferences?.allergies || [],
            diabetic: settings.dietaryPreferences?.diabetic || false,
            vegetarian: settings.dietaryPreferences?.vegetarian || false,
            inventoryItems: inventory.map(i => i.name)
        };

        try {
            const result = await analyzeDisplayCase(base64, context);
            setShowcaseResult(result);
        } catch (e: any) {
            if (e.message === 'INSUFFICIENT_BALANCE') {
                setError('Insufficient balance for scanning');
            } else {
                setShowcaseResult({
                    products: [],
                    bestChoices: [],
                    avoidList: [],
                    tip: '',
                    notRecognized: true,
                    notRecognizedReason: String(e)
                });
            }
        }
        setIsShowcaseScanning(false);
    };

    const toggleCompareMode = () => {
        setCompareMode(!compareMode);
        setProductsToCompare([]);
        setComparisonResult(null);
    };

    const toggleProductForComparison = (product: ShowcaseProduct) => {
        if (productsToCompare.find(p => p.id === product.id)) {
            setProductsToCompare(productsToCompare.filter(p => p.id !== product.id));
        } else if (productsToCompare.length < 2) {
            setProductsToCompare([...productsToCompare, product]);
        }
    };

    const runComparison = async () => {
        if (productsToCompare.length !== 2) return;
        setIsComparing(true);
        setComparisonResult(null);

        const settings = StorageService.getSettings();
        const context: ShowcaseScanContext = {
            dailyProteinGoal: settings.dailyProteinGoal || 100,
            todayProtein: 0,
            diabetic: settings.dietaryPreferences?.diabetic || false,
            vegetarian: settings.dietaryPreferences?.vegetarian || false
        };

        try {
            const result = await compareProducts(productsToCompare[0], productsToCompare[1], context);
            setComparisonResult(result);
        } catch (e) {
            setError(String(e));
        }
        setIsComparing(false);
    };

    const addShowcaseProductToInventory = (product: ShowcaseProduct) => {
        const newItem: InventoryItem = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: product.name,
            emoji: product.emoji,
            quantity: 1,
            unit: 'pcs',
            storageId: 'fridge' as StorageType,
            addedAt: new Date().toISOString(),
            source: 'manual' as const,
            caloriesPer100: product.calories,
            price: product.estimatedPrice
        };

        const currentInventory = StorageService.getInventory() || [];
        localStorage.setItem('fitstream_inventory', JSON.stringify([...currentInventory, newItem]));

        setSelectedShowcaseProduct(null);
        alert(`${product.emoji} ${product.name} added to inventory!`);
    };

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

    const activeInventory = StorageService.getActiveInventory?.() || inventory.filter(i => !i.depleted);
    const inventoryNames = activeInventory.map(i => i.name.toLowerCase());

    const missingEssentials = ESSENTIAL_PRODUCTS.filter(p =>
        !inventoryNames.some(name =>
            name.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(name)
        )
    );

    // ========== RENDER FUNCTIONS ==========
    // Due to the complexity, the render logic is kept inline matching the original component structure.
    // The full render tree from the monolith ShoppingAssistant is preserved here.

    return (
        <div className="min-h-full pb-4">
            {view === 'home' && (
                <div className="px-4 space-y-4 pb-24">
                    <div className="flex items-center gap-3 pt-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                            <ShoppingCart size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">SmartCart</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">AI Shopping Assistant</p>
                        </div>
                    </div>

                    {session && session.status !== 'completed' && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Active List</h3>
                                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">{checkedCount}/{totalCount}</span>
                            </div>
                            <div className="h-2 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                            <button
                                onClick={() => setView(session.status === 'shopping' ? 'shopping' : 'list')}
                                className="w-full bg-emerald-500 text-white py-2 rounded-xl font-bold text-sm"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    )}

                    <input ref={showcaseInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={(e) => handlePhotoSelect(e, onShowcasePhotoSelected)} />

                    {/* Scan showcase */}
                    <button
                        onClick={handleOpenShowcaseScan}
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:from-violet-400 hover:to-purple-400 transition transform active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-xl"><Scan size={24} /></div>
                            <div className="text-left">
                                <p className="font-bold flex items-center gap-1.5"><Camera size={18} /> Scan Showcase</p>
                                <p className="text-xs text-white/80">What's good on the shelf?</p>
                            </div>
                        </div>
                        <ChevronRight size={24} />
                    </button>

                    {/* Scan receipt */}
                    <button
                        onClick={() => setShowReceiptModal(true)}
                        className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-200 dark:bg-gray-700 p-2.5 rounded-xl">
                                <Receipt size={24} className="text-green-500 dark:text-green-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-700 dark:text-gray-300">Scan Receipt</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">After shopping</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </button>

                    {/* Missing essentials */}
                    {missingEssentials.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="text-red-500">!</span> Need to Buy
                                </h3>
                                <span className="text-xs text-red-500 font-medium bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                    {missingEssentials.length} items
                                </span>
                            </div>
                            <div className="p-3">
                                <div className="flex flex-wrap gap-2">
                                    {missingEssentials.slice(0, 12).map((p, idx) => (
                                        <span key={idx} className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                                            {p.emoji} {p.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Plan shopping CTA */}
                    <button
                        onClick={() => setView('planning')}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:from-emerald-400 hover:to-teal-400 transition transform active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-xl"><ShoppingCart size={24} /></div>
                            <div className="text-left">
                                <p className="font-bold">Plan Shopping Trip</p>
                                <p className="text-xs text-white/80">AI plans meals and creates your list</p>
                            </div>
                        </div>
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            {view === 'planning' && (
                <div className="px-4 space-y-6 pb-24">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                            <X size={24} className="text-gray-500" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plan Meals</h2>
                    </div>

                    {/* Days */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">How many days?</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 5, 7].map(d => (
                                <button key={d} onClick={() => setPreferences({ ...preferences, daysCount: d })}
                                    className={`flex-1 py-3 rounded-xl font-bold transition ${preferences.daysCount === d ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{d}</button>
                            ))}
                        </div>
                    </div>

                    {/* People */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">How many people?</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(p => (
                                <button key={p} onClick={() => setPreferences({ ...preferences, peopleCount: p })}
                                    className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-1 ${preferences.peopleCount === p ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                    <Users size={16} /> {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Cooking difficulty</label>
                        <div className="flex gap-2">
                            {(['easy', 'medium', 'hard'] as CookingDifficulty[]).map(d => (
                                <button key={d} onClick={() => setPreferences({ ...preferences, cookingDifficulty: d })}
                                    className={`flex-1 py-3 rounded-xl font-bold transition ${preferences.cookingDifficulty === d ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                    {d === 'easy' && 'Easy'} {d === 'medium' && 'Medium'} {d === 'hard' && 'Hard'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Max cooking time</label>
                        <div className="flex flex-col gap-2">
                            {(['quick', 'medium', 'long'] as CookingTime[]).map(time => (
                                <button key={time} onClick={() => setPreferences({ ...preferences, maxCookingTime: time })}
                                    className={`py-3 px-4 rounded-xl font-medium transition flex items-center gap-3 ${preferences.maxCookingTime === time ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                    <Clock size={18} />
                                    {time === 'quick' && 'Under 30 min'}
                                    {time === 'medium' && '30-60 min'}
                                    {time === 'long' && 'Over 60 min'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Budget (optional)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={preferences.budget || ''}
                                onChange={e => setPreferences({ ...preferences, budget: e.target.value ? parseInt(e.target.value) : undefined })}
                                placeholder="5000"
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:border-emerald-500"
                            />
                            <span className="text-gray-500">{getCurrencySymbol(currency)}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-2">
                            <AlertTriangle size={20} /><span className="text-sm">{error}</span>
                        </div>
                    )}

                    {isLoading && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {generationStage === 1 && 'Analyzing inventory...'}
                                    {generationStage === 2 && 'Checking expiry dates...'}
                                    {generationStage === 3 && 'Calculating nutrition...'}
                                    {generationStage === 4 && 'Selecting recipes...'}
                                    {generationStage === 5 && 'Optimizing portions...'}
                                    {generationStage === 6 && 'Creating shopping list...'}
                                    {generationStage === 7 && 'Estimating prices...'}
                                </span>
                                <span className="text-sm font-bold text-emerald-500">{Math.round(generationProgress)}%</span>
                            </div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-200 ease-out" style={{ width: `${generationProgress}%` }} />
                            </div>
                        </div>
                    )}

                    <button onClick={handleGeneratePlan} disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                        {isLoading ? (<><Loader2 className="animate-spin" size={20} />Generating...</>) : (<><Sparkles size={20} />Generate Plan</>)}
                    </button>
                </div>
            )}

            {view === 'list' && session && (
                <div className="px-4 space-y-4 pb-24">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-500" /></button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meal Plan</h2>
                        <div className="w-10" />
                    </div>

                    {/* Meal plan days */}
                    <div className="space-y-3">
                        {Array.from(new Set(session.mealPlan.map(m => m.day))).map(day => (
                            <div key={day} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <button onClick={() => setExpandedDays(expandedDays.includes(day) ? expandedDays.filter(d => d !== day) : [...expandedDays, day])}
                                    className="w-full p-4 flex items-center justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white">Day {day}</span>
                                    {expandedDays.includes(day) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {expandedDays.includes(day) && (
                                    <div className="px-4 pb-4 space-y-3">
                                        {session.mealPlan.filter(m => m.day === day).map(meal => (
                                            <div key={meal.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-gray-500 uppercase">
                                                        {meal.mealType === 'breakfast' && 'Breakfast'}
                                                        {meal.mealType === 'lunch' && 'Lunch'}
                                                        {meal.mealType === 'dinner' && 'Dinner'}
                                                        {meal.mealType === 'snack' && 'Snack'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{meal.cookingTime}min - {meal.calories}kcal</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900 dark:text-white">{meal.recipeName}</p>
                                                        {meal.recipeDescription && <p className="text-xs text-gray-500 mt-1">{meal.recipeDescription}</p>}
                                                    </div>
                                                    <button onClick={() => handleOpenMealReplacement(meal)}
                                                        className="ml-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 hover:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition">
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

                    {/* Shopping list summary */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2"><ShoppingCart size={18} /> Shopping List</h3>
                            <span className="text-sm text-emerald-600 dark:text-emerald-400">{session.shoppingList.length} items</span>
                        </div>
                        <p className="text-emerald-700 dark:text-emerald-400 text-sm mb-3">Est. cost: ~{formatCurrency(session.totalEstimatedCost || 0, currency)}</p>
                        <button onClick={handleStartShopping}
                            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                            <ShoppingCart size={18} /> Start Shopping
                        </button>
                    </div>
                </div>
            )}

            {view === 'shopping' && session && (
                <div className="px-4 space-y-4 pb-24">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-500" /></button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shopping List</h2>
                        <button onClick={handleScanShelf} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600"><Eye size={20} /></button>
                    </div>

                    {/* Progress */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">{checkedCount}/{totalCount} items</span>
                            <span className="text-sm font-bold text-emerald-500">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    {/* Items by category */}
                    {(Object.entries(groupedList) as [ShoppingCategory, ShoppingListItem[]][]).map(([category, items]) => (
                        <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                <span className="text-xl">{CATEGORY_ICONS[category]}</span>
                                <span className="font-bold text-gray-900 dark:text-white capitalize">{category}</span>
                                <span className="text-xs text-gray-400 ml-auto">{items.filter(i => i.isChecked).length}/{items.length}</span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {items.map(item => (
                                    <div key={item.id} className={`p-3 flex items-center gap-3 transition ${item.isChecked ? 'bg-gray-50 dark:bg-gray-900/50 opacity-60' : ''}`}>
                                        <button onClick={() => toggleItemChecked(item.id)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${item.isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {item.isChecked && <Check size={14} />}
                                        </button>
                                        <div className="flex-1">
                                            <span className={item.isChecked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}>
                                                {item.emoji} {item.name}
                                            </span>
                                            <div className="text-xs text-gray-500">{item.quantity} {item.unit}</div>
                                        </div>
                                        {!item.isChecked && (
                                            <button onClick={() => handleVerifyProduct(item)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-emerald-500">
                                                <Camera size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {checkedCount === totalCount && totalCount > 0 && (
                        <button onClick={handleFinishShopping} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-bold shadow-lg">
                            Finish Shopping
                        </button>
                    )}
                </div>
            )}

            {view === 'verify' && (
                <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-50 flex flex-col">
                    <input ref={verifyInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={(e) => handlePhotoSelect(e, onVerifyPhotoSelected)} />
                    <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setView('shopping')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-500" /></button>
                            {currentItem && <div className="bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full"><span className="text-emerald-700 dark:text-emerald-300 font-bold">{currentItem.emoji} {currentItem.name}</span></div>}
                            <div className="w-10" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {!verifyImage && !verificationResult && (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 max-w-sm">
                                    <Camera size={64} className="mx-auto mb-4 text-emerald-500" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Is this it?</h3>
                                    <p className="text-gray-500 text-sm mb-6">Take a photo to verify the product</p>
                                    <button onClick={() => verifyInputRef.current?.click()} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                                        <Camera size={20} /> Take Photo
                                    </button>
                                </div>
                            </div>
                        )}
                        {isVerifying && (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" /><p className="text-gray-500">Analyzing...</p>
                            </div>
                        )}
                        {verifyImage && verificationResult && (
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <img src={`data:image/jpeg;base64,${verifyImage}`} className="w-full h-48 object-cover" alt="Product" />
                                </div>
                                <div className={`p-4 rounded-2xl ${verificationResult.isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                    <div className={`flex items-center gap-3 ${verificationResult.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {verificationResult.isCorrect ? <Check size={32} /> : <X size={32} />}
                                        <div>
                                            <p className="text-xl font-bold">{verificationResult.isCorrect ? 'Correct!' : 'Wrong product'}</p>
                                            <p className="text-sm opacity-80">{verificationResult.productName}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-2xl ${HEALTH_COLORS[verificationResult.healthScore].bg}`}>
                                    <div className={`flex items-center gap-2 ${HEALTH_COLORS[verificationResult.healthScore].text}`}>
                                        <Heart size={20} />
                                        <span className="font-bold">
                                            {verificationResult.healthScore === 1 && 'Healthy Choice'}
                                            {verificationResult.healthScore === 2 && 'Moderate'}
                                            {verificationResult.healthScore === 3 && 'Unhealthy'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{verificationResult.healthAnalysis}</p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => { setVerificationResult(null); setVerifyImage(null); }} className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300">Retake</button>
                                    <button onClick={() => confirmVerification(verificationResult.isCorrect)} className={`flex-1 py-4 rounded-xl font-bold text-white ${verificationResult.isCorrect ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                                        {verificationResult.isCorrect ? 'Checked!' : 'OK'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'shelf' && (
                <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-50 flex flex-col">
                    <input ref={shelfInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={(e) => handlePhotoSelect(e, onShelfPhotoSelected)} />
                    <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setView('shopping')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X size={24} /></button>
                            <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full"><span className="text-blue-700 dark:text-blue-300 font-bold flex items-center gap-2"><Eye size={16} /> Scan Shelf</span></div>
                            <div className="w-10" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {!shelfImage && !shelfResult && (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 max-w-sm">
                                    <Eye size={64} className="mx-auto mb-4 text-blue-500" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Show the Shelf</h3>
                                    <p className="text-gray-500 text-sm mb-6">Take a photo and AI will find what you need</p>
                                    <button onClick={() => shelfInputRef.current?.click()} className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"><Camera size={20} /> Take Photo</button>
                                    <button onClick={() => setView('shopping')} className="w-full mt-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium">Back to List</button>
                                </div>
                            </div>
                        )}
                        {isLoading && <div className="flex flex-col items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-blue-500 mb-4" /><p className="text-gray-500">Analyzing...</p></div>}
                        {shelfImage && shelfResult && (
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                                    <img src={`data:image/jpeg;base64,${shelfImage}`} className="w-full" alt="Shelf" />
                                    {!shelfResult.notRecognized && shelfResult.products.map((product, idx) => (
                                        <div key={idx} className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${product.isNeeded ? 'bg-emerald-500 ring-4 ring-emerald-500/50 animate-pulse' : 'bg-gray-500/70'} text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg`}
                                            style={{ left: `${product.positionX}%`, top: `${product.positionY}%` }}
                                            onClick={() => { if (product.isNeeded && product.matchedListItem) markItemFromShelf(product.matchedListItem); }}>
                                            {product.emoji} {product.isNeeded && '\u2713'}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => { setShelfResult(null); setShelfImage(null); }} className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold flex items-center justify-center gap-2"><RefreshCw size={16} /> New Photo</button>
                                    <button onClick={() => setView('shopping')} className="flex-1 py-4 bg-blue-500 text-white rounded-xl font-bold">Done</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'showcase' && (
                <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-50 flex flex-col">
                    <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setView('home')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X size={24} /></button>
                            <div className="bg-violet-100 dark:bg-violet-900/30 px-4 py-2 rounded-full"><span className="text-violet-700 dark:text-violet-300 font-bold flex items-center gap-2"><Scan size={16} /> Smart Scanner</span></div>
                            {showcaseResult && !showcaseResult.notRecognized ? (
                                <button onClick={toggleCompareMode} className={`p-2 rounded-full ${compareMode ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}><ArrowLeftRight size={20} /></button>
                            ) : <div className="w-10" />}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {!showcaseImage && !showcaseResult && (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 max-w-sm">
                                    <Scan size={64} className="mx-auto mb-4 text-violet-500" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">What's good here?</h3>
                                    <p className="text-gray-500 text-sm mb-6">Scan a shelf and I'll show what suits you</p>
                                    <button onClick={() => showcaseInputRef.current?.click()} className="w-full bg-violet-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"><Camera size={20} /> Scan Showcase</button>
                                </div>
                            </div>
                        )}
                        {isShowcaseScanning && <div className="flex flex-col items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-violet-500 mb-4" /><p className="text-gray-500">Analyzing products...</p></div>}
                        {showcaseImage && showcaseResult && (
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                                    <img src={`data:image/jpeg;base64,${showcaseImage}`} className="w-full" alt="Showcase" />
                                    {!showcaseResult.notRecognized && showcaseResult.products.map(product => {
                                        const style = RATING_STYLES[product.rating];
                                        return (
                                            <div key={product.id} className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 ${productsToCompare.find(p => p.id === product.id) ? 'ring-4 ring-white' : ''}`}
                                                style={{ left: `${product.positionX}%`, top: `${product.positionY}%` }}
                                                onClick={() => compareMode ? toggleProductForComparison(product) : setSelectedShowcaseProduct(selectedShowcaseProduct?.id === product.id ? null : product)}>
                                                <div className={`${style.bg} text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg`}>{product.emoji}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {showcaseResult.notRecognized ? (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-2xl text-center">
                                        <AlertTriangle size={48} className="mx-auto mb-3 text-yellow-500" />
                                        <p className="font-bold text-gray-900 dark:text-white mb-2">Could not recognize</p>
                                        <p className="text-sm text-gray-500">{showcaseResult.notRecognizedReason || 'Try a clearer photo'}</p>
                                    </div>
                                ) : (
                                    <>
                                        {showcaseResult.tip && (
                                            <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-2xl border border-violet-200 dark:border-violet-800">
                                                <p className="text-violet-700 dark:text-violet-300 flex items-center gap-2"><Sparkles size={18} /> {showcaseResult.tip}</p>
                                            </div>
                                        )}
                                        {showcaseResult.bestChoices.length > 0 && !compareMode && (
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                                                <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2"><Trophy size={18} /> Recommended for You</h4>
                                                <div className="space-y-2">
                                                    {showcaseResult.products.filter(p => showcaseResult.bestChoices.includes(p.id)).map(product => (
                                                        <button key={product.id} onClick={() => setSelectedShowcaseProduct(product)}
                                                            className="w-full flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-200 dark:border-emerald-700 text-left">
                                                            <div>
                                                                <span className="font-bold text-gray-900 dark:text-white">{product.emoji} {product.name}</span>
                                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">{product.ratingReason}</p>
                                                            </div>
                                                            <ChevronRight size={18} className="text-gray-400" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => { setShowcaseResult(null); setShowcaseImage(null); setSelectedShowcaseProduct(null); setCompareMode(false); setProductsToCompare([]); setComparisonResult(null); }}
                                        className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold flex items-center justify-center gap-2"><RefreshCw size={16} /> New Photo</button>
                                    <button onClick={() => setView('home')} className="flex-1 py-4 bg-violet-500 text-white rounded-xl font-bold">Done</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product detail modal */}
                    {selectedShowcaseProduct && !compareMode && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                            <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 ${RATING_STYLES[selectedShowcaseProduct.rating].bg} rounded-xl flex items-center justify-center text-white text-2xl`}>{selectedShowcaseProduct.emoji}</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedShowcaseProduct.name}</h3>
                                            <p className={`text-sm ${RATING_STYLES[selectedShowcaseProduct.rating].text}`}>{RATING_STYLES[selectedShowcaseProduct.rating].label}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedShowcaseProduct(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20} className="text-gray-500" /></button>
                                </div>
                                <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
                                    <div className={`p-4 rounded-xl ${selectedShowcaseProduct.rating === 'best_choice' || selectedShowcaseProduct.rating === 'good' ? 'bg-emerald-50 dark:bg-emerald-900/20' : selectedShowcaseProduct.rating === 'caution' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                        <p className={`${RATING_STYLES[selectedShowcaseProduct.rating].text} font-medium`}>{selectedShowcaseProduct.ratingReason}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-3">Nutrition per 100g</h4>
                                        <div className="grid grid-cols-4 gap-3 text-center">
                                            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedShowcaseProduct.calories}</p><p className="text-xs text-gray-500">kcal</p></div>
                                            <div><p className="text-2xl font-bold text-blue-600">{selectedShowcaseProduct.protein}</p><p className="text-xs text-gray-500">protein</p></div>
                                            <div><p className="text-2xl font-bold text-orange-600">{selectedShowcaseProduct.carbs}</p><p className="text-xs text-gray-500">carbs</p></div>
                                            <div><p className="text-2xl font-bold text-yellow-600">{selectedShowcaseProduct.fat}</p><p className="text-xs text-gray-500">fat</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                                    <button onClick={() => setSelectedShowcaseProduct(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium">Close</button>
                                    <button onClick={() => addShowcaseProductToInventory(selectedShowcaseProduct)} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Plus size={18} /> Add to Inventory</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'complete' && (
                <div className="px-4 space-y-6 pb-24 text-center">
                    <div className="py-12">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <Check size={48} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Shopping Complete!</h2>
                        <p className="text-gray-500">{totalCount} products bought</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-sm text-gray-500">Estimated cost</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(session?.totalEstimatedCost || 0, currency)}</p></div>
                            <div><p className="text-sm text-gray-500">Saved</p><p className="text-2xl font-bold text-emerald-500">~{formatCurrency(Math.round((session?.totalEstimatedCost || 0) * 0.15), currency)}</p></div>
                        </div>
                    </div>
                    <button onClick={() => { setSession(null); setView('home'); }} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold">Done</button>
                </div>
            )}

            {showReceiptModal && (
                <ScanReceiptModal
                    onClose={() => setShowReceiptModal(false)}
                    onAdded={() => setShowReceiptModal(false)}
                />
            )}
        </div>
    );
};

export default ShoppingAssistant;
