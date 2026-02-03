// SmartCart Gemini AI Service
// Contains only shopping-related AI functions

import { GoogleGenAI, Type } from "@google/genai";
import {
    InventoryItem, StorageType,
    ShoppingPreferences, PlannedMeal, ShoppingListItem, ProductVerification, ShoppingCategory,
    BillingActionType
} from '@fitstream/shared';
import { BillingService } from '@fitstream/shared';
import { StorageService } from './storageService';

// Helper to get API Key (try all available sources)
const getApiKey = () => {
    return import.meta.env.VITE_API_KEY
        || import.meta.env.VITE_GEMINI_API_KEY
        || (typeof process !== 'undefined' && process.env?.API_KEY)
        || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY)
        || '';
};

// Helper to sanitize base64 (remove data:image/... prefix if present)
const cleanBase64 = (b64: string) => {
    return b64.includes(',') ? b64.split(',')[1] : b64;
};

// Helper to extract mime type from data URL
const getMimeType = (b64: string): string => {
    if (b64.startsWith('data:')) {
        const match = b64.match(/^data:([^;]+);/);
        if (match) return match[1];
    }
    return 'image/jpeg'; // default
};

// Helper to check balance and charge for AI actions
const checkAndCharge = async (actionType: BillingActionType): Promise<{ allowed: boolean; reason?: string }> => {
    const settings = StorageService.getSettings();
    const userId = settings.googleId || StorageService.getUserId();

    try {
        const result = await BillingService.chargeForAction(userId, actionType);
        return result;
    } catch (e) {
        console.error('Billing check failed:', e);
        // Allow on billing error to not break UX
        return { allowed: true };
    }
};

// ============================================
// INTERFACES
// ============================================

export interface ScannedProduct {
    name: string;
    emoji: string;
    quantity: number;
    unit: string;
    expiresInDays: number | null;
    caloriesPer100: number;
    positionX: number; // 0-100%
    positionY: number; // 0-100%
    price?: number;
}

export interface ProductWithPhotoId extends ScannedProduct {
    photoId: string;
}

export interface DeduplicatedProduct {
    name: string;
    emoji: string;
    quantity: number;
    unit: string;
    expiresInDays: number | null;
    caloriesPer100: number;
    price?: number;
    positions: { photoId: string; x: number; y: number }[];
    photoIds: string[];
}

export interface ScannedReceiptItem {
    name: string;
    emoji: string;
    quantity: number;
    unit: string;
    price: number;
    storageType: StorageType;
    expiresInDays: number | null;
    caloriesPer100: number;
}

export interface ScannedReceipt {
    store: string;
    date: string;
    totalPrice: number;
    items: ScannedReceiptItem[];
}

export interface GeneratedMealPlan {
    meals: PlannedMeal[];
    shoppingList: ShoppingListItem[];
    totalEstimatedCost: number;
    tips: string[];
}

export interface ShelfProduct {
    name: string;
    emoji: string;
    positionX: number;
    positionY: number;
    isNeeded: boolean;
    matchedListItem?: string;
    healthScore: 1 | 2 | 3;
    estimatedPrice?: number;
}

export interface ShelfScanResult {
    products: ShelfProduct[];
    notRecognized: boolean;
    notRecognizedReason?: string;
    tip?: string;
}

export interface MealAlternative {
    id: string;
    recipeName: string;
    recipeDescription: string;
    cookingTime: number;
    calories: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients: Array<{
        name: string;
        emoji: string;
        quantity: number;
        unit: string;
    }>;
}

export type ShowcaseProductRating = 'best_choice' | 'good' | 'caution' | 'avoid';

export interface ShowcaseProduct {
    id: string;
    name: string;
    emoji: string;
    positionX: number;
    positionY: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar?: number;
    fiber?: number;
    estimatedPrice?: number;
    pricePerKg?: number;
    rating: ShowcaseProductRating;
    ratingReason: string;
    allergenWarning?: string;
    diabeticWarning?: string;
    servingSuggestion?: string;
    pairsWith?: string[];
}

export interface ShowcaseScanContext {
    dailyCalorieGoal?: number;
    dailyProteinGoal?: number;
    todayCalories?: number;
    todayProtein?: number;
    todayCarbs?: number;
    todayFat?: number;
    allergies?: string[];
    diabetic?: boolean;
    vegetarian?: boolean;
    inventoryItems?: string[];
}

