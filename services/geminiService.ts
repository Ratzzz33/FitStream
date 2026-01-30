

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { t } from './i18n';
import { ApiService } from './api';
import { StorageService } from './storageService';
import {
    InventoryItem, Recipe, CookingStep, CookingReminder, StorageType,
    ShoppingPreferences, PlannedMeal, ShoppingListItem, ProductVerification, ShoppingCategory
} from '../types';

// Helper to get API Key (Env Only)
const getApiKey = () => {
    return process.env.API_KEY || '';
};

// Helper to sanitize base64 (remove data:image/... prefix if present)
const cleanBase64 = (b64: string) => {
    return b64.includes(',') ? b64.split(',')[1] : b64;
};

// 1. Vision Service for Weight Scale Reading
export const scanScaleDisplay = async (base64Image: string): Promise<{ weight: number | null, confidence: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
            { text: "Read the number on this scale. Return JSON with 'weight' (number) and 'confidence' (HIGH/LOW). If invalid, return weight 0." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weight: { type: Type.NUMBER },
            confidence: { type: Type.STRING, enum: ["HIGH", "LOW"] }
          },
          required: ["weight", "confidence"]
        }
      }
    });
    
    // Safety check for null response
    if (response.text) {
        return JSON.parse(response.text);
    }
    return { weight: null, confidence: "LOW" };
  } catch (error) {
    console.error("Error scanning scale:", error);
    return { weight: null, confidence: "LOW" };
  }
};

