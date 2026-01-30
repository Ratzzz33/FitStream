/**
 * Dish Image Generation Service
 * Generates AI images of dishes for recipes using Google Imagen 4 API
 */

import { GoogleGenAI } from "@google/genai";

// Cache for generated images to avoid regenerating
const imageCache = new Map<string, string>();

// Get API key from environment
const getApiKey = () => {
  return process.env.API_KEY || '';
};

// Generate cache key from dish name and ingredients
const getCacheKey = (dishName: string, ingredients: string[], stepDescription?: string): string => {
  const base = `${dishName.toLowerCase()}:${ingredients.map(i => i.toLowerCase().trim()).sort().join('|')}`;
  return stepDescription ? `step:${stepDescription}:${base}` : `dish:${base}`;
};

export interface GenerateImageOptions {
  dishName: string;
  ingredients: string[];
  style?: 'photo' | 'illustration';
  stepDescription?: string; // For step-by-step cooking images
}

export interface GeneratedImage {
  url: string;
  cached: boolean;
}

/**
 * Generate an image of a dish using Google Imagen 4 API
 */
export const generateDishImage = async (options: GenerateImageOptions): Promise<GeneratedImage> => {
  const { dishName, ingredients, style = 'photo', stepDescription } = options;

  // Check cache first
  const cacheKey = getCacheKey(dishName, ingredients, stepDescription);

  if (imageCache.has(cacheKey)) {
    return { url: imageCache.get(cacheKey)!, cached: true };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('No API key, using placeholder');
    return { url: getPlaceholderImage(dishName, ingredients), cached: false };
  }

  // Build optimized prompt for food photography
  const ingredientsList = ingredients.slice(0, 5).join(', ');

  const prompt = stepDescription
    ? `Professional food photography of cooking step: ${stepDescription}.
       Dish: ${dishName}. Visible ingredients: ${ingredientsList}.
       Kitchen setting, natural lighting, top-down or 45-degree angle view,
       clean modern style, appetizing presentation.
       NO TEXT, NO LABELS, NO WATERMARKS, NO CAPTIONS.`
    : `Professional food photography of ${dishName}.
       Main ingredients: ${ingredientsList}.
       Beautifully plated, appetizing, well-lit, shallow depth of field,
       ${style === 'photo' ? 'realistic photo' : 'clean illustration style'},
       restaurant quality presentation, neutral background.
       NO TEXT, NO LABELS, NO WATERMARKS, NO CAPTIONS.`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/webp'
      }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const img = response.generatedImages[0];

      // Check for content filtering
      if (img.raiFilteredReason) {
        console.warn(`Image filtered: ${img.raiFilteredReason}`);
        return { url: getPlaceholderImage(dishName, ingredients), cached: false };
      }

      if (img.image?.imageBytes) {
        // Convert to data URL
        const imageUrl = `data:image/webp;base64,${img.image.imageBytes}`;
        imageCache.set(cacheKey, imageUrl);
        return { url: imageUrl, cached: false };
      }
    }

    console.warn('No image generated, using placeholder');
    return { url: getPlaceholderImage(dishName, ingredients), cached: false };

  } catch (error: any) {
    console.error('Error generating image:', error.message);

    // Fallback to Unsplash for food images
    const unsplashUrl = getUnsplashFallback(dishName, ingredients);
    if (unsplashUrl) {
      imageCache.set(cacheKey, unsplashUrl);
      return { url: unsplashUrl, cached: false };
    }

    return { url: getPlaceholderImage(dishName, ingredients), cached: false };
  }
};

/**
 * Get Unsplash fallback image based on dish category
 */
const getUnsplashFallback = (dishName: string, ingredients: string[]): string | null => {
  const searchTerm = detectDishCategory(dishName, ingredients);
  // Use Unsplash Source API for relevant food images
  return `https://source.unsplash.com/512x512/?${encodeURIComponent(searchTerm)},food`;
};

/**
 * Detect dish category from name and ingredients for better fallback images
 */
const detectDishCategory = (dishName: string, ingredients: string[]): string => {
  const name = dishName.toLowerCase();
  const allText = `${name} ${ingredients.join(' ').toLowerCase()}`;

  // Category detection based on dish name and ingredients
  const categories: [RegExp, string][] = [
    // Breakfast items
    [/творог|cottage|каша с бананом|йогурт|мюсли|granola/, 'cottage cheese breakfast'],
    [/каша|porridge|овсян|oatmeal/, 'oatmeal porridge'],
    [/яичниц|омлет|scrambled|omelette|eggs/, 'scrambled eggs'],
    [/блин|pancake|оладь/, 'pancakes'],
    [/тост|toast|бутерброд|sandwich/, 'toast sandwich'],

    // Soups
    [/суп|soup|борщ|borscht|щи|солянк/, 'soup bowl'],

    // Salads
    [/салат|salad|греческ|цезар|caesar/, 'fresh salad'],

    // Pasta & noodles
    [/паста|макарон|спагетти|pasta|spaghetti|noodle|лапш/, 'pasta dish'],

    // Rice dishes
    [/рис|rice|плов|ризотто|risotto/, 'rice dish'],

    // Meat dishes
    [/стейк|steak|мяс|meat|котлет|cutlet|шашлык|kebab/, 'meat dish'],
    [/курица|chicken|птиц|индейк|turkey/, 'chicken dish'],
    [/рыб|fish|лосось|salmon|тунец|tuna/, 'fish dish'],

    // Desserts
    [/торт|cake|десерт|dessert|пирог|pie|печень|cookie/, 'dessert'],
    [/мороженое|ice cream|сорбет/, 'ice cream'],

    // Drinks
    [/смузи|smoothie|коктейль|shake/, 'smoothie drink'],
    [/кофе|coffee|латте|latte|капуччино/, 'coffee drink'],

    // Vegetables
    [/овощ|vegetable|вегетариан|веган|vegan/, 'vegetable dish'],
  ];

  for (const [pattern, category] of categories) {
    if (pattern.test(allText)) {
      return category;
    }
  }

  // Default: use main ingredient or generic food
  const mainIngredient = ingredients[0] || 'food';
  return `${mainIngredient} dish`;
};

