

import { GoogleGenAI, Type, FunctionDeclaration, Modality, Schema } from "@google/genai";
import { t } from './i18n';
import { ApiService } from './api';
import { StorageService } from './storageService';

const API_KEY = process.env.API_KEY || '';

// 1. Vision Service for Weight Scale Reading
export const scanScaleDisplay = async (base64Image: string): Promise<{ weight: number | null, confidence: string }> => {
  if (!API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Identify the number displayed on this weighing scale. Return ONLY the number. If unsure, return 0." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weight: { type: Type.NUMBER },
            confidence: { type: Type.STRING, enum: ["HIGH", "LOW"] }
          }
        }
      }
    });
    
    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
    return { weight: null, confidence: "LOW" };
  } catch (error) {
    console.error("Error scanning scale:", error);
    return { weight: null, confidence: "LOW" };
  }
};

// 2. Nutrition Analysis with Reference Object
export const analyzeFood = async (
    base64Image: string, 
    referenceObject: string,
    referenceDimensions?: string
): Promise<{ name: string, calories: number, protein: number, carbs: number, fat: number }> => {
    if (!API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const lang = navigator.language;

    const refContext = referenceDimensions 
        ? `The user is using a "${referenceObject}" (approx. ${referenceDimensions}) as a size reference.`
        : `There is a "${referenceObject}" in the image next to the food for scale.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: `Identify the food in this image. 
                      ${refContext}
                      Use this to estimate the physical size and portion of the food accurately. 
                      Based on the estimated portion size, calculate the calories and macros.
                      Respond with the 'name' of the food in ${lang} language.
                      Return the result in JSON format.` 
                    }
                ]
            },
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
        
        const text = response.text;
        if (text) return JSON.parse(text);
        throw new Error("Failed to parse AI response");
    } catch (error) {
        console.error("Error analyzing food:", error);
        throw error;
    }
};

// 2.1 Calculate Nutrition from Text Input
export const calculateNutritionFromText = async (
    foodName: string, 
    amount: string
): Promise<{ calories: number, protein: number, carbs: number, fat: number }> => {
    if (!API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Default to 100g/standard portion if no amount specified, but UI enforces amount mostly
    const weightContext = amount ? `${amount}g` : "a standard serving";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: `Calculate the nutrition for "${foodName}" with a weight of ${weightContext}.
                      Estimate the calories, protein, carbs, and fat.
                      Return the result in JSON format.` 
                    }
                ]
            },
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
        
        const text = response.text;
        if (text) return JSON.parse(text);
        throw new Error("Failed to parse AI response");
    } catch (error) {
        console.error("Error calculating nutrition from text:", error);
        throw error;
    }
};

// 3. Identify Reference Object for Settings
export const identifyReferenceObject = async (base64Image: string): Promise<{ name: string, dimensions: string }> => {
    if (!API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const lang = navigator.language;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: `Identify the main object in this image that will be used as a size reference. 
                      Common examples: Credit Card, Keys, Ring, Lighter, AirPods Case.
                      Return the name in ${lang} language and estimated standard physical dimensions (width x height in cm, e.g. "8.5 x 5.4 cm").
                      Return JSON: { "name": "...", "dimensions": "..." }` 
                    }
                ]
            },
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
        
        const text = response.text;
        if (text) return JSON.parse(text);
        throw new Error("Failed to parse AI response");
    } catch (error) {
        console.error("Error identifying object:", error);
        throw error;
    }
};

// 4. Identify Phone Weight from Model using DB and AI Matching
export const getPhoneSpecs = async (modelName: string): Promise<{ officialName: string, weightGrams: number } | null> => {
    if (!API_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const settings = StorageService.getSettings();
    
    // Step 1: Fetch Known Phones from Backend
    let knownPhones = [];
    try {
        knownPhones = await ApiService.getPhoneDatabase(settings.backendUrl);
    } catch (e) {
        console.warn("Could not fetch phone DB, relying on AI knowledge.");
    }
    
    const dbContext = knownPhones.length > 0 
        ? `I have a database of known phones and their weights in grams: ${JSON.stringify(knownPhones)}.`
        : `I do not have a local database connection right now.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: `
                        User Input: "${modelName}".
                        
                        ${dbContext}
                        
                        Task: 
                        1. Compare the user's input with the provided database to find the best matching phone model. Use AI fuzzy matching (e.g., "s25 ultra" -> "Samsung Galaxy S25 Ultra").
                        2. If a match is found in the database, return the 'name' from the DB as 'officialName' and the 'weight' from the DB as 'weightGrams'.
                        3. If NO match is found in the database, identify the phone based on your own knowledge and estimate the weight.
                        4. If the input is invalid or not a phone, return null.
                    ` }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        officialName: { type: Type.STRING, description: "The full official marketing name of the phone." },
                        weightGrams: { type: Type.NUMBER, description: "Weight of the phone in grams." },
                        isValid: { type: Type.BOOLEAN, description: "True if a known phone model was found." },
                        source: { type: Type.STRING, enum: ["DATABASE", "AI_ESTIMATE"], description: "Where the data came from." }
                    }
                }
            }
        });
        const text = response.text;
        if (text) {
            const data = JSON.parse(text);
            if (data.isValid && data.officialName && data.weightGrams > 0) {
                console.log(`Phone Identified: ${data.officialName} (${data.weightGrams}g) via ${data.source}`);
                return { officialName: data.officialName, weightGrams: data.weightGrams };
            }
        }
        return null;
    } catch (e) {
        console.error("Error getting phone specs:", e);
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
    if (!API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const lang = navigator.language;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: `Analyze the restaurant menu in this image.
                      Identify dishes and recommend options for someone trying to be healthy but practical.
                      
                      Select 3 distinct recommendations:
                      1. BEST_CHOICE: The most balanced, healthy option (good macros, reasonable calories).
                      2. HIGH_PROTEIN: The best option for muscle gain/satiety.
                      3. LESSER_OF_EVILS: A "cheat meal" that is the "least bad" among the indulgent options (e.g. burger without bun, or pizza with veggies).
                      
                      Estimate calories and protein for each.
                      Provide a short 'reasoning' in ${lang} language explaining why it was chosen.
                      Return JSON array.` 
                    }
                ]
            },
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
                        }
                    }
                }
            }
        });
        
        const text = response.text;
        if (text) return JSON.parse(text);
        return [];
    } catch (error) {
        console.error("Error analyzing menu:", error);
        throw error;
    }
};

// 6. Motivation & Recommendations
export const getMotivation = async (streak: number, repsToday: number): Promise<string> => {
    if (!API_KEY) return t('defaultMotivation');
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const lang = navigator.language;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a single short, punchy, motivational sentence for a user who has a ${streak} day streak and did ${repsToday} reps today. Respond in ${lang} language.`,
        });
        return response.text || t('defaultMotivation');
    } catch (e) {
        return t('defaultMotivation');
    }
};