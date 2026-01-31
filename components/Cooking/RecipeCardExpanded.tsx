import React, { useState } from 'react';
import { X, Clock, Flame, Users, ChefHat, AlertTriangle, Check, ShoppingCart, Eye } from 'lucide-react';
import { GeneratedRecipe, RecipeDifficulty } from '../../services/geminiService';
import { StorageService } from '../../services/storageService';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';
import { RecipePreview } from './RecipePreview';
import { RecipeRating } from './RecipeRating';

// Emoji placeholders for recipes without images
const RECIPE_EMOJIS: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🍲',
  dinner: '🍽️',
  snack: '🥪',
  salad: '🥗',
  soup: '🍜',
  pasta: '🍝',
  meat: '🥩',
  fish: '🐟',
  chicken: '🍗',
  dessert: '🍰',
  drink: '🥤',
  default: '👨‍🍳'
};

const getRecipeEmoji = (name: string): string => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('салат') || nameLower.includes('salad')) return RECIPE_EMOJIS.salad;
  if (nameLower.includes('суп') || nameLower.includes('soup')) return RECIPE_EMOJIS.soup;
  if (nameLower.includes('паста') || nameLower.includes('макарон') || nameLower.includes('спагетти')) return RECIPE_EMOJIS.pasta;
  if (nameLower.includes('курица') || nameLower.includes('куриц') || nameLower.includes('chicken')) return RECIPE_EMOJIS.chicken;
  if (nameLower.includes('мясо') || nameLower.includes('говядин') || nameLower.includes('свинин') || nameLower.includes('котлет')) return RECIPE_EMOJIS.meat;
  if (nameLower.includes('рыба') || nameLower.includes('тунец') || nameLower.includes('лосось') || nameLower.includes('fish')) return RECIPE_EMOJIS.fish;
  if (nameLower.includes('яйц') || nameLower.includes('омлет') || nameLower.includes('яичниц')) return RECIPE_EMOJIS.breakfast;
  if (nameLower.includes('торт') || nameLower.includes('пирог') || nameLower.includes('десерт') || nameLower.includes('печень')) return RECIPE_EMOJIS.dessert;
  if (nameLower.includes('смузи') || nameLower.includes('коктейль') || nameLower.includes('напиток')) return RECIPE_EMOJIS.drink;
  return RECIPE_EMOJIS.default;
};

interface RecipeCardExpandedProps {
  recipe: GeneratedRecipe;
  imageUrl?: string;
  onClose: () => void;
  onStartCooking: () => void;
  onChooseAnother?: () => void;
}

