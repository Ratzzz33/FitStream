// Local recipe database - no AI tokens needed
// Recipes with photos, ingredients, cooking info

export interface RecipeIngredient {
  name: string;
  amount: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  photo: string; // URL or base64
  description: string;
  ingredients: RecipeIngredient[];
  cookingTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  calories: number; // per serving
  servings: number;
  tags: string[]; // for search: 'salad', 'soup', 'quick', 'healthy', etc.
  steps: string[];
}

export interface RecipeMatch {
  recipe: Recipe;
  availableIngredients: string[];
  missingIngredients: string[];
  matchPercentage: number;
}

// Recipe database
export const recipes: Recipe[] = [
  {
    id: 'greek-salad',
    name: 'Греческий салат',
    emoji: '🥗',
    photo: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
    description: 'Классический средиземноморский салат с фетой и оливками',
    ingredients: [
      { name: 'помидоры', amount: '3 шт' },
      { name: 'огурцы', amount: '2 шт' },
      { name: 'перец болгарский', amount: '1 шт' },
      { name: 'лук красный', amount: '1 шт' },
      { name: 'фета', amount: '150 г' },
      { name: 'оливки', amount: '100 г' },
      { name: 'оливковое масло', amount: '3 ст.л.' },
      { name: 'орегано', amount: '1 ч.л.', optional: true },
    ],
    cookingTime: 15,
    difficulty: 'easy',
    calories: 280,
    servings: 2,
    tags: ['салат', 'греческий', 'овощи', 'быстрый', 'здоровый', 'вегетарианский'],
    steps: [
      'Нарежьте помидоры и огурцы крупными кубиками',
      'Нарежьте перец полосками, лук полукольцами',
      'Выложите овощи в салатник',
      'Добавьте оливки и кубики феты',
      'Заправьте оливковым маслом, посыпьте орегано',
    ],
  },
  {
    id: 'tuna-nicoise',
    name: 'Салат Нисуаз с тунцом',
    emoji: '🐟',
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    description: 'Французский салат с тунцом, яйцами и стручковой фасолью',
    ingredients: [
      { name: 'тунец консервированный', amount: '1 банка' },
      { name: 'яйца', amount: '2 шт' },
      { name: 'стручковая фасоль', amount: '150 г' },
      { name: 'помидоры черри', amount: '10 шт' },
      { name: 'оливки', amount: '50 г' },
      { name: 'салат латук', amount: '100 г' },
      { name: 'оливковое масло', amount: '2 ст.л.' },
      { name: 'лимонный сок', amount: '1 ст.л.' },
    ],
    cookingTime: 20,
    difficulty: 'easy',
    calories: 350,
    servings: 2,
    tags: ['салат', 'тунец', 'рыба', 'французский', 'белок', 'здоровый'],
    steps: [
      'Отварите яйца вкрутую, остудите и разрежьте пополам',
      'Отварите стручковую фасоль 5 минут, остудите',
      'Выложите салат латук на тарелку',
      'Добавьте тунец, яйца, фасоль, черри и оливки',
      'Заправьте маслом и лимонным соком',
    ],
  },
  {
    id: 'simple-tuna-salad',
    name: 'Простой салат с тунцом',
    emoji: '🥗',
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    description: 'Легкий салат с консервированным тунцом и овощами',
    ingredients: [
      { name: 'тунец консервированный', amount: '1 банка' },
      { name: 'огурцы', amount: '2 шт' },
      { name: 'помидоры', amount: '2 шт' },
      { name: 'лук красный', amount: '0.5 шт' },
      { name: 'оливковое масло', amount: '2 ст.л.' },
      { name: 'лимонный сок', amount: '1 ст.л.' },
      { name: 'зелень', amount: 'по вкусу', optional: true },
    ],
    cookingTime: 10,
    difficulty: 'easy',
    calories: 250,
    servings: 2,
    tags: ['салат', 'тунец', 'рыба', 'быстрый', 'простой', 'здоровый', 'белок'],
    steps: [
      'Слейте жидкость из банки с тунцом',
      'Нарежьте огурцы и помидоры кубиками',
      'Нарежьте лук тонкими полукольцами',
      'Смешайте все ингредиенты в салатнике',
      'Заправьте маслом и лимонным соком',
    ],
  },
  {
    id: 'caesar-salad',
    name: 'Салат Цезарь',
    emoji: '🥬',
    photo: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400',
    description: 'Классический Цезарь с курицей и пармезаном',
    ingredients: [
      { name: 'куриная грудка', amount: '200 г' },
      { name: 'салат ромэн', amount: '200 г' },
      { name: 'пармезан', amount: '50 г' },
      { name: 'сухарики', amount: '50 г' },
      { name: 'чеснок', amount: '2 зубчика' },
      { name: 'оливковое масло', amount: '3 ст.л.' },
      { name: 'лимонный сок', amount: '1 ст.л.' },
      { name: 'яйцо', amount: '1 шт', optional: true },
    ],
    cookingTime: 25,
    difficulty: 'medium',
    calories: 420,
    servings: 2,
    tags: ['салат', 'цезарь', 'курица', 'классический'],
    steps: [
      'Обжарьте куриную грудку до готовности, нарежьте',
      'Порвите салат руками в миску',
      'Приготовьте заправку: масло, чеснок, лимонный сок',
      'Добавьте курицу, сухарики, полейте заправкой',
      'Посыпьте тёртым пармезаном',
    ],
  },
  {
    id: 'tomato-soup',
    name: 'Томатный суп',
    emoji: '🍅',
    photo: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    description: 'Кремовый томатный суп с базиликом',
    ingredients: [
      { name: 'помидоры', amount: '500 г' },
      { name: 'лук', amount: '1 шт' },
      { name: 'чеснок', amount: '2 зубчика' },
      { name: 'сливки', amount: '100 мл' },
      { name: 'базилик', amount: 'пучок' },
      { name: 'оливковое масло', amount: '2 ст.л.' },
      { name: 'соль', amount: 'по вкусу' },
    ],
    cookingTime: 30,
    difficulty: 'easy',
    calories: 180,
    servings: 4,
    tags: ['суп', 'томатный', 'кремовый', 'вегетарианский', 'тёплый'],
    steps: [
      'Обжарьте лук и чеснок на масле',
      'Добавьте нарезанные помидоры, тушите 15 минут',
      'Пюрируйте блендером до однородности',
      'Добавьте сливки, прогрейте',
      'Украсьте свежим базиликом',
    ],
  },
  {
    id: 'chicken-stir-fry',
    name: 'Курица с овощами',
    emoji: '🍗',
    photo: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    description: 'Быстрая курица с овощами по-азиатски',
    ingredients: [
      { name: 'куриная грудка', amount: '300 г' },
      { name: 'перец болгарский', amount: '2 шт' },
      { name: 'брокколи', amount: '200 г' },
      { name: 'морковь', amount: '1 шт' },
      { name: 'соевый соус', amount: '3 ст.л.' },
      { name: 'имбирь', amount: '1 ч.л.' },
      { name: 'чеснок', amount: '2 зубчика' },
      { name: 'растительное масло', amount: '2 ст.л.' },
    ],
    cookingTime: 20,
    difficulty: 'easy',
    calories: 320,
    servings: 2,
    tags: ['курица', 'азиатский', 'быстрый', 'овощи', 'белок'],
    steps: [
      'Нарежьте курицу полосками, обжарьте на сильном огне',
      'Добавьте нарезанные овощи',
      'Добавьте имбирь и чеснок',
      'Влейте соевый соус, перемешайте',
      'Готовьте ещё 5 минут до готовности овощей',
    ],
  },
  {
    id: 'chicken-pasta',
    name: 'Паста с курицей и сливками',
    emoji: '🍝',
    photo: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    description: 'Сливочная паста с нежной куриной грудкой',
    ingredients: [
      { name: 'пенне', amount: '200 г' },
      { name: 'куриная грудка', amount: '250 г' },
      { name: 'сливки', amount: '200 мл' },
      { name: 'чеснок', amount: '2 зубчика' },
      { name: 'пармезан', amount: '50 г' },
      { name: 'оливковое масло', amount: '2 ст.л.' },
      { name: 'базилик', amount: 'по вкусу', optional: true },
    ],
    cookingTime: 25,
    difficulty: 'easy',
    calories: 520,
    servings: 2,
    tags: ['паста', 'курица', 'сливочный', 'итальянский', 'ужин'],
    steps: [
      'Отварите пасту до состояния аль денте',
      'Нарежьте курицу кубиками и обжарьте до золотистого цвета',
      'Добавьте чеснок, жарьте 1 минуту',
      'Влейте сливки, тушите 5 минут',
      'Добавьте пасту, перемешайте, посыпьте пармезаном',
    ],
  },
  {
    id: 'pasta-carbonara',
    name: 'Паста Карбонара',
    emoji: '🍝',
    photo: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    description: 'Классическая итальянская паста с беконом и яйцом',
    ingredients: [
      { name: 'спагетти', amount: '200 г' },
      { name: 'бекон', amount: '150 г' },
      { name: 'яйца', amount: '2 шт' },
      { name: 'пармезан', amount: '50 г' },
      { name: 'чеснок', amount: '2 зубчика' },
      { name: 'чёрный перец', amount: 'по вкусу' },
    ],
    cookingTime: 25,
    difficulty: 'medium',
    calories: 550,
    servings: 2,
    tags: ['паста', 'итальянский', 'карбонара', 'бекон'],
    steps: [
      'Отварите пасту до состояния аль денте',
      'Обжарьте бекон с чесноком',
      'Смешайте яйца с тёртым пармезаном',
      'Добавьте горячую пасту к бекону',
      'Снимите с огня, влейте яичную смесь, быстро перемешайте',
    ],
  },
  {
    id: 'omelette',
    name: 'Омлет с овощами',
    emoji: '🍳',
    photo: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400',
    description: 'Пышный омлет с помидорами и зеленью',
    ingredients: [
      { name: 'яйца', amount: '3 шт' },
      { name: 'молоко', amount: '50 мл' },
      { name: 'помидоры', amount: '1 шт' },
      { name: 'сыр', amount: '50 г' },
      { name: 'зелень', amount: 'по вкусу' },
      { name: 'сливочное масло', amount: '20 г' },
    ],
    cookingTime: 10,
    difficulty: 'easy',
    calories: 280,
    servings: 1,
    tags: ['завтрак', 'яйца', 'быстрый', 'омлет', 'вегетарианский'],
    steps: [
      'Взбейте яйца с молоком',
      'Растопите масло на сковороде',
      'Вылейте яичную смесь',
      'Когда низ схватится, добавьте помидоры и сыр',
      'Сложите пополам, посыпьте зеленью',
    ],
  },
  {
    id: 'smoothie-bowl',
    name: 'Смузи-боул',
    emoji: '🫐',
    photo: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400',
    description: 'Ягодный смузи-боул с гранолой',
    ingredients: [
      { name: 'банан', amount: '1 шт' },
      { name: 'ягоды замороженные', amount: '150 г' },
      { name: 'йогурт', amount: '100 г' },
      { name: 'гранола', amount: '30 г' },
      { name: 'мёд', amount: '1 ст.л.', optional: true },
    ],
    cookingTime: 5,
    difficulty: 'easy',
    calories: 320,
    servings: 1,
    tags: ['завтрак', 'смузи', 'ягоды', 'быстрый', 'здоровый'],
    steps: [
      'Измельчите банан и ягоды в блендере',
      'Добавьте йогурт, взбейте до однородности',
      'Перелейте в миску',
      'Украсьте гранолой и свежими ягодами',
    ],
  },
  {
    id: 'avocado-toast',
    name: 'Тост с авокадо',
    emoji: '🥑',
    photo: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400',
    description: 'Хрустящий тост с авокадо и яйцом пашот',
    ingredients: [
      { name: 'хлеб', amount: '2 ломтика' },
      { name: 'авокадо', amount: '1 шт' },
      { name: 'яйца', amount: '2 шт' },
      { name: 'лимонный сок', amount: '1 ч.л.' },
      { name: 'соль', amount: 'по вкусу' },
      { name: 'перец чили', amount: 'щепотка', optional: true },
    ],
    cookingTime: 15,
    difficulty: 'medium',
    calories: 380,
    servings: 1,
    tags: ['завтрак', 'авокадо', 'тост', 'здоровый', 'модный'],
    steps: [
      'Поджарьте хлеб до хруста',
      'Разомните авокадо с лимонным соком и солью',
      'Приготовьте яйца пашот',
      'Намажьте авокадо на тосты',
      'Положите сверху яйца пашот, посыпьте перцем',
    ],
  },
  {
    id: 'fried-rice',
    name: 'Жареный рис с овощами',
    emoji: '🍚',
    photo: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    description: 'Азиатский жареный рис с яйцом и овощами',
    ingredients: [
      { name: 'рис', amount: '200 г' },
      { name: 'яйца', amount: '2 шт' },
      { name: 'морковь', amount: '1 шт' },
      { name: 'горошек', amount: '100 г' },
      { name: 'соевый соус', amount: '2 ст.л.' },
      { name: 'зелёный лук', amount: '2-3 пера' },
      { name: 'растительное масло', amount: '2 ст.л.' },
    ],
    cookingTime: 20,
    difficulty: 'easy',
    calories: 380,
    servings: 2,
    tags: ['рис', 'азиатский', 'быстрый', 'гарнир'],
    steps: [
      'Отварите рис заранее, остудите',
      'Обжарьте яйца, разбейте на кусочки',
      'Обжарьте морковь и горошек',
      'Добавьте рис, обжаривайте на сильном огне',
      'Влейте соевый соус, добавьте лук',
    ],
  },
];

