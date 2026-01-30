import React, { useState, useEffect } from 'react';
import { ChefHat, ShoppingCart, ArrowRight } from 'lucide-react';
import { RecipeCard } from './RecipeCard';
import { RecipeModal } from './RecipeModal';
import { getRecipesWithIngredientMatch, RecipeWithMatch } from '../../services/recipeService';
import type { UserSettings } from '../../types';

interface RecipeSuggestionsProps {
    settings: UserSettings;
    userIngredients: string[];
    remainingCalories?: number;
    maxMissingIngredients?: number;
    onViewAllRecipes?: () => void;
}

export const RecipeSuggestions: React.FC<RecipeSuggestionsProps> = ({
    settings,
    userIngredients,
    remainingCalories,
    maxMissingIngredients = 5,
    onViewAllRecipes
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
            <div className={`rounded-2xl p-6 text-center ${
                settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
                <ShoppingCart size={48} className="mx-auto mb-3 text-gray-400" />
                <p className={settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {isRussian
                        ? 'Добавьте продукты в холодильник, чтобы получить рекомендации рецептов'
                        : 'Add ingredients to your inventory to get recipe suggestions'
                    }
                </p>
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