export interface ShowcaseScanResult {
    products: ShowcaseProduct[];
    bestChoices: string[];
    avoidList: string[];
    tip: string;
    notRecognized: boolean;
    notRecognizedReason?: string;
}

export interface ProductComparison {
    winner: 'first' | 'second' | 'tie';
    winnerReason: string;
    comparison: {
        category: string;
        firstValue: string;
        secondValue: string;
        better: 'first' | 'second' | 'tie';
    }[];
    recommendation: string;
}

// ============================================
// AI FUNCTIONS
// ============================================

// 1. Generate Meal Plan for Shopping
export const generateMealPlanForShopping = async (
    inventory: InventoryItem[],
    preferences: ShoppingPreferences
): Promise<GeneratedMealPlan> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const inventoryList = inventory.map(item => {
        const expiring = item.expiresAt
            ? ` (годен до ${new Date(item.expiresAt).toLocaleDateString(lang)})`
            : '';
        return `- ${item.emoji || ''} ${item.name}: ${item.quantity}${item.unit}${expiring}`;
    }).join('\n');

    const difficultyMap = { easy: 'простые', medium: 'средние', hard: 'сложные' };
    const timeMap = { quick: 'до 30 минут', medium: '30-60 минут', long: 'более 60 минут' };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        {
                            text: `Ты умная жена, которая планирует питание и покупки. Составь меню на ${preferences.daysCount} дней для ${preferences.peopleCount} человек.

ПРЕДПОЧТЕНИЯ:
- Сложность готовки: ${difficultyMap[preferences.cookingDifficulty]}
- Время готовки: ${timeMap[preferences.maxCookingTime]}
${preferences.budget ? `- Бюджет: ${preferences.budget} руб.` : ''}
${preferences.dietaryRestrictions?.length ? `- Диета: ${preferences.dietaryRestrictions.join(', ')}` : ''}

УЖЕ ЕСТЬ ДОМА:
${inventoryList || 'Ничего нет'}

ЗАДАЧА:
1. Составь план питания (завтрак, обед, ужин, перекус) на каждый день
2. Учти что уже есть дома - используй в первую очередь
3. Составь список покупок только для недостающего
4. Для каждого продукта в списке укажи:
   - category: dairy/meat/fish/vegetables/fruits/grains/bread/frozen/drinks/snacks/spices/other
   - healthScore: 1 (зеленый-здоровый), 2 (желтый-умеренный), 3 (красный-нездоровый)
   - expiryReminder: true если скоропортящийся
5. Добавь полезные советы

Будь практичной и экономной, как заботливая жена!
Язык: ${lang}`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        meals: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    day: { type: Type.NUMBER },
                                    mealType: { type: Type.STRING, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
                                    recipeName: { type: Type.STRING },
                                    recipeDescription: { type: Type.STRING },
                                    servings: { type: Type.NUMBER },
                                    calories: { type: Type.NUMBER },
                                    cookingTime: { type: Type.NUMBER },
                                    difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                                    ingredients: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING },
                                                emoji: { type: Type.STRING },
                                                quantity: { type: Type.NUMBER },
                                                unit: { type: Type.STRING },
                                                inInventory: { type: Type.BOOLEAN },
                                                inventoryQuantity: { type: Type.NUMBER },
                                                needToBuy: { type: Type.NUMBER }
                                            },
                                            required: ["name", "quantity", "unit", "inInventory", "needToBuy"]
                                        }
                                    }
                                },
                                required: ["id", "day", "mealType", "recipeName", "servings", "calories", "cookingTime", "difficulty", "ingredients"]
                            }
                        },
                        shoppingList: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    name: { type: Type.STRING },
                                    emoji: { type: Type.STRING },
                                    quantity: { type: Type.NUMBER },
                                    unit: { type: Type.STRING },
                                    category: { type: Type.STRING, enum: ['dairy', 'meat', 'fish', 'vegetables', 'fruits', 'grains', 'bread', 'frozen', 'drinks', 'snacks', 'spices', 'other'] },
                                    estimatedPrice: { type: Type.NUMBER },
                                    forRecipes: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    healthScore: { type: Type.NUMBER },
                                    healthNote: { type: Type.STRING },
                                    expiryReminder: { type: Type.BOOLEAN }
                                },
                                required: ["id", "name", "emoji", "quantity", "unit", "category", "forRecipes", "healthScore"]
                            }
                        },
                        totalEstimatedCost: { type: Type.NUMBER },
                        tips: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["meals", "shoppingList", "totalEstimatedCost", "tips"]
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            // Add isChecked: false to all shopping items
            result.shoppingList = result.shoppingList.map((item: any) => ({
                ...item,
                isChecked: false
            }));
            return result;
        }
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error generating meal plan:", error);
        throw error;
    }
};

