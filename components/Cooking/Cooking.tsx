import React, { useState, useRef, useEffect } from 'react';
import { Flame, ChefHat, Clock, Check, Sparkles, ShoppingCart, Package, Mic, MicOff, Send, Loader2, X } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { searchRecipes, matchRecipesWithInventory, getSurpriseRecipe, RecipeMatch, Recipe } from '../../services/recipeDatabase';

interface CookingProps {
  caloriesRemaining: number;
  servingsNeeded?: number;
  onCaloriesLogged?: (calories: number) => void;
  onOpenKitchenCamera?: () => void;
  onOpenManualAdd?: () => void;
  onOpenShopping?: () => void;
}

export const Cooking: React.FC<CookingProps> = ({
  caloriesRemaining,
  onCaloriesLogged,
  onOpenKitchenCamera,
  onOpenShopping
}) => {
  const [query, setQuery] = useState('');
  // Default to 'shopping' if no inventory
  const inventory = StorageService.getInventory();
  const inventoryNames = inventory.map(item => item.name);
  const inventoryCount = inventory.length;
  const [mode, setMode] = useState<'available' | 'shopping'>(inventoryCount > 0 ? 'available' : 'shopping');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [results, setResults] = useState<RecipeMatch[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) {
      console.error('Microphone access denied:', e);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('API key not configured');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
                { text: 'Transcribe this audio to text. Return ONLY the transcribed text, nothing else. If the audio is in Russian, keep it in Russian.' }
              ]
            }]
          })
        }
      );

      const data = await response.json();
      const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (transcription) {
        setQuery(transcription);
        handleSearch(transcription);
      }
    } catch (e) {
      console.error('Transcription error:', e);
      alert('Не удалось распознать речь');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSearch = (searchQuery?: string, searchMode?: 'available' | 'shopping') => {
    const q = searchQuery || query;
    const currentMode = searchMode || mode;

    if (!q.trim()) return;

    const foundRecipes = searchRecipes(q);
    const matched = matchRecipesWithInventory(inventoryNames, foundRecipes);

    let filtered = matched;
    if (currentMode === 'available') {
      // No inventory = no results in "available" mode
      if (inventoryCount === 0) {
        filtered = [];
      } else {
        // Show recipes where we have at least 30% of ingredients
        // NO fallback - if nothing matches, show empty results
        filtered = matched.filter(m => m.matchPercentage >= 30);
      }
    }
    // In 'shopping' mode - show ALL matching recipes regardless of inventory

    // Sort: in 'available' mode sort by match %, in 'shopping' by relevance (already sorted)
    if (currentMode === 'available') {
      filtered.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    setResults(filtered);
    setShowResults(true);
  };

  // Mode change handler - re-search with new mode
  const handleModeChange = (newMode: 'available' | 'shopping') => {
    setMode(newMode);
    if (showResults && query.trim()) {
      // Re-search with new mode
      handleSearch(query, newMode);
    }
  };

  const handleSurprise = () => {
    const surprise = getSurpriseRecipe(inventoryNames);
    if (surprise) {
      setResults([surprise]);
      setShowResults(true);
      setQuery('');
    }
  };

  // Browse all recipes (for "shopping" mode exploration)
  const handleBrowseAll = () => {
    const allMatched = matchRecipesWithInventory(inventoryNames);
    setResults(allMatched);
    setShowResults(true);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelectRecipe = (match: RecipeMatch) => {
    setSelectedRecipe(match);
  };

  const handleLogCalories = () => {
    if (selectedRecipe) {
      onCaloriesLogged?.(selectedRecipe.recipe.calories);
      setSelectedRecipe(null);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Recipe detail view
  if (selectedRecipe) {
    const { recipe, availableIngredients, missingIngredients, matchPercentage } = selectedRecipe;

    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        {/* Header with image */}
        <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
          <img
            src={recipe.photo}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button
            onClick={() => setSelectedRecipe(null)}
            className="absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>{recipe.emoji}</span>
              {recipe.name}
            </h2>
            <p className="text-white/90 text-sm mt-1">{recipe.description}</p>
            <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.cookingTime} мин
              </span>
              <span className={getDifficultyColor(recipe.difficulty)}>
                {getDifficultyLabel(recipe.difficulty)}
              </span>
              <span>{recipe.calories} ккал</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Match indicator */}
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
              matchPercentage >= 70 ? 'bg-green-500' :
              matchPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {matchPercentage}%
            </div>
            <div>
              <p className="font-medium dark:text-white">
                {matchPercentage >= 70 ? 'Почти всё есть!' :
                 matchPercentage >= 40 ? 'Нужно докупить немного' : 'Нужна закупка'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {availableIngredients.length} из {availableIngredients.length + missingIngredients.length} ингредиентов
              </p>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-bold dark:text-white mb-3">Ингредиенты</h3>
            <div className="space-y-2">
              {recipe.ingredients.map((ing, i) => {
                const isAvailable = availableIngredients.includes(ing.name);
                const isMissing = missingIngredients.includes(ing.name);

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isAvailable ? 'bg-green-50 dark:bg-green-900/20' :
                      isMissing ? 'bg-red-50 dark:bg-red-900/20' :
                      'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isAvailable && <Check className="w-4 h-4 text-green-500" />}
                      {isMissing && <ShoppingCart className="w-4 h-4 text-red-500" />}
                      {!isAvailable && !isMissing && <span className="w-4 h-4" />}
                      <span className={`${ing.optional ? 'text-gray-400' : 'dark:text-white'}`}>
                        {ing.name} {ing.optional && '(опц.)'}
                      </span>
                    </span>
                    <span className="text-sm text-gray-500">{ing.amount}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-bold dark:text-white mb-3">Приготовление</h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3 shrink-0">
          {missingIngredients.length > 0 && onOpenShopping && (
            <button
              onClick={() => {
                // Add missing items to shopping and navigate
                onOpenShopping();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-medium"
            >
              <ShoppingCart className="w-5 h-5" />
              В магазин
            </button>
          )}
          <button
            onClick={handleLogCalories}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium"
          >
            <ChefHat className="w-5 h-5" />
            Готовить! ({recipe.calories} ккал)
          </button>
        </div>
      </div>
    );
  }

  // Main search view
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold dark:text-white mb-1">
          Что готовим?
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" />
            Осталось: {caloriesRemaining} ккал
          </span>
          {inventoryCount > 0 && (
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4 text-blue-500" />
              {inventoryCount} продуктов
            </span>
          )}
        </div>
      </div>

      {/* Search area */}
      <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
        {/* Input field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Например: салат, паста, быстрый ужин..."
            className="w-full px-4 py-3 pr-24 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isTranscribing}
          />

          {/* Voice button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500'
            }`}
          >
            {isTranscribing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Send button */}
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isTranscribing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 text-red-500 text-sm animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Говорите... (нажмите чтобы остановить)
          </div>
        )}

        {/* Mode selection */}
        <div className="flex gap-2">
          <button
            onClick={() => inventoryCount > 0 && handleModeChange('available')}
            disabled={inventoryCount === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-colors text-sm ${
              inventoryCount === 0
                ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : mode === 'available'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Package className="w-4 h-4" />
            Из запасов {inventoryCount > 0 && `(${inventoryCount})`}
          </button>
          <button
            onClick={() => handleModeChange('shopping')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-colors text-sm ${
              mode === 'shopping' || inventoryCount === 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            С закупкой
          </button>
        </div>

        {/* Quick suggestions */}
        {!showResults && (
          <div className="flex flex-wrap gap-2">
            {['Салат', 'Быстрый ужин', 'Курица', 'Завтрак', 'Суп'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                }}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {!showResults && (
          <div className="flex gap-2">
            <button
              onClick={handleSurprise}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition"
            >
              <Sparkles className="w-5 h-5" />
              Удиви меня!
            </button>
            <button
              onClick={handleBrowseAll}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <ChefHat className="w-5 h-5" />
              Все
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {showResults && (
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Не нашли подходящих рецептов</p>
              <p className="text-sm mt-1">Попробуйте другой запрос</p>
            </div>
          ) : (
            results.map((match) => (
              <button
                key={match.recipe.id}
                onClick={() => handleSelectRecipe(match)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex border border-gray-100 dark:border-gray-700"
              >
                {/* Photo */}
                <div className="w-28 h-28 shrink-0">
                  <img
                    src={match.recipe.photo}
                    alt={match.recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 p-3 text-left">
                  <h3 className="font-bold dark:text-white flex items-center gap-1 text-sm">
                    <span>{match.recipe.emoji}</span>
                    {match.recipe.name}
                  </h3>

                  {/* Short description */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {match.recipe.description}
                  </p>

                  {/* Time & difficulty */}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {match.recipe.cookingTime} мин
                    </span>
                    <span className={getDifficultyColor(match.recipe.difficulty)}>
                      {getDifficultyLabel(match.recipe.difficulty)}
                    </span>
                  </div>

                  {/* Availability */}
                  <div className="mt-2 space-y-1">
                    {match.availableIngredients.length > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Есть: {match.availableIngredients.slice(0, 3).join(', ')}
                        {match.availableIngredients.length > 3 && ` +${match.availableIngredients.length - 3}`}
                      </p>
                    )}
                    {match.missingIngredients.length > 0 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        Купить: {match.missingIngredients.slice(0, 2).join(', ')}
                        {match.missingIngredients.length > 2 && ` +${match.missingIngredients.length - 2}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Match percentage */}
                <div className="pr-3 flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                    match.matchPercentage >= 70 ? 'bg-green-500' :
                    match.matchPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-400'
                  }`}>
                    {match.matchPercentage}%
                  </div>
                </div>
              </button>
            ))
          )}

          {/* Back to search */}
          <button
            onClick={() => {
              setShowResults(false);
              setResults([]);
              setQuery('');
            }}
            className="w-full py-3 text-blue-500 font-medium"
          >
            ← Новый поиск
          </button>
        </div>
      )}

      {/* Empty kitchen state */}
      {!showResults && inventoryCount === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold dark:text-white mb-2">
            Кухня пуста
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Добавьте продукты, чтобы подобрать рецепты из ваших запасов
          </p>
          {onOpenKitchenCamera && (
            <button
              onClick={onOpenKitchenCamera}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium"
            >
              Сфотографировать кухню
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Cooking;
