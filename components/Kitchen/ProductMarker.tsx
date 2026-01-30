import React, { useState } from 'react';
import { X } from 'lucide-react';
import { InventoryItem } from '../../types';

interface ProductMarkerProps {
  item: InventoryItem;
  onClick: () => void;
}

export const ProductMarker: React.FC<ProductMarkerProps> = ({ item, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Check if item is depleted (finished/used up)
  const isDepleted = item.depleted || item.quantity <= 0;

  // Calculate days until expiration
  const getDaysUntilExpiry = (): number | null => {
    if (!item.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(item.expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();
  const isExpiringSoon = daysLeft !== null && daysLeft <= 2;
  const isExpired = daysLeft !== null && daysLeft < 0;

  // Position styles
  const position = item.position || { x: 50, y: 50 };
  const style: React.CSSProperties = {
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)'
  };

  return (
    <div
      className="absolute cursor-pointer transition-all duration-200"
      style={style}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Marker dot */}
      <div
        className={`
          relative flex items-center justify-center
          ${isHovered ? 'scale-110' : 'scale-100'}
          transition-transform duration-200
        `}
      >
        {/* Background pill */}
        <div
          className={`
            flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg
            ${isDepleted
              ? 'bg-gray-400/80 text-gray-600 line-through'
              : isExpired
                ? 'bg-red-500 text-white'
                : isExpiringSoon
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-white'
            }
          `}
        >
          {/* Depleted X overlay */}
          {isDepleted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500 stroke-[3]" />
            </div>
          )}

          {/* Emoji */}
          <span className={`text-base ${isDepleted ? 'opacity-50' : ''}`}>
            {item.emoji || '🍽️'}
          </span>

          {/* Name (show on hover or always if compact) */}
          {isHovered && !isDepleted && (
            <span className="text-xs font-medium whitespace-nowrap max-w-[100px] truncate">
              {item.name}
            </span>
          )}

          {/* Expiry indicator (hide if depleted) */}
          {!isDepleted && daysLeft !== null && daysLeft <= 3 && (
            <span className={`text-xs font-bold ${isExpired || isExpiringSoon ? '' : 'text-amber-600'}`}>
              {isExpired ? '!' : `${daysLeft}д`}
            </span>
          )}
        </div>

        {/* Pulse animation for expiring items (not depleted) */}
        {!isDepleted && isExpiringSoon && !isExpired && (
          <div className="absolute inset-0 rounded-lg bg-amber-500 animate-ping opacity-30" />
        )}
      </div>

      {/* Expanded card on hover */}
      {isHovered && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10
            bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 min-w-[150px]
            border border-gray-200 dark:border-gray-700"
        >
          <div className={`text-sm font-medium dark:text-white mb-1 ${isDepleted ? 'line-through text-gray-400' : ''}`}>
            {item.emoji} {item.name}
          </div>

          {isDepleted ? (
            <div className="text-xs text-red-500 font-medium">
              ❌ Закончился
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {item.quantity} {item.unit}
              </div>
              {daysLeft !== null && (
                <div className={`text-xs mt-1 ${
                  isExpired ? 'text-red-500' :
                  isExpiringSoon ? 'text-amber-500' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {isExpired
                    ? '⚠️ Просрочено!'
                    : daysLeft === 0
                      ? '⚠️ Сегодня последний день!'
                      : daysLeft === 1
                        ? '⚠️ Осталось 1 день'
                        : `Годен ещё ${daysLeft} дн.`
                  }
                </div>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {item.caloriesPer100} ккал/100{item.unit === 'мл' ? 'мл' : 'г'}
              </div>
            </>
          )}

          {/* Hint to rescan */}
          {isDepleted && (
            <div className="text-xs text-gray-400 mt-2 italic">
              Обновите фото чтобы убрать
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductMarker;
