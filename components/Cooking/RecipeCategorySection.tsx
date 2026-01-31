import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';
import { RecipeCardMini } from './RecipeCardMini';

interface RecipeCategorySectionProps {
  title: string;
  emoji: string;
  recipes: GeneratedRecipe[];
  images: Record<number, string>;
  loadingImages: Set<number>;
  onSelectRecipe: (recipeIndex: number) => void;
  baseIndex: number; // Starting index for this section's recipes
}

export const RecipeCategorySection: React.FC<RecipeCategorySectionProps> = ({
  title,
  emoji,
  recipes,
  images,
  loadingImages,
  onSelectRecipe,
  baseIndex
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(recipes.length > 1);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = 200;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (recipes.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 px-4">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-bold text-lg dark:text-white">{title}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({recipes.length})
        </span>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {canScrollRight && recipes.length > 1 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Recipe cards */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto pb-2 px-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recipes.map((recipe, index) => {
            const globalIndex = baseIndex + index;
            return (
              <div
                key={globalIndex}
                className="snap-start shrink-0"
                style={{ width: '200px' }}
              >
                <RecipeCardMini
                  recipe={recipe}
                  imageUrl={images[globalIndex]}
                  isLoading={loadingImages.has(globalIndex)}
                  onClick={() => onSelectRecipe(globalIndex)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecipeCategorySection;
