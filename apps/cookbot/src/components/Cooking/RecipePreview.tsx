import React, { useRef, useEffect } from 'react';
import { X, Clock, Flame, AlertTriangle, ChefHat, ArrowLeft } from 'lucide-react';
import { GeneratedRecipe, RecipeDifficulty } from '../../services/geminiService';

interface RecipePreviewProps {
  recipe: GeneratedRecipe;
  imageUrl?: string;
  onStartCooking: () => void;
  onChooseAnother: () => void;
  onClose: () => void;
}

const difficultyConfig: Record<RecipeDifficulty, { label: string; color: string; bg: string }> = {
  easy: { label: 'Easy', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  hard: { label: 'Hard', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
};

const messyLevelConfig: Record<1 | 2 | 3, { label: string; icon: string; color: string; bg: string }> = {
  1: { label: 'Clean', icon: '✨', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  2: { label: 'Moderate', icon: '💦', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  3: { label: 'Messy', icon: '🌊', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' }
};

export const RecipePreview: React.FC<RecipePreviewProps> = ({
  recipe,
  imageUrl,
  onStartCooking,
  onChooseAnother,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Swipe down to close
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const content = contentRef.current;
    if (content && content.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;

    if (diff > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${diff}px)`;
      modalRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const diff = touchCurrentY.current - touchStartY.current;

    if (modalRef.current) {
      modalRef.current.style.transition = 'transform 0.3s ease-out';

      if (diff > 100) {
        modalRef.current.style.transform = 'translateY(100%)';
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        modalRef.current.style.transform = 'translateY(0)';
      }
    }

    touchStartY.current = 0;
    touchCurrentY.current = 0;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const difficulty = difficultyConfig[recipe.difficulty] || difficultyConfig.medium;
  const messyLevel = messyLevelConfig[recipe.messyLevel as 1 | 2 | 3] || messyLevelConfig[1];

  const totalTimerMinutes = recipe.steps.reduce((acc, step) => {
    return acc + (step.timerSeconds ? Math.ceil(step.timerSeconds / 60) : 0);
  }, 0);

  const essentialEquipment = recipe.equipment?.filter(e => e.essential) || [];
  const optionalEquipment = recipe.equipment?.filter(e => !e.essential) || [];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col animate-slide-up"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag indicator for swipe */}
        <div className="flex justify-center pt-2 pb-1 shrink-0 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header with image */}
        <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-gray-700 dark:to-gray-800 shrink-0">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Back button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 left-4 w-10 h-10 bg-black/50 hover:bg-black/70 active:bg-black/90 text-white rounded-full flex items-center justify-center transition-colors z-10"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 active:bg-black/90 text-white rounded-full flex items-center justify-center transition-colors z-10"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-xl font-bold text-white">{recipe.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{recipe.totalTimeMinutes} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>{recipe.caloriesPerServing} kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
          {/* Warning badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Difficulty */}
            <div className={`flex items-center gap-1 px-3 py-1.5 ${difficulty.bg} rounded-full ${difficulty.color}`}>
              <ChefHat className="w-4 h-4" />
              <span className="text-sm font-medium">{difficulty.label}</span>
            </div>

            {/* Messy level */}
            <div className={`flex items-center gap-1 px-3 py-1.5 ${messyLevel.bg} rounded-full ${messyLevel.color}`}>
              <span>{messyLevel.icon}</span>
              <span className="text-sm font-medium">{messyLevel.label}</span>
            </div>

            {/* Timer total */}
            {totalTimerMinutes > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{totalTimerMinutes} min timers</span>
              </div>
            )}
          </div>

          {/* Messy warning */}
          {recipe.messyWarning && recipe.messyLevel >= 2 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{recipe.messyWarning}</p>
            </div>
          )}

          {/* Equipment */}
          {(essentialEquipment.length > 0 || optionalEquipment.length > 0) && (
            <div className="mb-4">
              <h3 className="font-semibold dark:text-white mb-2">Equipment</h3>

              {/* Essential */}
              {essentialEquipment.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {essentialEquipment.map((eq, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-lg">{eq.emoji}</span>
                      <span className="text-sm dark:text-white">{eq.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional */}
              {optionalEquipment.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {optionalEquipment.map((eq, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-70"
                    >
                      <span className="text-lg">{eq.emoji}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{eq.name}</span>
                      <span className="text-xs text-gray-400">(opt.)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full steps list */}
          <div className="mb-4">
            <h3 className="font-semibold dark:text-white mb-3">
              Full process ({recipe.steps.length} steps)
            </h3>
            <div className="space-y-3">
              {recipe.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  {/* Step number */}
                  <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {step.order}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <p className="text-sm dark:text-gray-200">{step.instruction}</p>

                    {/* Step meta */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {step.timerSeconds && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.ceil(step.timerSeconds / 60)} min
                        </span>
                      )}
                      {step.heatLevel && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          {Array.from({ length: step.heatLevel }).map((_, i) => (
                            <Flame key={i} className="w-3 h-3" />
                          ))}
                        </span>
                      )}
                      {step.technique && (
                        <span className="text-xs text-purple-600 dark:text-purple-400">
                          Technique
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-200 dark:border-gray-700 space-y-2 shrink-0">
          <button
            onClick={onStartCooking}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="text-xl">👨‍🍳</span>
            <span>Let's cook!</span>
          </button>
          <button
            onClick={onChooseAnother}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Choose another dish
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipePreview;
