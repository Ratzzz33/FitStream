import React, { useState } from 'react';
import { X } from 'lucide-react';
import { InventoryItem } from '@fitstream/shared';

interface ProductMarkerProps {
  item: InventoryItem;
  onClick: () => void;
}

export const ProductMarker: React.FC<ProductMarkerProps> = ({ item, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const isDepleted = item.depleted || item.quantity <= 0;

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
      <div
        className={`
          relative flex items-center justify-center
          ${isHovered ? 'scale-110' : 'scale-100'}
          transition-transform duration-200
        `}
      >
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
          {isDepleted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500 stroke-[3]" />
            </div>
          )}

          <span className={`text-base ${isDepleted ? 'opacity-50' : ''}`}>
            {item.emoji || '🍽️'}
          </span>

          {isHovered && !isDepleted && (
            <span className="text-xs font-medium whitespace-nowrap max-w-[100px] truncate">
              {item.name}
            </span>
          )}

          {!isDepleted && daysLeft !== null && daysLeft <= 3 && (
            <span className={`text-xs font-bold ${isExpired || isExpiringSoon ? '' : 'text-amber-600'}`}>
              {isExpired ? '!' : `${daysLeft}d`}
            </span>
          )}
        </div>

        {!isDepleted && isExpiringSoon && !isExpired && (
          <div className="absolute inset-0 rounded-lg bg-amber-500 animate-ping opacity-30" />
        )}
      </div>

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
              Depleted
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
                    ? 'Expired!'
                    : daysLeft === 0
                      ? 'Expires today!'
                      : daysLeft === 1
                        ? '1 day left'
                        : `${daysLeft} days left`
                  }
                </div>
              )}
              {item.caloriesPer100 > 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {item.caloriesPer100} kcal/100{item.unit === 'ml' ? 'ml' : 'g'}
                </div>
              )}
            </>
          )}

          {isDepleted && (
            <div className="text-xs text-gray-400 mt-2 italic">
              Update photo to remove
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductMarker;
