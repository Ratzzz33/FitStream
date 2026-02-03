import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Clock, ChefHat, Sparkles } from 'lucide-react';
import { generateRecipes, GeneratedRecipe, RecipeGenerationContext } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { RecipeCardMini } from './Cooking/RecipeCardMini';
import { RecipeCardExpanded } from './Cooking/RecipeCardExpanded';

interface CookingPromptProps {
  onClose: () => void;
  onStartCooking?: (recipe: GeneratedRecipe) => void;
}

export const CookingPrompt: React.FC<CookingPromptProps> = ({ onClose, onStartCooking }) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedRecipe[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get inventory for context
  const inventory = StorageService.getActiveInventory();
  const inventoryCount = inventory.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsGenerating(true);
    setShowResults(true);
    setError(null);

    try {
      const context: RecipeGenerationContext = {
        timeOfDay: 'lunch',
        currentTime: new Date().toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }),
        caloriesRemaining: 2000,
        servingsNeeded: 2,
        maxCookingTime: 60,
        excludeRecipeIds: StorageService.getRecentRecipeIds(),
        onlyAvailable: inventoryCount > 0,
        userQuery: q,
      };

      const generated = await generateRecipes(inventory, context);
      setResults(generated);
    } catch (err: any) {
      console.error('Recipe generation error:', err);
      if (err.message === 'INSUFFICIENT_BALANCE') {
        setError('Insufficient balance to generate recipes.');
      } else {
        setError('Failed to generate recipes. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSurprise = () => {
    handleSearch('quick delicious recipe');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // Recipe detail view
  if (selectedRecipeIndex !== null && results[selectedRecipeIndex]) {
    return (
      <RecipeCardExpanded
        recipe={results[selectedRecipeIndex]}
        onClose={() => setSelectedRecipeIndex(null)}
        onStartCooking={() => {
          onStartCooking?.(results[selectedRecipeIndex!]);
          onClose();
        }}
        onChooseAnother={() => setSelectedRecipeIndex(null)}
      />
    );
  }

  // Main search view
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in">
      <div className={`bg-white dark:bg-gray-800 w-full ${showResults ? 'h-[85vh]' : ''} sm:w-auto sm:min-w-[450px] sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold dark:text-white">
            What to cook?
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search area */}
        <div className="p-4 space-y-4 shrink-0">
          {/* Inventory context */}
          {inventoryCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>You have {inventoryCount} items in stock</span>
            </div>
          )}

          {/* Input field */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g.: pasta, quick dinner, chicken..."
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500"
              disabled={isGenerating}
            />

            {/* Send button */}
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isGenerating}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick suggestions */}
          {!showResults && (
            <div className="flex flex-wrap gap-2">
              {['Salad', 'Quick dinner', 'Chicken', 'Breakfast', 'Soup'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Surprise me button */}
          {!showResults && (
            <button
              onClick={handleSurprise}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition"
            >
              <Sparkles className="w-5 h-5" />
              Surprise me!
            </button>
          )}
        </div>

        {/* Results */}
        {showResults && (
          <div className="flex-1 overflow-auto p-4 pt-0 space-y-3">
            {/* Loading */}
            {isGenerating && (
              <div className="py-8 flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full" />
                  <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <ChefHat className="absolute inset-0 m-auto w-6 h-6 text-amber-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium dark:text-white">Generating recipes...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI is finding the best options</p>
                </div>
              </div>
            )}

            {/* Error */}
            {!isGenerating && error && (
              <div className="text-center py-8">
                <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* No results */}
            {!isGenerating && !error && results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recipes found</p>
                <p className="text-sm mt-1">Try a different query</p>
              </div>
            )}

            {/* Recipe cards */}
            {!isGenerating && results.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 py-2 text-amber-600 dark:text-amber-400 text-sm">
                  <Sparkles className="w-4 h-4" />
                  AI generated {results.length} recipes
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {results.map((recipe, index) => (
                    <RecipeCardMini
                      key={index}
                      recipe={recipe}
                      onClick={() => setSelectedRecipeIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Back to search */}
            {!isGenerating && (
              <button
                onClick={() => {
                  setShowResults(false);
                  setResults([]);
                  setQuery('');
                  setError(null);
                }}
                className="w-full py-3 text-amber-500 font-medium"
              >
                New search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CookingPrompt;
