import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';
import { RecipeCardMini } from './RecipeCardMini';

interface RecipeCarouselProps {
  recipes: GeneratedRecipe[];
  images: Record<string, string>;
  loadingImages: Set<number>;
  onSelectRecipe: (index: number) => void;
  selectedIndex?: number;
}

export const RecipeCarousel: React.FC<RecipeCarouselProps> = ({
  recipes,
  images,
  loadingImages,
  onSelectRecipe,
  selectedIndex
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = 280;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {canScrollRight && recipes.length > 1 && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recipes.map((recipe, index) => (
          <div key={index} className="snap-start shrink-0" style={{ width: 'calc(100% - 40px)', maxWidth: '320px' }}>
            <RecipeCardMini
              recipe={recipe}
              imageUrl={images[index]}
              isLoading={loadingImages.has(index)}
              isSelected={selectedIndex === index}
              onClick={() => onSelectRecipe(index)}
            />
          </div>
        ))}
      </div>

      {recipes.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {recipes.map((_, index) => (
            <button
              key={index}
              onClick={() => onSelectRecipe(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                selectedIndex === index ? 'bg-amber-500 w-4' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeCarousel;
