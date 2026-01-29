/**
 * Nana Banana Image Generation Service
 * Generates AI images of dishes for recipes using Nana Banana v2+
 */

// Cache for generated images to avoid regenerating
const imageCache = new Map<string, string>();

// Generate cache key from ingredients
const getCacheKey = (ingredients: string[]): string => {
  return ingredients.map(i => i.toLowerCase().trim()).sort().join('|');
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
 * Generate an image of a dish using Nana Banana v2+
 */
export const generateDishImage = async (options: GenerateImageOptions): Promise<GeneratedImage> => {
  const { dishName, ingredients, style = 'photo', stepDescription } = options;

  // Check cache first
  const cacheKey = stepDescription
    ? `step:${stepDescription}:${getCacheKey(ingredients)}`
    : `dish:${dishName}:${getCacheKey(ingredients)}`;

  if (imageCache.has(cacheKey)) {
    return { url: imageCache.get(cacheKey)!, cached: true };
  }

  // Build prompt for image generation
  const prompt = stepDescription
    ? `Cooking step: ${stepDescription}. Ingredients visible: ${ingredients.join(', ')}. Style: ${style === 'photo' ? 'professional food photography' : 'clean illustration'}, top-down view, kitchen setting.`
    : `Delicious ${dishName} made with ${ingredients.join(', ')}. Style: ${style === 'photo' ? 'professional food photography, appetizing, well-lit' : 'clean modern illustration'}, plated beautifully.`;

  try {
    // TODO: Replace with actual Nana Banana v2+ API call
    // For now, using placeholder that will be replaced with real API
    const apiKey = process.env.NANA_BANANA_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      // Return placeholder if no API key
      return { url: getPlaceholderImage(dishName), cached: false };
    }

    // Nana Banana v2+ API call
    const response = await fetch('https://api.nana-banana.ai/v2/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: 'nana-banana-v2',
        size: '512x512',
        quality: 'standard'
      })
    });

    if (!response.ok) {
      console.warn('Nana Banana API error, using placeholder');
      return { url: getPlaceholderImage(dishName), cached: false };
    }

    const data = await response.json();
    const imageUrl = data.url || data.image_url || data.data?.[0]?.url;

    if (imageUrl) {
      imageCache.set(cacheKey, imageUrl);
      return { url: imageUrl, cached: false };
    }

    return { url: getPlaceholderImage(dishName), cached: false };
  } catch (error) {
    console.error('Error generating image:', error);
    return { url: getPlaceholderImage(dishName), cached: false };
  }
};

/**
 * Generate a placeholder image SVG for when API is unavailable
 */
const getPlaceholderImage = (dishName: string): string => {
  // Get first emoji from dish name or default
  const foodEmojis = ['🍳', '🥗', '🍲', '🍝', '🥘', '🍜', '🍛', '🥙'];
  const emoji = foodEmojis[Math.abs(hashCode(dishName)) % foodEmojis.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#bg)" rx="16"/>
      <text x="100" y="110" font-size="64" text-anchor="middle">${emoji}</text>
      <text x="100" y="160" font-size="12" text-anchor="middle" fill="#92400e" font-family="system-ui">${truncate(dishName, 20)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

// Simple hash function for consistent emoji selection
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

const truncate = (str: string, len: number): string => {
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
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
    }, idx * 500); // Stagger requests
  });
};

/**
 * Clear image cache (for memory management)
 */
export const clearImageCache = (): void => {
  imageCache.clear();
};
