import React from 'react';
import { X, Clock, Flame, Users, ChefHat, Leaf, ExternalLink, Play, Lightbulb } from 'lucide-react';
import type { Recipe } from '../../services/recipeService';
import type { UserSettings } from '../../types';

interface RecipeModalProps {
    recipe: Recipe;
    settings: UserSettings;
    onClose: () => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, settings, onClose }) => {
    const isRussian = settings.language === 'ru';
    const name = isRussian && recipe.name_ru ? recipe.name_ru : recipe.name_en;
    const instructions = isRussian && recipe.instructions_ru ? recipe.instructions_ru : recipe.instructions;
    const tips = isRussian && recipe.tips_ru ? recipe.tips_ru : recipe.tips;

    const difficultyColors: Record<string, string> = {
        easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    const difficultyLabels: Record<string, string> = { easy: isRussian ? 'Легко' : 'Easy', medium: isRussian ? 'Средне' : 'Medium', hard: isRussian ? 'Сложно' : 'Hard' };
    const steps = instructions?.split(/\r?\n/).filter(s => s.trim()) || [];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden rounded-none sm:rounded-3xl flex flex-col ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="relative h-56">
                    {recipe.image_url ? <img src={recipe.image_url} alt={name} className="w-full h-full object-cover" /> : (
                        <div className={`w-full h-full flex items-center justify-center ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}><ChefHat size={64} className="text-gray-400" /></div>
                    )}
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"><X size={24} /></button>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        {recipe.is_healthy && <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white flex items-center gap-1"><Leaf size={14} />{isRussian ? 'Здоровое' : 'Healthy'}</span>}
                        {recipe.is_vegetarian && <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500 text-white">{isRussian ? 'Вегетарианское' : 'Vegetarian'}</span>}
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 p-6">
                    <h2 className={`text-2xl font-bold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{name}</h2>
                    <div className="flex flex-wrap gap-4 mb-6">
                        {recipe.cooking_time && <div className="flex items-center gap-2"><Clock size={20} className="text-gray-400" /><span className={settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{recipe.cooking_time} {isRussian ? 'мин' : 'min'}</span></div>}
                        {recipe.servings && <div className="flex items-center gap-2"><Users size={20} className="text-gray-400" /><span className={settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{recipe.servings} {isRussian ? 'порций' : 'servings'}</span></div>}
                        {recipe.difficulty && <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[recipe.difficulty]}`}>{difficultyLabels[recipe.difficulty]}</span>}
                    </div>

                    {(recipe.calories || recipe.protein) && (
                        <div className={`rounded-2xl p-4 mb-6 ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}><Flame size={18} className="text-orange-500" />{isRussian ? 'Пищевая ценность' : 'Nutrition'}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                {recipe.calories && <div className="text-center"><div className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{recipe.calories}</div><div className="text-sm text-gray-500">{isRussian ? 'ккал' : 'kcal'}</div></div>}
                                {recipe.protein && <div className="text-center"><div className="text-2xl font-bold text-blue-500">{recipe.protein}g</div><div className="text-sm text-gray-500">{isRussian ? 'Белки' : 'Protein'}</div></div>}
                                {recipe.fat && <div className="text-center"><div className="text-2xl font-bold text-yellow-500">{recipe.fat}g</div><div className="text-sm text-gray-500">{isRussian ? 'Жиры' : 'Fat'}</div></div>}
                                {recipe.carbs && <div className="text-center"><div className="text-2xl font-bold text-green-500">{recipe.carbs}g</div><div className="text-sm text-gray-500">{isRussian ? 'Углеводы' : 'Carbs'}</div></div>}
                                {recipe.fiber && <div className="text-center"><div className="text-2xl font-bold text-emerald-500">{recipe.fiber}g</div><div className="text-sm text-gray-500">{isRussian ? 'Клетчатка' : 'Fiber'}</div></div>}
                            </div>
                        </div>
                    )}

                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <div className="mb-6">
                            <h3 className={`font-semibold mb-3 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{isRussian ? 'Ингредиенты' : 'Ingredients'}</h3>
                            <ul className="space-y-2">
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i} className={`flex items-center gap-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <span>•</span><span>{ing.amount && <strong>{ing.amount}</strong>} {isRussian && ing.name_ru ? ing.name_ru : ing.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {steps.length > 0 && (
                        <div className="mb-6">
                            <h3 className={`font-semibold mb-3 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{isRussian ? 'Инструкция' : 'Instructions'}</h3>
                            <ol className="space-y-3">
                                {steps.map((step, i) => (
                                    <li key={i} className={`flex gap-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${settings.theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>{i + 1}</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {tips && (
                        <div className={`rounded-2xl p-4 mb-6 ${settings.theme === 'dark' ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                            <h3 className={`font-semibold mb-2 flex items-center gap-2 ${settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}><Lightbulb size={18} />{isRussian ? 'Совет' : 'Tips'}</h3>
                            <p className={settings.theme === 'dark' ? 'text-amber-200/80' : 'text-amber-800'}>{tips}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        {recipe.video_url && <a href={recipe.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"><Play size={18} />{isRussian ? 'Видео' : 'Video'}</a>}
                        {recipe.source_url && <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-4 py-2 rounded-xl ${settings.theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><ExternalLink size={18} />{isRussian ? 'Источник' : 'Source'}</a>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeModal;
