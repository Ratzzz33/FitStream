import React from 'react';
import { X, Leaf, HeartPulse, Package } from 'lucide-react';

export type RecipeCategory = 'breakfast' | 'salad' | 'soup' | 'main' | 'dessert' | 'snack' | 'drink' | 'side';

export interface DietaryPreferences {
  vegetarian: boolean;
  diabetic: boolean;
}

interface RecipeFiltersProps {
  mealEmoji: string;
  mealName: string;
  dietaryPreferences: DietaryPreferences;
  onlyAvailable: boolean;
  selectedCategory: RecipeCategory | null;
  availableCategories: RecipeCategory[];
  onDietaryChange: (key: keyof DietaryPreferences, value: boolean) => void;
  onOnlyAvailableChange: (value: boolean) => void;
  onCategoryChange: (category: RecipeCategory | null) => void;
  onClose: () => void;
}

const categoryConfig: Record<RecipeCategory, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🍳' },
  salad: { label: 'Salads', emoji: '🥗' },
  soup: { label: 'Soups', emoji: '🍲' },
  main: { label: 'Main', emoji: '🍖' },
  dessert: { label: 'Desserts', emoji: '🍰' },
  snack: { label: 'Snacks', emoji: '🍿' },
  drink: { label: 'Drinks', emoji: '🥤' },
  side: { label: 'Sides', emoji: '🍚' }
};

export const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  mealEmoji,
  mealName,
  dietaryPreferences,
  onlyAvailable,
  selectedCategory,
  availableCategories,
  onDietaryChange,
  onOnlyAvailableChange,
  onCategoryChange,
  onClose
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{mealEmoji}</span>
          <h3 className="font-bold text-lg dark:text-white">{mealName}</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Dietary filters */}
      <div className="space-y-2 mb-4">
        {/* Only available ingredients */}
        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => onOnlyAvailableChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
          />
          <Package className="w-5 h-5 text-amber-500" />
          <span className="dark:text-white">Only from available ingredients</span>
        </label>

        {/* Vegetarian */}
        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={dietaryPreferences.vegetarian}
            onChange={(e) => onDietaryChange('vegetarian', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
          />
          <Leaf className="w-5 h-5 text-green-500" />
          <span className="dark:text-white">Vegetarian</span>
        </label>

        {/* Diabetic-friendly */}
        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={dietaryPreferences.diabetic}
            onChange={(e) => onDietaryChange('diabetic', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <HeartPulse className="w-5 h-5 text-blue-500" />
          <span className="dark:text-white">Diabetic-friendly</span>
        </label>
      </div>

      {/* Category tabs */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* All categories */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>

          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat === selectedCategory ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{categoryConfig[cat]?.emoji}</span>
              <span>{categoryConfig[cat]?.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeFilters;