// 2. Verify Product by Photo
export const verifyProductPhoto = async (
    base64Image: string,
    expectedProduct: ShoppingListItem
): Promise<ProductVerification> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
                        {
                            text: `Ты умная жена в магазине. Пользователь ищет: "${expectedProduct.emoji} ${expectedProduct.name}" (${expectedProduct.quantity} ${expectedProduct.unit}).

ЗАДАЧА:
1. Определи, это нужный продукт или нет (isCorrect)
2. Оцени здоровье продукта (healthScore: 1=зеленый-здоровый, 2=желтый-умеренный, 3=красный-нездоровый)
3. Проверь срок годности если видно (expiryWarning)
4. Предложи альтернативу получше если есть (betterAlternative)
5. Укажи КБЖУ на 100г

Будь честной - если не можешь точно определить, скажи прямо!
Язык: ${lang}`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isCorrect: { type: Type.BOOLEAN },
                        confidence: { type: Type.NUMBER },
                        productName: { type: Type.STRING },
                        healthScore: { type: Type.NUMBER },
                        healthAnalysis: { type: Type.STRING },
                        expiryWarning: { type: Type.STRING },
                        betterAlternative: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            }
                        },
                        nutritionPer100: {
                            type: Type.OBJECT,
                            properties: {
                                calories: { type: Type.NUMBER },
                                protein: { type: Type.NUMBER },
                                carbs: { type: Type.NUMBER },
                                fat: { type: Type.NUMBER },
                                sugar: { type: Type.NUMBER },
                                fiber: { type: Type.NUMBER }
                            },
                            required: ["calories", "protein", "carbs", "fat"]
                        }
                    },
                    required: ["isCorrect", "confidence", "productName", "healthScore", "healthAnalysis", "nutritionPer100"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error verifying product:", error);
        throw error;
    }
};

// 3. Scan Store Shelf
export const scanStoreShelf = async (
    base64Image: string,
    shoppingList: ShoppingListItem[]
): Promise<ShelfScanResult> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const neededItems = shoppingList
        .filter(item => !item.isChecked)
        .map(item => `- ${item.emoji} ${item.name} (${item.quantity} ${item.unit}) [id: ${item.id}]`)
        .join('\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
                        {
                            text: `Ты умная жена-помощник в магазине. Пользователь сфоткал витрину/полку.

НУЖНО НАЙТИ:
${neededItems || 'Список пуст'}

ЗАДАЧА:
1. Распознай ВСЕ видимые продукты на фото
2. Для каждого продукта укажи позицию на фото (positionX, positionY в процентах 0-100)
3. Отметь какие из них есть в списке покупок (isNeeded: true, matchedListItem: id из списка)
4. Оцени здоровье каждого (healthScore)
5. Если НЕ МОЖЕШЬ чётко распознать витрину - честно скажи notRecognized: true и объясни почему

ВАЖНО: Будь честной! Если фото размытое, тёмное или это не витрина - так и скажи.
Язык: ${lang}`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        products: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    emoji: { type: Type.STRING },
                                    positionX: { type: Type.NUMBER },
                                    positionY: { type: Type.NUMBER },
                                    isNeeded: { type: Type.BOOLEAN },
                                    matchedListItem: { type: Type.STRING },
                                    healthScore: { type: Type.NUMBER },
                                    estimatedPrice: { type: Type.NUMBER }
                                },
                                required: ["name", "emoji", "positionX", "positionY", "isNeeded", "healthScore"]
                            }
                        },
                        notRecognized: { type: Type.BOOLEAN },
                        notRecognizedReason: { type: Type.STRING },
                        tip: { type: Type.STRING }
                    },
                    required: ["products", "notRecognized"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return { products: [], notRecognized: true, notRecognizedReason: "Empty AI response" };
    } catch (error) {
        console.error("Error scanning shelf:", error);
        return { products: [], notRecognized: true, notRecognizedReason: String(error) };
    }
};

