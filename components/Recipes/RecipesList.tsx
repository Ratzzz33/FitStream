import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Leaf, Dumbbell, Clock, ChevronDown } from 'lucide-react';
import { RecipeCard } from './RecipeCard';
import { RecipeModal } from './RecipeModal';
import { getRecipes, getCategories, Recipe, RecipeFilters } from '../../services/recipeService';
import type { UserSettings } from '../../types';

interface RecipesListProps {
    settings: UserSettings;
    onClose?: () => void;
    maxCalories?: number;
}

export const RecipesList: React.FC<RecipesListProps> = ({
    settings,
    onClose,
    maxCalories
}) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<RecipeFilters>({
        maxCalories: maxCalories,
        limit: 50
    });

    const isRussian = settings.language === 'ru';

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadRecipes();
    }, [filters, selectedCategory, search]);

    const loadCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (e) {
            console.error('Failed to load categories:', e);
        }
    };

    const loadRecipes = async () => {
        setLoading(true);
        try {
            const data = await getRecipes({
                ...filters,
                search: search || undefined,
                category: selectedCategory || undefined
            });
            setRecipes(data);
        } catch (e) {
            console.error('Failed to load recipes:', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleFilter = (key: keyof RecipeFilters, value: boolean | number | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key] === value ? undefined : value
        }));
    };

    return (
        <div className={`fixed inset-0 z-50 ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 px-4 py-3 ${
                settings.theme === 'dark' ? 'bg-gray-900/95 backdrop-blur' : 'bg-white/95 backdrop-blur shadow-sm'
            }`}>
                <div className="flex items-center gap-3 mb-3">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl ${
                                settings.theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                        >
                            <X size={24} className={settings.theme === 'dark' ? 'text-white' : 'text-gray-900'} />
                        </button>
                    )}
                    <h1 className={`text-xl font-bold flex-1 ${
                        settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        {isRussian ? 'Рецепты' : 'Recipes'}
                    </h1>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl ${
                            showFilters
                                ? 'bg-blue-500 text-white'
                                : settings.theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className={`relative mb-3`}>
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isRussian ? 'Поиск рецептов...' : 'Search recipes...'}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                            settings.theme === 'dark'
                                ? 'bg-gray-800 text-white placeholder-gray-500'
                                : 'bg-gray-100 text-gray-900 placeholder-gray-400'
                        }`}
                    />
                </div>

                {/* Quick filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                    <button
                        onClick={() => toggleFilter('isHealthy', true)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                            filters.isHealthy
                                ? 'bg-green-500 text-white'
                                : settings.theme === 'dark'
                                    ? 'bg-gray-800 text-gray-300'
                                    : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        <Leaf size={14} />
                        {isRussian ? 'ЗОЖ' : 'Healthy'}
                    </button>
                    <button
                        onClick={() => toggleFilter('minProtein', 30)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                            filters.minProtein
                                ? 'bg-blue-500 text-white'
                                : settings.theme === 'dark'
                                    ? 'bg-gray-800 text-gray-300'
                                    : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        <Dumbbell size={14} />
                        {isRussian ? 'Высокий белок' : 'High Protein'}
                    </button>
                    <button
                        onClick={() => toggleFilter('maxCookingTime', 30)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                            filters.maxCookingTime
                                ? 'bg-orange-500 text-white'
                                : settings.theme === 'dark'
                                    ? 'bg-gray-800 text-gray-300'
                                    : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        <Clock size={14} />
                        {'<30 '}{isRussian ? 'мин' : 'min'}
                    </button>

                    {/* Category dropdown */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-sm ${
                                selectedCategory
                                    ? 'bg-purple-500 text-white'
                                    : settings.theme === 'dark'
                                        ? 'bg-gray-800 text-gray-300'
                                        : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            <option value="">{isRussian ? 'Категория' : 'Category'}</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                {/* Extended filters */}
                {showFilters && (
                    <div className={`mt-3 p-4 rounded-xl ${
                        settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-2 ${
                                settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                {isRussian ? 'Макс. калорий' : 'Max Calories'}: {filters.maxCalories || isRussian ? 'Любое' : 'Any'}
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="1000"
                                step="50"
                                value={filters.maxCalories || 1000}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    maxCalories: parseInt(e.target.value) === 1000 ? undefined : parseInt(e.target.value)
                                }))}
                                className="w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleFilter('isVegetarian', true)}
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                    filters.isVegetarian
                                        ? 'bg-emerald-500 text-white'
                                        : settings.theme === 'dark'
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-white text-gray-700'
                                }`}
                            >
                                {isRussian ? 'Вегетарианское' : 'Vegetarian'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Recipe grid */}
            <div className="p-4 pb-24 overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : recipes.length === 0 ? (
                    <div className={`text-center py-12 ${
                        settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                        {isRussian ? 'Рецепты не найдены' : 'No recipes found'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                settings={settings}
                                onClick={() => setSelectedRecipe(recipe)}
                            />
                        ))}
                    </div>
                )}
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

export default RecipesList;
