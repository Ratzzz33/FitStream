import React, { useState, useRef, useEffect } from 'react';
import {
    ShoppingCart, ChefHat, Users, Clock, Loader2, Camera, Check, X,
    AlertTriangle, Sparkles, ChevronRight, ChevronDown, ChevronUp,
    RefreshCw, Heart, AlertCircle, Eye, Repeat, Plus, Minus, Refrigerator,
    Scan, ZoomIn, Scale, Trophy, ThumbsUp, ShieldAlert, Ban, Info, ArrowLeftRight
} from 'lucide-react';
import { t, tf } from '../services/i18n';
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
} from '../types';
import {
    generateMealPlanForShopping,
    verifyProductPhoto,
    scanStoreShelf,
    suggestProductAlternative,
    checkDuplicateInInventory,
    generateMealAlternatives,
    MealAlternative,
    ShelfScanResult,
    scanStoragePhoto,
    detectStorageType,
    deduplicateProducts,
    ProductWithPhotoId,
    ScannedProduct,
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
    best_choice: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', icon: Trophy, label: '🏆 Лучший выбор' },
    good: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', icon: ThumbsUp, label: '👍 Хорошо' },
    caution: { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', icon: ShieldAlert, label: '⚠️ Осторожно' },
    avoid: { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', icon: Ban, label: '🚫 Избегать' }
};

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

// Стандартный набор продуктов которые должны быть дома
const ESSENTIAL_PRODUCTS = [
    { name: 'Молоко', emoji: '🥛', category: 'dairy' },
    { name: 'Яйца', emoji: '🥚', category: 'dairy' },
    { name: 'Хлеб', emoji: '🍞', category: 'bread' },
    { name: 'Масло сливочное', emoji: '🧈', category: 'dairy' },
    { name: 'Сыр', emoji: '🧀', category: 'dairy' },
    { name: 'Курица', emoji: '🍗', category: 'meat' },
    { name: 'Рис', emoji: '🍚', category: 'grains' },
    { name: 'Макароны', emoji: '🍝', category: 'grains' },
    { name: 'Картофель', emoji: '🥔', category: 'vegetables' },
    { name: 'Лук', emoji: '🧅', category: 'vegetables' },
    { name: 'Морковь', emoji: '🥕', category: 'vegetables' },
    { name: 'Помидоры', emoji: '🍅', category: 'vegetables' },
    { name: 'Огурцы', emoji: '🥒', category: 'vegetables' },
    { name: 'Яблоки', emoji: '🍎', category: 'fruits' },
    { name: 'Бананы', emoji: '🍌', category: 'fruits' },
    { name: 'Соль', emoji: '🧂', category: 'spices' },
    { name: 'Сахар', emoji: '🍬', category: 'spices' },
    { name: 'Растительное масло', emoji: '🫒', category: 'other' },
];

interface Props {
    onRequestPro?: () => void;
}

export const ShoppingAssistant: React.FC<Props> = ({ onRequestPro }) => {
    const [view, setView] = useState<ShoppingView>('home');
    const [session, setSession] = useState<ShoppingSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get currency from settings
    const settings = StorageService.getSettings();
    const currency = (settings.currency || 'RUB') as CurrencyCode;

    // Planning state - load from settings
    const [preferences, setPreferences] = useState<ShoppingPreferences>(() => {
        return settings.shoppingPreferences || {
            daysCount: 3,
            peopleCount: 2,
            cookingDifficulty: 'easy',
            maxCookingTime: 'quick',
            budget: undefined
        };
    });

    // Save preferences to settings when changed
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

    // Multi-photo inventory scan state
    const [isInventoryScanning, setIsInventoryScanning] = useState(false);
    const [inventoryScanProgress, setInventoryScanProgress] = useState<string>('');
    const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
    const [showMultiPhotoModal, setShowMultiPhotoModal] = useState(false);

    // File input refs (photo only, no live video)
    const verifyInputRef = useRef<HTMLInputElement>(null);
    const shelfInputRef = useRef<HTMLInputElement>(null);
    const inventoryInputRef = useRef<HTMLInputElement>(null);

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

    // Showcase scan state (smart display case scanner)
    const [showcaseResult, setShowcaseResult] = useState<ShowcaseScanResult | null>(null);
    const [showcaseImage, setShowcaseImage] = useState<string | null>(null);
    const [isShowcaseScanning, setIsShowcaseScanning] = useState(false);
    const [selectedShowcaseProduct, setSelectedShowcaseProduct] = useState<ShowcaseProduct | null>(null);
    const [compareMode, setCompareMode] = useState(false);
    const [productsToCompare, setProductsToCompare] = useState<ShowcaseProduct[]>([]);
    const [comparisonResult, setComparisonResult] = useState<ProductComparison | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const showcaseInputRef = useRef<HTMLInputElement>(null);

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

    // Multi-photo inventory scan - handles multiple files
    const handleInventoryPhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const photos: string[] = [];

        // Read all files
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = (reader.result as string).split(',')[1];
                    resolve(result);
                };
                reader.readAsDataURL(file);
            });
            photos.push(base64);
        }

        e.target.value = ''; // Reset input

        if (photos.length === 1) {
            // Single photo - process immediately
            await processInventoryPhoto(photos[0]);
        } else {
            // Multiple photos - show confirmation and process
            setPendingPhotos(photos);
            setShowMultiPhotoModal(true);
        }
    };

    // Process a single inventory photo with auto storage detection
    const processInventoryPhoto = async (base64: string) => {
        setIsInventoryScanning(true);
        setInventoryScanProgress('Определяем место хранения...');

        try {
            // Auto-detect storage type
            const detectedType = await detectStorageType(base64);
            setInventoryScanProgress(`Найден: ${getStorageName(detectedType)}. Сканируем продукты...`);

            // Add photo to storage
            const photoId = StorageService.addStoragePhoto(detectedType, `data:image/jpeg;base64,${base64}`);

            // Scan products
            const scannedProducts = await scanStoragePhoto(base64, detectedType);
            const newProducts: ProductWithPhotoId[] = scannedProducts.map((p: ScannedProduct) => ({
                ...p,
                photoId
            }));

            // Get all photos for this storage
            const allPhotos = StorageService.getStoragePhotos(detectedType);

            if (allPhotos.length > 1) {
                // Multi-photo mode - deduplicate
                setInventoryScanProgress('Объединяем продукты...');

                const existingInventory = StorageService.getInventoryByStorage(detectedType)
                    .filter((i: InventoryItem) => i.source === 'photo');

                const existingProducts: ProductWithPhotoId[] = existingInventory.flatMap((item: InventoryItem) => {
                    const positions = item.mergedFromPhotoIds?.length
                        ? item.mergedFromPhotoIds.map(pid => ({ photoId: pid, x: 0, y: 0 }))
                        : item.photoId
                            ? [{ photoId: item.photoId, x: item.position?.x || 0, y: item.position?.y || 0 }]
                            : [];

                    return positions.map(pos => ({
                        name: item.name,
                        emoji: item.emoji || '',
                        quantity: item.quantity,
                        unit: item.unit,
                        expiresInDays: item.expiresAt
                            ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
                            : null,
                        caloriesPer100: item.caloriesPer100,
                        positionX: pos.x,
                        positionY: pos.y,
                        photoId: pos.photoId
                    }));
                });

                const allProducts = [...existingProducts, ...newProducts];
                const deduplicated = await deduplicateProducts(allProducts);

                // Remove old photo items for this storage
                const nonPhotoItems = StorageService.getInventory().filter(
                    (i: InventoryItem) => i.storageId !== detectedType || i.source !== 'photo'
                );

                // Create new items from deduplicated
                const newItems: InventoryItem[] = deduplicated.map(p => {
                    const primaryPosition = p.positions[0];
                    return {
                        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: p.name,
                        emoji: p.emoji,
                        quantity: p.quantity,
                        unit: p.unit,
                        storageId: detectedType,
                        expiresAt: p.expiresInDays
                            ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
                            : undefined,
                        addedAt: new Date().toISOString(),
                        source: 'photo' as const,
                        position: { x: primaryPosition.x, y: primaryPosition.y },
                        photoId: primaryPosition.photoId,
                        mergedFromPhotoIds: p.photoIds.length > 1 ? p.photoIds : undefined,
                        caloriesPer100: p.caloriesPer100,
                        price: p.price
                    };
                });

                localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
            } else {
                // First photo - add without deduplication
                const newItems: InventoryItem[] = newProducts.map((p: ProductWithPhotoId) => ({
                    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: p.name,
                    emoji: p.emoji,
                    quantity: p.quantity,
                    unit: p.unit,
                    storageId: detectedType,
                    expiresAt: p.expiresInDays
                        ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
                        : undefined,
                    addedAt: new Date().toISOString(),
                    source: 'photo' as const,
                    position: { x: p.positionX, y: p.positionY },
                    photoId: p.photoId,
                    caloriesPer100: p.caloriesPer100,
                    price: p.price
                }));

                StorageService.saveInventoryBulk(newItems);
            }

            setIsInventoryScanning(false);
            setInventoryScanProgress('');
            return { success: true, storageType: detectedType, count: newProducts.length };
        } catch (error: any) {
            console.error('Error scanning inventory:', error);
            setIsInventoryScanning(false);
            setInventoryScanProgress('');
            throw error;
        }
    };

    // Process multiple photos in batch
    const processMultiplePhotos = async () => {
        setShowMultiPhotoModal(false);
        setIsInventoryScanning(true);

        const results: { storageType: StorageType; count: number }[] = [];

        for (let i = 0; i < pendingPhotos.length; i++) {
            setInventoryScanProgress(`Фото ${i + 1} из ${pendingPhotos.length}...`);
            try {
                const result = await processInventoryPhoto(pendingPhotos[i]);
                if (result) results.push(result);
            } catch (e) {
                console.error(`Error processing photo ${i + 1}:`, e);
            }
        }

        setPendingPhotos([]);
        setIsInventoryScanning(false);
        setInventoryScanProgress('');

        // Show summary
        if (results.length > 0) {
            const summary = results.reduce((acc, r) => {
                acc[r.storageType] = (acc[r.storageType] || 0) + r.count;
                return acc;
            }, {} as Record<string, number>);

            const summaryText = Object.entries(summary)
                .map(([type, count]) => `${getStorageName(type as StorageType)}: ${count}`)
                .join(', ');

            alert(`Добавлено: ${summaryText}`);
        }
    };

    // Helper to get storage name
    const getStorageName = (type: StorageType): string => {
        const names: Record<StorageType, string> = {
            fridge: 'Холодильник',
            freezer: 'Морозилка',
            cabinet: 'Шкаф',
            appliances: 'Техника'
        };
        return names[type] || type;
    };

    // Open inventory scan
    const handleOpenInventoryScan = () => {
        inventoryInputRef.current?.click();
    };

    // Generate meal plan with progress stages
    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError(null);
        setGenerationStage(1);
        setGenerationProgress(0);

        // Animate progress through stages - slower with more stages
        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev < 12) {
                    setGenerationStage(1); // Analyzing fridge
                    return prev + 0.8;
                } else if (prev < 25) {
                    setGenerationStage(2); // Checking expiry dates
                    return prev + 0.6;
                } else if (prev < 40) {
                    setGenerationStage(3); // Calculating nutrients
                    return prev + 0.7;
                } else if (prev < 55) {
                    setGenerationStage(4); // Selecting recipes
                    return prev + 0.5;
                } else if (prev < 70) {
                    setGenerationStage(5); // Optimizing portions
                    return prev + 0.4;
                } else if (prev < 85) {
                    setGenerationStage(6); // Creating shopping list
                    return prev + 0.3;
                } else if (prev < 95) {
                    setGenerationStage(7); // Calculating prices
                    return prev + 0.2;
                }
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

    // ========== SHOWCASE SCAN (Smart Display Case Scanner) ==========

    // Open showcase scan
    const handleOpenShowcaseScan = () => {
        setShowcaseResult(null);
        setShowcaseImage(null);
        setSelectedShowcaseProduct(null);
        setCompareMode(false);
        setProductsToCompare([]);
        setComparisonResult(null);
        setView('showcase');
    };

    // Process showcase photo
    const onShowcasePhotoSelected = async (base64: string) => {
        setShowcaseImage(base64);
        setIsShowcaseScanning(true);

        // Build context from user settings and today's nutrition
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
            allergies: settings.allergies || [],
            diabetic: settings.diabetic || false,
            vegetarian: settings.vegetarian || false,
            inventoryItems: inventory.map(i => i.name)
        };

        try {
            const result = await analyzeDisplayCase(base64, context);
            setShowcaseResult(result);
        } catch (e: any) {
            if (e.message === 'INSUFFICIENT_BALANCE') {
                setError('Недостаточно средств для сканирования');
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

    // Toggle compare mode
    const toggleCompareMode = () => {
        setCompareMode(!compareMode);
        setProductsToCompare([]);
        setComparisonResult(null);
    };

    // Add product to comparison
    const toggleProductForComparison = (product: ShowcaseProduct) => {
        if (productsToCompare.find(p => p.id === product.id)) {
            setProductsToCompare(productsToCompare.filter(p => p.id !== product.id));
        } else if (productsToCompare.length < 2) {
            setProductsToCompare([...productsToCompare, product]);
        }
    };

    // Run comparison
    const runComparison = async () => {
        if (productsToCompare.length !== 2) return;
        setIsComparing(true);
        setComparisonResult(null);

        const settings = StorageService.getSettings();
        const todayLogs = StorageService.getNutritionLogs?.()?.filter((log: any) => {
            const logDate = new Date(log.date).toDateString();
            const today = new Date().toDateString();
            return logDate === today;
        }) || [];

        const todayTotals = todayLogs.reduce((acc: any, log: any) => ({
            protein: acc.protein + (log.protein || 0)
        }), { protein: 0 });

        const context: ShowcaseScanContext = {
            dailyProteinGoal: settings.dailyProteinGoal || 100,
            todayProtein: todayTotals.protein,
            diabetic: settings.diabetic || false,
            vegetarian: settings.vegetarian || false
        };

        try {
            const result = await compareProducts(productsToCompare[0], productsToCompare[1], context);
            setComparisonResult(result);
        } catch (e) {
            setError(String(e));
        }
        setIsComparing(false);
    };

    // Add showcase product to inventory
    const addShowcaseProductToInventory = (product: ShowcaseProduct) => {
        const newItem: InventoryItem = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: product.name,
            emoji: product.emoji,
            quantity: 1,
            unit: 'шт',
            storageId: 'fridge' as StorageType,
            addedAt: new Date().toISOString(),
            source: 'manual' as const,
            caloriesPer100: product.calories,
            price: product.estimatedPrice
        };

        const currentInventory = StorageService.getInventory() || [];
        localStorage.setItem('fitstream_inventory', JSON.stringify([...currentInventory, newItem]));

        // Show feedback
        setSelectedShowcaseProduct(null);
        alert(`${product.emoji} ${product.name} добавлен в инвентарь!`);
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

    // Вычисляем что есть и чего не хватает
    const activeInventory = StorageService.getActiveInventory?.() || inventory.filter(i => !i.depleted);
    const inventoryNames = activeInventory.map(i => i.name.toLowerCase());

    const missingEssentials = ESSENTIAL_PRODUCTS.filter(p =>
        !inventoryNames.some(name =>
            name.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(name)
        )
    );

    const inStockEssentials = ESSENTIAL_PRODUCTS.filter(p =>
        inventoryNames.some(name =>
            name.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(name)
        )
    );

    // Render functions
    const renderHome = () => (
        <div className="px-4 space-y-4 pb-24">
            {/* Header compact */}
            <div className="flex items-center gap-3 pt-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                    <ShoppingCart size={24} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('shoppingAssistant')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {t('wifeTip')} 👩‍🍳
                    </p>
                </div>
            </div>

            {/* Active session progress */}
            {session && session.status !== 'completed' && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                            🛒 Активный список
                        </h3>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                            {checkedCount}/{totalCount}
                        </span>
                    </div>
                    <div className="h-2 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden mb-3">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <button
                        onClick={() => setView(session.status === 'shopping' ? 'shopping' : 'list')}
                        className="w-full bg-emerald-500 text-white py-2 rounded-xl font-bold text-sm"
                    >
                        Продолжить покупки →
                    </button>
                </div>
            )}

            {/* Missing essentials - Need to buy */}
            {missingEssentials.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-red-500">⚠️</span> Нужно купить
                        </h3>
                        <span className="text-xs text-red-500 font-medium bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                            {missingEssentials.length} поз.
                        </span>
                    </div>
                    <div className="p-3">
                        <div className="flex flex-wrap gap-2">
                            {missingEssentials.slice(0, 12).map((p, idx) => (
                                <span
                                    key={idx}
                                    className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                                >
                                    {p.emoji} {p.name}
                                </span>
                            ))}
                            {missingEssentials.length > 12 && (
                                <span className="text-gray-400 text-sm px-2 py-1.5">
                                    +{missingEssentials.length - 12}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* In stock from inventory */}
            {activeInventory.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-green-500">✓</span> На полках
                        </h3>
                        <span className="text-xs text-green-600 font-medium bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                            {activeInventory.length} поз.
                        </span>
                    </div>
                    <div className="p-3">
                        <div className="flex flex-wrap gap-2">
                            {activeInventory.slice(0, 10).map((item, idx) => (
                                <span
                                    key={idx}
                                    className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                                >
                                    {item.emoji || '📦'} {item.name}
                                    {item.quantity && (
                                        <span className="text-green-500 text-xs ml-1">
                                            {item.quantity}{item.unit}
                                        </span>
                                    )}
                                </span>
                            ))}
                            {activeInventory.length > 10 && (
                                <span className="text-gray-400 text-sm px-2 py-1.5">
                                    +{activeInventory.length - 10}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden input for multi-photo selection */}
            <input
                ref={inventoryInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={handleInventoryPhotosSelect}
            />

            {/* Scan inventory button - always visible */}
            <button
                onClick={handleOpenInventoryScan}
                disabled={isInventoryScanning}
                className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 text-center border border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isInventoryScanning ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 size={32} className="animate-spin text-emerald-500" />
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            {inventoryScanProgress}
                        </p>
                    </div>
                ) : (
                    <>
                        <Refrigerator size={32} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {activeInventory.length === 0
                                ? 'Сфоткай запасы, чтобы обновить сведения'
                                : 'Добавить ещё фото запасов'
                            }
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Можно несколько фото сразу
                        </p>
                    </>
                )}
            </button>

            {/* Multi-photo confirmation modal */}
            {showMultiPhotoModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Обработать {pendingPhotos.length} фото?
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                            Каждое фото будет проанализировано и продукты автоматически разнесены по местам хранения
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowMultiPhotoModal(false); setPendingPhotos([]); }}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={processMultiplePhotos}
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold"
                            >
                                Обработать
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden input for showcase scan */}
            <input
                ref={showcaseInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoSelect(e, onShowcasePhotoSelected)}
            />

            {/* Quick showcase scan button - NEW FEATURE */}
            <button
                onClick={handleOpenShowcaseScan}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:from-violet-400 hover:to-purple-400 transition transform active:scale-[0.98]"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                        <Scan size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold">📸 Сканировать витрину</p>
                        <p className="text-xs text-white/80">Что полезного на полке?</p>
                    </div>
                </div>
                <ChevronRight size={24} />
            </button>

            {/* Go shopping button */}
            <button
                onClick={() => setView('planning')}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:from-emerald-400 hover:to-teal-400 transition transform active:scale-[0.98]"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                        <ChefHat size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold">{t('goShopping')}</p>
                        <p className="text-xs text-white/80">{t('planMeals')}</p>
                    </div>
                </div>
                <ChevronRight size={24} />
            </button>

            {/* Quick stats */}
            {(inStockEssentials.length > 0 || missingEssentials.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {inStockEssentials.length}
                        </p>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70">базовых есть</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {missingEssentials.length}
                        </p>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70">нужно купить</p>
                    </div>
                </div>
            )}
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
                    <span className="text-gray-500">{getCurrencySymbol(currency)}</span>
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
                            {generationStage === 4 && t('generatingStage4')}
                            {generationStage === 5 && t('generatingStage5')}
                            {generationStage === 6 && t('generatingStage6')}
                            {generationStage === 7 && t('generatingStage7')}
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
                            {t('stageIcon1')}
                        </span>
                        <span className={generationStage >= 3 ? 'text-emerald-500 font-medium' : ''}>
                            {t('stageIcon2')}
                        </span>
                        <span className={generationStage >= 5 ? 'text-emerald-500 font-medium' : ''}>
                            {t('stageIcon3')}
                        </span>
                        <span className={generationStage >= 7 ? 'text-emerald-500 font-medium' : ''}>
                            {t('stageIcon4')}
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
                    {t('estimatedCost')}: ~{formatCurrency(session?.totalEstimatedCost || 0, currency)}
                </p>

                {/* Categories preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {(Object.entries(groupedList) as [ShoppingCategory, ShoppingListItem[]][]).map(([cat, items]) => (
                        <span key={cat} className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                            {CATEGORY_ICONS[cat]} {items.length}
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
            {(Object.entries(groupedList) as [ShoppingCategory, ShoppingListItem[]][]).map(([category, items]) => (
                <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <span className="text-xl">{CATEGORY_ICONS[category]}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {t(category as any)}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                            {items.filter((i: ShoppingListItem) => i.isChecked).length}/{items.length}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((item: ShoppingListItem) => (
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
                    <button onClick={() => setView('shopping')} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X size={24} className="text-gray-700 dark:text-gray-300" />
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
                            <button
                                onClick={() => setView('shopping')}
                                className="w-full mt-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium"
                            >
                                {t('backToList')}
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

    // ========== SHOWCASE SCAN VIEW ==========
    const renderShowcase = () => (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setView('home')}
                        className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                        <X size={24} className="text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="bg-violet-100 dark:bg-violet-900/30 px-4 py-2 rounded-full">
                        <span className="text-violet-700 dark:text-violet-300 font-bold flex items-center gap-2">
                            <Scan size={16} /> Умный сканер
                        </span>
                    </div>
                    {showcaseResult && !showcaseResult.notRecognized && (
                        <button
                            onClick={toggleCompareMode}
                            className={`p-2 rounded-full ${compareMode ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                        >
                            <ArrowLeftRight size={20} />
                        </button>
                    )}
                    {!showcaseResult && <div className="w-10" />}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Initial state - prompt to take photo */}
                {!showcaseImage && !showcaseResult && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 max-w-sm">
                            <Scan size={64} className="mx-auto mb-4 text-violet-500" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Что полезного на витрине?
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Сфоткай полку — я покажу что подходит именно тебе
                            </p>
                            <button
                                onClick={() => showcaseInputRef.current?.click()}
                                className="w-full bg-violet-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Camera size={20} /> Сфоткать витрину
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {isShowcaseScanning && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 size={48} className="animate-spin text-violet-500 mb-4" />
                        <p className="text-gray-500">Анализирую продукты...</p>
                        <p className="text-xs text-gray-400 mt-2">Учитываю твои цели и ограничения</p>
                    </div>
                )}

                {/* Results */}
                {showcaseImage && showcaseResult && (
                    <div className="space-y-4">
                        {/* Photo with markers */}
                        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                            <img
                                src={`data:image/jpeg;base64,${showcaseImage}`}
                                className="w-full"
                                alt="Витрина"
                            />

                            {/* Product markers */}
                            {!showcaseResult.notRecognized && showcaseResult.products.map((product) => {
                                const style = RATING_STYLES[product.rating];
                                const isSelected = selectedShowcaseProduct?.id === product.id;
                                const isInComparison = productsToCompare.find(p => p.id === product.id);

                                return (
                                    <div
                                        key={product.id}
                                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                                            isSelected ? 'scale-125 z-20' : 'z-10'
                                        } ${isInComparison ? 'ring-4 ring-white' : ''}`}
                                        style={{
                                            left: `${product.positionX}%`,
                                            top: `${product.positionY}%`
                                        }}
                                        onClick={() => {
                                            if (compareMode) {
                                                toggleProductForComparison(product);
                                            } else {
                                                setSelectedShowcaseProduct(
                                                    selectedShowcaseProduct?.id === product.id ? null : product
                                                );
                                            }
                                        }}
                                    >
                                        <div className={`${style.bg} text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1`}>
                                            {product.emoji}
                                            {compareMode && isInComparison && (
                                                <span className="bg-white text-violet-600 w-4 h-4 rounded-full text-[10px] flex items-center justify-center">
                                                    {productsToCompare.findIndex(p => p.id === product.id) + 1}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Compare mode UI */}
                        {compareMode && (
                            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-4 border border-violet-200 dark:border-violet-800">
                                <p className="text-violet-700 dark:text-violet-300 font-bold mb-2 flex items-center gap-2">
                                    <ArrowLeftRight size={18} /> Режим сравнения
                                </p>
                                <p className="text-sm text-violet-600 dark:text-violet-400 mb-3">
                                    Выбери 2 продукта на фото для сравнения
                                </p>
                                <div className="flex gap-2 mb-3">
                                    {[0, 1].map(idx => (
                                        <div
                                            key={idx}
                                            className={`flex-1 p-3 rounded-xl border-2 border-dashed ${
                                                productsToCompare[idx]
                                                    ? 'border-violet-400 bg-white dark:bg-gray-800'
                                                    : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        >
                                            {productsToCompare[idx] ? (
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {productsToCompare[idx].emoji} {productsToCompare[idx].name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Продукт {idx + 1}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {productsToCompare.length === 2 && (
                                    <button
                                        onClick={runComparison}
                                        disabled={isComparing}
                                        className="w-full bg-violet-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isComparing ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Scale size={18} />
                                        )}
                                        Сравнить
                                    </button>
                                )}

                                {/* Comparison result */}
                                {comparisonResult && (
                                    <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Trophy size={20} className="text-yellow-500" />
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {comparisonResult.winner === 'first'
                                                    ? productsToCompare[0]?.name
                                                    : comparisonResult.winner === 'second'
                                                        ? productsToCompare[1]?.name
                                                        : 'Равноценны'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {comparisonResult.winnerReason}
                                        </p>

                                        {/* Comparison table */}
                                        <div className="space-y-2">
                                            {comparisonResult.comparison.map((row, idx) => (
                                                <div key={idx} className="flex items-center text-sm">
                                                    <span className={`flex-1 text-right ${row.better === 'first' ? 'font-bold text-emerald-600' : 'text-gray-500'}`}>
                                                        {row.firstValue}
                                                    </span>
                                                    <span className="w-20 text-center text-gray-400 text-xs">{row.category}</span>
                                                    <span className={`flex-1 ${row.better === 'second' ? 'font-bold text-emerald-600' : 'text-gray-500'}`}>
                                                        {row.secondValue}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                            <p className="text-sm text-violet-700 dark:text-violet-300">
                                                💡 {comparisonResult.recommendation}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Not recognized */}
                        {showcaseResult.notRecognized ? (
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-2xl text-center">
                                <AlertTriangle size={48} className="mx-auto mb-3 text-yellow-500" />
                                <p className="font-bold text-gray-900 dark:text-white mb-2">
                                    Не удалось распознать
                                </p>
                                <p className="text-sm text-gray-500">
                                    {showcaseResult.notRecognizedReason || 'Попробуй сфоткать ближе и чётче'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Personalized tip */}
                                {showcaseResult.tip && (
                                    <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-2xl border border-violet-200 dark:border-violet-800">
                                        <p className="text-violet-700 dark:text-violet-300 flex items-center gap-2">
                                            <Sparkles size={18} /> {showcaseResult.tip}
                                        </p>
                                    </div>
                                )}

                                {/* Best choices */}
                                {showcaseResult.bestChoices.length > 0 && !compareMode && (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                                        <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
                                            <Trophy size={18} /> Рекомендую для тебя
                                        </h4>
                                        <div className="space-y-2">
                                            {showcaseResult.products
                                                .filter(p => showcaseResult.bestChoices.includes(p.id))
                                                .map(product => (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => setSelectedShowcaseProduct(product)}
                                                        className="w-full flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-200 dark:border-emerald-700 text-left"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-gray-900 dark:text-white">
                                                                {product.emoji} {product.name}
                                                            </span>
                                                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                                {product.ratingReason}
                                                            </p>
                                                        </div>
                                                        <ChevronRight size={18} className="text-gray-400" />
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Avoid list */}
                                {showcaseResult.avoidList.length > 0 && !compareMode && (
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
                                        <h4 className="font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                                            <Ban size={18} /> Лучше избегать
                                        </h4>
                                        <div className="space-y-2">
                                            {showcaseResult.products
                                                .filter(p => showcaseResult.avoidList.includes(p.id))
                                                .map(product => (
                                                    <div
                                                        key={product.id}
                                                        className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-red-200 dark:border-red-700"
                                                    >
                                                        <span className="text-lg">{product.emoji}</span>
                                                        <div className="flex-1">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {product.name}
                                                            </span>
                                                            <p className="text-xs text-red-600 dark:text-red-400">
                                                                {product.allergenWarning || product.diabeticWarning || product.ratingReason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* All products list */}
                                {!compareMode && (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                Все продукты ({showcaseResult.products.length})
                                            </h4>
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {showcaseResult.products.map(product => {
                                                const style = RATING_STYLES[product.rating];
                                                return (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => setSelectedShowcaseProduct(product)}
                                                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                                    >
                                                        <div className={`w-8 h-8 ${style.bg} rounded-full flex items-center justify-center text-white text-sm`}>
                                                            {product.emoji}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                {product.name}
                                                            </p>
                                                            <p className={`text-xs ${style.text}`}>
                                                                {RATING_STYLES[product.rating].label}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {product.calories} ккал
                                                            </p>
                                                            {product.estimatedPrice && (
                                                                <p className="text-xs text-gray-500">
                                                                    ~{product.estimatedPrice}₽
                                                                </p>
                                                            )}
                                                        </div>
                                                        <ChevronRight size={18} className="text-gray-400" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => {
                                    setShowcaseResult(null);
                                    setShowcaseImage(null);
                                    setSelectedShowcaseProduct(null);
                                    setCompareMode(false);
                                    setProductsToCompare([]);
                                    setComparisonResult(null);
                                }}
                                className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} /> Новое фото
                            </button>
                            <button
                                onClick={() => setView('home')}
                                className="flex-1 py-4 bg-violet-500 text-white rounded-xl font-bold"
                            >
                                Готово
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Product detail modal */}
            {selectedShowcaseProduct && !compareMode && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 ${RATING_STYLES[selectedShowcaseProduct.rating].bg} rounded-xl flex items-center justify-center text-white text-2xl`}>
                                    {selectedShowcaseProduct.emoji}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {selectedShowcaseProduct.name}
                                    </h3>
                                    <p className={`text-sm ${RATING_STYLES[selectedShowcaseProduct.rating].text}`}>
                                        {RATING_STYLES[selectedShowcaseProduct.rating].label}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedShowcaseProduct(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
                            {/* Rating reason */}
                            <div className={`p-4 rounded-xl ${
                                selectedShowcaseProduct.rating === 'best_choice' || selectedShowcaseProduct.rating === 'good'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                    : selectedShowcaseProduct.rating === 'caution'
                                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                                        : 'bg-red-50 dark:bg-red-900/20'
                            }`}>
                                <p className={`${RATING_STYLES[selectedShowcaseProduct.rating].text} font-medium`}>
                                    {selectedShowcaseProduct.ratingReason}
                                </p>
                            </div>

                            {/* Warnings */}
                            {selectedShowcaseProduct.allergenWarning && (
                                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center gap-3">
                                    <AlertTriangle size={24} className="text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 dark:text-red-300 font-medium">
                                        {selectedShowcaseProduct.allergenWarning}
                                    </p>
                                </div>
                            )}

                            {selectedShowcaseProduct.diabeticWarning && (
                                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center gap-3">
                                    <ShieldAlert size={24} className="text-orange-500 flex-shrink-0" />
                                    <p className="text-orange-700 dark:text-orange-300 font-medium">
                                        {selectedShowcaseProduct.diabeticWarning}
                                    </p>
                                </div>
                            )}

                            {/* Nutrition */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                                    КБЖУ на 100г
                                </h4>
                                <div className="grid grid-cols-4 gap-3 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {selectedShowcaseProduct.calories}
                                        </p>
                                        <p className="text-xs text-gray-500">ккал</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {selectedShowcaseProduct.protein}
                                        </p>
                                        <p className="text-xs text-gray-500">белки</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {selectedShowcaseProduct.carbs}
                                        </p>
                                        <p className="text-xs text-gray-500">углеводы</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {selectedShowcaseProduct.fat}
                                        </p>
                                        <p className="text-xs text-gray-500">жиры</p>
                                    </div>
                                </div>
                                {(selectedShowcaseProduct.sugar !== undefined || selectedShowcaseProduct.fiber !== undefined) && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 text-center">
                                        {selectedShowcaseProduct.sugar !== undefined && (
                                            <div>
                                                <p className="text-lg font-bold text-red-500">{selectedShowcaseProduct.sugar}г</p>
                                                <p className="text-xs text-gray-500">сахар</p>
                                            </div>
                                        )}
                                        {selectedShowcaseProduct.fiber !== undefined && (
                                            <div>
                                                <p className="text-lg font-bold text-green-500">{selectedShowcaseProduct.fiber}г</p>
                                                <p className="text-xs text-gray-500">клетчатка</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Price */}
                            {selectedShowcaseProduct.estimatedPrice && (
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <span className="text-gray-500">Примерная цена</span>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            ~{selectedShowcaseProduct.estimatedPrice}₽
                                        </p>
                                        {selectedShowcaseProduct.pricePerKg && (
                                            <p className="text-xs text-gray-500">
                                                {selectedShowcaseProduct.pricePerKg}₽/кг
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Serving suggestion */}
                            {selectedShowcaseProduct.servingSuggestion && (
                                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                    <Info size={20} className="text-blue-500 flex-shrink-0" />
                                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                                        {selectedShowcaseProduct.servingSuggestion}
                                    </p>
                                </div>
                            )}

                            {/* Pairs with */}
                            {selectedShowcaseProduct.pairsWith && selectedShowcaseProduct.pairsWith.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Хорошо сочетается с:
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedShowcaseProduct.pairsWith.map((item, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setSelectedShowcaseProduct(null)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium text-gray-700 dark:text-gray-300"
                            >
                                Закрыть
                            </button>
                            <button
                                onClick={() => addShowcaseProductToInventory(selectedShowcaseProduct)}
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> В инвентарь
                            </button>
                        </div>
                    </div>
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
                    {totalCount} {t('productsBought')}
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">{t('estimatedCost')}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(session?.totalEstimatedCost || 0, currency)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('savedAmount')}</p>
                        <p className="text-2xl font-bold text-emerald-500">
                            ~{formatCurrency(Math.round((session?.totalEstimatedCost || 0) * 0.15), currency)}
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
        <div className="min-h-full pb-4">
            {view === 'home' && renderHome()}
            {view === 'planning' && renderPlanning()}
            {view === 'list' && renderList()}
            {view === 'shopping' && renderShopping()}
            {view === 'verify' && renderVerify()}
            {view === 'shelf' && renderShelfScan()}
            {view === 'showcase' && renderShowcase()}
            {view === 'complete' && renderComplete()}
        </div>
    );
};

export default ShoppingAssistant;
