import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, BillingActionType } from '@fitstream/shared';
import { BillingService } from '@fitstream/shared';
import { BaseStorageService } from '@fitstream/shared';

// Helper to get API Key (try all available sources)
const getApiKey = () => {
    return import.meta.env.VITE_API_KEY
        || import.meta.env.VITE_GEMINI_API_KEY
        || (typeof process !== 'undefined' && process.env?.API_KEY)
        || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY)
        || '';
};

// Helper to check balance and charge for AI actions
const checkAndCharge = async (actionType: BillingActionType): Promise<{ allowed: boolean; reason?: string }> => {
    const settings = BaseStorageService.getSettings();
    const userId = settings.googleId || BaseStorageService.getUserId();

    try {
        const result = await BillingService.chargeForAction(userId, actionType);
        return result;
    } catch (e) {
        console.error('Billing check failed:', e);
        // Allow on billing error to not break UX
        return { allowed: true };
    }
};

// === Types for Recipe Generation ===

export interface TodayMealContext {
    time: string;
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export interface RecipeGenerationContext {
    timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    currentTime: string;
    caloriesRemaining: number;
    servingsNeeded: number;
    maxCookingTime?: number;
    excludeRecipeIds?: string[];
    dietaryPreferences?: string[];
    vegetarian?: boolean;
    diabetic?: boolean;
    onlyAvailable?: boolean;
    todayMeals?: TodayMealContext[];
    todayMacros?: {
        protein: number;
        carbs: number;
        fat: number;
    };
    userQuery?: string;
}

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface RecipeEquipment {
    name: string;
    emoji: string;
    essential: boolean;
}

export interface GeneratedRecipe {
    name: string;
    description: string;
    servings: number;
    totalTimeMinutes: number;
    caloriesPerServing: number;
    proteinPerServing: number;
    carbsPerServing: number;
    fatPerServing: number;
    difficulty: RecipeDifficulty;
    difficultyReason?: string;
    equipment: RecipeEquipment[];
    messyLevel: 1 | 2 | 3;
    messyWarning?: string;
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
        technique?: string;
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
    priorityReason?: string;
    nutritionNote?: string;
    costEstimate?: number;
    restaurantPrice?: number;
}

// === Generate Recipes from Inventory ===

export const generateRecipes = async (
    inventory: InventoryItem[],
    context: RecipeGenerationContext
): Promise<GeneratedRecipe[]> => {
    const billing = await checkAndCharge('recipe_ai');
    if (!billing.allowed) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    // Format inventory for prompt
    const inventoryList = inventory.map(item => {
        const expiring = item.expiresAt
            ? ` (expires ${new Date(item.expiresAt).toLocaleDateString(lang)})`
            : '';
        return `- ${item.emoji || ''} ${item.name}: ${item.quantity}${item.unit}${expiring}`;
    }).join('\n');

    // Expiring items for priority
    const expiringItems = inventory
        .filter(i => i.expiresAt && new Date(i.expiresAt) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
        .map(i => i.name);

    const mealTypeNames: Record<string, string> = {
        breakfast: 'breakfast',
        lunch: 'lunch',
        dinner: 'dinner',
        snack: 'snack'
    };

    // Today's meal history
    const todayMealsInfo = context.todayMeals?.length
        ? `\nALREADY EATEN TODAY:\n${context.todayMeals.map(m =>
            `- ${m.time}: ${m.name} (${m.calories} kcal${m.protein ? `, P:${m.protein}g` : ''}${m.carbs ? `, C:${m.carbs}g` : ''})`
        ).join('\n')}`
        : '';

    // Macros balance
    const macrosInfo = context.todayMacros
        ? `\nMACROS EATEN TODAY: Protein ${context.todayMacros.protein}g, Carbs ${context.todayMacros.carbs}g, Fat ${context.todayMacros.fat}g`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        {
                            text: `You are a culinary AI assistant. Current time: ${context.currentTime || new Date().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}.
Suggest 3-4 dishes for ${mealTypeNames[context.timeOfDay]} like a restaurant menu.

AVAILABLE PRODUCTS:
${inventoryList}

${expiringItems.length > 0 ? `EXPIRING SOON (priority!): ${expiringItems.join(', ')}` : ''}
${todayMealsInfo}
${macrosInfo}

CONSTRAINTS:
- Servings: ${context.servingsNeeded}
- Remaining calories for the day: ${context.caloriesRemaining}
- Max cooking time: ${context.maxCookingTime || 60} minutes
${context.dietaryPreferences?.length ? `- Diet: ${context.dietaryPreferences.join(', ')}` : ''}
${context.vegetarian ? '- VEGETARIAN: NO meat, fish, seafood! Only plant products + dairy + eggs.' : ''}
${context.diabetic ? '- DIABETIC-FRIENDLY: Low glycemic index! NO sugar, white rice, potatoes. Minimal simple carbs.' : ''}
${context.onlyAvailable ? '- ONLY FROM AVAILABLE: Use ONLY products from the list above! Do not add any other ingredients.' : ''}
${context.userQuery ? `
USER REQUEST: "${context.userQuery}"
Consider this preference when selecting recipes! If specific - prioritize it.` : ''}

REQUIRED FIELDS for each recipe:
1. proteinPerServing, carbsPerServing, fatPerServing - macros per serving in grams
2. difficulty: "easy" / "medium" / "hard"
3. difficultyReason: why this difficulty (1-2 words)
4. nutritionNote: if morning was carb-heavy - recommend protein, and vice versa
5. equipment: array of tools [{name, emoji, essential}] - pan, knife, pot, blender etc.
6. messyLevel: 1 (clean), 2 (moderate), 3 (lots of splatter/waste)
7. messyWarning: if messyLevel >= 2, explain what to expect

IMPORTANT for cooking steps:
1. Write in SIMPLE language for beginners
2. Specify time and heat level (1=low, 2=medium, 3=high)
3. Add tip, doneWhen, troubleshoot
4. technique: tips on technique (how to cut onions without tears, how to check doneness etc.)

ECONOMICS:
- costEstimate: cost in local currency
- restaurantPrice: restaurant price

Response language: ${lang}`
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