// Normalize ingredient name for matching
const normalizeIngredient = (name: string): string => {
  return name.toLowerCase()
    .replace(/ы$|и$|а$|я$|о$|е$|ь$/g, '') // remove common endings
    .replace(/консервированн|свеж|заморожен|варён|жарен/g, '') // remove modifiers
    .trim();
};

// Check if inventory item matches recipe ingredient
const ingredientMatches = (inventoryItem: string, recipeIngredient: string): boolean => {
  const invNorm = normalizeIngredient(inventoryItem);
  const recNorm = normalizeIngredient(recipeIngredient);

  return invNorm.includes(recNorm) || recNorm.includes(invNorm) ||
         invNorm === recNorm;
};

// Simple Russian stemming - remove common endings for search
const stemRussian = (word: string): string => {
  return word
    .replace(/ом$|ем$|ой$|ей$|ам$|ям$|ами$|ями$|ах$|ях$/, '') // Instrumental, dative, prepositional
    .replace(/ого$|его$|ому$|ему$/, '') // Adjective endings
    .replace(/а$|я$|у$|ю$|е$|и$|ы$|о$|ь$/, ''); // Basic endings
};

// Check if query word matches target word (with stemming)
const wordMatches = (queryWord: string, targetWord: string): boolean => {
  const qStem = stemRussian(queryWord);
  const tStem = stemRussian(targetWord);

  // Direct substring match
  if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) return true;

  // Stem match (min 3 chars to avoid false positives)
  if (qStem.length >= 3 && tStem.length >= 3) {
    if (tStem.includes(qStem) || qStem.includes(tStem)) return true;
  }

  return false;
};

