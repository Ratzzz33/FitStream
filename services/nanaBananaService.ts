/**
 * Dish Image Service
 * Uses Unsplash for free high-quality food images
 */

// Cache for generated images
const imageCache = new Map<string, string>();

// Generate cache key
const getCacheKey = (dishName: string, ingredients: string[], stepDescription?: string): string => {
  const base = `${dishName.toLowerCase()}:${ingredients.slice(0, 3).join('|')}`;
  return stepDescription ? `step:${stepDescription.slice(0, 30)}:${base}` : `dish:${base}`;
};

export interface GenerateImageOptions {
  dishName: string;
  ingredients: string[];
  style?: 'photo' | 'illustration';
  stepDescription?: string;
}

export interface GeneratedImage {
  url: string;
  cached: boolean;
}

/**
 * Get dish image from Unsplash (free, unlimited)
 */
export const generateDishImage = async (options: GenerateImageOptions): Promise<GeneratedImage> => {
  const { dishName, ingredients, stepDescription } = options;

  const cacheKey = getCacheKey(dishName, ingredients, stepDescription);

  if (imageCache.has(cacheKey)) {
    return { url: imageCache.get(cacheKey)!, cached: true };
  }

  try {
    // Build search query for Unsplash
    const searchQuery = stepDescription
      ? buildStepSearchQuery(stepDescription, ingredients)
      : buildDishSearchQuery(dishName, ingredients);

    // Unsplash Source API - free, no API key needed
    const imageUrl = `https://source.unsplash.com/512x512/?${encodeURIComponent(searchQuery)}`;

    // Verify image loads (prefetch)
    const isValid = await verifyImageUrl(imageUrl);

    if (isValid) {
      imageCache.set(cacheKey, imageUrl);
      return { url: imageUrl, cached: false };
    }

    // Fallback to placeholder
    return { url: getPlaceholderImage(dishName, ingredients), cached: false };

  } catch (error) {
    console.error('Error getting image:', error);
    return { url: getPlaceholderImage(dishName, ingredients), cached: false };
  }
};

/**
 * Verify image URL is accessible
 */
const verifyImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Build search query for dish image
 */
const buildDishSearchQuery = (dishName: string, ingredients: string[]): string => {
  const category = detectDishCategory(dishName, ingredients);

  // Add "food" to ensure food-related results
  return `${category},food,dish`;
};

/**
 * Build search query for cooking step image
 */
const buildStepSearchQuery = (stepDescription: string, ingredients: string[]): string => {
  const step = stepDescription.toLowerCase();

  // Detect cooking action
  const actions: [RegExp, string][] = [
    [/нарез|режем|порез|slice|cut|chop/, 'cutting vegetables knife'],
    [/жарим|жарить|обжар|fry|sauté|sear/, 'frying pan cooking'],
    [/варим|варить|кипят|boil|simmer/, 'boiling pot cooking'],
    [/запекаем|запечь|духовк|bake|oven|roast/, 'oven baking'],
    [/мешаем|перемеш|помеш|stir|mix/, 'stirring pot cooking'],
    [/взбива|whisk|beat/, 'whisking bowl'],
    [/добавля|добавь|add/, 'adding ingredients cooking'],
    [/подаём|подача|серви|serve|plate/, 'plated food presentation'],
    [/украш|garnish|decorate/, 'food garnish plating'],
  ];

  for (const [pattern, query] of actions) {
    if (pattern.test(step)) {
      return `${query},cooking`;
    }
  }

  // Default: use main ingredient + cooking
  const mainIngredient = ingredients[0] || 'food';
  return `${mainIngredient},cooking,kitchen`;
};

/**
 * Detect dish category for better image search
 */
