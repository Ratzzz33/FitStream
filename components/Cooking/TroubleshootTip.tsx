import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface TroubleshootOption {
  problem: string;
  solution: string;
  icon?: string;
}

interface TroubleshootTipProps {
  options: TroubleshootOption[];
  onClose: () => void;
}

export const TroubleshootTip: React.FC<TroubleshootTipProps> = ({
  options,
  onClose
}) => {
  if (options.length === 0) return null;

  const defaultIcons: Record<string, string> = {
    'Пригорает': '🔥',
    'Не жарится': '❄️',
    'Слишком сухо': '💧',
    'Слишком жидко': '🌊',
    'Не хватает ингредиента': '🛒'
  };

  const getIcon = (problem: string, customIcon?: string): string => {
    return customIcon || defaultIcons[problem] || '❓';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-md max-h-[70vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold dark:text-white">Что-то пошло не так?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3 overflow-auto">
          {options.map((option, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{getIcon(option.problem, option.icon)}</span>
                <span className="font-medium dark:text-white">{option.problem}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 pl-8">
                → {option.solution}
              </div>
            </div>
          ))}
        </div>

        {/* Close button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TroubleshootTip;
