import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, Flame, Users, ChefHat, AlertTriangle, Check, ShoppingCart, Eye, ArrowLeft } from 'lucide-react';
import { GeneratedRecipe, RecipeDifficulty } from '../../services/geminiService';
import { RecipePreview } from './RecipePreview';

interface RecipeCardExpandedProps {
  recipe: GeneratedRecipe;
  imageUrl?: string;
  onClose: () => void;
  onStartCooking: () => void;
  onChooseAnother?: () => void;
}

const difficultyConfig: Record<RecipeDifficulty, { label: string; icons: number; color: string; bg: string }> = {
  easy: { label: 'Easy', icons: 1, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  medium: { label: 'Medium', icons: 2, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  hard: { label: 'Hard', icons: 3, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
};

const messyLevelConfig: Record<1 | 2 | 3, { label: string; icon: string; color: string; bg: string }> = {
  1: { label: 'Clean', icon: '✨', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  2: { label: 'Moderate', icon: '💦', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  3: { label: 'Messy', icon: '🌊', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' }
};

export const RecipeCardExpanded: React.FC<RecipeCardExpandedProps> = ({
  recipe,
  imageUrl,
  onClose,
  onStartCooking,
  onChooseAnother
}) => {
  const [showFullPreview, setShowFullPreview] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
        setTimeout(() => onClose(), 300);
      } else {
        modalRef.current.style.transform = 'translateY(0)';
      }
    }
    touchStartY.current = 0;
    touchCurrentY.current = 0;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const difficulty = difficultyConfig[recipe.difficulty] || difficultyConfig.medium;
  const messyLevel = messyLevelConfig[(recipe.messyLevel as 1 | 2 | 3) || 1];
  const unavailableIngredients = recipe.ingredients.filter(i => !i.isAvailable);
  const availableIngredients = recipe.ingredients.filter(i => i.isAvailable);
  const briefSteps = recipe.steps.slice(0, 4);

  if (showFullPreview) {
    return (
      <RecipePreview
        recipe={recipe}
        imageUrl={imageUrl}
        onStartCooking={onStartCooking}
        onChooseAnother={() => {
          setShowFullPreview(false);
          onChooseAnother?.();
          onClose();
        }}
        onClose={() => setShowFullPreview(false)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-gray-700 dark:to-gray-800 shrink-0">
          {imageUrl && (
            <img src={imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="absolute top-4 left-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          {recipe.priorityReason && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-full shadow-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>{recipe.priorityReason}</span>
            </div>
          )}
        </div>

        <div ref={contentRef} className="flex-1 overflow-y-auto p-5">
          <h2 className="text-xl font-bold dark:text-white mb-2">{recipe.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{recipe.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{recipe.totalTimeMinutes} min</span></div>
            <div className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /><span>{recipe.caloriesPerServing} kcal</span></div>
            <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{recipe.servings} srv.</span></div>
          </div>

          {recipe.messyLevel >= 2 && (
            <div className={`${messyLevel.bg} rounded-lg p-3 mb-4`}>
              <div className={`flex items-center gap-2 ${messyLevel.color}`}>
                <span className="text-lg">{messyLevel.icon}</span>
                <span className="font-medium">{messyLevel.label}</span>
              </div>
              {recipe.messyWarning && <p className="text-sm mt-1 opacity-80">{recipe.messyWarning}</p>}
            </div>
          )}

          {recipe.nutritionNote && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">{recipe.nutritionNote}</p>
            </div>
          )}

          {recipe.equipment && recipe.equipment.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold dark:text-white mb-2">Equipment</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.equipment.map((eq, idx) => (
                  <div key={idx} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${eq.essential ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-700/50 opacity-70'}`}>
                    <span className="text-lg">{eq.emoji}</span>
                    <span className="text-sm dark:text-white">{eq.name}</span>
                    {!eq.essential && <span className="text-xs text-gray-400">(opt.)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold dark:text-white mb-3">Nutrition (per serving)</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><div className="text-2xl font-bold text-orange-500">{recipe.caloriesPerServing}</div><div className="text-xs text-gray-500 dark:text-gray-400">kcal</div></div>
              <div><div className="text-2xl font-bold text-red-500">{recipe.proteinPerServing || 0}g</div><div className="text-xs text-gray-500 dark:text-gray-400">protein</div></div>
              <div><div className="text-2xl font-bold text-amber-500">{recipe.carbsPerServing || 0}g</div><div className="text-xs text-gray-500 dark:text-gray-400">carbs</div></div>
              <div><div className="text-2xl font-bold text-blue-500">{recipe.fatPerServing || 0}g</div><div className="text-xs text-gray-500 dark:text-gray-400">fat</div></div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold dark:text-white mb-3">Ingredients ({recipe.ingredients.length})</h3>
            <div className="space-y-2 mb-3">
              {availableIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-lg">{ing.emoji}</span>
                  <span className="dark:text-white flex-1">{ing.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{ing.quantity} {ing.unit}</span>
                </div>
              ))}
            </div>
            {unavailableIngredients.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="font-medium">Need to buy:</span>
                </div>
                <div className="space-y-1">
                  {unavailableIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-amber-800 dark:text-amber-200">
                      <span className="text-lg">{ing.emoji}</span>
                      <span className="flex-1">{ing.name}</span>
                      <span className="opacity-75">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold dark:text-white">Brief process</h3>
              <button onClick={() => setShowFullPreview(true)} className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:underline">
                <Eye className="w-4 h-4" />Full process
              </button>
            </div>
            <div className="space-y-3">
              {briefSteps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-sm font-bold shrink-0">{step.order}</div>
                  <div className="flex-1">
                    <p className="text-sm dark:text-gray-200">{step.instruction}</p>
                    {step.timerSeconds && <span className="text-xs text-gray-500 dark:text-gray-400">Timer: {Math.round(step.timerSeconds / 60)} min</span>}
                  </div>
                </div>
              ))}
              {recipe.steps.length > 4 && (
                <button onClick={() => setShowFullPreview(true)} className="text-sm text-amber-500 dark:text-amber-400 hover:underline">
                  + {recipe.steps.length - 4} more steps...
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={onStartCooking}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="text-xl">👨‍🍳</span>
            <span>Let's cook!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCardExpanded;
