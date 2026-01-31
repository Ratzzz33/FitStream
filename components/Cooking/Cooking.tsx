import React, { useState, useEffect } from 'react';
import { RefreshCw, Flame, ChefHat, AlertTriangle, Camera, PenLine, Store, WifiOff } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { generateRecipes, GeneratedRecipe, RecipeGenerationContext, TodayMealContext } from '../../services/geminiService';
import { generateDishImage } from '../../services/nanaBananaService';
import { findMatchingRecipes, convertToGeneratedRecipe } from '../../data/offlineRecipes';
import { RecipeCarousel } from './RecipeCarousel';
import { RecipeCardExpanded } from './RecipeCardExpanded';
import { CookingMode } from './CookingMode';

// Custom Fridge Icon
const FridgeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="15" y1="5" x2="15" y2="7" />
    <line x1="15" y1="12" x2="15" y2="16" />
  </svg>
);

// Skeleton card with shimmer effect (AI generation style)
const RecipeSkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 p-4"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Shimmer overlay */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />

    <div className="flex gap-4">
      {/* Image placeholder */}
      <div className="w-24 h-24 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <ChefHat className="w-8 h-8 text-gray-300 dark:text-gray-600 animate-pulse" />
      </div>

      {/* Content placeholder */}
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>

    {/* Generating text */}
    <div className="mt-3 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      <span>AI генерирует рецепт...</span>
    </div>
  </div>
);

interface CookingProps {
  caloriesRemaining: number;
  servingsNeeded?: number;
  onCaloriesLogged?: (calories: number) => void;
  onOpenKitchenCamera?: () => void;
  onOpenManualAdd?: () => void;
  onOpenShopping?: () => void;
}

type ViewState = 'loading' | 'menu' | 'expanded' | 'cooking' | 'error';

const MAX_RECIPES = 3; // Total recipe slots to show