// 2. Nutrition Analysis
export const analyzeFood = async (
    base64Image: string, 
    referenceObject: string,
    referenceDimensions?: string
): Promise<{ name: string, calories: number, protein: number, carbs: number, fat: number }> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const refContext = referenceDimensions 
        ? `User is using a "${referenceObject}" (${referenceDimensions}) for scale.`
        : `A "${referenceObject}" is used for scale.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
                        { text: `Identify food. ${refContext} Estimate size, calories, protein, carbs, fat. JSON output. Language: ${lang}.` }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER },
                        fat: { type: Type.NUMBER }
                    },
                    required: ["name", "calories", "protein", "carbs", "fat"]
                }
            }
        });
        
        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error analyzing food:", error);
        throw error;
    }
};

// 2.1 Calculate Nutrition from Text
export const calculateNutritionFromText = async (
    foodName: string, 
    amount: string
): Promise<{ calories: number, protein: number, carbs: number, fat: number }> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { text: `Calculate nutrition for "${foodName}" (${amount || 'standard serving'}). Return JSON: calories, protein, carbs, fat.` }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER },
                        fat: { type: Type.NUMBER }
                    },
                    required: ["calories", "protein", "carbs", "fat"]
                }
            }
        });
        
        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error calculating nutrition:", error);
        throw error;
    }
};

// 3. Identify Reference Object
export const identifyReferenceObject = async (base64Image: string): Promise<{ name: string, dimensions: string }> => {
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
                        { text: `Identify the main reference object (e.g. credit card, coin, lighter). Return JSON: {name, dimensions} in ${lang}.` }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        dimensions: { type: Type.STRING }
                    },
                    required: ["name", "dimensions"]
                }
            }
        });
        
        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error identifying object:", error);
        throw error;
    }
};

// 4. Phone Specs
export const getPhoneSpecs = async (modelName: string): Promise<{ officialName: string, weightGrams: number } | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const settings = StorageService.getSettings();
    
    let knownPhones: any[] = [];
    try {
        knownPhones = await ApiService.getPhoneDatabase(settings.backendUrl);
    } catch (e) {}
    
    const dbContext = knownPhones.length > 0 ? JSON.stringify(knownPhones) : "[]";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { text: `Find phone model "${modelName}". Use DB if matches: ${dbContext}. Else estimate. Return JSON: {officialName, weightGrams, isValid, source}.` }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        officialName: { type: Type.STRING },
                        weightGrams: { type: Type.NUMBER },
                        isValid: { type: Type.BOOLEAN },
                        source: { type: Type.STRING }
                    },
                    required: ["officialName", "weightGrams", "isValid"]
                }
            }
        });
        if (response.text) {
            const data = JSON.parse(response.text);
            if (data.isValid) return { officialName: data.officialName, weightGrams: data.weightGrams };
        }
        return null;
    } catch (e) {
        return null;
    }
};

// 5. Menu Analyzer
export interface MenuRecommendation {
    dishName: string;
    calories: number;
    protein: number;
    category: 'BEST_CHOICE' | 'HIGH_PROTEIN' | 'LESSER_OF_EVILS';
    reasoning: string;
}

export const analyzeMenu = async (base64Image: string): Promise<MenuRecommendation[]> => {
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
                        { text: `Analyze menu. Recommend 3 dishes: BEST_CHOICE, HIGH_PROTEIN, LESSER_OF_EVILS. JSON Array. Language: ${lang}.` }
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
                            dishName: { type: Type.STRING },
                            calories: { type: Type.NUMBER },
                            protein: { type: Type.NUMBER },
                            category: { type: Type.STRING, enum: ['BEST_CHOICE', 'HIGH_PROTEIN', 'LESSER_OF_EVILS'] },
                            reasoning: { type: Type.STRING }
                        },
                        required: ["dishName", "calories", "protein", "category", "reasoning"]
                    }
                }
            }
        });
        
        if (response.text) return JSON.parse(response.text);
        return [];
    } catch (error) {
        console.error("Error analyzing menu:", error);
        throw error;
    }
};

// 6. Motivation
export const getMotivation = async (streak: number, repsToday: number): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return t('defaultMotivation');
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [{ text: `Motivational quote for fitness. Streak: ${streak} days. Reps today: ${repsToday}. Language: ${lang}. Keep it short.` }]
                }
            ]
        });
        return response.text || t('defaultMotivation');
    } catch (e) {
        return t('defaultMotivation');
    }
};

// ============================================
// SMART KITCHEN AI FUNCTIONS
// ============================================

// 7. Scan Storage Photo (fridge/cabinet/freezer)
export interface ScannedProduct {
    name: string;
    emoji: string;
    quantity: number;
    unit: string;
    expiresInDays: number | null;
    caloriesPer100: number;
    positionX: number; // 0-100%
    positionY: number; // 0-100%
}

export const scanStoragePhoto = async (
    base64Image: string,
    storageType: StorageType
): Promise<ScannedProduct[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const storageNames: Record<StorageType, string> = {
        fridge: 'холодильника',
        cabinet: 'кухонного шкафа',
        freezer: 'морозилки'
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
                        {
                            text: `Распознай ВСЕ продукты на фото ${storageNames[storageType]}.
                            Для каждого продукта определи:
                            - name: название на языке ${lang}
                            - emoji: подходящий эмодзи
                            - quantity: примерное количество (число)
                            - unit: единица измерения (г, мл, шт)
                            - expiresInDays: через сколько дней испортится (null если долгое хранение)
                            - caloriesPer100: калорий на 100г/мл
                            - positionX, positionY: позиция на фото в процентах (0-100)

                            Верни JSON массив. Будь внимателен, не пропускай продукты.`
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
                            positionX: { type: Type.NUMBER },
                            positionY: { type: Type.NUMBER }
                        },
                        required: ["name", "emoji", "quantity", "unit", "caloriesPer100", "positionX", "positionY"]
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return [];
    } catch (error) {
        console.error("Error scanning storage:", error);
        throw error;
    }
};

// 8. Scan Receipt
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

export const scanReceipt = async (base64Image: string): Promise<ScannedReceipt> => {
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
                    required: ["store", "totalPrice", "items"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return { store: '', date: '', totalPrice: 0, items: [] };
    } catch (error) {
        console.error("Error scanning receipt:", error);
        throw error;
    }
};

// 9. Generate Recipes from Inventory

// История питания за сегодня для контекста
export interface TodayMealContext {
    time: string;        // "08:30"
    name: string;        // "Овсянка с бананом"
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export interface RecipeGenerationContext {
    timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    currentTime: string; // "12:30" — точное время
    caloriesRemaining: number;
    servingsNeeded: number;
    maxCookingTime?: number; // minutes
    excludeRecipeIds?: string[];
    dietaryPreferences?: string[];
    // История питания сегодня
    todayMeals?: TodayMealContext[];
    // БЖУ съеденное сегодня
    todayMacros?: {
        protein: number;
        carbs: number;
        fat: number;
    };
}

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface RecipeEquipment {
    name: string;
    emoji: string;
    essential: boolean; // true = обязательно, false = желательно
}

export interface GeneratedRecipe {
    name: string;
    description: string;
    servings: number;
    totalTimeMinutes: number;
    caloriesPerServing: number;
    // БЖУ на порцию
    proteinPerServing: number;
    carbsPerServing: number;
    fatPerServing: number;
    // Сложность
    difficulty: RecipeDifficulty;
    difficultyReason?: string; // "Много шагов" / "Нужен опыт" / "Простые ингредиенты"
    // Новые поля для UX
    equipment: RecipeEquipment[]; // Необходимые инструменты
    messyLevel: 1 | 2 | 3; // 1=чисто, 2=умеренно, 3=много брызг/мусора
    messyWarning?: string; // "Брызги масла" / "Много отходов"
    ingredients: {
        name: string;
        emoji: string;
        quantity: number;
        unit: string;
        isAvailable: boolean;
        inventoryItemId?: string;
    }[];
    steps: {
        order: number;
        instruction: string;
        timerSeconds?: number;
        heatLevel?: 1 | 2 | 3;
        tip?: string;
        technique?: string; // "Режь от корня, не срезая его — меньше слёз"
        doneWhen?: string;
        reminders: {
            type: string;
            intervalSeconds?: number;
            atSeconds?: number;
            message: string;
            icon: string;
        }[];
        troubleshoot: {
            problem: string;
            solution: string;
        }[];
    }[];
    priorityReason?: string; // Why this recipe is recommended (e.g., "Курица портится завтра")
    nutritionNote?: string;  // "Белковое блюдо — идеально после углеводного завтрака"
    // PRD: Economic calculations
    costEstimate?: number;    // Себестоимость блюда в рублях
    restaurantPrice?: number; // Примерная цена в ресторане
}

export const generateRecipes = async (
    inventory: InventoryItem[],
    context: RecipeGenerationContext
): Promise<GeneratedRecipe[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    // Format inventory for prompt
    const inventoryList = inventory.map(item => {
        const expiring = item.expiresAt
            ? ` (годен до ${new Date(item.expiresAt).toLocaleDateString(lang)})`
            : '';
        return `- ${item.emoji || ''} ${item.name}: ${item.quantity}${item.unit}${expiring}`;
    }).join('\n');

    // Expiring items for priority
    const expiringItems = inventory
        .filter(i => i.expiresAt && new Date(i.expiresAt) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
        .map(i => i.name);

    const mealTypeNames: Record<string, string> = {
        breakfast: 'завтрак',
        lunch: 'обед',
        dinner: 'ужин',
        snack: 'перекус'
    };

    // История питания сегодня
    const todayMealsInfo = context.todayMeals?.length
        ? `\nСЕГОДНЯ УЖЕ ЕЛ:\n${context.todayMeals.map(m =>
            `- ${m.time}: ${m.name} (${m.calories} ккал${m.protein ? `, Б:${m.protein}г` : ''}${m.carbs ? `, У:${m.carbs}г` : ''})`
        ).join('\n')}`
        : '';

    // БЖУ баланс
    const macrosInfo = context.todayMacros
        ? `\nСЪЕДЕНО БЖУ СЕГОДНЯ: Белки ${context.todayMacros.protein}г, Углеводы ${context.todayMacros.carbs}г, Жиры ${context.todayMacros.fat}г`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        {
                            text: `Ты кулинарный AI-помощник как в ресторане. Сейчас ${context.currentTime || new Date().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}.