// 4. Suggest alternative when product is not available
export const suggestProductAlternative = async (
    unavailableProduct: ShoppingListItem,
    availableProducts?: string[]
): Promise<{
    alternatives: Array<{
        name: string;
        emoji: string;
        reason: string;
        healthScore: 1 | 2 | 3;
    }>;
    tip: string;
}> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        {
                            text: `Ты умная жена в магазине. Нужного продукта нет:
"${unavailableProduct.emoji} ${unavailableProduct.name}" для рецептов: ${unavailableProduct.forRecipes.join(', ')}

${availableProducts?.length ? `На полке видно: ${availableProducts.join(', ')}` : ''}

Предложи 2-3 альтернативы, которые подойдут для этих рецептов.
Объясни почему каждая подходит и оцени здоровье (1=зеленый, 2=желтый, 3=красный).
Дай практичный совет.
Язык: ${lang}`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        alternatives: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    emoji: { type: Type.STRING },
                                    reason: { type: Type.STRING },
                                    healthScore: { type: Type.NUMBER }
                                },
                                required: ["name", "emoji", "reason", "healthScore"]
                            }
                        },
                        tip: { type: Type.STRING }
                    },
                    required: ["alternatives", "tip"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error suggesting alternative:", error);
        throw error;
    }
};

// 5. Analyze Display Case / Showcase
export const analyzeDisplayCase = async (
    base64Image: string,
    context: ShowcaseScanContext
): Promise<ShowcaseScanResult> => {
    const billing = await checkAndCharge('showcase_scan');
    if (!billing.allowed) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const caloriesRemaining = context.dailyCalorieGoal && context.todayCalories
        ? context.dailyCalorieGoal - context.todayCalories
        : null;
    const proteinRemaining = context.dailyProteinGoal && context.todayProtein
        ? context.dailyProteinGoal - context.todayProtein
        : null;

    const contextInfo = `
КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
${context.dailyCalorieGoal ? `- Цель калорий: ${context.dailyCalorieGoal} ккал/день` : ''}
${context.dailyProteinGoal ? `- Цель белка: ${context.dailyProteinGoal}г/день` : ''}
${caloriesRemaining !== null ? `- Осталось калорий сегодня: ${caloriesRemaining} ккал` : ''}
${proteinRemaining !== null ? `- Осталось белка сегодня: ${proteinRemaining}г` : ''}
${context.todayCarbs ? `- Углеводов сегодня съел: ${context.todayCarbs}г` : ''}
${context.todayFat ? `- Жиров сегодня съел: ${context.todayFat}г` : ''}
${context.allergies?.length ? `- АЛЛЕРГИИ: ${context.allergies.join(', ')}` : ''}
${context.diabetic ? '- ДИАБЕТИК: избегать сахар и высокий ГИ!' : ''}
${context.vegetarian ? '- ВЕГЕТАРИАНЕЦ: без мяса и рыбы' : ''}
${context.inventoryItems?.length ? `- Уже есть дома: ${context.inventoryItems.join(', ')}` : ''}
`.trim();

    try {
        const mimeType = getMimeType(base64Image);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType, data: cleanBase64(base64Image) } },
                        {
                            text: `Ты умный помощник в магазине. Пользователь сфоткал витрину/полку.

${contextInfo}

ЗАДАЧА:
1. Распознай ВСЕ видимые продукты на фото
2. Для каждого продукта определи:
   - id: уникальный ID (prod_1, prod_2, ...)
   - name, emoji
   - positionX, positionY: позиция на фото (0-100%)
   - КБЖУ на 100г (calories, protein, carbs, fat, sugar, fiber)
   - estimatedPrice: примерная цена в рублях
   - pricePerKg: цена за кг для сравнения

3. ПЕРСОНАЛЬНЫЙ РЕЙТИНГ каждого продукта:
   - best_choice: Идеально подходит пользователю
   - good: Хороший выбор
   - caution: С осторожностью (много сахара, калорий)
   - avoid: Избегать (аллергены, противопоказано)

4. ratingReason: объясни ПОЧЕМУ такой рейтинг (персонализировано!)
5. Предупреждения: allergenWarning, diabeticWarning
6. Полезные советы: servingSuggestion, pairsWith
7. Итоговые рекомендации: bestChoices, avoidList, tip

ВАЖНО:
- Если фото размытое или это НЕ витрина - честно скажи notRecognized: true
- Учитывай ВСЕ ограничения пользователя!
- Рейтинг должен быть ПЕРСОНАЛЬНЫМ, не общим

Язык: ${lang}`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        products: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    name: { type: Type.STRING },
                                    emoji: { type: Type.STRING },
                                    positionX: { type: Type.NUMBER },
                                    positionY: { type: Type.NUMBER },
                                    calories: { type: Type.NUMBER },
                                    protein: { type: Type.NUMBER },
                                    carbs: { type: Type.NUMBER },
                                    fat: { type: Type.NUMBER },
                                    sugar: { type: Type.NUMBER },
                                    fiber: { type: Type.NUMBER },
                                    estimatedPrice: { type: Type.NUMBER },
                                    pricePerKg: { type: Type.NUMBER },
                                    rating: { type: Type.STRING, enum: ['best_choice', 'good', 'caution', 'avoid'] },
                                    ratingReason: { type: Type.STRING },
                                    allergenWarning: { type: Type.STRING },
                                    diabeticWarning: { type: Type.STRING },
                                    servingSuggestion: { type: Type.STRING },
                                    pairsWith: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["id", "name", "emoji", "positionX", "positionY", "calories", "protein", "carbs", "fat", "rating", "ratingReason"]
                            }
                        },
                        bestChoices: { type: Type.ARRAY, items: { type: Type.STRING } },
                        avoidList: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tip: { type: Type.STRING },
                        notRecognized: { type: Type.BOOLEAN },
                        notRecognizedReason: { type: Type.STRING }
                    },
                    required: ["products", "bestChoices", "avoidList", "tip", "notRecognized"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return { products: [], bestChoices: [], avoidList: [], tip: '', notRecognized: true, notRecognizedReason: "Empty AI response" };
    } catch (error) {
        console.error("Error analyzing display case:", error);
        return { products: [], bestChoices: [], avoidList: [], tip: '', notRecognized: true, notRecognizedReason: String(error) };
    }
};