const difficultyConfig: Record<RecipeDifficulty, { label: string; icons: number; color: string; bg: string }> = {
  easy: { label: 'Легко', icons: 1, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  medium: { label: 'Средне', icons: 2, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  hard: { label: 'Сложно', icons: 3, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
};

const messyLevelConfig: Record<1 | 2 | 3, { label: string; icon: string; color: string; bg: string }> = {
  1: { label: 'Чисто', icon: '✨', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  2: { label: 'Умеренно', icon: '💦', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  3: { label: 'Много брызг', icon: '🌊', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' }
};

export const RecipeCardExpanded: React.FC<RecipeCardExpandedProps> = ({
  recipe,
  imageUrl,
  onClose,
  onStartCooking,
  onChooseAnother
}) => {
  const [showFullPreview, setShowFullPreview] = useState(false);

  const difficulty = difficultyConfig[recipe.difficulty] || difficultyConfig.medium;
  const messyLevel = messyLevelConfig[(recipe.messyLevel as 1 | 2 | 3) || 1];
  const allIngredientsAvailable = recipe.ingredients.every(i => i.isAvailable);
  const unavailableIngredients = recipe.ingredients.filter(i => !i.isAvailable);
  const availableIngredients = recipe.ingredients.filter(i => i.isAvailable);

  const settings = StorageService.getSettings();
  const currency = ((settings as any).currency || 'RUB') as CurrencyCode;

  // Краткий процесс приготовления (первые 3-4 шага)
  const briefSteps = recipe.steps.slice(0, 4);

  // Show full preview
  if (showFullPreview) {
    return (
      <RecipePreview
        recipe={recipe}
        imageUrl={imageUrl}
        onStartCooking={onStartCooking}
        onChooseAnother={() => {
          setShowFullPreview(false);
          onChooseAnother?.();
          onClose();
        }}
        onClose={() => setShowFullPreview(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header with image or emoji placeholder */}
        <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-gray-700 dark:to-gray-800 shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl opacity-50">{getRecipeEmoji(recipe.name)}</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Difficulty badge */}
          <div className={`absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 ${difficulty.bg} rounded-full shadow ${difficulty.color}`}>
            {Array.from({ length: difficulty.icons }).map((_, i) => (
              <ChefHat key={i} className="w-4 h-4" />
            ))}
            <span className="text-sm font-medium">{difficulty.label}</span>
            {recipe.difficultyReason && (
              <span className="text-xs opacity-75">• {recipe.difficultyReason}</span>
            )}
          </div>

          {/* Priority badge */}
          {recipe.priorityReason && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-full shadow-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>{recipe.priorityReason}</span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Title & description */}
          <h2 className="text-xl font-bold dark:text-white mb-2">{recipe.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{recipe.description}</p>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
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

          {/* Messy warning */}
          {recipe.messyLevel >= 2 && (
            <div className={`${messyLevel.bg} rounded-lg p-3 mb-4`}>
              <div className={`flex items-center gap-2 ${messyLevel.color}`}>
                <span className="text-lg">{messyLevel.icon}</span>
                <span className="font-medium">{messyLevel.label}</span>
              </div>
              {recipe.messyWarning && (
                <p className="text-sm mt-1 opacity-80">{recipe.messyWarning}</p>
              )}
            </div>
          )}

          {/* Nutrition note */}
          {recipe.nutritionNote && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 {recipe.nutritionNote}
              </p>
            </div>
          )}

          {/* Equipment */}
          {recipe.equipment && recipe.equipment.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold dark:text-white mb-2">Инструменты</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.equipment.map((eq, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                      eq.essential
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 opacity-70'
                    }`}
                  >
                    <span className="text-lg">{eq.emoji}</span>
                    <span className="text-sm dark:text-white">{eq.name}</span>
                    {!eq.essential && <span className="text-xs text-gray-400">(опц.)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* БЖУ detailed */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold dark:text-white mb-3">Пищевая ценность (на порцию)</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-500">{recipe.caloriesPerServing}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">ккал</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{recipe.proteinPerServing || 0}г</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">белки</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">{recipe.carbsPerServing || 0}г</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">углеводы</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{recipe.fatPerServing || 0}г</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">жиры</div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-4">
            <h3 className="font-semibold dark:text-white mb-3">
              Ингредиенты ({recipe.ingredients.length})
            </h3>

            {/* Available */}
            <div className="space-y-2 mb-3">
              {availableIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-lg">{ing.emoji}</span>
                  <span className="dark:text-white flex-1">{ing.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
              ))}
            </div>

            {/* Unavailable */}
            {unavailableIngredients.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="font-medium">Нужно докупить:</span>
                </div>
                <div className="space-y-1">
                  {unavailableIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-amber-800 dark:text-amber-200">
                      <span className="text-lg">{ing.emoji}</span>
                      <span className="flex-1">{ing.name}</span>
                      <span className="opacity-75">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Brief cooking steps */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold dark:text-white">Краткий процесс</h3>
              <button
                onClick={() => setShowFullPreview(true)}
                className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:underline"
              >
                <Eye className="w-4 h-4" />
                Весь процесс
              </button>
            </div>
            <div className="space-y-3">
              {briefSteps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm dark:text-gray-200">{step.instruction}</p>
                    {step.timerSeconds && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ⏱️ {Math.round(step.timerSeconds / 60)} мин
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {recipe.steps.length > 4 && (
                <button
                  onClick={() => setShowFullPreview(true)}
                  className="text-sm text-orange-500 dark:text-orange-400 hover:underline"
                >
                  + ещё {recipe.steps.length - 4} шагов...
                </button>
              )}
            </div>
          </div>

          {/* Economics */}
          {recipe.costEstimate && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4">
              <h3 className="font-semibold dark:text-white mb-2">💰 Экономика</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Себестоимость:</span>
                  <span className="font-medium dark:text-white">
                    ~{formatCurrency(recipe.costEstimate, currency)}
                  </span>
                </div>
                {recipe.restaurantPrice && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">В ресторане:</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ~{formatCurrency(recipe.restaurantPrice, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
                      <span className="text-green-600 dark:text-green-400 font-medium">Экономия:</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        {formatCurrency(recipe.restaurantPrice - recipe.costEstimate, currency)}!
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Rating & Comments */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="font-semibold dark:text-white mb-3">⭐ Оценки и отзывы</h3>
            <RecipeRating
              recipeId={(recipe as any)._dbId}
              recipeName={recipe.name}
            />
          </div>
        </div>

        {/* Bottom CTA with safe area */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={onStartCooking}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="text-xl">🍳</span>
            <span>ГОТОВИТЬ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCardExpanded;
