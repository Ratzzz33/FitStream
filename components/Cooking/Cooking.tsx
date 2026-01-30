import React, { useState, useEffect } from 'react';
import { RefreshCw, Flame, ChefHat, AlertTriangle } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { generateRecipes, GeneratedRecipe, RecipeGenerationContext, TodayMealContext } from '../../services/geminiService';
import { generateDishImage } from '../../services/nanaBananaService';
import { RecipeCarousel } from './RecipeCarousel';
import { RecipeCardExpanded } from './RecipeCardExpanded';
import { CookingMode } from './CookingMode';

interface CookingProps {
  caloriesRemaining: number;
  servingsNeeded?: number;
  onCaloriesLogged?: (calories: number) => void;
}

type ViewState = 'loading' | 'menu' | 'expanded' | 'cooking' | 'error';

export const Cooking: React.FC<CookingProps> = ({
  caloriesRemaining,
  servingsNeeded = 2,
  onCaloriesLogged
}) => {
  const [state, setState] = useState<ViewState>('loading');
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | undefined>();
  const [recipeImages, setRecipeImages] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');

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

      const { meals, macros } = getTodayMealsContext();

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

      const generatedRecipes = await generateRecipes(inventory, context);

      if (generatedRecipes.length === 0) {
        setError('Не удалось подобрать рецепты. Попробуйте добавить больше продуктов.');
        setState('error');
        return;
      }

      setRecipes(generatedRecipes);
      setState('menu');

      // Generate images for ALL recipes in parallel
      generatedRecipes.forEach((recipe, index) => {
        generateImageForRecipe(recipe, index);
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

      {/* Error state */}
      {state === 'error' && (
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
