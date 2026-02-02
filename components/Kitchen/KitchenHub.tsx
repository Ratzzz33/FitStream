import React, { useState } from 'react';
import { ChevronLeft, ChefHat, UtensilsCrossed } from 'lucide-react';
import { Kitchen } from './Kitchen';
import { Cooking } from '../Cooking';
import { t } from '../../services/i18n';

// Custom Fridge Icon
const FridgeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
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

interface KitchenHubProps {
  onClose?: () => void;
  initialScreen?: 'kitchen' | 'cooking';
  caloriesRemaining?: number;
  onCaloriesLogged?: (calories: number) => void;
}

type ActiveScreen = 'hub' | 'kitchen' | 'cooking';

export const KitchenHub: React.FC<KitchenHubProps> = ({
  onClose,
  initialScreen,
  caloriesRemaining = 0,
  onCaloriesLogged
}) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(initialScreen || 'hub');

  // If we have an initial screen, go directly there
  if (activeScreen === 'kitchen') {
    return (
      <Kitchen onClose={() => setActiveScreen('hub')} />
    );
  }

  if (activeScreen === 'cooking') {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveScreen('hub')}
            className="p-1 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-semibold dark:text-white">{t('recipes') || 'Рецепты'}</h2>
        </div>

        {/* Cooking content */}
        <div className="flex-1 overflow-auto">
          <Cooking
            caloriesRemaining={caloriesRemaining}
            onCaloriesLogged={onCaloriesLogged || (() => {})}
            onOpenKitchenCamera={() => setActiveScreen('kitchen')}
            onOpenManualAdd={() => setActiveScreen('kitchen')}
            onOpenShopping={() => {}}
          />
        </div>
      </div>
    );
  }

  // Hub screen with two CTA cards
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        <h2 className="text-lg font-semibold dark:text-white flex-1 text-center">
          {t('kitchen') || 'Кухня'}
        </h2>
        {onClose && <div className="w-6" />} {/* Spacer for centering */}
      </div>

      {/* Two CTA cards */}
      <div className="flex-1 flex flex-col justify-center p-6 gap-6">
        {/* Fridge Card */}
        <button
          onClick={() => setActiveScreen('kitchen')}
          className="flex items-center gap-5 p-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20 text-white hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <FridgeIcon className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-bold mb-1">{t('inventory') || 'Запасы'}</h3>
            <p className="text-sm text-white/80">
              Холодильник, морозилка, шкафы
            </p>
          </div>
        </button>

        {/* Cooking Card */}
        <button
          onClick={() => setActiveScreen('cooking')}
          className="flex items-center gap-5 p-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/20 text-white hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-bold mb-1">{t('recipes') || 'Что приготовить'}</h3>
            <p className="text-sm text-white/80">
              Рецепты из имеющихся продуктов
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default KitchenHub;
