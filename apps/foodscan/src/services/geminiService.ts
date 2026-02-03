// FoodScan Gemini AI Service
// Food analysis, scale scanning, reference object detection, photo type detection

import { GoogleGenAI, Type } from "@google/genai";
import { t } from '@fitstream/shared';
import { BillingService } from '@fitstream/shared';
import { BaseStorageService } from '@fitstream/shared';
import { BillingActionType } from '@fitstream/shared';
import { ApiService } from '@fitstream/shared';

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

// === INTERFACES ===

export interface FoodAnalysisResult {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    referenceDetected: boolean;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    isHomeMade: boolean;
    homeIndicators: string[];
    ingredients: string[];
}

export const SUPPORTED_COST_CURRENCIES = ['RUB', 'USD', 'EUR', 'GBP', 'KZT', 'UAH', 'GEL'] as const;
export type SupportedCostCurrency = typeof SUPPORTED_COST_CURRENCIES[number];

export const isCostSupported = (currency?: string): currency is SupportedCostCurrency => {
    return !!currency && SUPPORTED_COST_CURRENCIES.includes(currency as SupportedCostCurrency);
};

export interface FoodIngredient {
    name: string;
    emoji: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice: number;
}

export interface FoodAnalysisWithCost {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: FoodIngredient[];
    totalCost: number;
    cookingTimeMinutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    briefRecipe: string;
}

export interface MenuRecommendation {
    dishName: string;
    calories: number;
    protein: number;
    category: 'BEST_CHOICE' | 'HIGH_PROTEIN' | 'LESSER_OF_EVILS';
    reasoning: string;
}

export type PhotoContentType = 'FOOD' | 'MENU' | 'QR_MENU' | 'UNKNOWN';

export interface PhotoTypeDetectionResult {
    type: PhotoContentType;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    qrUrl?: string;
}

// === AI FUNCTIONS ===

// 1. Vision Service for Weight Scale Reading
export const scanScaleDisplay = async (base64Image: string): Promise<{ weight: number | null, confidence: string }> => {
    const billing = await checkAndCharge('scale_scan');
    if (!billing.allowed) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

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
): Promise<FoodAnalysisResult> => {
    const billing = await checkAndCharge('food_scan');
    if (!billing.allowed) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const refContext = referenceDimensions
        ? `User prefers "${referenceObject}" (${referenceDimensions}) for scale.`
        : `User prefers "${referenceObject}" for scale.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
                        { text: `Identify food in this photo. ${refContext}

Check if ANY common reference object is visible for scale estimation:
- Fork, spoon, knife, chopsticks
- Hand, fingers
- Credit card, ID card
- Coin, lighter
- Phone, keys
- The user's preferred object: "${referenceObject}"

referenceDetected: true if ANY of these objects is visible (not just the preferred one)
confidenceLevel: HIGH if clear reference visible, MEDIUM if partial/unclear, LOW if no reference at all

ALSO determine if this food is HOME-MADE or from OUTSIDE:
Home-made indicators (isHomeMade=true):
- Food container, lunch box, meal prep container
- Home kitchen plates, simple dishes
- Home environment visible
- Food in tupperware or similar storage

Outside food indicators (isHomeMade=false):
- Restaurant plates with logo or branding
- Cafe/restaurant table or setting
- Professional plating/garnish
- Takeout packaging with brand
- Fast food containers

homeIndicators: list visible indicators that helped determine if home-made (e.g. ["lunch box", "home plate"])
ingredients: list the main ingredients in this dish (e.g. ["chicken", "rice", "vegetables", "sauce"])

Estimate size, calories, protein, carbs, fat. JSON output. Language: ${lang}.` }
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
                        fat: { type: Type.NUMBER },
                        referenceDetected: { type: Type.BOOLEAN },
                        confidenceLevel: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
                        isHomeMade: { type: Type.BOOLEAN },
                        homeIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "calories", "protein", "carbs", "fat", "referenceDetected", "confidenceLevel", "isHomeMade", "homeIndicators", "ingredients"]
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

// 2.2 Nutrition Analysis with Cost Breakdown
export const analyzeFoodWithCost = async (
    base64Image: string,
    referenceObject: string,
    referenceDimensions?: string,
    currency: string = 'RUB'
): Promise<FoodAnalysisWithCost> => {
    const billing = await checkAndCharge('food_scan_cost');
    if (!billing.allowed) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const refContext = referenceDimensions
        ? `For scale: "${referenceObject}" (${referenceDimensions}).`
        : `For scale: "${referenceObject}".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
                        {
                            text: `Analyze the dish in this photo. ${refContext}

TASK:
1. Identify the dish name
2. Estimate CALS, protein, carbs, fat
3. Break down into ingredients with quantities
4. Estimate average price of each ingredient in ${currency}
5. Calculate total cost
6. Estimate cooking time in minutes
7. Difficulty: easy/medium/hard
8. Brief (1-2 sentences) how to cook

Language: ${lang}`
                        }
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
                        fat: { type: Type.NUMBER },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    emoji: { type: Type.STRING },
                                    quantity: { type: Type.NUMBER },
                                    unit: { type: Type.STRING },
                                    pricePerUnit: { type: Type.NUMBER },
                                    totalPrice: { type: Type.NUMBER }
                                },
                                required: ["name", "emoji", "quantity", "unit", "pricePerUnit", "totalPrice"]
                            }
                        },
                        totalCost: { type: Type.NUMBER },
                        cookingTimeMinutes: { type: Type.NUMBER },
                        difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                        briefRecipe: { type: Type.STRING }
                    },
                    required: ["name", "calories", "protein", "carbs", "fat", "ingredients", "totalCost", "cookingTimeMinutes", "difficulty", "briefRecipe"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("Empty AI response");
    } catch (error) {
        console.error("Error analyzing food with cost:", error);
        throw error;
    }
};

// 2.3 Calculate Nutrition from Text
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
    const settings = BaseStorageService.getSettings();

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

// 5. Detect Photo Type (Food/Menu/QR) - Universal scanner
export const detectPhotoType = async (base64Image: string): Promise<PhotoTypeDetectionResult> => {
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
                        { text: `Analyze this image and determine what it shows:

1. FOOD - A plate/dish with food that should be analyzed for nutrition (calories, macros)
2. MENU - A restaurant/cafe menu (printed text with dish names and prices)
3. QR_MENU - A QR code that likely leads to a digital menu
4. UNKNOWN - None of the above

If it's a QR code, try to read the URL from it if visible.

Respond with JSON: { "type": "FOOD" | "MENU" | "QR_MENU" | "UNKNOWN", "confidence": "HIGH" | "MEDIUM" | "LOW", "qrUrl": "url if QR detected" }` }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['FOOD', 'MENU', 'QR_MENU', 'UNKNOWN'] },
                        confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
                        qrUrl: { type: Type.STRING }
                    },
                    required: ["type", "confidence"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return { type: 'UNKNOWN', confidence: 'LOW' };
    } catch (error) {
        console.error("Error detecting photo type:", error);
        return { type: 'UNKNOWN', confidence: 'LOW' };
    }
};
