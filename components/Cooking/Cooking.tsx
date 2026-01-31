import React, { useState, useEffect } from 'react';
import { RefreshCw, Flame, ChefHat, AlertTriangle, Database, Sparkles, X, Camera, PenLine, Store } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { generateRecipes, GeneratedRecipe, RecipeGenerationContext, TodayMealContext } from '../../services/geminiService';
import { generateDishImage } from '../../services/nanaBananaService';
import { matchRecipesByIngredients, saveGeneratedRecipe, getRecipeStats, RecipeWithMatch } from '../../services/recipeService';
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

// Toast component for new recipes notification
const NewRecipesToast: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => (
  <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl shadow-lg p-4 flex items-center gap-3">
      <span className="text-3xl">🆕</span>
      <div className="flex-1">
        <p className="font-bold">Новые рецепты!</p>
        <p className="text-sm opacity-90">
          Добавлено {count} {count === 1 ? 'рецепт' : count < 5 ? 'рецепта' : 'рецептов'} с прошлого обновления
        </p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const LAST_RECIPE_CHECK_KEY = 'fitstream_last_recipe_check';
interface CookingProps {
  caloriesRemaining: number;
  servingsNeeded?: number;
  onCaloriesLogged?: (calories: number) => void;
  onOpenKitchenCamera?: () => void;
  onOpenManualAdd?: () => void;
  onOpenShopping?: () => void;
}

type ViewState = 'loading' | 'menu' | 'expanded' | 'cooking' | 'error';

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
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');
  const [newRecipesCount, setNewRecipesCount] = useState<number>(0);

  // Check for new recipes on mount
  useEffect(() => {
    checkForNewRecipes();
  }, []);

  const checkForNewRecipes = async () => {
    try {
      const lastCheck = localStorage.getItem(LAST_RECIPE_CHECK_KEY);
      const stats = await getRecipeStats(lastCheck || undefined);

      if (lastCheck && stats.newSince > 0) {
        setNewRecipesCount(stats.newSince);
        // Auto-hide after 5 seconds
        setTimeout(() => setNewRecipesCount(0), 5000);
      }

      // Update last check time
      localStorage.setItem(LAST_RECIPE_CHECK_KEY, new Date().toISOString());
    } catch (err) {
      console.warn('Failed to check for new recipes:', err);
    }
  };

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

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  // Generate image for a recipe (parallel) and save to DB if AI-generated
  const generateImageForRecipe = async (recipe: GeneratedRecipe, index: number) => {
    setLoadingImages(prev => new Set(prev).add(index));

    try {
      const image = await generateDishImage({
        dishName: recipe.name,
        ingredients: recipe.ingredients.map(i => i.name)
      });
      setRecipeImages(prev => ({ ...prev, [index]: image.url }));

      // If this is NOT a DB recipe, save image to DB
      const recipeAny = recipe as any;
      if (!recipeAny._fromDb && image.url) {
        saveGeneratedRecipe(recipe, image.url, StorageService.getUserId())
          .then(result => {
            console.log(`🖼️ Saved recipe "${recipe.name}" with image to DB`);
          })
          .catch(err => console.warn('Failed to save recipe with image:', err));
      }
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

  // Convert DB recipe to GeneratedRecipe format
  const convertDbRecipe = (dbRecipe: RecipeWithMatch): GeneratedRecipe => {
    const instructions = (dbRecipe.instructions_ru || dbRecipe.instructions || '').split('\n').filter(Boolean);

    return {
      name: dbRecipe.name_ru || dbRecipe.name_en || 'Рецепт',
      description: dbRecipe.tips_ru || dbRecipe.tips || '',
      servings: dbRecipe.servings || 2,
      totalTimeMinutes: dbRecipe.cooking_time || 30,
      caloriesPerServing: dbRecipe.calories || 300,
      proteinPerServing: dbRecipe.protein || 15,
      carbsPerServing: dbRecipe.carbs || 30,
      fatPerServing: dbRecipe.fat || 10,
      difficulty: (dbRecipe.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      difficultyReason: dbRecipe.difficulty === 'easy' ? 'Просто' : dbRecipe.difficulty === 'hard' ? 'Сложно' : 'Средне',
      nutritionNote: dbRecipe.is_healthy ? '🥗 Полезный рецепт' : '',
      equipment: [],
      messyLevel: 1,
      messyWarning: '',
      ingredients: (dbRecipe.ingredients || []).map(ing => ({
        name: ing.name_ru || ing.name || '',
        amount: (ing.amount || '').split(' ')[0] || '',
        unit: (ing.amount || '').split(' ').slice(1).join(' ') || '',
        emoji: '🥘',
        isOptional: false,
        inInventory: true,
        inventoryAmount: ''
      })),
      steps: instructions.map((inst, i) => ({
        stepNumber: i + 1,
        instruction: inst.replace(/^\d+\.\s*/, ''),
        durationMinutes: Math.ceil((dbRecipe.cooking_time || 30) / Math.max(instructions.length, 1)),
        heatLevel: 2
      })),
      cookingTips: dbRecipe.tips_ru ? [dbRecipe.tips_ru] : [],
      // Mark as from DB for UI distinction
      _fromDb: true,
      _dbId: dbRecipe.id,
      _imageUrl: dbRecipe.image_url,
      _matchPercentage: dbRecipe.matchPercentage,
      _missingIngredients: dbRecipe.missingIngredients
    } as GeneratedRecipe & { _fromDb?: boolean; _dbId?: number; _matchPercentage?: number; _missingIngredients?: string[] };
  };

  const loadRecipes = async () => {
    setState('loading');
    setError('');
    setRecipeImages({});
    setSelectedRecipeIndex(undefined);

    try {
      const inventory = StorageService.getInventory().filter(i => !i.depleted && i.quantity > 0);

      if (inventory.length === 0) {
        setError('Добавьте продукты в Кухню, чтобы получить рекомендации рецептов.');
        setState('error');
        return;
      }

      const ingredientNames = inventory.map(i => i.name);
      const { meals, macros } = getTodayMealsContext();
      let allRecipes: GeneratedRecipe[] = [];

      // Step 1: Try to get recipes from database first
      console.log('🔍 Searching recipes in database...');
      try {
        const dbRecipes = await matchRecipesByIngredients(ingredientNames, {
          maxMissing: 3,
          limit: 10
        });

        if (dbRecipes.length > 0) {
          console.log(`📚 Found ${dbRecipes.length} recipes in DB`);
          allRecipes = dbRecipes.map(convertDbRecipe);
        }
      } catch (dbErr) {
        console.warn('⚠️ DB search failed, will try AI:', dbErr);
      }

      // Step 2: If DB has < 3 recipes, generate more with AI
      const MIN_RECIPES = 3;
      if (allRecipes.length < MIN_RECIPES) {
        console.log(`🤖 Need more recipes (have ${allRecipes.length}), calling AI...`);

        try {
          const context: RecipeGenerationContext = {
            timeOfDay: getTimeOfDay(),
            currentTime: getCurrentTime(),
            caloriesRemaining,
            servingsNeeded,
            maxCookingTime: 45,
            excludeRecipeIds: StorageService.getRecentRecipeIds(3),
            todayMeals: meals.length > 0 ? meals : undefined,
            todayMacros: (macros.protein > 0 || macros.carbs > 0 || macros.fat > 0) ? macros : undefined
          };

          const aiRecipes = await generateRecipes(inventory, context);
          console.log(`✨ AI generated ${aiRecipes.length} recipes`);

          // Note: AI recipes will be saved to DB when their images are generated
          // (in generateImageForRecipe function)

          // Combine DB + AI recipes, avoiding duplicates
          const existingNames = new Set(allRecipes.map(r => r.name.toLowerCase()));
          for (const aiRecipe of aiRecipes) {
            if (!existingNames.has(aiRecipe.name.toLowerCase())) {
              allRecipes.push(aiRecipe);
            }
          }
        } catch (aiErr) {
          console.warn('⚠️ AI generation failed:', aiErr);
          // If AI fails but we have some DB recipes, continue with those
        }
      }

      // Final check
      if (allRecipes.length === 0) {
        setError('Не удалось подобрать рецепты. Проверьте подключение к интернету и попробуйте снова.');
        setState('error');
        return;
      }

      // Sort: DB recipes with high match first, then AI
      allRecipes.sort((a, b) => {
        const aMatch = (a as any)._matchPercentage || 0;
        const bMatch = (b as any)._matchPercentage || 0;
        return bMatch - aMatch;
      });

      // Take top 4 recipes
      setRecipes(allRecipes.slice(0, 4));
      setState('menu');

      // Generate images for ALL recipes in parallel
      allRecipes.slice(0, 4).forEach((recipe, index) => {
        // Use DB image if available
        const dbRecipe = recipe as any;
        if (dbRecipe._fromDb && dbRecipe._imageUrl) {
          setRecipeImages(prev => ({ ...prev, [index]: dbRecipe._imageUrl }));
        } else {
          generateImageForRecipe(recipe, index);
        }
      });

    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Не удалось загрузить рецепты. Проверьте подключение к интернету.');
      setState('error');
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
      {/* New recipes toast */}
      {newRecipesCount > 0 && (
        <NewRecipesToast count={newRecipesCount} onClose={() => setNewRecipesCount(0)} />
      )}

      {/* Loading state */}
      {state === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="relative">
            <ChefHat className="w-16 h-16 text-orange-500 animate-bounce" />
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
            Подбираем меню для вас...
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {getMealEmoji()} {getMealName()} • {getCurrentTime()}
          </p>
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
