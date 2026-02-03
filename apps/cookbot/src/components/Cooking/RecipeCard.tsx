import React from 'react';
import { Clock, Flame, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';

interface RecipeCardProps {
  recipe: GeneratedRecipe;
  imageUrl: string;
  onStartCooking: () => void;
  onNextRecipe: () => void;
  hasMoreRecipes: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  imageUrl,
  onStartCooking,
  onNextRecipe,
  hasMoreRecipes
}) => {
  const allIngredientsAvailable = recipe.ingredients.every(i => i.isAvailable);
  const unavailableIngredients = recipe.ingredients.filter(i => !i.isAvailable);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col">
      <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-gray-700 dark:to-gray-800">
        {imageUrl && (
          <img src={imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
        )}
        {recipe.priorityReason && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-full shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>{recipe.priorityReason}</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col">
        <h3 className="text-xl font-bold dark:text-white mb-2">{recipe.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{recipe.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.totalTimeMinutes} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{recipe.caloriesPerServing} kcal</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} srv.</span>
          </div>
        </div>

        <div className="mb-4">
          {allIngredientsAvailable ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <span className="text-lg">✅</span>
              <span>All ingredients available</span>
            </div>
          ) : (
            <div className="text-sm">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <span className="text-lg">⚠️</span>
                <span>Missing {unavailableIngredients.length} ingredients</span>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {unavailableIngredients.map(i => i.name).join(', ')}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="space-y-3">
          <button
            onClick={onStartCooking}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="text-xl">👨‍🍳</span>
            <span>Let's cook!</span>
          </button>

          {hasMoreRecipes && (
            <button
              onClick={onNextRecipe}
              className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Different recipe</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
