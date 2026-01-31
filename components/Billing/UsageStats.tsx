// components/Billing/UsageStats.tsx

import React, { useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';

const ACTION_ICONS: Record<string, string> = {
  food_scan: '🍔',
  food_scan_cost: '🍔',
  receipt_scan: '🧾',
  storage_scan: '📷',
  menu_scan: '📋',
  recipe_ai: '🍳',
  scale_scan: '⚖️',
};

const ACTION_NAMES: Record<string, string> = {
  food_scan: 'Анализ еды',
  food_scan_cost: 'Еда + стоимость',
  receipt_scan: 'Чеки',
  storage_scan: 'Холодильник',
  menu_scan: 'Меню',
  recipe_ai: 'Рецепты',
  scale_scan: 'Весы',
};

export const UsageStats: React.FC = () => {
  const { usageStats, refreshUsageStats } = useBilling();

  useEffect(() => {
    refreshUsageStats();
  }, [refreshUsageStats]);

  if (!usageStats) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const totalMonth = usageStats.month.cents;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <BarChart3 size={20} className="text-purple-500" />
        Расходы
      </h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Сегодня</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">${usageStats.today.dollars}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Неделя</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">${usageStats.week.dollars}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Месяц</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">${usageStats.month.dollars}</p>
        </div>
      </div>

      {/* By category */}
      {usageStats.byType.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">По категориям:</p>
          {usageStats.byType.map((item) => {
            const percent = totalMonth > 0 ? (item.cents / totalMonth) * 100 : 0;
            return (
              <div key={item.type} className="flex items-center gap-3">
                <span className="text-xl">{ACTION_ICONS[item.type] || '📊'}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {ACTION_NAMES[item.type] || item.type}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${item.dollars} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
