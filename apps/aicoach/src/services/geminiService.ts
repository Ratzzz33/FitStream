import { GoogleGenAI } from "@google/genai";
import { t } from '@fitstream/shared';

// Helper to get API Key (try all available sources)
const getApiKey = () => {
    return import.meta.env.VITE_API_KEY
        || import.meta.env.VITE_GEMINI_API_KEY
        || (typeof process !== 'undefined' && process.env?.API_KEY)
        || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY)
        || '';
};

// Personalized motivational quotes based on streak/reps
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