/**
 * Get smart emoji based on dish type and ingredients
 */
const getSmartEmoji = (dishName: string, ingredients: string[]): string => {
  const name = dishName.toLowerCase();
  const allText = `${name} ${ingredients.join(' ').toLowerCase()}`;

  const emojiMap: [RegExp, string][] = [
    // Breakfast
    [/творог|cottage/, '🥛'],
    [/каша|porridge|овсян|oatmeal/, '🥣'],
    [/яичниц|scrambled/, '🍳'],
    [/омлет|omelette/, '🥚'],
    [/блин|pancake|оладь/, '🥞'],
    [/тост|toast/, '🍞'],
    [/бутерброд|sandwich/, '🥪'],

    // Fruits
    [/банан|banana/, '🍌'],
    [/яблок|apple/, '🍎'],
    [/ягод|berry|клубник|strawberry/, '🍓'],

    // Main dishes
    [/суп|soup|борщ/, '🍲'],
    [/салат|salad/, '🥗'],
    [/паста|макарон|спагетти|pasta/, '🍝'],
    [/рис|rice|плов/, '🍚'],
    [/пицц|pizza/, '🍕'],
    [/бургер|burger/, '🍔'],

    // Meat
    [/стейк|steak/, '🥩'],
    [/курица|chicken/, '🍗'],
    [/рыб|fish|лосось/, '🐟'],
    [/морепродукт|seafood|креветк|shrimp/, '🦐'],

    // Desserts
    [/торт|cake/, '🎂'],
    [/пирог|pie/, '🥧'],
    [/мороженое|ice cream/, '🍨'],
    [/шоколад|chocolate/, '🍫'],

    // Drinks
    [/смузи|smoothie/, '🥤'],
    [/кофе|coffee/, '☕'],
    [/чай|tea/, '🍵'],

    // Vegetables
    [/овощ|vegetable/, '🥦'],
    [/грибы|mushroom/, '🍄'],
  ];

  for (const [pattern, emoji] of emojiMap) {
    if (pattern.test(allText)) {
      return emoji;
    }
  }

  // Default food emoji
  return '🍽️';
};

/**
 * Generate a placeholder image SVG when API is unavailable
 * Now uses smart emoji detection based on dish and ingredients
 */
const getPlaceholderImage = (dishName: string, ingredients: string[]): string => {
  const emoji = getSmartEmoji(dishName, ingredients);

  // Generate warm gradient based on dish type
  const gradients: Record<string, [string, string]> = {
    '🥛': ['#f0f9ff', '#dbeafe'], // Light blue for dairy
    '🥣': ['#fef3c7', '#fde68a'], // Warm yellow for porridge
    '🍳': ['#fef9c3', '#fef08a'], // Yellow for eggs
    '🥗': ['#d1fae5', '#a7f3d0'], // Green for salads
    '🍝': ['#fee2e2', '#fecaca'], // Red for pasta
    '🍲': ['#ffedd5', '#fed7aa'], // Orange for soups
    '🍗': ['#fef3c7', '#fde68a'], // Yellow for chicken
  };

  const [color1, color2] = gradients[emoji] || ['#fef3c7', '#fde68a'];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1}"/>
          <stop offset="100%" style="stop-color:${color2}"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#bg)" rx="16"/>
      <text x="100" y="110" font-size="80" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};


/**
 * Preload images for a recipe (all steps + main dish)
 */
export const preloadRecipeImages = async (
  dishName: string,
  ingredients: string[],
  steps: { description: string }[]
): Promise<void> => {
  // Generate main dish image
  generateDishImage({ dishName, ingredients });

  // Generate step images in background (don't await)
  steps.forEach((step, idx) => {
    setTimeout(() => {
      generateDishImage({
        dishName,
        ingredients,
        stepDescription: step.description
      });
    }, idx * 1000); // Stagger requests to avoid rate limiting
  });
};

/**
 * Clear image cache (for memory management)
 */
export const clearImageCache = (): void => {
  imageCache.clear();
};
