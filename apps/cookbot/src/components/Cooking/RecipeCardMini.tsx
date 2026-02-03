import React from 'react';
import { Clock, Flame, ChefHat, AlertTriangle } from 'lucide-react';
import { GeneratedRecipe, RecipeDifficulty } from '../../services/geminiService';

interface RecipeCardMiniProps {
  recipe: GeneratedRecipe;
  imageUrl?: string;
  isLoading?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

const difficultyConfig: Record<RecipeDifficulty, { label: string; icons: number; color: string }> = {
  easy: { label: 'Easy', icons: 1, color: 'text-green-500' },
  medium: { label: 'Medium', icons: 2, color: 'text-amber-500' },
  hard: { label: 'Hard', icons: 3, color: 'text-red-500' }
};

export const RecipeCardMini: React.FC<RecipeCardMiniProps> = ({
  recipe,
  imageUrl,
  isLoading,
  isSelected,
  onClick
}) => {
  const difficulty = difficultyConfig[recipe.difficulty] || difficultyConfig.medium;
  const allIngredientsAvailable = recipe.ingredients.every(i => i.isAvailable);

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer
        transition-all duration-200 hover:shadow-xl hover:scale-[1.02]
        ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
      `}
    >
      <div className="relative h-36 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-gray-700 dark:to-gray-800">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🍽️</div>
        )}

        {recipe.priorityReason && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs rounded-full shadow">
            <AlertTriangle className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{recipe.priorityReason}</span>
          </div>
        )}

        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-gray-800/90 rounded-full shadow ${difficulty.color}`}>
          {Array.from({ length: difficulty.icons }).map((_, i) => (
            <ChefHat key={i} className="w-3 h-3" />
          ))}
          <span className="text-xs font-medium">{difficulty.label}</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-bold dark:text-white text-sm mb-1 line-clamp-2 min-h-[2.5rem]">{recipe.name}</h3>

        {recipe.nutritionNote && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 line-clamp-1">
            {recipe.nutritionNote}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{recipe.totalTimeMinutes} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>{recipe.caloriesPerServing} kcal</span>
          </div>
        </div>

        <div className="flex gap-2 text-xs mb-2">
          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
            P {recipe.proteinPerServing || 0}g
          </span>
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
            C {recipe.carbsPerServing || 0}g
          </span>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
            F {recipe.fatPerServing || 0}g
          </span>
        </div>

        <div className="flex items-center justify-between">
          {allIngredientsAvailable ? (
            <span className="text-xs text-green-600 dark:text-green-400">All available</span>
          ) : (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Missing {recipe.ingredients.filter(i => !i.isAvailable).length}
            </span>
          )}
          {recipe.costEstimate && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ~${recipe.costEstimate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCardMini;