const detectDishCategory = (dishName: string, ingredients: string[]): string => {
  const text = `${dishName} ${ingredients.join(' ')}`.toLowerCase();

  const categories: [RegExp, string][] = [
    // Breakfast
    [/творог|cottage cheese/, 'cottage cheese bowl breakfast'],
    [/каша|porridge|овсян|oatmeal/, 'oatmeal porridge bowl'],
    [/яичниц|scrambled|жареные яйца/, 'scrambled eggs breakfast'],
    [/омлет|omelette|omelet/, 'omelette breakfast'],
    [/блин|pancake|оладь/, 'pancakes stack breakfast'],
    [/тост|toast|бутерброд|sandwich/, 'toast sandwich breakfast'],
    [/мюсли|granola|гранола/, 'granola bowl yogurt'],

    // Soups
    [/борщ|borscht/, 'borscht soup beetroot'],
    [/суп|soup|щи|солянк/, 'soup bowl hot'],

    // Salads
    [/цезар|caesar/, 'caesar salad'],
    [/греческ|greek/, 'greek salad feta'],
    [/салат|salad/, 'fresh salad bowl'],

    // Pasta & noodles
    [/карбонар|carbonara/, 'carbonara pasta'],
    [/болоньез|bolognese/, 'bolognese pasta meat'],
    [/паста|pasta|макарон|спагетти/, 'pasta dish italian'],
    [/лапш|noodle|рамен|ramen/, 'noodles asian'],

    // Rice
    [/плов|pilaf/, 'pilaf rice meat'],
    [/ризотто|risotto/, 'risotto creamy'],
    [/рис|rice/, 'rice dish'],

    // Meat
    [/стейк|steak/, 'steak beef grilled'],
    [/котлет|cutlet|бургер/, 'burger cutlet meat'],
    [/шашлык|kebab|шаурм/, 'kebab grilled meat'],
    [/курица|chicken|куриц/, 'chicken dish'],
    [/индейк|turkey/, 'turkey meat'],
    [/свинин|pork/, 'pork dish'],
    [/говядин|beef/, 'beef dish'],

    // Fish
    [/лосось|salmon/, 'salmon fish'],
    [/тунец|tuna/, 'tuna fish'],
    [/рыб|fish/, 'fish dish seafood'],
    [/креветк|shrimp|морепродукт/, 'shrimp seafood'],

    // Desserts
    [/торт|cake/, 'cake dessert slice'],
    [/пирог|pie|пирожок/, 'pie dessert'],
    [/мороженое|ice cream/, 'ice cream dessert'],
    [/печень|cookie|печенье/, 'cookies dessert'],
    [/шоколад|chocolate/, 'chocolate dessert'],

    // Drinks
    [/смузи|smoothie/, 'smoothie fruit drink'],
    [/коктейль|shake|милкшейк/, 'milkshake drink'],

    // Vegetables
    [/овощ|vegetable|веган|vegan/, 'vegetable dish healthy'],
    [/грибы|mushroom/, 'mushroom dish'],
  ];

  for (const [pattern, category] of categories) {
    if (pattern.test(text)) {
      return category;
    }
  }

  // Default: use dish name cleaned up
  return dishName.replace(/[^a-zA-Zа-яА-Я\s]/g, '').trim() || 'delicious food';
};

/**
 * Get smart emoji based on dish type
 */
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
    [/банан|banana/, '🍌'],
    [/яблок|apple/, '🍎'],
    [/ягод|berry|клубник/, '🍓'],
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

/**
 * Generate placeholder SVG (offline fallback)
 */
const getPlaceholderImage = (dishName: string, ingredients: string[]): string => {
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
 * Preload images for recipe
 */
export const preloadRecipeImages = async (
  dishName: string,
  ingredients: string[],
  steps: { description: string }[]
): Promise<void> => {
  // Preload main dish image
  generateDishImage({ dishName, ingredients });

  // Preload step images (staggered)
  steps.forEach((step, idx) => {
    setTimeout(() => {
      generateDishImage({
        dishName,
        ingredients,
        stepDescription: step.description
      });
    }, idx * 200);
  });
};

/**
 * Clear image cache
 */
export const clearImageCache = (): void => {
  imageCache.clear();
};
