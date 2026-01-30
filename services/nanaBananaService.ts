/**
 * Dish Image Service - AI-Powered with Imagen
 *
 * Features:
 * - Google Imagen 4.0 for accurate dish images
 * - IndexedDB storage for generated images (permanent)
 * - Fallbacks: Imagen → Unsplash → Foodish → Bundle
 * - Adaptive sizes (small/medium/large)
 * - Progressive loading support
 */

import { GoogleGenAI } from '@google/genai';

// ============================================
// IMAGEN CONFIG
// ============================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAF1MbCqcLIaOboSnHS0YU-qEmLYYOCGaQ';

// IndexedDB for dish images
const DISH_IMAGES_DB = 'fitstream_dish_images';
const DISH_IMAGES_STORE = 'images';
let dishImagesDB: IDBDatabase | null = null;

const initDishImagesDB = async (): Promise<IDBDatabase> => {
  if (dishImagesDB) return dishImagesDB;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DISH_IMAGES_DB, 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dishImagesDB = request.result;
      resolve(dishImagesDB);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DISH_IMAGES_STORE)) {
        db.createObjectStore(DISH_IMAGES_STORE, { keyPath: 'id' });
      }
    };
  });
};

// Get cached image from IndexedDB
const getCachedDishImage = async (key: string): Promise<string | null> => {
  try {
    const db = await initDishImagesDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DISH_IMAGES_STORE, 'readonly');
      const store = tx.objectStore(DISH_IMAGES_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

// Save image to IndexedDB
const saveDishImage = async (key: string, base64Data: string): Promise<void> => {
  try {
    const db = await initDishImagesDB();
    const tx = db.transaction(DISH_IMAGES_STORE, 'readwrite');
    const store = tx.objectStore(DISH_IMAGES_STORE);
    store.put({ id: key, data: base64Data, timestamp: Date.now() });
  } catch (e) {
    console.warn('Failed to save dish image:', e);
  }
};

// Generate image using Imagen
const generateWithImagen = async (dishName: string, ingredients: string[]): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const ingredientsList = ingredients.slice(0, 5).join(', ');
    const prompt = `Professional food photography of "${dishName}" dish${ingredientsList ? ` with ${ingredientsList}` : ''}, beautifully plated, restaurant quality, appetizing, warm lighting, top-down or 45-degree angle, clean background, high resolution`;

    console.log(`[Imagen] Generating: ${dishName}`);

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
      },
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      const base64 = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64}`;
    }

    return null;
  } catch (e) {
    console.warn('[Imagen] Generation failed:', e);
    return null;
  }
};

// ============================================
// RATE LIMIT TRACKER
// ============================================

type ImageSource = 'unsplash' | 'foodish' | 'picsum';

interface SourceStatus {
  failures: number;
  lastFailure: number;
  cooldownUntil: number;
}

const RATE_LIMIT_KEY = 'fitstream_image_rate_limits';
const COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hour cooldown after 3 failures
const MAX_FAILURES = 3;

// In-memory rate limit state
const sourceStatus: Record<ImageSource, SourceStatus> = {
  unsplash: { failures: 0, lastFailure: 0, cooldownUntil: 0 },
  foodish: { failures: 0, lastFailure: 0, cooldownUntil: 0 },
  picsum: { failures: 0, lastFailure: 0, cooldownUntil: 0 }
};

// Load rate limit state from localStorage
const loadRateLimitState = (): void => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.assign(sourceStatus, parsed);
    }
  } catch {
    // Ignore errors
  }
};

// Save rate limit state
const saveRateLimitState = (): void => {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(sourceStatus));
  } catch {
    // Ignore errors
  }
};

// Check if source is available
const isSourceAvailable = (source: ImageSource): boolean => {
  const status = sourceStatus[source];
  const now = Date.now();

  // Reset if cooldown expired
  if (status.cooldownUntil && now > status.cooldownUntil) {
    status.failures = 0;
    status.cooldownUntil = 0;
    saveRateLimitState();
  }

  return status.cooldownUntil === 0 || now > status.cooldownUntil;
};

// Record failure for source
const recordFailure = (source: ImageSource): void => {
  const status = sourceStatus[source];
  status.failures++;
  status.lastFailure = Date.now();

  if (status.failures >= MAX_FAILURES) {
    status.cooldownUntil = Date.now() + COOLDOWN_DURATION;
    console.warn(`[ImageService] ${source} disabled for 1 hour after ${MAX_FAILURES} failures`);
  }

  saveRateLimitState();
};

// Record success (reset failures)
const recordSuccess = (source: ImageSource): void => {
  const status = sourceStatus[source];
  if (status.failures > 0) {
    status.failures = 0;
    status.cooldownUntil = 0;
    saveRateLimitState();
  }
};

// Initialize
loadRateLimitState();

// ============================================
// CACHE SYSTEM
// ============================================

const CACHE_KEY = 'fitstream_image_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  url: string;
  timestamp: number;
  size: ImageSize;
  category?: string; // For similar dish matching
}

interface CacheStore {
  [key: string]: CacheEntry;
}

const memoryCache = new Map<string, string>();
let persistentCache: CacheStore = {};

// Load cache from LocalStorage
const loadPersistentCache = (): CacheStore => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return {};

    const cache: CacheStore = JSON.parse(stored);
    const now = Date.now();

    // Filter expired entries
    const validCache: CacheStore = {};
    for (const [key, entry] of Object.entries(cache)) {
      if (now - entry.timestamp < CACHE_TTL) {
        validCache[key] = entry;
        memoryCache.set(key, entry.url);
      }
    }

    if (Object.keys(validCache).length !== Object.keys(cache).length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(validCache));
    }

    persistentCache = validCache;
    return validCache;
  } catch {
    return {};
  }
};

// Save to cache
const saveToPersistentCache = (key: string, url: string, size: ImageSize, category?: string): void => {
  try {
    persistentCache[key] = { url, timestamp: Date.now(), size, category };

    // Limit cache size
    const entries = Object.entries(persistentCache);
    if (entries.length > 200) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toKeep = entries.slice(-150);
      persistentCache = {};
      toKeep.forEach(([k, v]) => { persistentCache[k] = v; });
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(persistentCache));
    memoryCache.set(key, url);
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
};

// Find similar dish in cache
const findSimilarInCache = (category: string, size: ImageSize): string | null => {
  for (const [key, entry] of Object.entries(persistentCache)) {
    if (entry.category === category && entry.size === size) {
      return entry.url;
    }
  }
  return null;
};

loadPersistentCache();

// ============================================
// TYPES
// ============================================

export type ImageSize = 'small' | 'medium' | 'large';

const SIZE_MAP: Record<ImageSize, number> = {
  small: 256,
  medium: 512,
  large: 800
};

export interface GenerateImageOptions {
  dishName: string;
  ingredients: string[];
  style?: 'photo' | 'illustration';
  stepDescription?: string;
  size?: ImageSize;
}

export interface GeneratedImage {
  url: string;
  cached: boolean;
  source?: 'cache' | 'unsplash' | 'foodish' | 'picsum' | 'bundle' | 'svg';
  placeholder?: string;
}

// ============================================
// BUILT-IN SVG ILLUSTRATIONS
// ============================================

type DishCategory =
  | 'breakfast' | 'eggs' | 'pancakes' | 'porridge'
  | 'soup' | 'salad' | 'pasta' | 'rice' | 'meat' | 'fish' | 'chicken'
  | 'burger' | 'pizza' | 'sandwich'
  | 'dessert' | 'cake' | 'icecream'
  | 'drink' | 'coffee'
  | 'cutting' | 'frying' | 'boiling' | 'baking' | 'plating'
  | 'default';

// Beautiful SVG illustrations for each category
const BUNDLED_ILLUSTRATIONS: Record<DishCategory, (size: number) => string> = {
  breakfast: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.55}" rx="${s*0.3}" ry="${s*0.2}" fill="#fff" stroke="#f59e0b" stroke-width="3"/>
      <ellipse cx="${s*0.5}" cy="${s*0.5}" rx="${s*0.15}" ry="${s*0.12}" fill="#fbbf24"/>
      <path d="M${s*0.2} ${s*0.35} Q${s*0.3} ${s*0.25} ${s*0.4} ${s*0.3}" stroke="#d97706" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M${s*0.6} ${s*0.3} Q${s*0.7} ${s*0.25} ${s*0.8} ${s*0.35}" stroke="#d97706" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>
  `,
  eggs: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef9c3"/>
          <stop offset="100%" style="stop-color:#fef08a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.35}" cy="${s*0.55}" rx="${s*0.22}" ry="${s*0.18}" fill="#fff" stroke="#e5e7eb" stroke-width="2"/>
      <ellipse cx="${s*0.35}" cy="${s*0.52}" rx="${s*0.1}" ry="${s*0.08}" fill="#fbbf24"/>
      <ellipse cx="${s*0.65}" cy="${s*0.5}" rx="${s*0.22}" ry="${s*0.18}" fill="#fff" stroke="#e5e7eb" stroke-width="2"/>
      <ellipse cx="${s*0.65}" cy="${s*0.47}" rx="${s*0.1}" ry="${s*0.08}" fill="#fbbf24"/>
    </svg>
  `,
  pancakes: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.65}" rx="${s*0.35}" ry="${s*0.08}" fill="#d97706"/>
      <ellipse cx="${s*0.5}" cy="${s*0.55}" rx="${s*0.32}" ry="${s*0.08}" fill="#f59e0b"/>
      <ellipse cx="${s*0.5}" cy="${s*0.45}" rx="${s*0.29}" ry="${s*0.08}" fill="#fbbf24"/>
      <ellipse cx="${s*0.5}" cy="${s*0.35}" rx="${s*0.08}" ry="${s*0.06}" fill="#fef3c7"/>
      <path d="M${s*0.45} ${s*0.35} Q${s*0.5} ${s*0.5} ${s*0.55} ${s*0.35}" stroke="#fef3c7" stroke-width="3" fill="none"/>
    </svg>
  `,
  porridge: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.6}" rx="${s*0.35}" ry="${s*0.15}" fill="#f5f5f4"/>
      <ellipse cx="${s*0.5}" cy="${s*0.55}" rx="${s*0.3}" ry="${s*0.1}" fill="#fef3c7"/>
      <circle cx="${s*0.4}" cy="${s*0.5}" r="${s*0.04}" fill="#3b82f6"/>
      <circle cx="${s*0.55}" cy="${s*0.52}" r="${s*0.03}" fill="#3b82f6"/>
      <circle cx="${s*0.6}" cy="${s*0.48}" r="${s*0.035}" fill="#3b82f6"/>
    </svg>
  `,
  soup: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffedd5"/>
          <stop offset="100%" style="stop-color:#fed7aa"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.6}" rx="${s*0.38}" ry="${s*0.2}" fill="#f5f5f4"/>
      <ellipse cx="${s*0.5}" cy="${s*0.55}" rx="${s*0.32}" ry="${s*0.15}" fill="#dc2626"/>
      <path d="M${s*0.35} ${s*0.3} Q${s*0.35} ${s*0.2} ${s*0.4} ${s*0.25}" stroke="#9ca3af" stroke-width="2" fill="none"/>
      <path d="M${s*0.5} ${s*0.28} Q${s*0.5} ${s*0.18} ${s*0.55} ${s*0.23}" stroke="#9ca3af" stroke-width="2" fill="none"/>
      <path d="M${s*0.65} ${s*0.3} Q${s*0.65} ${s*0.2} ${s*0.7} ${s*0.25}" stroke="#9ca3af" stroke-width="2" fill="none"/>
    </svg>
  `,
  salad: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#d1fae5"/>
          <stop offset="100%" style="stop-color:#a7f3d0"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.6}" rx="${s*0.38}" ry="${s*0.18}" fill="#f5f5f4"/>
      <ellipse cx="${s*0.35}" cy="${s*0.5}" rx="${s*0.12}" ry="${s*0.08}" fill="#22c55e"/>
      <ellipse cx="${s*0.55}" cy="${s*0.48}" rx="${s*0.1}" ry="${s*0.06}" fill="#16a34a"/>
      <ellipse cx="${s*0.65}" cy="${s*0.55}" rx="${s*0.08}" ry="${s*0.05}" fill="#ef4444"/>
      <ellipse cx="${s*0.4}" cy="${s*0.58}" rx="${s*0.06}" ry="${s*0.04}" fill="#fbbf24"/>
    </svg>
  `,
  pasta: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fee2e2"/>
          <stop offset="100%" style="stop-color:#fecaca"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.6}" rx="${s*0.38}" ry="${s*0.18}" fill="#f5f5f4"/>
      <path d="M${s*0.3} ${s*0.5} Q${s*0.4} ${s*0.4} ${s*0.5} ${s*0.5} Q${s*0.6} ${s*0.6} ${s*0.7} ${s*0.5}" stroke="#fbbf24" stroke-width="4" fill="none"/>
      <path d="M${s*0.35} ${s*0.55} Q${s*0.45} ${s*0.45} ${s*0.55} ${s*0.55} Q${s*0.65} ${s*0.65} ${s*0.75} ${s*0.55}" stroke="#fbbf24" stroke-width="4" fill="none"/>
      <ellipse cx="${s*0.5}" cy="${s*0.5}" rx="${s*0.15}" ry="${s*0.1}" fill="#dc2626" opacity="0.8"/>
    </svg>
  `,
  rice: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fefce8"/>
          <stop offset="100%" style="stop-color:#fef9c3"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.6}" rx="${s*0.35}" ry="${s*0.18}" fill="#f5f5f4"/>
      <ellipse cx="${s*0.5}" cy="${s*0.52}" rx="${s*0.28}" ry="${s*0.12}" fill="#fefce8"/>
      ${Array.from({length: 8}).map((_, i) =>
        `<ellipse cx="${s*(0.35 + (i%4)*0.1)}" cy="${s*(0.48 + Math.floor(i/4)*0.08)}" rx="${s*0.02}" ry="${s*0.015}" fill="#fff"/>`
      ).join('')}
    </svg>
  `,
  meat: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fecaca"/>
          <stop offset="100%" style="stop-color:#fca5a5"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.55}" rx="${s*0.35}" ry="${s*0.2}" fill="#991b1b"/>
      <ellipse cx="${s*0.5}" cy="${s*0.5}" rx="${s*0.3}" ry="${s*0.15}" fill="#b91c1c"/>
      <path d="M${s*0.3} ${s*0.5} L${s*0.7} ${s*0.5}" stroke="#7f1d1d" stroke-width="2"/>
      <path d="M${s*0.35} ${s*0.45} L${s*0.65} ${s*0.45}" stroke="#7f1d1d" stroke-width="2"/>
    </svg>
  `,
  fish: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#dbeafe"/>
          <stop offset="100%" style="stop-color:#bfdbfe"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.45}" cy="${s*0.5}" rx="${s*0.3}" ry="${s*0.15}" fill="#f97316"/>
      <polygon points="${s*0.75},${s*0.5} ${s*0.85},${s*0.4} ${s*0.85},${s*0.6}" fill="#ea580c"/>
      <circle cx="${s*0.3}" cy="${s*0.47}" r="${s*0.02}" fill="#1e293b"/>
      <path d="M${s*0.35} ${s*0.5} L${s*0.55} ${s*0.5}" stroke="#fff" stroke-width="2" opacity="0.5"/>
    </svg>
  `,
  chicken: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.45}" cy="${s*0.55}" rx="${s*0.25}" ry="${s*0.18}" fill="#d97706"/>
      <ellipse cx="${s*0.65}" cy="${s*0.5}" rx="${s*0.12}" ry="${s*0.2}" fill="#b45309"/>
      <ellipse cx="${s*0.45}" cy="${s*0.52}" rx="${s*0.2}" ry="${s*0.12}" fill="#f59e0b"/>
    </svg>
  `,
  burger: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.35}" rx="${s*0.3}" ry="${s*0.1}" fill="#d97706"/>
      <rect x="${s*0.2}" y="${s*0.42}" width="${s*0.6}" height="${s*0.08}" fill="#22c55e"/>
      <rect x="${s*0.2}" y="${s*0.48}" width="${s*0.6}" height="${s*0.1}" fill="#991b1b"/>
      <rect x="${s*0.2}" y="${s*0.56}" width="${s*0.6}" height="${s*0.05}" fill="#fbbf24"/>
      <ellipse cx="${s*0.5}" cy="${s*0.65}" rx="${s*0.3}" ry="${s*0.08}" fill="#b45309"/>
    </svg>
  `,
  pizza: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fed7aa"/>
          <stop offset="100%" style="stop-color:#fdba74"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <path d="M${s*0.5} ${s*0.25} L${s*0.2} ${s*0.75} L${s*0.8} ${s*0.75} Z" fill="#fbbf24"/>
      <ellipse cx="${s*0.5}" cy="${s*0.7}" rx="${s*0.25}" ry="${s*0.08}" fill="#d97706"/>
      <circle cx="${s*0.4}" cy="${s*0.5}" r="${s*0.05}" fill="#dc2626"/>
      <circle cx="${s*0.55}" cy="${s*0.55}" r="${s*0.04}" fill="#dc2626"/>
      <circle cx="${s*0.5}" cy="${s*0.65}" r="${s*0.045}" fill="#dc2626"/>
    </svg>
  `,
  sandwich: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <polygon points="${s*0.2},${s*0.55} ${s*0.5},${s*0.35} ${s*0.8},${s*0.55}" fill="#d97706"/>
      <rect x="${s*0.22}" y="${s*0.55}" width="${s*0.56}" height="${s*0.05}" fill="#22c55e"/>
      <rect x="${s*0.22}" y="${s*0.58}" width="${s*0.56}" height="${s*0.06}" fill="#fbbf24"/>
      <rect x="${s*0.22}" y="${s*0.62}" width="${s*0.56}" height="${s*0.05}" fill="#ef4444"/>
      <polygon points="${s*0.2},${s*0.67} ${s*0.5},${s*0.75} ${s*0.8},${s*0.67}" fill="#b45309"/>
    </svg>
  `,
  dessert: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fce7f3"/>
          <stop offset="100%" style="stop-color:#fbcfe8"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.65}" rx="${s*0.25}" ry="${s*0.1}" fill="#f5f5f4"/>
      <ellipse cx="${s*0.5}" cy="${s*0.5}" rx="${s*0.2}" ry="${s*0.15}" fill="#ec4899"/>
      <ellipse cx="${s*0.5}" cy="${s*0.4}" rx="${s*0.15}" ry="${s*0.1}" fill="#f472b6"/>
      <circle cx="${s*0.5}" cy="${s*0.32}" r="${s*0.03}" fill="#ef4444"/>
    </svg>
  `,
  cake: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fce7f3"/>
          <stop offset="100%" style="stop-color:#fbcfe8"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <rect x="${s*0.25}" y="${s*0.5}" width="${s*0.5}" height="${s*0.25}" fill="#fbbf24" rx="4"/>
      <rect x="${s*0.25}" y="${s*0.45}" width="${s*0.5}" height="${s*0.08}" fill="#fff"/>
      <rect x="${s*0.25}" y="${s*0.4}" width="${s*0.5}" height="${s*0.08}" fill="#ec4899"/>
      <ellipse cx="${s*0.5}" cy="${s*0.38}" rx="${s*0.25}" ry="${s*0.05}" fill="#f472b6"/>
      <circle cx="${s*0.5}" cy="${s*0.32}" r="${s*0.025}" fill="#ef4444"/>
    </svg>
  `,
  icecream: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e0e7ff"/>
          <stop offset="100%" style="stop-color:#c7d2fe"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <polygon points="${s*0.35},${s*0.55} ${s*0.5},${s*0.8} ${s*0.65},${s*0.55}" fill="#d97706"/>
      <circle cx="${s*0.5}" cy="${s*0.45}" r="${s*0.15}" fill="#fef3c7"/>
      <circle cx="${s*0.5}" cy="${s*0.35}" r="${s*0.12}" fill="#fbcfe8"/>
      <circle cx="${s*0.5}" cy="${s*0.28}" r="${s*0.08}" fill="#a78bfa"/>
    </svg>
  `,
  drink: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <rect x="${s*0.35}" y="${s*0.3}" width="${s*0.3}" height="${s*0.45}" fill="#f5f5f4" rx="4"/>
      <rect x="${s*0.38}" y="${s*0.4}" width="${s*0.24}" height="${s*0.3}" fill="#f97316"/>
      <rect x="${s*0.33}" y="${s*0.28}" width="${s*0.34}" height="${s*0.05}" fill="#d4d4d4"/>
    </svg>
  `,
  coffee: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.45}" cy="${s*0.6}" rx="${s*0.2}" ry="${s*0.15}" fill="#f5f5f4"/>
      <ellipse cx="${s*0.45}" cy="${s*0.55}" rx="${s*0.17}" ry="${s*0.1}" fill="#78350f"/>
      <path d="M${s*0.65} ${s*0.5} Q${s*0.75} ${s*0.5} ${s*0.75} ${s*0.6} Q${s*0.75} ${s*0.7} ${s*0.65} ${s*0.7}" stroke="#d4d4d4" stroke-width="3" fill="none"/>
      <path d="M${s*0.35} ${s*0.4} Q${s*0.35} ${s*0.3} ${s*0.4} ${s*0.35}" stroke="#9ca3af" stroke-width="2" fill="none"/>
      <path d="M${s*0.5} ${s*0.38} Q${s*0.5} ${s*0.28} ${s*0.55} ${s*0.33}" stroke="#9ca3af" stroke-width="2" fill="none"/>
    </svg>
  `,
  cutting: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#d1fae5"/>
          <stop offset="100%" style="stop-color:#a7f3d0"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <rect x="${s*0.2}" y="${s*0.5}" width="${s*0.6}" height="${s*0.2}" fill="#d97706" rx="2"/>
      <ellipse cx="${s*0.35}" cy="${s*0.5}" rx="${s*0.08}" ry="${s*0.06}" fill="#f97316"/>
      <ellipse cx="${s*0.5}" cy="${s*0.5}" rx="${s*0.08}" ry="${s*0.06}" fill="#f97316"/>
      <ellipse cx="${s*0.65}" cy="${s*0.5}" rx="${s*0.08}" ry="${s*0.06}" fill="#f97316"/>
      <path d="M${s*0.7} ${s*0.35} L${s*0.8} ${s*0.55}" stroke="#9ca3af" stroke-width="4" stroke-linecap="round"/>
      <polygon points="${s*0.68},${s*0.33} ${s*0.82},${s*0.53} ${s*0.78},${s*0.57} ${s*0.64},${s*0.37}" fill="#d4d4d4"/>
    </svg>
  `,
  frying: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.45}" cy="${s*0.55}" rx="${s*0.3}" ry="${s*0.12}" fill="#404040"/>
      <ellipse cx="${s*0.45}" cy="${s*0.52}" rx="${s*0.25}" ry="${s*0.08}" fill="#525252"/>
      <rect x="${s*0.7}" y="${s*0.5}" width="${s*0.2}" height="${s*0.04}" fill="#78716c"/>
      <path d="M${s*0.35} ${s*0.4} Q${s*0.35} ${s*0.3} ${s*0.4} ${s*0.35}" stroke="#f97316" stroke-width="2" fill="none"/>
      <path d="M${s*0.5} ${s*0.38} Q${s*0.5} ${s*0.28} ${s*0.55} ${s*0.33}" stroke="#f97316" stroke-width="2" fill="none"/>
    </svg>
  `,
  boiling: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#dbeafe"/>
          <stop offset="100%" style="stop-color:#bfdbfe"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.6}" rx="${s*0.3}" ry="${s*0.15}" fill="#a3a3a3"/>
      <ellipse cx="${s*0.5}" cy="${s*0.55}" rx="${s*0.25}" ry="${s*0.1}" fill="#3b82f6"/>
      <circle cx="${s*0.4}" cy="${s*0.45}" r="${s*0.02}" fill="#fff"/>
      <circle cx="${s*0.55}" cy="${s*0.43}" r="${s*0.025}" fill="#fff"/>
      <circle cx="${s*0.5}" cy="${s*0.48}" r="${s*0.02}" fill="#fff"/>
      <path d="M${s*0.35} ${s*0.35} Q${s*0.35} ${s*0.25} ${s*0.4} ${s*0.3}" stroke="#9ca3af" stroke-width="2" fill="none"/>
      <path d="M${s*0.5} ${s*0.33} Q${s*0.5} ${s*0.23} ${s*0.55} ${s*0.28}" stroke="#9ca3af" stroke-width="2" fill="none"/>
      <path d="M${s*0.65} ${s*0.35} Q${s*0.65} ${s*0.25} ${s*0.7} ${s*0.3}" stroke="#9ca3af" stroke-width="2" fill="none"/>
    </svg>
  `,
  baking: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <rect x="${s*0.2}" y="${s*0.35}" width="${s*0.6}" height="${s*0.4}" fill="#525252" rx="4"/>
      <rect x="${s*0.25}" y="${s*0.4}" width="${s*0.5}" height="${s*0.3}" fill="#f97316" rx="2"/>
      <rect x="${s*0.3}" y="${s*0.5}" width="${s*0.4}" height="${s*0.12}" fill="#fbbf24" rx="2"/>
    </svg>
  `,
  plating: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f5f5f4"/>
          <stop offset="100%" style="stop-color:#e7e5e4"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.55}" rx="${s*0.38}" ry="${s*0.2}" fill="#fff" stroke="#d4d4d4" stroke-width="2"/>
      <ellipse cx="${s*0.4}" cy="${s*0.5}" rx="${s*0.1}" ry="${s*0.06}" fill="#22c55e"/>
      <ellipse cx="${s*0.55}" cy="${s*0.52}" rx="${s*0.12}" ry="${s*0.08}" fill="#f97316"/>
      <path d="M${s*0.6} ${s*0.45} Q${s*0.65} ${s*0.4} ${s*0.7} ${s*0.45}" stroke="#22c55e" stroke-width="2" fill="none"/>
    </svg>
  `,
  default: (s) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="${s}" height="${s}" fill="url(#bg)" rx="16"/>
      <ellipse cx="${s*0.5}" cy="${s*0.55}" rx="${s*0.35}" ry="${s*0.18}" fill="#fff" stroke="#e5e7eb" stroke-width="2"/>
      <text x="${s*0.5}" y="${s*0.58}" font-size="${s*0.25}" text-anchor="middle" dominant-baseline="middle">🍽️</text>
    </svg>
  `
};

