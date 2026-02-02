/**
 * AI-powered Product Price Estimation
 * Определение продукта, объёма и цены по фото
 */

import { GoogleGenAI, Type } from "@google/genai";
import { georgiaPrices, ProductPrice, PriceCategory } from './georgiaPricesService';

const getApiKey = () => import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
const cleanBase64 = (b64: string) => b64.includes(',') ? b64.split(',')[1] : b64;

export interface ProductRecognitionResult {
  name: string;
  nameEn: string;
  emoji: string;
  category: PriceCategory;
  quantity: number;
  unit: string;
  estimatedPriceGel: number;
  priceSource: 'database' | 'ai_estimate' | 'price_tag';
  confidence: number;
  matchedProductId?: string;
  priceNote?: string;
  alternatives?: { name: string; priceGel: number }[];
}

export interface MultiProductResult {
  products: ProductRecognitionResult[];
  totalEstimatedPrice: number;
  recognitionQuality: 'high' | 'medium' | 'low';
  tip?: string;
}

/**
 * Распознать продукт по фото и оценить цену
 */
export const recognizeProductAndPrice = async (
  base64Image: string
): Promise<ProductRecognitionResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey });
  const lang = navigator.language;

  // Топ-100 продуктов для контекста
  const knownProducts = georgiaPrices.getAllProducts()
    .slice(0, 100)
    .map(p => `${p.name} (${p.priceGel}₾/${p.unit})`);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
            {
              text: `Распознай продукт на фото. Определи:
1. Название (name, nameEn)
2. Эмодзи
3. Категория (dairy/meat/fish/vegetables/fruits/grains/bread/eggs/oils/drinks/snacks/spices/canned/frozen/sweets/alcohol/household/other)
4. Количество/объём (quantity + unit)
5. Примерную цену в лари (GEL) для Тбилиси
6. priceFromLabel: true если видишь ценник

СПРАВОЧНИК ЦЕН (Грузия):
${knownProducts.join(', ')}

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
            name: { type: Type.STRING },
            nameEn: { type: Type.STRING },
            emoji: { type: Type.STRING },
            category: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            estimatedPriceGel: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            priceFromLabel: { type: Type.BOOLEAN }
          },
          required: ["name", "nameEn", "emoji", "category", "quantity", "unit", "estimatedPriceGel", "confidence"]
        }
      }
    });

    if (!response.text) throw new Error("Empty AI response");
    const aiResult = JSON.parse(response.text);

    // Ищем в базе
    const dbMatch = georgiaPrices.findProduct(aiResult.name) ||
                    georgiaPrices.findProduct(aiResult.nameEn);

    let finalPrice = aiResult.estimatedPriceGel;
    let priceSource: 'database' | 'ai_estimate' | 'price_tag' = 'ai_estimate';
    let matchedProductId: string | undefined;
    let priceNote = '~примерная цена';

    if (aiResult.priceFromLabel) {
      priceSource = 'price_tag';
      priceNote = 'цена с ценника';
    } else if (dbMatch) {
      const dbPrice = georgiaPrices.getPrice(dbMatch.id, aiResult.quantity, aiResult.unit);
      if (dbPrice) {
        finalPrice = Math.round(dbPrice * 100) / 100;
        priceSource = 'database';
        matchedProductId = dbMatch.id;
        priceNote = 'цена из справочника';
      }
    }

    return {
      name: aiResult.name,
      nameEn: aiResult.nameEn,
      emoji: aiResult.emoji,
      category: aiResult.category as PriceCategory,
      quantity: aiResult.quantity,
      unit: aiResult.unit,
      estimatedPriceGel: finalPrice,
      priceSource,
      confidence: aiResult.confidence,
      matchedProductId,
      priceNote
    };
  } catch (error) {
    console.error("Error recognizing product:", error);
    throw error;
  }
};

/**
 * Распознать несколько продуктов (чек, корзина)
 */
export const recognizeMultipleProducts = async (
  base64Image: string
): Promise<MultiProductResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey });
  const lang = navigator.language;

  const priceGuide = georgiaPrices.getAllProducts()
    .map(p => `${p.emoji} ${p.name}: ${p.priceGel}₾/${p.unit}`)
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
            {
              text: `Распознай ВСЕ продукты на фото. Это может быть чек, корзина, полка.

Для каждого:
- name, nameEn, emoji, category
- quantity, unit
- estimatedPriceGel, confidence
- priceFromLabel: true если видишь ценник

СПРАВОЧНИК ЦЕН ГРУЗИИ:
${priceGuide}

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
                  nameEn: { type: Type.STRING },
                  emoji: { type: Type.STRING },
                  category: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  estimatedPriceGel: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  priceFromLabel: { type: Type.BOOLEAN }
                },
                required: ["name", "nameEn", "emoji", "category", "quantity", "unit", "estimatedPriceGel", "confidence"]
              }
            },
            overallConfidence: { type: Type.NUMBER },
            tip: { type: Type.STRING }
          },
          required: ["products", "overallConfidence"]
        }
      }
    });

    if (!response.text) throw new Error("Empty AI response");
    const aiResult = JSON.parse(response.text);

    const processedProducts: ProductRecognitionResult[] = aiResult.products.map((p: any) => {
      const dbMatch = georgiaPrices.findProduct(p.name) || georgiaPrices.findProduct(p.nameEn);

      let finalPrice = p.estimatedPriceGel;
      let priceSource: 'database' | 'ai_estimate' | 'price_tag' = 'ai_estimate';
      let matchedProductId: string | undefined;
      let priceNote = '~примерная';

      if (p.priceFromLabel) {
        priceSource = 'price_tag';
        priceNote = 'с ценника';
      } else if (dbMatch) {
        const dbPrice = georgiaPrices.getPrice(dbMatch.id, p.quantity, p.unit);
        if (dbPrice) {
          finalPrice = Math.round(dbPrice * 100) / 100;
          priceSource = 'database';
          matchedProductId = dbMatch.id;
          priceNote = 'справочник';
        }
      }

      return {
        name: p.name,
        nameEn: p.nameEn,
        emoji: p.emoji,
        category: p.category as PriceCategory,
        quantity: p.quantity,
        unit: p.unit,
        estimatedPriceGel: finalPrice,
        priceSource,
        confidence: p.confidence,
        matchedProductId,
        priceNote
      };
    });

    const totalPrice = processedProducts.reduce((sum, p) => sum + p.estimatedPriceGel, 0);
    const avgConfidence = processedProducts.length > 0
      ? processedProducts.reduce((sum, p) => sum + p.confidence, 0) / processedProducts.length
      : 0;

    return {
      products: processedProducts,
      totalEstimatedPrice: Math.round(totalPrice * 100) / 100,
      recognitionQuality: avgConfidence >= 80 ? 'high' : avgConfidence >= 50 ? 'medium' : 'low',
      tip: aiResult.tip
    };
  } catch (error) {
    console.error("Error recognizing multiple products:", error);
    throw error;
  }
};

/**
 * Быстрая оценка цены по названию (без фото)
 */
export const estimatePriceByName = (
  productName: string,
  quantity?: number,
  unit?: string
): { priceGel: number; source: 'database' | 'unknown'; product?: ProductPrice } | null => {
  const match = georgiaPrices.findProduct(productName);
  if (match) {
    const price = georgiaPrices.getPrice(match.id, quantity, unit) || match.priceGel;
    return {
      priceGel: Math.round(price * 100) / 100,
      source: 'database',
      product: match
    };
  }
  return null;
};

/**
 * Добавить цену из чека в базу (обучение)
 */
export const learnPriceFromReceipt = (
  productName: string,
  actualPrice: number,
  quantity: number,
  unit: string
): void => {
  const match = georgiaPrices.findProduct(productName);
  if (match) {
    georgiaPrices.updateUserPrice(match.id, actualPrice / quantity, `1${unit}`);
  } else {
    georgiaPrices.addProduct({
      id: `user_${Date.now()}`,
      name: productName,
      nameEn: productName,
      emoji: '📦',
      category: 'other',
      priceGel: actualPrice,
      unit: `${quantity}${unit}`,
      pricePerUnit: actualPrice / quantity,
      source: 'user'
    });
  }
};