Предложи 3-4 блюда для ${mealTypeNames[context.timeOfDay]} как меню ресторана.

ДОСТУПНЫЕ ПРОДУКТЫ:
${inventoryList}

${expiringItems.length > 0 ? `⚠️ СКОРО ПОРТЯТСЯ (приоритет!): ${expiringItems.join(', ')}` : ''}
${todayMealsInfo}
${macrosInfo}

ОГРАНИЧЕНИЯ:
- Порций: ${context.servingsNeeded}
- Осталось калорий на день: ${context.caloriesRemaining}
- Максимум времени готовки: ${context.maxCookingTime || 60} минут
${context.dietaryPreferences?.length ? `- Диета: ${context.dietaryPreferences.join(', ')}` : ''}

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ для каждого рецепта:
1. proteinPerServing, carbsPerServing, fatPerServing — БЖУ на порцию в граммах
2. difficulty: "easy" / "medium" / "hard"
3. difficultyReason: почему такая сложность (1-2 слова)
4. nutritionNote: если утром ел углеводы — порекомендуй белковое, и наоборот
5. equipment: массив инструментов [{name, emoji, essential}] — сковорода🍳, нож🔪, кастрюля🍲, блендер и т.д.
6. messyLevel: 1 (чисто), 2 (умеренно), 3 (много брызг/мусора)
7. messyWarning: если messyLevel >= 2, объясни что будет (брызги масла, много отходов)