// Detect category from dish name and ingredients
const detectCategory = (dishName: string, ingredients: string[], stepDescription?: string): DishCategory => {
  const text = `${dishName} ${ingredients.join(' ')} ${stepDescription || ''}`.toLowerCase();

  // Cooking steps
  if (stepDescription) {
    if (/нарез|режем|порез|slice|cut|chop/.test(text)) return 'cutting';
    if (/жарим|жарить|обжар|fry|sauté/.test(text)) return 'frying';
    if (/варим|варить|кипят|boil/.test(text)) return 'boiling';
    if (/запекаем|запечь|духовк|bake|oven/.test(text)) return 'baking';
    if (/подаём|подача|серви|serve|plate/.test(text)) return 'plating';
  }

  // Dishes
  if (/яичниц|scrambled|омлет|omelette/.test(text)) return 'eggs';
  if (/блин|pancake|оладь/.test(text)) return 'pancakes';
  if (/каша|porridge|овсян/.test(text)) return 'porridge';
  if (/завтрак|breakfast|творог/.test(text)) return 'breakfast';
  if (/суп|soup|борщ|щи/.test(text)) return 'soup';
  if (/салат|salad/.test(text)) return 'salad';
  if (/паста|pasta|спагетти|макарон/.test(text)) return 'pasta';
  if (/рис|rice|плов|ризотто/.test(text)) return 'rice';
  if (/стейк|steak|мясо|говядин|свинин/.test(text)) return 'meat';
  if (/рыб|fish|лосось|salmon|тунец/.test(text)) return 'fish';
  if (/курица|chicken|куриц|индейк/.test(text)) return 'chicken';
  if (/бургер|burger|котлет/.test(text)) return 'burger';
  if (/пицц|pizza/.test(text)) return 'pizza';
  if (/бутерброд|sandwich|тост/.test(text)) return 'sandwich';
  if (/торт|cake/.test(text)) return 'cake';
  if (/мороженое|ice cream/.test(text)) return 'icecream';
  if (/десерт|dessert|пирог|печень/.test(text)) return 'dessert';
  if (/кофе|coffee/.test(text)) return 'coffee';
  if (/смузи|smoothie|коктейль|напиток/.test(text)) return 'drink';

  return 'default';
};

