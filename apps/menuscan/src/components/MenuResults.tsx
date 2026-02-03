// MenuResults - Display menu analysis results with health ratings and recommendations

import { useState } from 'react';
import { Heart, Flame, Zap, ChevronDown, ChevronUp, Plus, Check, Star } from 'lucide-react';
import { useTheme } from '@fitstream/shared';
import type { MenuRecommendation, MenuItemAnalysis } from '../types';

interface MenuResultsProps {
  recommendations: MenuRecommendation[];
  allItems?: MenuItemAnalysis[];
  restaurantName?: string;
  fromCache: boolean;
  onLogMeal: (item: MenuRecommendation | MenuItemAnalysis) => void;
  onClose: () => void;
}

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
  BEST_CHOICE: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Best Choice' },
  HIGH_PROTEIN: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'High Protein' },
  LESSER_OF_EVILS: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Lesser Evil' },
  REGULAR: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Regular' },
};

const healthScoreIcon = (score: 1 | 2 | 3) => {
  if (score === 1) return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Healthy' };
  if (score === 2) return { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Moderate' };
  return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Avoid' };
};

export function MenuResults({
  recommendations,
  allItems,
  restaurantName,
  fromCache,
  onLogMeal,
  onClose,
}: MenuResultsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAllItems, setShowAllItems] = useState(false);
  const [loggedItems, setLoggedItems] = useState<Set<string>>(new Set());

  const handleLog = (item: MenuRecommendation | MenuItemAnalysis) => {
    const name = 'dishName' in item ? item.dishName : item.name;
    setLoggedItems(prev => new Set(prev).add(name));
    onLogMeal(item);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {restaurantName || 'Menu Analysis'}
          </h2>
          {fromCache && (
            <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
              <Zap size={12} />
              Instant result from cache
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-200 hover:bg-gray-300'
          } transition-colors`}
        >
          Done
        </button>
      </div>

      {/* Top Recommendations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <Star size={14} />
          Top Picks
        </h3>
        {recommendations.map((rec, i) => {
          const cat = categoryColors[rec.category] || categoryColors.REGULAR;
          const isLogged = loggedItems.has(rec.dishName);

          return (
            <div
              key={i}
              className={`rounded-xl p-4 ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{rec.dishName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cat.bg} ${cat.text} font-medium`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {rec.reasoning}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-sm">
                      <Flame size={14} className="text-orange-400" />
                      {rec.calories} kcal
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <Zap size={14} className="text-blue-400" />
                      {rec.protein}g protein
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleLog(rec)}
                  disabled={isLogged}
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isLogged
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  }`}
                >
                  {isLogged ? <Check size={18} /> : <Plus size={18} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* All Items */}
      {allItems && allItems.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAllItems(!showAllItems)}
            className={`w-full flex items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <span>All Menu Items ({allItems.length})</span>
            {showAllItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAllItems && (
            <div className="space-y-2">
              {allItems.map((item, i) => {
                const hs = healthScoreIcon(item.healthScore);
                const isLogged = loggedItems.has(item.name);

                return (
                  <div
                    key={i}
                    className={`rounded-lg p-3 flex items-center gap-3 ${
                      isDark ? 'bg-white/5' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hs.bg}`}>
                      <Heart size={14} className={hs.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className={`text-xs flex items-center gap-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>{item.calories} kcal</span>
                        <span>{item.protein}g protein</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLog(item)}
                      disabled={isLogged}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isLogged
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isDark
                            ? 'bg-white/10 text-white/60 hover:bg-white/20'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                    >
                      {isLogged ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