// Find recipes matching search query with scoring
export const searchRecipes = (query: string): Recipe[] => {
  const queryLower = query.toLowerCase();
  // Filter out short words like "с", "и", "в", "из", etc.
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  if (queryWords.length === 0) {
    // If only short words, try full query match
    return recipes.filter(r => r.name.toLowerCase().includes(queryLower));
  }

  // Score-based matching with ALL-WORDS requirement for multi-word queries
  const scored = recipes.map(recipe => {
    let score = 0;
    let matchedWords = 0;
    const nameLower = recipe.name.toLowerCase();
    const nameWords = nameLower.split(/\s+/);
    const descLower = recipe.description.toLowerCase();

    // Collect all searchable text for the recipe
    const allText = [
      nameLower,
      descLower,
      ...recipe.tags,
      ...recipe.ingredients.map(ing => ing.name.toLowerCase())
    ].join(' ');

    // Exact full query in name (highest priority)
    if (nameLower.includes(queryLower)) {
      score += 100;
    }

    // Each query word matching - track how many words match
    for (const qWord of queryWords) {
      let wordFound = false;

      // Match in name words (highest score)
      if (nameWords.some(nw => wordMatches(qWord, nw))) {
        score += 50;
        wordFound = true;
      }

      // Match in tags
      if (recipe.tags.some(tag => wordMatches(qWord, tag))) {
        score += 30;
        wordFound = true;
      }

      // Match in ingredients
      if (recipe.ingredients.some(ing => wordMatches(qWord, ing.name.toLowerCase()))) {
        score += 20;
        wordFound = true;
      }

      // Match in description
      if (descLower.includes(qWord) || wordMatches(qWord, descLower)) {
        score += 10;
        wordFound = true;
      }

      if (wordFound) {
        matchedWords++;
      }
    }

    // CRITICAL: For multi-word queries, penalize recipes that don't match ALL words
    // If searching "салат тунец" - both words MUST appear somewhere
    if (queryWords.length > 1) {
      if (matchedWords < queryWords.length) {
        // Not all words matched - heavily penalize or exclude
        score = Math.floor(score * (matchedWords / queryWords.length) * 0.3);
      } else {
        // All words matched - bonus!
        score += 50 * queryWords.length;
      }
    }

    return { recipe, score, matchedWords };
  });

  // Return recipes sorted by score, filter out very low scores
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => {
      // First sort by matched words count (more = better)
      if (a.matchedWords !== b.matchedWords) {
        return b.matchedWords - a.matchedWords;
      }
      // Then by score
      return b.score - a.score;
    })
    .map(s => s.recipe);
};