// Get bundled illustration
const getBundledIllustration = (dishName: string, ingredients: string[], size: number, stepDescription?: string): string => {
  const category = detectCategory(dishName, ingredients, stepDescription);
  const svgContent = BUNDLED_ILLUSTRATIONS[category](size);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent.trim())))}`;
};

// ============================================
// LEGACY FUNCTIONS (for compatibility)
// ============================================

const getSmartEmoji = (dishName: string, ingredients: string[]): string => {
  const category = detectCategory(dishName, ingredients);
  const emojiMap: Record<DishCategory, string> = {
    breakfast: '🍳', eggs: '🥚', pancakes: '🥞', porridge: '🥣',
    soup: '🍲', salad: '🥗', pasta: '🍝', rice: '🍚',
    meat: '🥩', fish: '🐟', chicken: '🍗',
    burger: '🍔', pizza: '🍕', sandwich: '🥪',
    dessert: '🍰', cake: '🎂', icecream: '🍨',
    drink: '🥤', coffee: '☕',
    cutting: '🔪', frying: '🍳', boiling: '🍲', baking: '🥧', plating: '🍽️',
    default: '🍽️'
  };
  return emojiMap[category];
};

const getBlurPlaceholder = (dishName: string, ingredients: string[]): string => {
  return getBundledIllustration(dishName, ingredients, 20);
};

// ============================================
// CACHE KEY & SEARCH QUERY
// ============================================

const getCacheKey = (
  dishName: string,
  ingredients: string[],
  stepDescription?: string,
  size: ImageSize = 'medium'
): string => {
  const base = `${dishName.toLowerCase()}:${ingredients.slice(0, 3).join('|')}`;
  return stepDescription
    ? `step:${stepDescription.slice(0, 30)}:${base}:${size}`
    : `dish:${base}:${size}`;
};

const buildSearchQuery = (dishName: string, ingredients: string[], stepDescription?: string): string => {
  const category = detectCategory(dishName, ingredients, stepDescription);
  const queryMap: Partial<Record<DishCategory, string>> = {
    eggs: 'scrambled eggs breakfast',
    pancakes: 'pancakes stack',
    porridge: 'oatmeal porridge',
    soup: 'soup bowl hot',
    salad: 'fresh salad bowl',
    pasta: 'pasta dish italian',
    rice: 'rice dish',
    meat: 'steak grilled',
    fish: 'salmon fish',
    chicken: 'chicken dish',
    burger: 'burger food',
    pizza: 'pizza slice',
    cake: 'cake slice',
    cutting: 'cutting vegetables',
    frying: 'frying pan cooking',
    boiling: 'boiling pot',
    baking: 'oven baking'
  };
  return queryMap[category] || `${dishName} food`;
};

// ============================================
// IMAGE SOURCE FUNCTIONS
// ============================================

const getUnsplashUrl = (query: string, size: number): string => {
  const foodCollections = '317099,3178572,2081894';
  return `https://source.unsplash.com/collection/${foodCollections}/${size}x${size}/?${encodeURIComponent(query)}`;
};

