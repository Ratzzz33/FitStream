
import { GoogleGenAI, Type, FunctionDeclaration, Modality, Schema } from "@google/genai";
import { t } from './i18n';

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

// 3. Identify Reference Object for Settings
export const identifyReferenceObject = async (base64Image: string): Promise<{ name: string, dimensions: string }> => {
    if (!API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: `Identify the main object in this image that will be used as a size reference. 
                      Common examples: Credit Card, Keys, Ring, Lighter, AirPods Case.
                      Return the name and estimated standard physical dimensions (width x height in cm, e.g. "8.5 x 5.4 cm").
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

// 4. Motivation & Recommendations
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