// 6. Compare two products
export const compareProducts = async (
    first: ShowcaseProduct,
    second: ShowcaseProduct,
    context: ShowcaseScanContext
): Promise<ProductComparison> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        {
                            text: `Сравни два продукта для пользователя:

ПРОДУКТ 1: ${first.emoji} ${first.name}
- Калории: ${first.calories} ккал/100г
- Белок: ${first.protein}г, Углеводы: ${first.carbs}г, Жиры: ${first.fat}г
- Цена: ~${first.estimatedPrice || '?'}

ПРОДУКТ 2: ${second.emoji} ${second.name}
- Калории: ${second.calories} ккал/100г
- Белок: ${second.protein}г, Углеводы: ${second.carbs}г, Жиры: ${second.fat}г
- Цена: ~${second.estimatedPrice || '?'}

КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
${context.dailyProteinGoal ? `- Цель белка: ${context.dailyProteinGoal}г/день` : ''}
${context.todayProtein ? `- Белка сегодня съел: ${context.todayProtein}г` : ''}
${context.diabetic ? '- ДИАБЕТИК' : ''}
${context.vegetarian ? '- ВЕГЕТАРИАНЕЦ' : ''}

Сравни по категориям и дай персональную рекомендацию.
Язык: ${lang}`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        winner: { type: Type.STRING, enum: ['first', 'second', 'tie'] },
                        winnerReason: { type: Type.STRING },
                        comparison: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING },
                                    firstValue: { type: Type.STRING },
                                    secondValue: { type: Type.STRING },
                                    better: { type: Type.STRING, enum: ['first', 'second', 'tie'] }
                                },
                                required: ["category", "firstValue", "secondValue", "better"]
                            }
                        },
                        recommendation: { type: Type.STRING }
                    },
                    required: ["winner", "winnerReason", "comparison", "recommendation"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error comparing products:", error);
        throw error;
    }
};

