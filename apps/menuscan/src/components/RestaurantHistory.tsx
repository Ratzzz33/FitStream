// RestaurantHistory - History of scanned restaurant menus

import { useState } from 'react';
import { History, Trash2, ChevronRight, MapPin, Clock, Flame, Zap, Star, X } from 'lucide-react';
import { useTheme } from '@fitstream/shared';
import { StorageService } from '../services/storageService';
import { MenuResults } from './MenuResults';
import type { MenuScanEntry, MenuRecommendation, MenuItemAnalysis, NutritionLog } from '../types';

interface RestaurantHistoryProps {
  onMealLogged?: (log: NutritionLog) => void;
}

export function RestaurantHistory({ onMealLogged }: RestaurantHistoryProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [history, setHistory] = useState<MenuScanEntry[]>(() => StorageService.getMenuHistory());
  const [selectedScan, setSelectedScan] = useState<MenuScanEntry | null>(null);

  const removeEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.removeMenuScan(id);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const handleLogMeal = (item: MenuRecommendation | MenuItemAnalysis) => {
    const name = 'dishName' in item ? item.dishName : item.name;
    const log: NutritionLog = {
      id: `menu_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      type: 'FOOD',
      name,
      calories: item.calories,
      protein: item.protein,
      carbs: ('carbs' in item ? item.carbs : undefined) || 0,
      fat: ('fat' in item ? item.fat : undefined) || 0,
      manualEntry: false,
    };
    StorageService.saveNutrition(log);
    onMealLogged?.(log);
  };

  // Detail view for a selected scan
  if (selectedScan) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedScan(null)}
          className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <X size={16} />
          Back to History
        </button>
        <MenuResults
          recommendations={selectedScan.recommendations}
          allItems={selectedScan.allItems}
          restaurantName={selectedScan.restaurantName}
          fromCache={selectedScan.fromCache}
          onLogMeal={handleLogMeal}
          onClose={() => setSelectedScan(null)}
        />
      </div>
    );
  }

  // History list
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History size={20} className="text-rose-400" />
          Scan History
        </h2>
        {history.length > 0 && (
          <button
            onClick={() => {
              StorageService.clearMenuHistory();
              setHistory([]);
            }}
            className={`text-xs px-2 py-1 rounded-lg ${
              isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <History size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No menus scanned yet.</p>
          <p className="text-xs mt-1">Scan a restaurant menu to see results here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(entry => {
            const date = new Date(entry.scannedAt);
            const timeStr = date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const bestChoice = entry.recommendations.find(r => r.category === 'BEST_CHOICE');

            return (
              <button
                key={entry.id}
                onClick={() => setSelectedScan(entry)}
                className={`w-full rounded-xl p-4 text-left transition-colors ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border border-white/5'
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{entry.restaurantName}</span>
                      {entry.fromCache && (
                        <Zap size={12} className="text-rose-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {timeStr}
                      </span>
                      {entry.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          Nearby
                        </span>
                      )}
                    </div>
                    {bestChoice && (
                      <div className="flex items-center gap-2 mt-2">
                        <Star size={12} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400 truncate">
                          Best: {bestChoice.dishName} ({bestChoice.calories} kcal)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => removeEntry(entry.id, e)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDark ? 'hover:bg-red-500/20 text-gray-600 hover:text-red-400' : 'hover:bg-red-50 text-gray-300 hover:text-red-500'
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
