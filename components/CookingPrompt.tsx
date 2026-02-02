import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, Send, ShoppingCart, Package, Loader2, Clock, ChefHat, Check, Sparkles, ArrowRight } from 'lucide-react';
import { t } from '../services/i18n';
import { StorageService } from '../services/storageService';
import { searchRecipes, matchRecipesWithInventory, getSurpriseRecipe, RecipeMatch, Recipe } from '../services/recipeDatabase';

interface CookingPromptProps {
  onClose: () => void;
  onSelectRecipe?: (recipe: Recipe) => void;
}

export const CookingPrompt: React.FC<CookingPromptProps> = ({ onClose, onSelectRecipe }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'available' | 'shopping'>('available');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [results, setResults] = useState<RecipeMatch[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get inventory for matching
  const inventory = StorageService.getInventory();
  const inventoryNames = inventory.map(item => item.name);
  const inventoryCount = inventory.length;

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
        // Auto-search after transcription
        handleSearch(transcription);
      }
    } catch (e) {
      console.error('Transcription error:', e);
      alert('Не удалось распознать речь');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query;
    console.log('[CookingPrompt] handleSearch called with:', q);
    if (!q.trim()) {
      console.log('[CookingPrompt] Empty query, returning');
      return;
    }

    // Search recipes from local database
    const foundRecipes = searchRecipes(q);
    console.log('[CookingPrompt] Found recipes:', foundRecipes.length, foundRecipes.map(r => r.name));

    // Match with inventory
    const matched = matchRecipesWithInventory(inventoryNames, foundRecipes);
    console.log('[CookingPrompt] Matched with inventory:', matched.length);

    // Filter by mode
    let filtered = matched;
    if (mode === 'available') {
      // Prioritize recipes with high match percentage
      filtered = matched.filter(m => m.matchPercentage >= 30);
      if (filtered.length === 0) {
        filtered = matched; // Show all if none match well
      }
    }

    console.log('[CookingPrompt] Final results:', filtered.length);
    setResults(filtered);
    setShowResults(true);
    console.log('[CookingPrompt] showResults set to true');
  };

  const handleSurprise = () => {
    const surprise = getSurpriseRecipe(inventoryNames);
    if (surprise) {
      setResults([surprise]);
      setShowResults(true);
      setQuery('');
    }
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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in">
        <div className="bg-white dark:bg-gray-800 w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:w-auto sm:min-w-[450px] sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
          {/* Header with image */}
          <div className="relative h-48 sm:h-56 overflow-hidden">
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
            <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
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
            <div>
              <h3 className="font-bold dark:text-white mb-2">Ингредиенты</h3>
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
            <div>
              <h3 className="font-bold dark:text-white mb-2">Приготовление</h3>
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
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            {missingIngredients.length > 0 && (
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-medium">
                <ShoppingCart className="w-5 h-5" />
                В список покупок
              </button>
            )}
            <button
              onClick={() => {
                onSelectRecipe?.(recipe);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium"
            >
              <ChefHat className="w-5 h-5" />
              Готовить!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main search view
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in">
      <div className={`bg-white dark:bg-gray-800 w-full ${showResults ? 'h-[85vh]' : ''} sm:w-auto sm:min-w-[450px] sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold dark:text-white">
            Что приготовить?
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
              <Package className="w-4 h-4" />
              <span>У вас {inventoryCount} продуктов в запасах</span>
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
              onClick={() => setMode('available')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-colors text-sm ${
                mode === 'available'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Package className="w-4 h-4" />
              Из запасов
            </button>
            <button
              onClick={() => setMode('shopping')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-colors text-sm ${
                mode === 'shopping'
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

          {/* Surprise me button */}
          {!showResults && (
            <button
              onClick={handleSurprise}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition"
            >
              <Sparkles className="w-5 h-5" />
              Удиви меня!
            </button>
          )}
        </div>

        {/* Results */}
        {showResults && (
          <div className="flex-1 overflow-auto p-4 pt-0 space-y-3">
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
                  className="w-full bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex"
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
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
      </div>
    </div>
  );
};

export default CookingPrompt;
