/**
 * Dish Image Service - Free & Fast
 *
 * Features:
 * - Persistent LocalStorage cache (24h TTL)
 * - Multiple fallbacks: Unsplash → Foodish → Picsum → SVG
 * - Adaptive sizes (small/medium/large)
 * - Progressive loading support
 * - Debounced requests
 */

// ============================================
// CACHE SYSTEM
// ============================================

const CACHE_KEY = 'fitstream_image_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

interface CacheEntry {
  url: string;
  timestamp: number;
  size: ImageSize;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

// Memory cache for instant access
const memoryCache = new Map<string, string>();

// Load cache from LocalStorage
const loadPersistentCache = (): CacheStore => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return {};

    const cache: CacheStore = JSON.parse(stored);
    const now = Date.now();

    // Filter out expired entries
    const validCache: CacheStore = {};
    for (const [key, entry] of Object.entries(cache)) {
      if (now - entry.timestamp < CACHE_TTL) {
        validCache[key] = entry;
        memoryCache.set(key, entry.url);
      }
    }

    // Save cleaned cache back
    if (Object.keys(validCache).length !== Object.keys(cache).length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(validCache));
    }

    return validCache;
  } catch {
    return {};
  }
};

// Save to persistent cache
const saveToPersistentCache = (key: string, url: string, size: ImageSize): void => {
  try {
    const cache = loadPersistentCache();
    cache[key] = { url, timestamp: Date.now(), size };

    // Limit cache size (max 200 entries)
    const entries = Object.entries(cache);
    if (entries.length > 200) {
      // Remove oldest entries
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toKeep = entries.slice(-150);
      const newCache: CacheStore = {};
      toKeep.forEach(([k, v]) => { newCache[k] = v; });
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }

    memoryCache.set(key, url);
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
};

// Initialize cache on load
loadPersistentCache();

// ============================================
// TYPES
// ============================================

export type ImageSize = 'small' | 'medium' | 'large';

const SIZE_MAP: Record<ImageSize, number> = {
  small: 256,   // For previews, thumbnails
  medium: 512,  // Default for cards
  large: 800    // For detail views
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
  placeholder?: string; // Blur placeholder for progressive loading
}

// ============================================
// CACHE KEY GENERATION
// ============================================

const getCacheKey = (
  dishName: string,
  ingredients: string[],
  stepDescription?: string,
  size: ImageSize = 'medium'
): string => {
  const base = `${dishName.toLowerCase()}:${ingredients.slice(0, 3).join('|')}`;
  const sizeKey = size;
  return stepDescription
    ? `step:${stepDescription.slice(0, 30)}:${base}:${sizeKey}`
    : `dish:${base}:${sizeKey}`;
};

// ============================================
// IMAGE SOURCES (Fallback Chain)
// ============================================

/**
 * Source 1: Unsplash (primary)
 * Free, high quality, food-specific collections
 */
const getUnsplashUrl = (query: string, size: number): string => {
  // Use featured food collections for better results
  const foodCollections = '317099,3178572,2081894'; // Food photography collections
  return `https://source.unsplash.com/collection/${foodCollections}/${size}x${size}/?${encodeURIComponent(query)}`;
};

/**
 * Source 2: Foodish (food-only API)
 * https://foodish-api.com - only food images
 */
const getFoodishUrl = async (category: string): Promise<string | null> => {
  const categories = ['burger', 'pizza', 'pasta', 'rice', 'dessert', 'biryani'];
  const matchedCategory = categories.find(c => category.toLowerCase().includes(c)) || 'pasta';

  try {
    const response = await fetch(`https://foodish-api.com/api/images/${matchedCategory}`);
    if (response.ok) {
      const data = await response.json();
      return data.image;
    }
  } catch {
    // Foodish unavailable
  }
  return null;
};

/**
 * Source 3: Lorem Picsum (generic fallback)
 */
const getPicsumUrl = (size: number, seed: string): string => {
  // Use seed for consistent images
  const hash = seed.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  return `https://picsum.photos/seed/${Math.abs(hash)}/${size}/${size}`;
};

/**
 * Source 4: SVG Placeholder (offline fallback)
 */
const getPlaceholderImage = (dishName: string, ingredients: string[], size: number = 200): string => {
  const emoji = getSmartEmoji(dishName, ingredients);

  const gradients: Record<string, [string, string]> = {
    '🥛': ['#f0f9ff', '#dbeafe'],
    '🥣': ['#fef3c7', '#fde68a'],
    '🍳': ['#fef9c3', '#fef08a'],
    '🥗': ['#d1fae5', '#a7f3d0'],
    '🍝': ['#fee2e2', '#fecaca'],
    '🍲': ['#ffedd5', '#fed7aa'],
    '🍗': ['#fef3c7', '#fde68a'],
    '🥩': ['#fecaca', '#fca5a5'],
    '🐟': ['#dbeafe', '#bfdbfe'],
    '🍕': ['#fed7aa', '#fdba74'],
    '🍔': ['#fef3c7', '#fde68a'],
    '🥞': ['#fef3c7', '#fde68a'],
    '🎂': ['#fce7f3', '#fbcfe8'],
    '🍨': ['#e0e7ff', '#c7d2fe'],
  };

  const [color1, color2] = gradients[emoji] || ['#fef3c7', '#fde68a'];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1}"/>
          <stop offset="100%" style="stop-color:${color2}"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#bg)" rx="16"/>
      <text x="${size/2}" y="${size/2 + size*0.05}" font-size="${size*0.4}" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

/**
 * Generate tiny blur placeholder (for progressive loading)
 */
const getBlurPlaceholder = (dishName: string, ingredients: string[]): string => {
  const emoji = getSmartEmoji(dishName, ingredients);
  const gradients: Record<string, [string, string]> = {
    '🥛': ['#f0f9ff', '#dbeafe'],
    '🥣': ['#fef3c7', '#fde68a'],
    '🍳': ['#fef9c3', '#fef08a'],
    '🥗': ['#d1fae5', '#a7f3d0'],
    '🍝': ['#fee2e2', '#fecaca'],
    '🍲': ['#ffedd5', '#fed7aa'],
  };
  const [color1, color2] = gradients[emoji] || ['#fef3c7', '#fde68a'];

  // Tiny 10x10 SVG for blur effect
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1}"/>
          <stop offset="100%" style="stop-color:${color2}"/>
        </linearGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="10" height="10" fill="url(#bg)" filter="url(#blur)"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

// ============================================
// SMART EMOJI & CATEGORY DETECTION
// ============================================

const getSmartEmoji = (dishName: string, ingredients: string[]): string => {
  const text = `${dishName} ${ingredients.join(' ')}`.toLowerCase();

  const emojiMap: [RegExp, string][] = [
    [/творог|cottage/, '🥛'],
    [/каша|porridge|овсян/, '🥣'],
    [/яичниц|scrambled/, '🍳'],
    [/омлет|omelette/, '🥚'],
    [/блин|pancake|оладь/, '🥞'],
    [/тост|toast/, '🍞'],
    [/бутерброд|sandwich/, '🥪'],
    [/суп|soup|борщ/, '🍲'],
    [/салат|salad/, '🥗'],
    [/паста|макарон|спагетти/, '🍝'],
    [/рис|rice|плов/, '🍚'],
    [/пицц|pizza/, '🍕'],
    [/бургер|burger/, '🍔'],
    [/стейк|steak/, '🥩'],
    [/курица|chicken/, '🍗'],
    [/рыб|fish|лосось/, '🐟'],
    [/креветк|shrimp/, '🦐'],
    [/торт|cake/, '🎂'],
    [/пирог|pie/, '🥧'],
    [/мороженое|ice cream/, '🍨'],
    [/шоколад|chocolate/, '🍫'],
    [/смузи|smoothie/, '🥤'],
    [/кофе|coffee/, '☕'],
    [/чай|tea/, '🍵'],
    [/овощ|vegetable/, '🥦'],
    [/грибы|mushroom/, '🍄'],
  ];

  for (const [pattern, emoji] of emojiMap) {
    if (pattern.test(text)) {
      return emoji;
    }
  }

  return '🍽️';
};

// ============================================
// SEARCH QUERY BUILDERS
// ============================================

const buildDishSearchQuery = (dishName: string, ingredients: string[]): string => {
  const text = `${dishName} ${ingredients.join(' ')}`.toLowerCase();

  const categories: [RegExp, string][] = [
    // Breakfast
    [/творог|cottage cheese/, 'cottage cheese breakfast'],
    [/каша|porridge|овсян|oatmeal/, 'oatmeal porridge'],
    [/яичниц|scrambled/, 'scrambled eggs'],
    [/омлет|omelette/, 'omelette'],
    [/блин|pancake|оладь/, 'pancakes'],
    [/тост|toast|бутерброд/, 'toast breakfast'],

    // Main dishes
    [/борщ|borscht/, 'borscht soup'],
    [/суп|soup/, 'soup bowl'],
    [/салат|salad/, 'fresh salad'],
    [/паста|pasta|спагетти/, 'pasta dish'],
    [/плов|pilaf/, 'pilaf rice'],
    [/ризотто|risotto/, 'risotto'],
    [/стейк|steak/, 'steak'],
    [/котлет|cutlet|бургер/, 'burger'],
    [/курица|chicken/, 'chicken dish'],
    [/рыб|fish|лосось|salmon/, 'salmon fish'],

    // Desserts
    [/торт|cake/, 'cake slice'],
    [/пирог|pie/, 'pie'],
    [/мороженое|ice cream/, 'ice cream'],
  ];

  for (const [pattern, category] of categories) {
    if (pattern.test(text)) {
      return `${category} food`;
    }
  }

  return `${dishName.replace(/[^a-zA-Zа-яА-Я\s]/g, '')} food dish`;
};

const buildStepSearchQuery = (stepDescription: string, ingredients: string[]): string => {
  const step = stepDescription.toLowerCase();

  const actions: [RegExp, string][] = [
    [/нарез|режем|порез|slice|cut|chop/, 'cutting vegetables knife'],
    [/жарим|жарить|обжар|fry|sauté|sear/, 'frying pan cooking'],
    [/варим|варить|кипят|boil|simmer/, 'boiling pot'],
    [/запекаем|запечь|духовк|bake|oven|roast/, 'oven baking'],
    [/мешаем|перемеш|помеш|stir|mix/, 'stirring cooking'],
    [/взбива|whisk|beat/, 'whisking bowl'],
    [/добавля|добавь|add/, 'adding ingredients'],
    [/подаём|подача|серви|serve|plate/, 'plated food'],
    [/украш|garnish|decorate/, 'food plating'],
    [/чист|очист|clean|peel/, 'peeling vegetables'],
    [/солим|перчим|season/, 'seasoning food'],
  ];

  for (const [pattern, query] of actions) {
    if (pattern.test(step)) {
      return `${query} cooking`;
    }
  }

  const mainIngredient = ingredients[0] || 'food';
  return `${mainIngredient} cooking`;
};

// ============================================
// DEBOUNCE & RATE LIMITING
// ============================================

const pendingRequests = new Map<string, Promise<GeneratedImage>>();

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Get dish image with fallback chain
 * Unsplash → Foodish → Picsum → SVG
 */
export const generateDishImage = async (options: GenerateImageOptions): Promise<GeneratedImage> => {
  const { dishName, ingredients, stepDescription, size = 'medium' } = options;
  const pixelSize = SIZE_MAP[size];

  const cacheKey = getCacheKey(dishName, ingredients, stepDescription, size);

  // 1. Check memory cache (instant)
  if (memoryCache.has(cacheKey)) {
    return {
      url: memoryCache.get(cacheKey)!,
      cached: true,
      placeholder: getBlurPlaceholder(dishName, ingredients)
    };
  }

  // 2. Check if request is already pending (debounce)
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // 3. Create new request
  const requestPromise = (async (): Promise<GeneratedImage> => {
    const placeholder = getBlurPlaceholder(dishName, ingredients);

    try {
      // Build search query
      const searchQuery = stepDescription
        ? buildStepSearchQuery(stepDescription, ingredients)
        : buildDishSearchQuery(dishName, ingredients);

      // Try Unsplash first
      const unsplashUrl = getUnsplashUrl(searchQuery, pixelSize);

      // Quick HEAD request to verify
      try {
        const response = await fetch(unsplashUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000) // 3s timeout
        });

        if (response.ok) {
          saveToPersistentCache(cacheKey, unsplashUrl, size);
          return { url: unsplashUrl, cached: false, placeholder };
        }
      } catch {
        // Unsplash failed, try next
      }

      // Try Foodish (food-only API)
      const category = buildDishSearchQuery(dishName, ingredients);
      const foodishUrl = await getFoodishUrl(category);
      if (foodishUrl) {
        saveToPersistentCache(cacheKey, foodishUrl, size);
        return { url: foodishUrl, cached: false, placeholder };
      }

      // Try Picsum (generic but reliable)
      const picsumUrl = getPicsumUrl(pixelSize, cacheKey);
      try {
        const response = await fetch(picsumUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          saveToPersistentCache(cacheKey, picsumUrl, size);
          return { url: picsumUrl, cached: false, placeholder };
        }
      } catch {
        // Picsum failed too
      }

      // Final fallback: SVG placeholder
      const svgUrl = getPlaceholderImage(dishName, ingredients, pixelSize);
      return { url: svgUrl, cached: false, placeholder };

    } catch (error) {
      console.error('Image generation failed:', error);
      return {
        url: getPlaceholderImage(dishName, ingredients, pixelSize),
        cached: false,
        placeholder
      };
    } finally {
      // Cleanup pending request
      setTimeout(() => pendingRequests.delete(cacheKey), 100);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

// ============================================
// PRELOADING
// ============================================

/**
 * Preload images for recipe (staggered)
 */
export const preloadRecipeImages = async (
  dishName: string,
  ingredients: string[],
  steps: { instruction?: string; description?: string }[]
): Promise<void> => {
  // Preload main dish image (high priority)
  await generateDishImage({ dishName, ingredients, size: 'medium' });

  // Preload step images (staggered to avoid rate limiting)
  for (let i = 0; i < steps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const step = steps[i];
    generateDishImage({
      dishName,
      ingredients,
      stepDescription: step.instruction || step.description,
      size: 'medium'
    });
  }
};

/**
 * Prefetch next step image during cooking
 */
export const prefetchNextStep = (
  dishName: string,
  ingredients: string[],
  nextStepDescription: string
): void => {
  // Fire and forget
  generateDishImage({
    dishName,
    ingredients,
    stepDescription: nextStepDescription,
    size: 'medium'
  });
};

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Clear all cached images
 */
export const clearImageCache = (): void => {
  memoryCache.clear();
  localStorage.removeItem(CACHE_KEY);
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): { memoryCount: number; persistentCount: number; sizeKB: number } => {
  const stored = localStorage.getItem(CACHE_KEY);
  const persistentCache = stored ? JSON.parse(stored) : {};

  return {
    memoryCount: memoryCache.size,
    persistentCount: Object.keys(persistentCache).length,
    sizeKB: stored ? Math.round(stored.length / 1024) : 0
  };
};
