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