// 7. Scan Receipt
export const scanReceipt = async (base64Image: string): Promise<ScannedReceipt> => {
    const billing = await checkAndCharge('receipt_scan');
    if (!billing.allowed) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
                        {
                            text: `Извлеки все товары из чека. Язык: ${lang}.

                            Для каждого товара определи:
                            - name: название продукта (упрости если длинное)
                            - emoji: подходящий эмодзи
                            - quantity: количество
                            - unit: единица (г, мл, шт, кг, л)
                            - price: цена
                            - storageType: куда класть (fridge/cabinet/freezer)
                            - expiresInDays: через сколько дней испортится (null если долгое хранение)
                            - caloriesPer100: примерные калории на 100г/мл

                            Также определи магазин, дату и итоговую сумму.`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        store: { type: Type.STRING },
                        date: { type: Type.STRING },
                        totalPrice: { type: Type.NUMBER },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    emoji: { type: Type.STRING },
                                    quantity: { type: Type.NUMBER },
                                    unit: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    storageType: { type: Type.STRING, enum: ['fridge', 'cabinet', 'freezer'] },
                                    expiresInDays: { type: Type.NUMBER, nullable: true },
                                    caloriesPer100: { type: Type.NUMBER }
                                },
                                required: ["name", "emoji", "quantity", "unit", "price", "storageType", "caloriesPer100"]
                            }
                        }
                    },
                    required: ["store", "date", "totalPrice", "items"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error scanning receipt:", error);
        throw error;
    }
};

// 8. Generate meal alternatives for replacement
export const generateMealAlternatives = async (
    currentMeal: PlannedMeal,
    preferences: ShoppingPreferences,
    inventory: InventoryItem[]
): Promise<{ alternatives: MealAlternative[] }> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });

    const difficultyMap = { easy: 'простые', medium: 'средние', hard: 'сложные' };
    const timeMap = { quick: 'до 30 минут', medium: '30-60 минут', long: 'более 60 минут' };
    const mealTypeMap = { breakfast: 'завтрак', lunch: 'обед', dinner: 'ужин', snack: 'перекус' };

    const inventoryList = inventory.map(item => `${item.emoji || ''} ${item.name}`).join(', ');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [{
                    text: `Ты умная жена, которая помогает заменить блюдо в меню.

ТЕКУЩЕЕ БЛЮДО (${mealTypeMap[currentMeal.mealType]}):
- Название: ${currentMeal.recipeName}
- Описание: ${currentMeal.recipeDescription}
- Время готовки: ${currentMeal.cookingTime} мин
- Калории: ${currentMeal.calories}

ПРЕДПОЧТЕНИЯ:
- Сложность: ${difficultyMap[preferences.cookingDifficulty]}
- Макс. время готовки: ${timeMap[preferences.maxCookingTime]}
- Людей: ${preferences.peopleCount}

ЕСТЬ В ХОЛОДИЛЬНИКЕ: ${inventoryList || 'пусто'}

Предложи 3 альтернативных блюда похожей сложности и времени готовки.
Постарайся использовать то, что уже есть в холодильнике.
Верни JSON.`
                }]
            }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        alternatives: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    recipeName: { type: Type.STRING },
                                    recipeDescription: { type: Type.STRING },
                                    cookingTime: { type: Type.NUMBER },
                                    calories: { type: Type.NUMBER },
                                    difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                                    ingredients: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING },
                                                emoji: { type: Type.STRING },
                                                quantity: { type: Type.NUMBER },
                                                unit: { type: Type.STRING }
                                            },
                                            required: ['name', 'emoji', 'quantity', 'unit']
                                        }
                                    }
                                },
                                required: ['id', 'recipeName', 'recipeDescription', 'cookingTime', 'calories', 'difficulty', 'ingredients']
                            }
                        }
                    },
                    required: ['alternatives']
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error generating meal alternatives:", error);
        throw error;
    }
};

