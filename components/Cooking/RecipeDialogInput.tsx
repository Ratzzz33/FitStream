import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Send } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface QuickSuggestion {
  id: string;
  emoji: string;
  label: string;
  query: string;
}

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { id: 'light', emoji: '🥗', label: 'Лёгкое', query: 'лёгкое низкокалорийное блюдо' },
  { id: 'hearty', emoji: '🍖', label: 'Сытное', query: 'сытное плотное блюдо' },
  { id: 'quick', emoji: '⚡', label: 'Быстрое', query: 'быстрое блюдо до 20 минут' },
  { id: 'protein', emoji: '💪', label: 'Белковое', query: 'высокобелковое блюдо' },
  { id: 'comfort', emoji: '🍲', label: 'Комфорт', query: 'домашняя комфортная еда' },
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
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput('ru-RU');

  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

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

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      // Submit if we have transcript
      if (transcript.trim()) {
        setTimeout(() => {
          if (inputValue.trim()) {
            onSubmitQuery(inputValue.trim());
          }
        }, 300);
      }
    } else {
      setInputValue('');
      startListening();
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
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-3">
          <span className="text-3xl">👨‍🍳</span>
        </div>
        <h2 className="text-xl font-bold dark:text-white">Что приготовим?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {mealEmoji} {mealName}
        </p>
      </div>

      {/* Input with voice button */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Хочу пасту с курицей..."
            disabled={isLoading}
            className={`
              w-full px-4 py-4 pr-24 rounded-2xl border-2 transition-all
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              ${isListening
                ? 'border-red-400 dark:border-red-500 ring-4 ring-red-100 dark:ring-red-900/30'
                : 'border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />

          {/* Buttons container */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Voice button */}
            {isSupported && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={isLoading}
                className={`
                  p-2.5 rounded-xl transition-all
                  ${isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Send button */}
            {inputValue.trim() && (
              <button
                type="submit"
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Listening indicator */}
        {isListening && (
          <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Слушаю...
          </p>
        )}
      </form>

      {/* Quick suggestions */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Быстрые идеи:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleChipClick(suggestion)}
              disabled={isLoading}
              className="
                inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full
                bg-gray-100 dark:bg-gray-800
                hover:bg-orange-100 dark:hover:bg-orange-900/30
                text-gray-700 dark:text-gray-300
                hover:text-orange-600 dark:hover:text-orange-400
                transition-colors text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                border border-transparent hover:border-orange-200 dark:hover:border-orange-800
              "
            >
              <span>{suggestion.emoji}</span>
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-sm text-gray-400 dark:text-gray-500">или</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Surprise me button */}
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
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        "
      >
        <Sparkles className="w-5 h-5" />
        Удиви меня!
      </button>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>Подбираем рецепты...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDialogInput;