ВАЖНО для шагов готовки:
1. Пиши ПРОСТЫМ языком для новичков
2. Указывай время и уровень огня (1=слабый, 2=средний, 3=сильный)
3. Добавляй tip, doneWhen, troubleshoot
4. technique: советы по технике (как резать лук без слёз, как проверить готовность и т.д.)

ЭКОНОМИКА:
- costEstimate: себестоимость в рублях
- restaurantPrice: цена в кафе

Язык ответа: ${lang}`
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
                            description: { type: Type.STRING },
                            servings: { type: Type.NUMBER },
                            totalTimeMinutes: { type: Type.NUMBER },
                            caloriesPerServing: { type: Type.NUMBER },
                            proteinPerServing: { type: Type.NUMBER },
                            carbsPerServing: { type: Type.NUMBER },
                            fatPerServing: { type: Type.NUMBER },
                            difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                            difficultyReason: { type: Type.STRING },
                            nutritionNote: { type: Type.STRING },
                            equipment: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        emoji: { type: Type.STRING },
                                        essential: { type: Type.BOOLEAN }
                                    },
                                    required: ["name", "emoji", "essential"]
                                }
                            },
                            messyLevel: { type: Type.NUMBER },
                            messyWarning: { type: Type.STRING },
                            costEstimate: { type: Type.NUMBER },
                            restaurantPrice: { type: Type.NUMBER },
                            priorityReason: { type: Type.STRING },
                            ingredients: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        emoji: { type: Type.STRING },
                                        quantity: { type: Type.NUMBER },
                                        unit: { type: Type.STRING },
                                        isAvailable: { type: Type.BOOLEAN }
                                    },
                                    required: ["name", "quantity", "unit", "isAvailable"]
                                }
                            },
                            steps: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        order: { type: Type.NUMBER },
                                        instruction: { type: Type.STRING },
                                        timerSeconds: { type: Type.NUMBER },
                                        heatLevel: { type: Type.NUMBER },
                                        tip: { type: Type.STRING },
                                        technique: { type: Type.STRING },
                                        doneWhen: { type: Type.STRING },
                                        reminders: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    type: { type: Type.STRING },
                                                    intervalSeconds: { type: Type.NUMBER },
                                                    atSeconds: { type: Type.NUMBER },
                                                    message: { type: Type.STRING },
                                                    icon: { type: Type.STRING }
                                                },
                                                required: ["type", "message", "icon"]
                                            }
                                        },
                                        troubleshoot: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    problem: { type: Type.STRING },
                                                    solution: { type: Type.STRING }
                                                },
                                                required: ["problem", "solution"]
                                            }
                                        }
                                    },
                                    required: ["order", "instruction"]
                                }
                            }
                        },
                        required: ["name", "description", "servings", "totalTimeMinutes", "caloriesPerServing", "proteinPerServing", "carbsPerServing", "fatPerServing", "difficulty", "equipment", "messyLevel", "ingredients", "steps"]
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return [];
    } catch (error) {
        console.error("Error generating recipes:", error);
        throw error;
    }
};

// 10. Deduplicate products from multiple photos (same product from different angles)
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
    // Позиция на каждом фото где виден продукт
    positions: { photoId: string; x: number; y: number }[];
    // ID фото где виден продукт
    photoIds: string[];
}

export const deduplicateProducts = async (
    productsFromPhotos: ProductWithPhotoId[]
): Promise<DeduplicatedProduct[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    // Подготовка данных для AI
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
- Если один и тот же продукт виден на разных фото — это ОДИН продукт, не считай дважды
- Определи дубликаты по: название, тип продукта, похожее количество
- Для дубликатов: сохрани все позиции (positions) со всех фото где он виден
- Не дублируй quantity — если молоко видно на 2 фото, это всё равно 1 пакет молока

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

        if (response.text) return JSON.parse(response.text);
        return [];
    } catch (error) {
        console.error("Error deduplicating products:", error);
        // Fallback: просто преобразуем без дедупликации
        return productsFromPhotos.map(p => ({
            name: p.name,
            emoji: p.emoji,
            quantity: p.quantity,
            unit: p.unit,
            expiresInDays: p.expiresInDays,
            caloriesPer100: p.caloriesPer100,
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

// ============================================
// SMART SHOPPING ASSISTANT AI FUNCTIONS
// ============================================

// 11. Generate Meal Plan for Shopping
export interface GeneratedMealPlan {
    meals: PlannedMeal[];
    shoppingList: ShoppingListItem[];
    totalEstimatedCost: number;
    tips: string[];
}

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
   - healthScore: 1 (🟢здоровый), 2 (🟡умеренный), 3 (🔴нездоровый)
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

// 12. Verify Product by Photo ("Это оно?")
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
2. Оцени здоровье продукта (healthScore: 1=🟢здоровый, 2=🟡умеренный, 3=🔴нездоровый)
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

// 13. Scan Store Shelf - Highlight needed products ("Покажи витрину")
export interface ShelfProduct {
    name: string;
    emoji: string;
    positionX: number;      // 0-100% позиция на фото
    positionY: number;
    isNeeded: boolean;       // Нужен ли из списка
    matchedListItem?: string; // ID элемента из списка
    healthScore: 1 | 2 | 3;
    estimatedPrice?: number;
}

export interface ShelfScanResult {
    products: ShelfProduct[];
    notRecognized: boolean;  // Если не удалось распознать
    notRecognizedReason?: string;
    tip?: string;            // "Посмотри на верхнюю полку слева"
}

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

// 14. Suggest alternative when product is not available
export const suggestProductAlternative = async (
    unavailableProduct: ShoppingListItem,
    availableProducts?: string[] // Что видно на полке
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
Объясни почему каждая подходит и оцени здоровье (1=🟢, 2=🟡, 3=🔴).
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

// 15. Check if user already has product at home (duplicate warning)
export const checkDuplicateInInventory = (
    productName: string,
    inventory: InventoryItem[]
): { hasDuplicate: boolean; existingItem?: InventoryItem; message?: string } => {
    const normalizedName = productName.toLowerCase().trim();

    const match = inventory.find(item => {
        const itemName = item.name.toLowerCase().trim();
        // Exact match or contains
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

// 16. Generate meal alternatives for replacement
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