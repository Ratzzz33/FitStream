import React, { useState, useEffect } from 'react';
import { ChefHat, ShoppingCart, ArrowRight, Camera, PenLine, Store } from 'lucide-react';
import { RecipeCard } from './RecipeCard';
import { RecipeModal } from './RecipeModal';
import { getRecipesWithIngredientMatch, RecipeWithMatch } from '../../services/recipeService';
import type { UserSettings } from '../../types';

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

interface RecipeSuggestionsProps {
    settings: UserSettings;
    userIngredients: string[];
    remainingCalories?: number;
    maxMissingIngredients?: number;
    onViewAllRecipes?: () => void;
    onOpenKitchenCamera?: () => void;
    onOpenManualAdd?: () => void;
    onOpenShopping?: () => void;
}

export const RecipeSuggestions: React.FC<RecipeSuggestionsProps> = ({
    settings,
    userIngredients,
    remainingCalories,
    maxMissingIngredients = 5,
    onViewAllRecipes,
    onOpenKitchenCamera,
    onOpenManualAdd,
    onOpenShopping
}) => {
    const [recipes, setRecipes] = useState<RecipeWithMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithMatch | null>(null);

    const isRussian = settings.language === 'ru';

    useEffect(() => {
        loadSuggestions();
    }, [userIngredients, remainingCalories]);

    const loadSuggestions = async () => {
        if (userIngredients.length === 0) {
            setRecipes([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const matches = await getRecipesWithIngredientMatch(
                userIngredients,
                {
                    maxCalories: remainingCalories,
                    limit: 20
                }
            );

            // Filter by max missing ingredients
            const filtered = matches.filter(r => r.missingIngredients.length <= maxMissingIngredients);

            setRecipes(filtered.slice(0, 6));
        } catch (e) {
            console.error('Failed to load recipe suggestions:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`rounded-2xl p-6 ${
                settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (userIngredients.length === 0) {
        return (
            <div className={`rounded-2xl p-6 ${
                settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
                {/* Friendly empty state */}
                <div className="text-center mb-6">
                    <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
                        settings.theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50'
                    }`}>
                        <FridgeIcon className={`w-8 h-8 ${
                            settings.theme === 'dark' ? 'text-gray-500' : 'text-orange-300'
                        }`} />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                        settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        {isRussian ? 'Кухня пуста' : 'Kitchen is empty'}
                    </h3>
                    <p className={`text-sm ${
                        settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                        {isRussian
                            ? 'Добавьте продукты, чтобы увидеть подходящие рецепты'
                            : 'Add ingredients to see matching recipes'
                        }
                    </p>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                    {onOpenKitchenCamera && (
                        <button
                            onClick={onOpenKitchenCamera}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                settings.theme === 'dark'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            <Camera className="w-5 h-5" />
                            <div className="text-left">
                                <div className="font-medium">
                                    {isRussian ? 'Сфотографировать кухню' : 'Scan your kitchen'}
                                </div>
                                <div className={`text-xs ${
                                    settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-100'
                                }`}>
                                    {isRussian ? 'AI распознает продукты' : 'AI will detect products'}
                                </div>
                            </div>
                        </button>
                    )}

                    {onOpenManualAdd && (
                        <button
                            onClick={onOpenManualAdd}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                settings.theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            }`}
                        >
                            <PenLine className={`w-5 h-5 ${
                                settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <div className="text-left">
                                <div className="font-medium">
                                    {isRussian ? 'Добавить вручную' : 'Add manually'}
                                </div>
                                <div className={`text-xs ${
                                    settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    {isRussian ? 'Если знаете что есть' : 'If you know what you have'}
                                </div>
                            </div>
                        </button>
                    )}

                    {onOpenShopping && (
                        <button
                            onClick={onOpenShopping}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                settings.theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            }`}
                        >
                            <Store className={`w-5 h-5 ${
                                settings.theme === 'dark' ? 'text-green-400' : 'text-green-500'
                            }`} />
                            <div className="text-left">
                                <div className="font-medium">
                                    {isRussian ? 'В магазин' : 'Go shopping'}
                                </div>
                                <div className={`text-xs ${
                                    settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    {isRussian ? 'Составить список покупок' : 'Create shopping list'}
                                </div>
                            </div>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (recipes.length === 0) {
        return (
            <div className={`rounded-2xl p-6 text-center ${
                settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
                <ChefHat size={48} className="mx-auto mb-3 text-gray-400" />
                <p className={settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {isRussian
                        ? 'Не нашли подходящих рецептов. Попробуйте добавить больше продуктов'
                        : 'No matching recipes found. Try adding more ingredients'
                    }
                </p>
                {onViewAllRecipes && (
                    <button
                        onClick={onViewAllRecipes}
                        className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white"
                    >
                        {isRussian ? 'Все рецепты' : 'Browse All Recipes'}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`rounded-2xl overflow-hidden ${
            settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'
        }`}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between">
                <h3 className={`font-semibold flex items-center gap-2 ${
                    settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                    <ChefHat size={20} className="text-orange-500" />
                    {isRussian ? 'Что приготовить' : 'What to Cook'}
                </h3>
                {onViewAllRecipes && (
                    <button
                        onClick={onViewAllRecipes}
                        className={`text-sm flex items-center gap-1 ${
                            settings.theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                        }`}
                    >
                        {isRussian ? 'Все рецепты' : 'All recipes'}
                        <ArrowRight size={16} />
                    </button>
                )}
            </div>

            {/* Recipe list */}
            <div className="px-4 pb-4 space-y-3">
                {recipes.map(recipe => (
                    <div key={recipe.id}>
                        <RecipeCard
                            recipe={recipe}
                            settings={settings}
                            onClick={() => setSelectedRecipe(recipe)}
                            compact
                            matchPercentage={recipe.matchPercentage}
                        />

                        {/* Missing ingredients */}
                        {recipe.missingIngredients.length > 0 && (
                            <div className={`mt-1 ml-[76px] text-xs ${
                                settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                                {isRussian ? 'Не хватает:' : 'Missing:'}{' '}
                                {recipe.missingIngredients.slice(0, 3).join(', ')}
                                {recipe.missingIngredients.length > 3 && (
                                    <span> +{recipe.missingIngredients.length - 3}</span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Recipe modal */}
            {selectedRecipe && (
                <RecipeModal
                    recipe={selectedRecipe}
                    settings={settings}
                    onClose={() => setSelectedRecipe(null)}
                />
            )}
        </div>
    );
};

export default RecipeSuggestions;
