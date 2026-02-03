// FridgeTracker Gemini Service
// Storage scanning, product detection, receipt parsing, deduplication

import { GoogleGenAI, Type } from "@google/genai";
import { StorageType, BillingActionType } from '@fitstream/shared';
import { BillingService, BaseStorageService } from '@fitstream/shared';

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

// === FUNCTIONS ===

// Detect storage type from photo (fridge, freezer, cabinet, appliances)
export const detectStorageType = async (base64Image: string): Promise<StorageType> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });

    try {
        const mimeType = getMimeType(base64Image);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType, data: cleanBase64(base64Image) } },
                        {
                            text: `Determine the storage type in this photo. Choose ONE:
                            - fridge: refrigerator (shelves with cooled products, milk, vegetables, drinks)
                            - freezer: freezer (ice, frozen products, packaged meat, ice cream)
                            - cabinet: kitchen cabinet (dry goods, cereals, canned food, spices, pasta)
                            - appliances: kitchen appliances and utensils (pans, pots, knives, boards, mixer, blender)

                            Return JSON with a single "type" field containing the chosen type.`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['fridge', 'freezer', 'cabinet', 'appliances'] }
                    },
                    required: ["type"]
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            return result.type as StorageType;
        }
        return 'fridge'; // Default fallback
    } catch (error) {
        console.error("Error detecting storage type:", error);
        return 'fridge'; // Default fallback
    }
};

// Scan storage photo to detect products
export const scanStoragePhoto = async (
    base64Image: string,
    storageType: StorageType
): Promise<ScannedProduct[]> => {
    const billing = await checkAndCharge('storage_scan');
    if (!billing.allowed) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const lang = navigator.language;

    const storageNames: Record<StorageType, string> = {
        fridge: 'refrigerator',
        cabinet: 'kitchen cabinet',
        freezer: 'freezer',
        appliances: 'kitchen appliances'
    };

    try {
        const mimeType = getMimeType(base64Image);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType, data: cleanBase64(base64Image) } },
                        {
                            text: `Identify ALL products in this ${storageNames[storageType]} photo.
                            For each product determine:
                            - name: product name in language ${lang}
                            - emoji: appropriate emoji
                            - quantity: approximate quantity (number)
                            - unit: unit of measurement
                            - expiresInDays: days until expiry (null if long shelf life)
                            - caloriesPer100: calories per 100g/ml
                            - positionX, positionY: position on photo as percentage (0-100)

                            Return a JSON array. Be thorough, don't miss any products.`
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

        if (response.text) {
            const products: ScannedProduct[] = JSON.parse(response.text);
            return products;
        }
        return [];
    } catch (error) {
        console.error("Error scanning storage:", error);
        throw error;
    }
};

// Deduplicate products from multiple photos
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
                            text: `I have products from different photos of the same storage (fridge/cabinet).
Some products may appear in multiple photos taken from different angles.

IMPORTANT: Merge duplicates!
- If the same product is visible in different photos, it is ONE product, don't count it twice
- Identify duplicates by: name, product type, similar quantity
- For duplicates: keep all positions from all photos where it's visible
- Don't duplicate quantity - if milk is visible in 2 photos, it's still 1 pack of milk

Products:
${productsJson}

Return a JSON array of merged products. Language: ${lang}`
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
            const dedupedProducts: DeduplicatedProduct[] = JSON.parse(response.text);
            return dedupedProducts;
        }
        return [];
    } catch (error) {
        console.error("Error deduplicating products:", error);
        // Fallback: return without deduplication
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

// Get nutrition info for manual product entry
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
                            text: `Determine information about the product "${productName}":
                            - emoji: appropriate emoji
                            - caloriesPer100: calories per 100g/ml
                            - defaultUnit: typical unit of measurement
                            - typicalQuantity: typical quantity when purchased
                            - storageType: where to store (fridge/cabinet/freezer)
                            - shelfLifeDays: shelf life in days (null if very long)`
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

// Scan receipt to extract products
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
                            text: `Extract all items from this receipt. Language: ${lang}.

                            For each item determine:
                            - name: product name (simplify if long)
                            - emoji: appropriate emoji
                            - quantity: quantity
                            - unit: unit of measurement
                            - price: price
                            - storageType: where to store (fridge/cabinet/freezer)
                            - expiresInDays: days until expiry (null if long shelf life)
                            - caloriesPer100: approximate calories per 100g/ml

                            Also determine the store name, date, and total price.`
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
