import { useState } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel } from '@fitstream/shared';
import { ChefHat, BookOpen, Settings, Sparkles, Clock, Trash2 } from 'lucide-react';
import { Cooking } from './components/Cooking';
import { StorageService } from './services/storageService';
import type { Recipe } from '@fitstream/shared';

function SavedRecipesView() {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => StorageService.getSavedRecipes());
  const { theme } = useTheme();

  const handleRemove = (recipeId: string) => {
    StorageService.removeSavedRecipe(recipeId);
    setSavedRecipes(StorageService.getSavedRecipes());
  };

  if (savedRecipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold dark:text-white mb-2">No saved recipes</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px]">
          When you find recipes you love, save them here for quick access
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
        <BookOpen size={20} className="text-amber-500" />
        Saved Recipes ({savedRecipes.length})
      </h2>
      {savedRecipes.map((recipe) => (
        <div
          key={recipe.id}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold dark:text-white">{recipe.name}</h3>
              {recipe.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{recipe.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                {recipe.cookingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.cookingTime} min
                  </span>
                )}
                {recipe.calories && (
                  <span>{recipe.calories} kcal</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleRemove(recipe.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CookingHistoryBadge() {
  const history = StorageService.getCookingHistory();
  const todayMeals = history.filter(
    (m) => new Date(m.cookedAt).toDateString() === new Date().toDateString()
  );

  if (todayMeals.length === 0) return null;

  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.caloriesEaten || 0), 0);

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-amber-700 dark:text-amber-400">
          Cooked today: {todayMeals.length} meal{todayMeals.length > 1 ? 's' : ''}
        </span>
        <span className="text-sm font-medium text-amber-600 dark:text-amber-300">
          {totalCalories} kcal
        </span>
      </div>
    </div>
  );
}

function CookBotApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState<'generate' | 'saved' | 'settings'>('generate');

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Content area */}
      <main className="flex-1 overflow-hidden">
        {view === 'generate' && (
          <Cooking
            onCaloriesLogged={(calories) => {
              console.log('Calories logged:', calories);
            }}
          />
        )}

        {view === 'saved' && (
          <div className="h-full overflow-auto">
            <div className="px-4 pt-12 pb-4">
              <CookingHistoryBadge />
              <SavedRecipesView />
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="h-full overflow-auto">
            <div className="px-4 pt-12 pb-24">
              <SettingsPanel appName="CookBot" />
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-white/10 px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-around">
        <button
          onClick={() => setView('generate')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'generate' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Sparkles size={20} />
          <span className="text-xs font-medium">Cook</span>
        </button>
        <button
          onClick={() => setView('saved')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'saved' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <BookOpen size={20} />
          <span className="text-xs font-medium">Saved</span>
        </button>
        <button
          onClick={() => setView('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'settings' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Settings size={20} />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider initialTheme="dark">
        <CookBotApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