const getFoodishUrl = async (category: string): Promise<string | null> => {
  if (!isSourceAvailable('foodish')) return null;

  const categories = ['burger', 'pizza', 'pasta', 'rice', 'dessert', 'biryani'];
  const matched = categories.find(c => category.toLowerCase().includes(c)) || 'pasta';

  try {
    const response = await fetch(`https://foodish-api.com/api/images/${matched}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      recordSuccess('foodish');
      const data = await response.json();
      return data.image;
    }
    recordFailure('foodish');
  } catch {
    recordFailure('foodish');
  }
  return null;
};

const getPicsumUrl = (size: number, seed: string): string => {
  const hash = seed.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  return `https://picsum.photos/seed/${Math.abs(hash)}/${size}/${size}`;
};

// ============================================
// DEBOUNCE
// ============================================

const pendingRequests = new Map<string, Promise<GeneratedImage>>();

// ============================================
// MAIN FUNCTION
// ============================================

export const generateDishImage = async (options: GenerateImageOptions): Promise<GeneratedImage> => {
  const { dishName, ingredients, stepDescription, size = 'medium' } = options;
  const pixelSize = SIZE_MAP[size];
  const cacheKey = getCacheKey(dishName, ingredients, stepDescription, size);
  const imagenKey = `imagen_${dishName.toLowerCase().replace(/\s+/g, '_')}_${size}`;
  const category = detectCategory(dishName, ingredients, stepDescription);
  const placeholder = getBlurPlaceholder(dishName, ingredients);

  // 1. Check memory cache
  if (memoryCache.has(cacheKey)) {
    return { url: memoryCache.get(cacheKey)!, cached: true, source: 'cache', placeholder };
  }

  // 2. Check IndexedDB for Imagen-generated image
  const cachedImagen = await getCachedDishImage(imagenKey);
  if (cachedImagen) {
    memoryCache.set(cacheKey, cachedImagen);
    return { url: cachedImagen, cached: true, source: 'imagen', placeholder };
  }

  // 3. Check pending requests (debounce)
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // 4. Fetch from sources
  const requestPromise = (async (): Promise<GeneratedImage> => {
    // Try Imagen FIRST (best quality)
    const imagenUrl = await generateWithImagen(dishName, ingredients);
    if (imagenUrl) {
      await saveDishImage(imagenKey, imagenUrl);
      memoryCache.set(cacheKey, imagenUrl);
      return { url: imagenUrl, cached: false, source: 'imagen', placeholder };
    }

    // Fallback: Try Unsplash
    const searchQuery = buildSearchQuery(dishName, ingredients, stepDescription);
    if (isSourceAvailable('unsplash')) {
      try {
        const url = getUnsplashUrl(searchQuery, pixelSize);
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
          recordSuccess('unsplash');
          saveToPersistentCache(cacheKey, url, size, category);
          return { url, cached: false, source: 'unsplash', placeholder };
        }
        recordFailure('unsplash');
      } catch {
        recordFailure('unsplash');
      }
    }

    // Fallback: Try Foodish
    const foodishUrl = await getFoodishUrl(searchQuery);
    if (foodishUrl) {
      saveToPersistentCache(cacheKey, foodishUrl, size, category);
      return { url: foodishUrl, cached: false, source: 'foodish', placeholder };
    }

    // Fallback: Try Picsum
    if (isSourceAvailable('picsum')) {
      try {
        const url = getPicsumUrl(pixelSize, cacheKey);
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          recordSuccess('picsum');
          saveToPersistentCache(cacheKey, url, size, category);
          return { url, cached: false, source: 'picsum', placeholder };
        }
        recordFailure('picsum');
      } catch {
        recordFailure('picsum');
      }
    }

    // Fallback: Bundled illustration
    const bundledUrl = getBundledIllustration(dishName, ingredients, pixelSize, stepDescription);
    return { url: bundledUrl, cached: false, source: 'bundle', placeholder };

  })();

  pendingRequests.set(cacheKey, requestPromise);
  requestPromise.finally(() => setTimeout(() => pendingRequests.delete(cacheKey), 100));

  return requestPromise;
};

