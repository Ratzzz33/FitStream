import React from 'react';
import { Clock, Flame, Users, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';
import { StorageService } from '../../services/storageService';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';

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
  // Check if all ingredients are available
  const allIngredientsAvailable = recipe.ingredients.every(i => i.isAvailable);
  const unavailableIngredients = recipe.ingredients.filter(i => !i.isAvailable);

  const settings = StorageService.getSettings();
  const currency = (settings.currency || 'RUB') as CurrencyCode;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-gray-700 dark:to-gray-800">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Priority badge */}
        {recipe.priorityReason && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-full shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>{recipe.priorityReason}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Title */}
        <h3 className="text-xl font-bold dark:text-white mb-2">{recipe.name}</h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {recipe.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.totalTimeMinutes} мин</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{recipe.caloriesPerServing} ккал</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} порц.</span>
          </div>
        </div>

        {/* PRD: Economic calculations */}
        {recipe.costEstimate && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600 dark:text-gray-400">💰 Себестоимость:</span>
              <span className="font-medium dark:text-white">
                ~{formatCurrency(recipe.costEstimate, currency)} ({formatCurrency(Math.round(recipe.costEstimate / recipe.servings), currency)}/порция)
              </span>
            </div>
            {recipe.restaurantPrice && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 dark:text-gray-400">🍽️ В ресторане:</span>
                  <span className="text-gray-500 dark:text-gray-400">~{formatCurrency(recipe.restaurantPrice, currency)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-green-200 dark:border-green-800">
                  <span className="text-green-600 dark:text-green-400 font-medium">💚 Экономия:</span>
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    {formatCurrency(recipe.restaurantPrice - recipe.costEstimate, currency)}!
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Ingredients status */}
        <div className="mb-4">
          {allIngredientsAvailable ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <span className="text-lg">✅</span>
              <span>Все ингредиенты есть</span>
            </div>
          ) : (
            <div className="text-sm">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <span className="text-lg">⚠️</span>
                <span>Не хватает {unavailableIngredients.length} ингр.</span>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {unavailableIngredients.map(i => i.name).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="space-y-3">
          {/* Main CTA - Big button */}
          <button
            onClick={onStartCooking}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="text-xl">👨‍🍳</span>
            <span>Приступаем!</span>
          </button>

          {/* Secondary - Different recipe */}
          {hasMoreRecipes && (
            <button
              onClick={onNextRecipe}
              className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Другой вариант</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