// 9. Check if user already has product at home (duplicate warning)
export const checkDuplicateInInventory = (
    productName: string,
    inventory: InventoryItem[]
): { hasDuplicate: boolean; existingItem?: InventoryItem; message?: string } => {
    const normalizedName = productName.toLowerCase().trim();

    const match = inventory.find(item => {
        const itemName = item.name.toLowerCase().trim();
        return itemName === normalizedName ||
               itemName.includes(normalizedName) ||
               normalizedName.includes(itemName);
    });

    if (match) {
        return {
            hasDuplicate: true,
            existingItem: match,
            message: `У тебя уже есть ${match.emoji || ''} ${match.name}: ${match.quantity}${match.unit}!`
        };
    }

    return { hasDuplicate: false };
};

// 10. Deduplicate products from multiple photos
export const deduplicateProducts = async (
    productsFromPhotos: ProductWithPhotoId[]
): Promise<DeduplicatedProduct[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const productsJson = JSON.stringify(productsFromPhotos.map(p => ({
        photoId: p.photoId,
        name: p.name,
        emoji: p.emoji,
        quantity: p.quantity,
        unit: p.unit,
        expiresInDays: p.expiresInDays,
        caloriesPer100: p.caloriesPer100,
        positionX: p.positionX,
        positionY: p.positionY
    })));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        {
                            text: `У меня есть продукты с разных фото одного хранилища (холодильника/шкафа).
Некоторые продукты могут быть сняты с разных ракурсов и появляться на нескольких фото.

ВАЖНО: Объедини дубликаты!
- Если один и тот же продукт виден на разных фото - это ОДИН продукт, не считай дважды
- Определи дубликаты по: название, тип продукта, похожее количество
- Для дубликатов: сохрани все позиции (positions) со всех фото где он виден
- Не дублируй quantity - если молоко видно на 2 фото, это всё равно 1 пакет молока

Продукты:
${productsJson}

Верни JSON массив объединённых продуктов. Язык: ${lang}`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            emoji: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unit: { type: Type.STRING },
                            expiresInDays: { type: Type.NUMBER, nullable: true },
                            caloriesPer100: { type: Type.NUMBER },
                            positions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        photoId: { type: Type.STRING },
                                        x: { type: Type.NUMBER },
                                        y: { type: Type.NUMBER }
                                    },
                                    required: ["photoId", "x", "y"]
                                }
                            },
                            photoIds: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["name", "emoji", "quantity", "unit", "caloriesPer100", "positions", "photoIds"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (error) {
        console.error("Error deduplicating products:", error);
        // Fallback: convert without deduplication
        return productsFromPhotos.map(p => ({
            name: p.name,
            emoji: p.emoji,
            quantity: p.quantity,
            unit: p.unit,
            expiresInDays: p.expiresInDays,
            caloriesPer100: p.caloriesPer100,
            price: p.price,
            positions: [{ photoId: p.photoId, x: p.positionX, y: p.positionY }],
            photoIds: [p.photoId]
        }));
    }
};

// 11. Get nutrition info for manual product entry
export const getProductNutrition = async (productName: string): Promise<{
    emoji: string;
    caloriesPer100: number;
    defaultUnit: string;
    typicalQuantity: number;
    storageType: StorageType;
    shelfLifeDays: number | null;
}> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        {
                            text: `Определи информацию о продукте "${productName}":
                            - emoji: подходящий эмодзи
                            - caloriesPer100: калорий на 100г/мл
                            - defaultUnit: типичная единица измерения (г, мл, шт)
                            - typicalQuantity: типичное количество при покупке
                            - storageType: где хранить (fridge/cabinet/freezer)
                            - shelfLifeDays: срок хранения в днях (null если очень долго)`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        emoji: { type: Type.STRING },
                        caloriesPer100: { type: Type.NUMBER },
                        defaultUnit: { type: Type.STRING },
                        typicalQuantity: { type: Type.NUMBER },
                        storageType: { type: Type.STRING, enum: ['fridge', 'cabinet', 'freezer'] },
                        shelfLifeDays: { type: Type.NUMBER, nullable: true }
                    },
                    required: ["emoji", "caloriesPer100", "defaultUnit", "typicalQuantity", "storageType"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error getting product nutrition:", error);
        throw error;
    }
};
