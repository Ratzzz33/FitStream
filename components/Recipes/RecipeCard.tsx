import React from 'react';
import { Clock, Flame, Dumbbell, Leaf, ChefHat } from 'lucide-react';
import type { Recipe } from '../../services/recipeService';
import type { UserSettings } from '../../types';

interface RecipeCardProps {
    recipe: Recipe;
    settings: UserSettings;
    onClick?: () => void;
    compact?: boolean;
    matchPercentage?: number;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, settings, onClick, compact = false, matchPercentage }) => {
    const isRussian = settings.language === 'ru';
    const name = isRussian && recipe.name_ru ? recipe.name_ru : recipe.name_en;

    const difficultyColors: Record<string, string> = {
        easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };

    const difficultyLabels: Record<string, string> = {
        easy: isRussian ? 'Легко' : 'Easy',
        medium: isRussian ? 'Средне' : 'Medium',
        hard: isRussian ? 'Сложно' : 'Hard'
    };

    if (compact) {
        return (
            <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${settings.theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
                {recipe.image_url && <img src={recipe.image_url} alt={name} className="w-16 h-16 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        {recipe.calories && <span className="flex items-center gap-1"><Flame size={14} className="text-orange-500" />{recipe.calories}</span>}
                        {recipe.cooking_time && <span className="flex items-center gap-1"><Clock size={14} />{recipe.cooking_time}m</span>}
                    </div>
                </div>
                {matchPercentage !== undefined && (
                    <div className={`text-lg font-bold ${matchPercentage >= 80 ? 'text-green-500' : matchPercentage >= 50 ? 'text-yellow-500' : 'text-gray-400'}`}>{matchPercentage}%</div>
                )}
            </div>
        );
    }

    return (
        <div onClick={onClick} className={`rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${settings.theme === 'dark' ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-md'}`}>
            <div className="relative h-40">
                {recipe.image_url ? <img src={recipe.image_url} alt={name} className="w-full h-full object-cover" /> : (
                    <div className={`w-full h-full flex items-center justify-center ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}><ChefHat size={48} className="text-gray-400" /></div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                    {recipe.is_healthy && <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white flex items-center gap-1"><Leaf size={12} />{isRussian ? 'ЗОЖ' : 'Healthy'}</span>}
                    {recipe.protein && recipe.protein >= 30 && <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white flex items-center gap-1"><Dumbbell size={12} />{isRussian ? 'Белок' : 'Protein'}</span>}
                </div>
                {matchPercentage !== undefined && (
                    <div className="absolute top-2 right-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${matchPercentage >= 80 ? 'bg-green-500' : matchPercentage >= 50 ? 'bg-yellow-500' : 'bg-gray-500'} text-white`}>
                            {matchPercentage}% {isRussian ? 'совпадение' : 'match'}
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className={`font-semibold text-lg mb-2 line-clamp-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {recipe.calories && <span className="flex items-center gap-1"><Flame size={16} className="text-orange-500" />{recipe.calories} {isRussian ? 'ккал' : 'kcal'}</span>}
                    {recipe.cooking_time && <span className="flex items-center gap-1"><Clock size={16} />{recipe.cooking_time} {isRussian ? 'мин' : 'min'}</span>}
                </div>
                <div className="flex items-center gap-2">
                    {recipe.difficulty && <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[recipe.difficulty]}`}>{difficultyLabels[recipe.difficulty]}</span>}
                    {recipe.category && <span className={`px-2 py-1 rounded-full text-xs ${settings.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{recipe.category}</span>}
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
