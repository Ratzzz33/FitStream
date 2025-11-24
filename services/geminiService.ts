

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { t } from './i18n';
import { ApiService } from './api';
import { StorageService } from './storageService';

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