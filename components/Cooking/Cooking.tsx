import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Flame, ChefHat, AlertTriangle } from 'lucide-react';
import { Recipe, InventoryItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { generateRecipes, GeneratedRecipe, RecipeGenerationContext } from '../../services/geminiService';
import { generateDishImage } from '../../services/nanaBananaService';
import { RecipeCard } from './RecipeCard';
import { CookingMode } from './CookingMode';

interface CookingProps {
  caloriesRemaining: number;
  servingsNeeded?: number;
  onCaloriesLogged?: (calories: number) => void;
}

type ViewState = 'loading' | 'recommendation' | 'cooking' | 'error';

export const Cooking: React.FC<CookingProps> = ({
  caloriesRemaining,
  servingsNeeded = 2,
  onCaloriesLogged
}) => {
  const [state, setState] = useState<ViewState>('loading');
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<GeneratedRecipe | null>(null);
  const [recipeImage, setRecipeImage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Determine time of day for meal type
  const getTimeOfDay = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'snack';
    return 'dinner';
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

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setState('loading');
    setError('');

    try {
      const inventory = StorageService.getInventory();

      if (inventory.length === 0) {
        setError('Добавьте продукты в Кухню, чтобы получить рекомендации рецептов.');
        setState('error');
        return;
      }

      const context: RecipeGenerationContext = {
        timeOfDay: getTimeOfDay(),
        caloriesRemaining,
        servingsNeeded,
        maxCookingTime: 45, // Default max time
        excludeRecipeIds: StorageService.getRecentRecipeIds(3)
      };

      const generatedRecipes = await generateRecipes(inventory, context);

      if (generatedRecipes.length === 0) {
        setError('Не удалось подобрать рецепты. Попробуйте добавить больше продуктов.');
        setState('error');
        return;
      }

      setRecipes(generatedRecipes);
      setCurrentRecipeIndex(0);

      // Generate image for first recipe
      const firstRecipe = generatedRecipes[0];
      const image = await generateDishImage({
        dishName: firstRecipe.name,
        ingredients: firstRecipe.ingredients.map(i => i.name)
      });
      setRecipeImage(image.url);

      setState('recommendation');
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Не удалось загрузить рецепты. Проверьте подключение к интернету.');
      setState('error');
    }
  };

  const handleNextRecipe = async () => {
    const nextIndex = (currentRecipeIndex + 1) % recipes.length;
    setCurrentRecipeIndex(nextIndex);

    // Generate image for next recipe
    const nextRecipe = recipes[nextIndex];
    const image = await generateDishImage({
      dishName: nextRecipe.name,
      ingredients: nextRecipe.ingredients.map(i => i.name)
    });
    setRecipeImage(image.url);
  };

  const handleStartCooking = () => {
    setSelectedRecipe(recipes[currentRecipeIndex]);
    setState('cooking');
  };

  const handleCookingComplete = (caloriesEaten: number) => {
    onCaloriesLogged?.(caloriesEaten);
    setSelectedRecipe(null);
    setState('recommendation');
    loadRecipes(); // Refresh recommendations
  };

  const handleCookingCancel = () => {
    setSelectedRecipe(null);
    setState('recommendation');
  };

  const currentRecipe = recipes[currentRecipeIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Loading state */}
      {state === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="relative">
            <ChefHat className="w-16 h-16 text-orange-500 animate-bounce" />
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
            Подбираем рецепт для вас...
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

      {/* Recommendation state - zero-click UI */}
      {state === 'recommendation' && currentRecipe && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 text-center">
            <span className="text-2xl mr-2">{getMealEmoji()}</span>
            <span className="text-xl font-semibold dark:text-white">
              {getMealName()} готов к старту
            </span>
          </div>

          {/* Recipe card - main focus */}
          <div className="flex-1 px-4 pb-4">
            <RecipeCard
              recipe={currentRecipe}
              imageUrl={recipeImage}
              onStartCooking={handleStartCooking}
              onNextRecipe={handleNextRecipe}
              hasMoreRecipes={recipes.length > 1}
            />
          </div>

          {/* Calories info */}
          <div className="px-4 pb-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Осталось на сегодня: {caloriesRemaining} ккал
          </div>
        </div>
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