export const Cooking: React.FC<CookingProps> = ({
  caloriesRemaining,
  servingsNeeded = 2,
  onCaloriesLogged,
  onOpenKitchenCamera,
  onOpenManualAdd,
  onOpenShopping
}) => {
  const [state, setState] = useState<ViewState>('loading');
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | undefined>();
  const [recipeImages, setRecipeImages] = useState<Record<number, string>>({});
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');
  const [generatingSlots, setGeneratingSlots] = useState<number[]>([]); // Slots being AI-generated
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  // Determine time of day for meal type
  const getTimeOfDay = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'snack';
    return 'dinner';
  };

  const getCurrentTime = (): string => {
    return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getMealEmoji = () => {
    const timeOfDay = getTimeOfDay();
    switch (timeOfDay) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'snack': return '🍪';
      case 'dinner': return '🌙';
    }
  };

  const getMealName = () => {
    const timeOfDay = getTimeOfDay();
    switch (timeOfDay) {
      case 'breakfast': return 'Завтрак';
      case 'lunch': return 'Обед';
      case 'snack': return 'Перекус';
      case 'dinner': return 'Ужин';
    }
  };

  // Get today's meals for context
  const getTodayMealsContext = (): { meals: TodayMealContext[], macros: { protein: number, carbs: number, fat: number } } => {
    const today = new Date().toISOString().split('T')[0];
    const nutritionLogs = StorageService.getNutritionLogs();
    const todayLogs = nutritionLogs.filter(log => log.date === today && log.type === 'FOOD');

    const meals: TodayMealContext[] = todayLogs.map(log => ({
      time: new Date(log.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      name: log.name,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat
    }));

    const macros = todayLogs.reduce((acc, log) => ({
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0)
    }), { protein: 0, carbs: 0, fat: 0 });

    return { meals, macros };
  };

  // Cache key for recipes
  const getCacheKey = () => {
    const today = new Date().toISOString().split('T')[0];
    const timeOfDay = getTimeOfDay();
    return `fitstream_recipes_${today}_${timeOfDay}`;
  };

  // Load cached recipes
  const loadCachedRecipes = (): GeneratedRecipe[] | null => {
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) {
        const { recipes, timestamp } = JSON.parse(cached);
        // Cache valid for 2 hours
        if (Date.now() - timestamp < 2 * 60 * 60 * 1000) {
          return recipes;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached recipes:', e);
    }
    return null;
  };

  // Save recipes to cache
  const cacheRecipes = (recipes: GeneratedRecipe[]) => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify({
        recipes,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to cache recipes:', e);
    }
  };

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  // Generate image for a recipe (parallel)
  const generateImageForRecipe = async (recipe: GeneratedRecipe, index: number) => {
    setLoadingImages(prev => new Set(prev).add(index));

    try {
      const image = await generateDishImage({
        dishName: recipe.name,
        ingredients: recipe.ingredients.map(i => i.name)
      });
      setRecipeImages(prev => ({ ...prev, [index]: image.url }));
    } catch (err) {
      console.error(`Error generating image for recipe ${index}:`, err);
    } finally {
      setLoadingImages(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const loadRecipes = async (forceRefresh = false) => {
    setError('');
    setSelectedRecipeIndex(undefined);
    setIsOfflineMode(false);
    setMissingIngredients([]);
    setGeneratingSlots([]);
    setIsGeneratingMore(false);

    // Check inventory
    const inventory = StorageService.getInventory().filter(i => !i.depleted && i.quantity > 0);
    if (inventory.length === 0) {
      setError('Добавьте продукты в Кухню, чтобы получить рекомендации рецептов.');
      setState('error');
      return;
    }

    // 1. Check cache first (instant load)
    if (!forceRefresh) {
      const cached = loadCachedRecipes();
      if (cached && cached.length > 0) {
        setRecipes(cached);
        setRecipeImages({});
        setState('menu');
        // Generate images in background
        cached.forEach((recipe, index) => {
          generateImageForRecipe(recipe, index);
        });
        return;
      }
    }

    const ingredientNames = inventory.map(i => i.name);
    const mealType = getTimeOfDay();

    // 2. Load offline recipes FIRST (fast)
    const offlineMatches = findMatchingRecipes(ingredientNames, mealType, 2);
    let offlineRecipes: GeneratedRecipe[] = [];

    if (offlineMatches.length > 0) {
      // Collect missing ingredients
      const allMissing = new Set<string>();
      offlineMatches.slice(0, MAX_RECIPES).forEach(m => m.missing.forEach(i => allMissing.add(i)));
      setMissingIngredients(Array.from(allMissing));

      offlineRecipes = offlineMatches
        .slice(0, MAX_RECIPES)
        .map(match => convertToGeneratedRecipe(match.recipe, ingredientNames));
    }

    // Show offline recipes immediately
    if (offlineRecipes.length > 0) {
      setRecipes(offlineRecipes);
      setRecipeImages({});
      setState('menu');

      // If we have less than MAX_RECIPES, show generating slots
      if (offlineRecipes.length < MAX_RECIPES) {
        const slotsToGenerate = Array.from(
          { length: MAX_RECIPES - offlineRecipes.length },
          (_, i) => offlineRecipes.length + i
        );
        setGeneratingSlots(slotsToGenerate);
        setIsGeneratingMore(true);
      }
    } else {
      // No offline recipes - show loading with generating effect
      setState('loading');
      setGeneratingSlots([0, 1, 2]);
    }

    // 3. Generate AI recipes in background (for empty slots)
    try {
      const { meals, macros } = getTodayMealsContext();
      const context: RecipeGenerationContext = {
        timeOfDay: mealType,
        currentTime: getCurrentTime(),
        caloriesRemaining,
        servingsNeeded,
        maxCookingTime: 45,
        excludeRecipeIds: [
          ...StorageService.getRecentRecipeIds(3),
          ...offlineRecipes.map(r => r.id || r.name) // Exclude already shown
        ],
        todayMeals: meals.length > 0 ? meals : undefined,
        todayMacros: (macros.protein > 0 || macros.carbs > 0 || macros.fat > 0) ? macros : undefined
      };

      const aiRecipes = await generateRecipes(inventory, context);

      // Merge: keep offline recipes, add AI recipes to fill slots
      const slotsNeeded = MAX_RECIPES - offlineRecipes.length;
      const newAiRecipes = aiRecipes.slice(0, slotsNeeded);

      const finalRecipes = [...offlineRecipes, ...newAiRecipes];

      setRecipes(finalRecipes);
      setGeneratingSlots([]);
      setIsGeneratingMore(false);
      setState('menu');

      // Cache the result
      cacheRecipes(finalRecipes);

      // Generate images for new AI recipes
      newAiRecipes.forEach((recipe, index) => {
        generateImageForRecipe(recipe, offlineRecipes.length + index);
      });

    } catch (aiError) {
      console.warn('AI recipes failed:', aiError);
      setGeneratingSlots([]);
      setIsGeneratingMore(false);

      // If we have offline recipes, that's fine
      if (offlineRecipes.length > 0) {
        setIsOfflineMode(true);
        cacheRecipes(offlineRecipes);
      } else {
        setError('Не удалось подобрать рецепты. Проверьте подключение к интернету.');
        setState('error');
      }
    }
  };

  const handleSelectRecipe = (index: number) => {
    setSelectedRecipeIndex(index);
    setState('expanded');
  };

  const handleCloseExpanded = () => {
    setState('menu');
  };

  const handleStartCooking = () => {
    if (selectedRecipeIndex !== undefined) {
      setState('cooking');
    }
  };

  const handleCookingComplete = (caloriesEaten: number) => {
    onCaloriesLogged?.(caloriesEaten);
    setSelectedRecipeIndex(undefined);
    setState('menu');
    loadRecipes(); // Refresh recommendations
  };

  const handleCookingCancel = () => {
    setSelectedRecipeIndex(undefined);
    setState('menu');
  };

  const selectedRecipe = selectedRecipeIndex !== undefined ? recipes[selectedRecipeIndex] : null;
  const { meals: todayMeals } = getTodayMealsContext();

  return (
    <div className="flex flex-col h-full">
      {/* Loading state - shows skeleton cards */}
      {state === 'loading' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getMealEmoji()}</span>
              <h2 className="text-xl font-bold dark:text-white">{getMealName()}</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Подбираем рецепты...
            </p>
          </div>

          {/* Skeleton recipe cards */}
          <div className="flex-1 px-4 space-y-4">
            {[0, 1, 2].map((idx) => (
              <RecipeSkeletonCard key={idx} delay={idx * 150} />
            ))}
          </div>
        </div>
      )}

      {/* Error state - empty kitchen */}
      {state === 'error' && error.includes('Добавьте продукты') && (
        <div className="flex-1 flex flex-col p-6">
          {/* Friendly empty state */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <FridgeIcon className="w-10 h-10 text-orange-300 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">
              Кухня пуста
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Добавьте продукты, чтобы получить персональные рецепты
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 max-w-sm mx-auto w-full">
            {onOpenKitchenCamera && (
              <button
                onClick={onOpenKitchenCamera}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                <Camera className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Сфотографировать кухню</div>
                  <div className="text-xs text-blue-200">AI распознает продукты автоматически</div>
                </div>
              </button>
            )}

            {onOpenManualAdd && (
              <button
                onClick={onOpenManualAdd}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <PenLine className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                <div className="text-left">
                  <div className="font-semibold dark:text-white">Добавить вручную</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Если знаете что есть дома</div>
                </div>
              </button>
            )}

            {onOpenShopping && (
              <button
                onClick={onOpenShopping}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Store className="w-6 h-6 text-green-500" />
                <div className="text-left">
                  <div className="font-semibold dark:text-white">В магазин</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Составить список покупок</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error state - other errors */}
      {state === 'error' && !error.includes('Добавьте продукты') && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
          <button
            onClick={loadRecipes}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </button>
        </div>
      )}

      {/* Menu state - Restaurant-style carousel */}
      {state === 'menu' && recipes.length > 0 && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMealEmoji()}</span>
                <h2 className="text-xl font-bold dark:text-white">{getMealName()}</h2>
              </div>
              <button
                onClick={loadRecipes}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Выберите блюдо • {recipes.length} варианта
            </p>
          </div>

          {/* Offline mode indicator */}
          {isOfflineMode && (
            <div className="px-4 mb-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Офлайн-рецепты
                  </p>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Показаны рецепты из встроенной базы
                </p>
              </div>
            </div>
          )}

          {/* Missing ingredients */}
          {missingIngredients.length > 0 && onOpenShopping && (
            <div className="px-4 mb-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                <p className="text-xs text-orange-700 dark:text-orange-300 font-medium mb-2">
                  🛒 Не хватает базовых продуктов:
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {missingIngredients.slice(0, 5).map((ing, idx) => (
                    <span key={idx} className="text-xs bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">
                      {ing}
                    </span>
                  ))}
                  {missingIngredients.length > 5 && (
                    <span className="text-xs text-orange-500">+{missingIngredients.length - 5}</span>
                  )}
                </div>
                <button
                  onClick={onOpenShopping}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Store className="w-4 h-4" />
                  В магазин за продуктами
                </button>
              </div>
            </div>
          )}

          {/* Today's context */}
          {todayMeals.length > 0 && (
            <div className="px-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                  📊 Сегодня вы уже ели:
                </p>
                <div className="flex flex-wrap gap-2">
                  {todayMeals.slice(-3).map((meal, idx) => (
                    <span key={idx} className="text-xs text-blue-600 dark:text-blue-400">
                      {meal.time} {meal.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recipe carousel */}
          <div className="flex-1 px-4">
            <RecipeCarousel
              recipes={recipes}
              images={recipeImages}
              loadingImages={loadingImages}
              onSelectRecipe={handleSelectRecipe}
              selectedIndex={selectedRecipeIndex}
            />
          </div>

          {/* Calories remaining */}
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
            Осталось на сегодня: <span className="font-medium">{caloriesRemaining} ккал</span>
          </div>
        </div>
      )}

      {/* Expanded recipe view */}
      {state === 'expanded' && selectedRecipe && (
        <RecipeCardExpanded
          recipe={selectedRecipe}
          imageUrl={selectedRecipeIndex !== undefined ? recipeImages[selectedRecipeIndex] : undefined}
          onClose={handleCloseExpanded}
          onStartCooking={handleStartCooking}
          onChooseAnother={handleCloseExpanded}
        />
      )}

      {/* Cooking mode */}
      {state === 'cooking' && selectedRecipe && (
        <CookingMode
          recipe={selectedRecipe}
          onComplete={handleCookingComplete}
          onCancel={handleCookingCancel}
        />
      )}
    </div>
  );
};

export default Cooking;