// ============================================
// EXPORTS
// ============================================

export const preloadRecipeImages = async (
  dishName: string,
  ingredients: string[],
  steps: { instruction?: string; description?: string }[]
): Promise<void> => {
  await generateDishImage({ dishName, ingredients, size: 'medium' });
  for (let i = 0; i < steps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    generateDishImage({
      dishName,
      ingredients,
      stepDescription: steps[i].instruction || steps[i].description,
      size: 'medium'
    });
  }
};

export const prefetchNextStep = (
  dishName: string,
  ingredients: string[],
  nextStepDescription: string
): void => {
  generateDishImage({ dishName, ingredients, stepDescription: nextStepDescription, size: 'medium' });
};

export const clearImageCache = (): void => {
  memoryCache.clear();
  persistentCache = {};
  localStorage.removeItem(CACHE_KEY);
};

export const getCacheStats = () => ({
  memoryCount: memoryCache.size,
  persistentCount: Object.keys(persistentCache).length,
  sizeKB: Math.round((localStorage.getItem(CACHE_KEY) || '').length / 1024)
});

export const getSourceStatus = () => ({ ...sourceStatus });

export const resetSourceCooldown = (source: ImageSource): void => {
  sourceStatus[source] = { failures: 0, lastFailure: 0, cooldownUntil: 0 };
  saveRateLimitState();
};