// Match recipes with available inventory
export const matchRecipesWithInventory = (
  availableProducts: string[],
  recipesToMatch: Recipe[] = recipes
): RecipeMatch[] => {
  const matches: RecipeMatch[] = [];

  for (const recipe of recipesToMatch) {
    const requiredIngredients = recipe.ingredients.filter(ing => !ing.optional);
    const available: string[] = [];
    const missing: string[] = [];

    for (const ingredient of requiredIngredients) {
      const found = availableProducts.some(prod =>
        ingredientMatches(prod, ingredient.name)
      );

      if (found) {
        available.push(ingredient.name);
      } else {
        missing.push(ingredient.name);
      }
    }

    const matchPercentage = requiredIngredients.length > 0
      ? Math.round((available.length / requiredIngredients.length) * 100)
      : 0;

    matches.push({
      recipe,
      availableIngredients: available,
      missingIngredients: missing,
      matchPercentage,
    });
  }

  // Sort by match percentage (highest first)
  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
};

// Get random recipe for "Surprise me" - prioritizes recipes with available ingredients
export const getSurpriseRecipe = (availableProducts: string[]): RecipeMatch | null => {
  const matches = matchRecipesWithInventory(availableProducts);

  // Filter to recipes with at least 50% available ingredients
  const goodMatches = matches.filter(m => m.matchPercentage >= 50);

  if (goodMatches.length > 0) {
    // Random from good matches
    return goodMatches[Math.floor(Math.random() * goodMatches.length)];
  }

  // If no good matches, return random from all
  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)];
  }

  return null;
};

// Get recipe by ID
export const getRecipeById = (id: string): Recipe | undefined => {
  return recipes.find(r => r.id === id);
};

export default {
  recipes,
  searchRecipes,
  matchRecipesWithInventory,
  getSurpriseRecipe,
  getRecipeById,
};
