// MenuScan Gemini AI Service
// Menu analysis, photo type detection

import { GoogleGenAI, Type } from "@google/genai";
import { BillingService, BaseStorageService } from '@fitstream/shared';
import type { BillingActionType, CachedMenuItem } from '@fitstream/shared';
import type {
  MenuRecommendation,
  MenuAnalysisResult,
  MenuAnalysisOptions,
  PhotoContentType,
  PhotoTypeDetectionResult,
} from '../types';

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
  return 'image/jpeg';
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
    return { allowed: true };
  }
};

// --- Menu Analysis (basic) ---
export const analyzeMenu = async (base64Image: string): Promise<MenuRecommendation[]> => {
  const billing = await checkAndCharge('menu_scan');
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

// --- Extended Menu Analysis with Caching ---
export const analyzeMenuWithCache = async (
  base64Image: string,
  options?: MenuAnalysisOptions
): Promise<MenuAnalysisResult> => {
  // Check local menu scan history cache
  if (!options?.forceRefresh && options?.restaurantName) {
    const cached = getMenuScanFromHistory(options.restaurantName);
    if (cached) {
      return {
        recommendations: cached.recommendations,
        restaurantName: cached.restaurantName,
        fromCache: true,
      };
    }
  }

  // No cache hit - call AI
  const billing = await checkAndCharge('menu_scan');
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
            { inlineData: { mimeType: getMimeType(base64Image), data: cleanBase64(base64Image) } },
            {
              text: `Analyze menu. Extract:
1. Restaurant name (if visible)
2. ALL items with calories, protein, healthScore (1=best, 2=ok, 3=avoid)
3. Top 3 recommendations

JSON response. Language: ${lang}.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            restaurantName: { type: Type.STRING, nullable: true },
            allItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  healthScore: { type: Type.NUMBER },
                  category: { type: Type.STRING, enum: ['BEST_CHOICE', 'HIGH_PROTEIN', 'LESSER_OF_EVILS', 'REGULAR'] }
                },
                required: ["name", "calories", "protein", "healthScore", "category"]
              }
            },
            recommendations: {
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
          },
          required: ["recommendations", "allItems"]
        }
      }
    });

    if (!response.text) return { recommendations: [], fromCache: false };

    const result = JSON.parse(response.text);

    return {
      recommendations: result.recommendations || [],
      restaurantName: result.restaurantName,
      allItems: result.allItems,
      fromCache: false
    };
  } catch (error) {
    console.error("Error analyzing menu with cache:", error);
    throw error;
  }
};

// --- Detect Photo Type (Food/Menu/QR) ---
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
            { inlineData: { mimeType: getMimeType(base64Image), data: cleanBase64(base64Image) } },
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

// --- Local menu scan history helpers ---
const MENU_HISTORY_KEY = 'menuscan_history';

function getMenuScanFromHistory(restaurantName: string) {
  try {
    const data = localStorage.getItem(MENU_HISTORY_KEY);
    if (!data) return null;
    const history = JSON.parse(data) as Array<{
      restaurantName: string;
      recommendations: MenuRecommendation[];
      scannedAt: string;
    }>;
    const normalized = restaurantName.toLowerCase().trim();
    const match = history.find(h =>
      h.restaurantName.toLowerCase().trim() === normalized
    );
    if (match) {
      // Only use cache if less than 7 days old
      const age = Date.now() - new Date(match.scannedAt).getTime();
      if (age < 7 * 24 * 60 * 60 * 1000) return match;
    }
    return null;
  } catch {
    return null;
  }
}
