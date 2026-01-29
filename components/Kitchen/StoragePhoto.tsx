import React from 'react';
import { RefreshCw } from 'lucide-react';
import { InventoryItem } from '../../types';
import { ProductMarker } from './ProductMarker';

interface StoragePhotoProps {
  photo: string;
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  onRefresh: () => void;
}

export const StoragePhoto: React.FC<StoragePhotoProps> = ({
  photo,
  items,
  onItemClick,
  onRefresh
}) => {
  // Filter items that have position data
  const itemsWithPosition = items.filter(item => item.position);

  return (
    <div className="relative rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
      {/* Photo */}
      <img
        src={photo}
        alt="Storage"
        className="w-full h-auto max-h-[300px] object-cover"
      />

      {/* Product markers overlay */}
      <div className="absolute inset-0">
        {itemsWithPosition.map(item => (
          <ProductMarker
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="text-sm font-medium">Обновить фото</span>
      </button>

      {/* Items count badge */}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
        {items.length} продуктов
      </div>
    </div>
  );
};

export default StoragePhoto;
