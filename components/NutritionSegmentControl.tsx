import React from 'react';
import { Utensils, ChefHat } from 'lucide-react';

// Custom Fridge Icon
const FridgeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="15" y1="5" x2="15" y2="7" />
    <line x1="15" y1="12" x2="15" y2="16" />
  </svg>
);

export type NutritionTab = 'tracker' | 'kitchen' | 'recipes';

interface NutritionSegmentControlProps {
  activeTab: NutritionTab;
  onTabChange: (tab: NutritionTab) => void;
}

const TABS: { id: NutritionTab; label: string; icon: React.ReactNode }[] = [
  { id: 'tracker', label: 'Трекер', icon: <Utensils size={18} /> },
  { id: 'kitchen', label: 'Кухня', icon: <FridgeIcon className="w-[18px] h-[18px]" /> },
  { id: 'recipes', label: 'Готовка', icon: <ChefHat size={18} /> },
];

export const NutritionSegmentControl: React.FC<NutritionSegmentControlProps> = ({
  activeTab,
  onTabChange,
}) => {
  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex">
      {/* Animated pill background */}
      <div
        className="absolute top-1 bottom-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-all duration-300 ease-out"
        style={{
          width: `calc(${100 / TABS.length}% - 4px)`,
          left: `calc(${(activeIndex * 100) / TABS.length}% + 2px)`,
        }}
      />

      {/* Tab buttons */}
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3
              rounded-lg font-medium text-sm transition-colors duration-200
              ${isActive
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            <span className={isActive ? 'text-orange-500' : ''}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default NutritionSegmentControl;
