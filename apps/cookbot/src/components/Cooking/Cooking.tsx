import React, { useState, useRef, useEffect } from 'react';
import { Flame, ChefHat, Clock, Sparkles, Send, Loader2, RefreshCw } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { generateRecipes, GeneratedRecipe, RecipeGenerationContext } from '../../services/geminiService';
import { RecipeCardExpanded } from './RecipeCardExpanded';
import { RecipeCardMini } from './RecipeCardMini';
import { RecipeCategorySection } from './RecipeCategorySection';
import { RecipeDialogInput } from './RecipeDialogInput';
import { CookingMode } from './CookingMode';
import { DietaryPreferences } from './RecipeFilters';

// Custom Fridge Icon for inventory indicator
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

interface CookingProps {
  onCaloriesLogged?: (calories: number) => void;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealOption {
  id: MealType;
  emoji: string;
  label: string;
}

const MEAL_OPTIONS: MealOption[] = [
  { id: 'breakfast', emoji: '🌅', label: 'Breakfast' },
  { id: 'lunch', emoji: '☀️', label: 'Lunch' },
  { id: 'dinner', emoji: '🌙', label: 'Dinner' },
  { id: 'snack', emoji: '🍪', label: 'Snack' },
];

// Detect meal type based on current time
const detectMealType = (): MealType => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 20) return 'dinner';
  return 'snack';
};

export const Cooking: React.FC<CookingProps> = ({
  onCaloriesLogged
}) => {
  // State
  const [mealType, setMealType] = useState<MealType>(detectMealType());
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [recipeImages, setRecipeImages] = useState<Record<number, string>>({});
  const [loadingImages] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences>({
    vegetarian: false,
    diabetic: false,
  });

  // Inventory
  const inventory = StorageService.getActiveInventory();
  const inventoryCount = inventory.length;

  // Get current meal option
  const currentMeal = MEAL_OPTIONS.find(m => m.id === mealType) || MEAL_OPTIONS[0];

  // Generate recipes from AI
  const handleGenerateRecipes = async (userQuery?: string) => {
    setIsGenerating(true);
    setError(null);
    setShowInput(false);

    try {
      const context: RecipeGenerationContext = {
        timeOfDay: mealType,
        currentTime: new Date().toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }),
        caloriesRemaining: 2000, // Default daily calories
        servingsNeeded: 2,
        maxCookingTime: 60,
        excludeRecipeIds: StorageService.getRecentRecipeIds(),
        vegetarian: dietaryPreferences.vegetarian,
        diabetic: dietaryPreferences.diabetic,
        onlyAvailable: inventoryCount > 0,
        userQuery: userQuery,
      };

      const generatedRecipes = await generateRecipes(inventory, context);
      setRecipes(generatedRecipes);
      setSelectedRecipeIndex(null);
    } catch (err: any) {
      console.error('Recipe generation error:', err);
      if (err.message === 'INSUFFICIENT_BALANCE') {
        setError('Insufficient balance. Please top up to generate recipes.');
      } else {
        setError('Failed to generate recipes. Please try again.');
      }
      setShowInput(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle "Surprise me" button
  const handleSurpriseMe = () => {
    handleGenerateRecipes();
  };

  // Handle recipe selection
  const handleSelectRecipe = (index: number) => {
    setSelectedRecipeIndex(index);
  };

  // Handle start cooking
  const handleStartCooking = () => {
    if (selectedRecipeIndex !== null) {
      setIsCooking(true);
    }
  };

  // Handle cooking complete
  const handleCookingComplete = (caloriesEaten: number) => {
    onCaloriesLogged?.(caloriesEaten);
    setIsCooking(false);
    setSelectedRecipeIndex(null);
    setRecipes([]);
    setShowInput(true);
  };

  // Handle cooking cancel
  const handleCookingCancel = () => {
    setIsCooking(false);
  };

  // Handle "Choose another" from expanded card
  const handleChooseAnother = () => {
    setSelectedRecipeIndex(null);
  };

  // Reset to input
  const handleNewSearch = () => {
    setRecipes([]);
    setSelectedRecipeIndex(null);
    setShowInput(true);
    setError(null);
  };

  // If we're in cooking mode, show the cooking step-by-step
  if (isCooking && selectedRecipeIndex !== null && recipes[selectedRecipeIndex]) {
    return (
      <CookingMode
        recipe={recipes[selectedRecipeIndex]}
        onComplete={handleCookingComplete}
        onCancel={handleCookingCancel}
      />
    );
  }

  // If a recipe is selected, show expanded card
  if (selectedRecipeIndex !== null && recipes[selectedRecipeIndex]) {
    return (
      <RecipeCardExpanded
        recipe={recipes[selectedRecipeIndex]}
        imageUrl={recipeImages[selectedRecipeIndex]}
        onClose={() => setSelectedRecipeIndex(null)}
        onStartCooking={handleStartCooking}
        onChooseAnother={handleChooseAnother}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold dark:text-white mb-2">
          What shall we cook?
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {inventoryCount > 0 && (
            <span className="flex items-center gap-1">
              <FridgeIcon className="w-4 h-4 text-amber-500" />
              {inventoryCount} items in stock
            </span>
          )}
        </div>

        {/* Meal type selector */}
        <div className="flex gap-2 mt-3">
          {MEAL_OPTIONS.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setMealType(meal.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                mealType === meal.id
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-2 border-amber-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent'
              }`}
            >
              <span>{meal.emoji}</span>
              <span>{meal.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Input view */}
        {showInput && !isGenerating && (
          <RecipeDialogInput
            mealEmoji={currentMeal.emoji}
            mealName={currentMeal.label}
            onSubmitQuery={handleGenerateRecipes}
            onSurpriseMe={handleSurpriseMe}
            isLoading={isGenerating}
          />
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full" />
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <ChefHat className="absolute inset-0 m-auto w-8 h-8 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="font-medium dark:text-white text-lg">Creating recipes...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI is crafting the perfect dishes for you</p>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              <button
                onClick={handleNewSearch}
                className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {!isGenerating && !showInput && recipes.length > 0 && (
          <div className="p-4 space-y-4">
            {/* AI indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
              <Sparkles className="w-4 h-4" />
              AI generated {recipes.length} recipes for you
            </div>

            {/* Recipe cards grid */}
            <div className="grid grid-cols-2 gap-3">
              {recipes.map((recipe, index) => (
                <div key={index} className="w-full">
                  <RecipeCardMini
                    recipe={recipe}
                    imageUrl={recipeImages[index]}
                    isLoading={loadingImages.has(index)}
                    onClick={() => handleSelectRecipe(index)}
                  />
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleNewSearch}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                New search
              </button>
              <button
                onClick={() => handleGenerateRecipes()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Regenerate
              </button>
            </div>
          </div>
        )}

        {/* No results */}
        {!isGenerating && !showInput && recipes.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recipes found</p>
            <p className="text-sm mt-1">Try a different query</p>
            <button
              onClick={handleNewSearch}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cooking;
