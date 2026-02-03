import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Send } from 'lucide-react';

interface QuickSuggestion {
  id: string;
  emoji: string;
  label: string;
  query: string;
}

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { id: 'light', emoji: '🥗', label: 'Light', query: 'light low calorie dish' },
  { id: 'hearty', emoji: '🍖', label: 'Hearty', query: 'hearty filling dish' },
  { id: 'quick', emoji: '⚡', label: 'Quick', query: 'quick dish under 20 minutes' },
  { id: 'protein', emoji: '💪', label: 'Protein', query: 'high protein dish' },
  { id: 'comfort', emoji: '🍲', label: 'Comfort', query: 'comfort home food' },
];

interface RecipeDialogInputProps {
  mealEmoji: string;
  mealName: string;
  onSubmitQuery: (query: string) => void;
  onSurpriseMe: () => void;
  isLoading?: boolean;
}

export const RecipeDialogInput: React.FC<RecipeDialogInputProps> = ({
  mealEmoji,
  mealName,
  onSubmitQuery,
  onSurpriseMe,
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSubmitQuery(inputValue.trim());
    }
  };

  const handleChipClick = (suggestion: QuickSuggestion) => {
    if (!isLoading) {
      onSubmitQuery(suggestion.query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
          <span className="text-3xl">👨‍🍳</span>
        </div>
        <h2 className="text-xl font-bold dark:text-white">What shall we cook?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {mealEmoji} {mealName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="I want pasta with chicken..."
            disabled={isLoading}
            className={`
              w-full px-4 py-4 pr-16 rounded-2xl border-2 transition-all
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              border-gray-200 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-500
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {inputValue.trim() && (
              <button
                type="submit"
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Quick ideas:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleChipClick(suggestion)}
              disabled={isLoading}
              className="
                inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full
                bg-gray-100 dark:bg-gray-800
                hover:bg-amber-100 dark:hover:bg-amber-900/30
                text-gray-700 dark:text-gray-300
                hover:text-amber-600 dark:hover:text-amber-400
                transition-colors text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                border border-transparent hover:border-amber-200 dark:hover:border-amber-800
              "
            >
              <span>{suggestion.emoji}</span>
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-sm text-gray-400 dark:text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <button
        onClick={onSurpriseMe}
        disabled={isLoading}
        className="
          w-full py-4 rounded-2xl
          bg-gradient-to-r from-purple-500 to-pink-500
          hover:from-purple-600 hover:to-pink-600
          text-white font-semibold text-lg
          flex items-center justify-center gap-2
          transition-all transform hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Sparkles className="w-5 h-5" />
        Surprise me!
      </button>

      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>Finding recipes...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDialogInput;
