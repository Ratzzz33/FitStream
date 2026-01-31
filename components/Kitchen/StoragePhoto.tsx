import React, { useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, Plus, Trash2, Tag, Replace, AlertTriangle, RotateCcw } from 'lucide-react';
import { InventoryItem, StoragePhoto as StoragePhotoType } from '../../types';
import { ProductMarker } from './ProductMarker';

interface StoragePhotoProps {
  // Мультифото режим
  photos?: StoragePhotoType[];
  // Legacy single photo
  photo?: string;
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  onRefresh: () => void;
  onAddPhoto?: () => void;
  onRemovePhoto?: (photoId: string) => void;
  onLabelPhoto?: (photoId: string) => void;
  onReplacePhoto?: (photoId: string) => void; // Заменить фото (тот же ракурс)
  onRetryParse?: (photoId: string) => void; // Повторить парсинг для этого фото
  isRetrying?: string | null; // photoId который сейчас парсится
}

export const StoragePhoto: React.FC<StoragePhotoProps> = ({
  photos,
  photo,
  items,
  onItemClick,
  onRefresh,
  onAddPhoto,
  onRemovePhoto,
  onLabelPhoto,
  onReplacePhoto,
  onRetryParse,
  isRetrying
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Определяем режим работы
  const isMultiPhoto = photos && photos.length > 0;
  const photoList = isMultiPhoto ? photos : (photo ? [{ id: 'legacy', base64: photo, createdAt: new Date().toISOString() }] : []);
  const totalPhotos = photoList.length;

  if (totalPhotos === 0) return null;

  const currentPhoto = photoList[Math.min(currentPhotoIndex, totalPhotos - 1)];

  // Фильтруем items для текущего фото
  const itemsForCurrentPhoto = isMultiPhoto
    ? items.filter(item =>
        item.photoId === currentPhoto.id ||
        item.mergedFromPhotoIds?.includes(currentPhoto.id) ||
        // Для legacy позиций без photoId — показываем на всех
        (!item.photoId && !item.mergedFromPhotoIds)
      )
    : items;

  // Items с позициями для overlay
  const itemsWithPosition = itemsForCurrentPhoto.filter(item => item.position);

  // Count depleted items for this photo
  const depletedCount = itemsForCurrentPhoto.filter(item => item.depleted || item.quantity <= 0).length;

  // Check if this photo has no products (empty parse result)
  const hasNoProducts = itemsForCurrentPhoto.filter(i => !i.depleted && i.quantity > 0).length === 0;
  const isParseEmpty = currentPhoto.parseStatus === 'empty' || hasNoProducts;
  const isCurrentRetrying = isRetrying === currentPhoto.id;

  const goToPrev = () => {
    setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : totalPhotos - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex(prev => (prev < totalPhotos - 1 ? prev + 1 : 0));
  };

  return (
    <div className="relative rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
      {/* Photo */}
      <img
        src={currentPhoto.base64}
        alt="Storage"
        className="w-full h-auto max-h-[300px] object-cover"
      />

      {/* Product markers overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {itemsWithPosition.map(item => (
          <div key={item.id} className="pointer-events-auto">
            <ProductMarker
              item={item}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows for multi-photo */}
      {totalPhotos > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Photo counter & label */}
      <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
        <div className="px-3 py-1 bg-black/60 text-white text-sm rounded-full">
          {itemsForCurrentPhoto.filter(i => !i.depleted && i.quantity > 0).length} продуктов
        </div>
        {totalPhotos > 1 && (
          <div className="px-3 py-1 bg-blue-500/80 text-white text-sm rounded-full">
            {currentPhotoIndex + 1} / {totalPhotos}
          </div>
        )}
        {currentPhoto.label && (
          <div className="px-3 py-1 bg-purple-500/80 text-white text-sm rounded-full">
            {currentPhoto.label}
          </div>
        )}
        {/* Depleted items indicator */}
        {depletedCount > 0 && (
          <div className="px-3 py-1 bg-red-500/80 text-white text-sm rounded-full flex items-center gap-1">
            <span>❌</span>
            <span>{depletedCount} закончились</span>
          </div>
        )}
        {/* Empty parse warning badge */}
        {isParseEmpty && !isCurrentRetrying && (
          <div className="px-3 py-1 bg-amber-500/80 text-white text-sm rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Empty state with retry button */}
      {isParseEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          {isCurrentRetrying ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm">Распознаём...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-white font-medium">Нет продуктов</p>
              {onRetryParse && (
                <button
                  onClick={() => onRetryParse(currentPhoto.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Повторить</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dots indicator for multiple photos */}
      {totalPhotos > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
          {photoList.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setCurrentPhotoIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentPhotoIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Bottom actions bar */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {/* Label button */}
        {isMultiPhoto && onLabelPhoto && (
          <button
            onClick={() => onLabelPhoto(currentPhoto.id)}
            className="flex items-center gap-1 px-2 py-2 bg-purple-500/90 hover:bg-purple-600 text-white rounded-lg shadow-lg transition-colors"
            title="Добавить метку"
          >
            <Tag className="w-4 h-4" />
          </button>
        )}

        {/* Delete photo button */}
        {isMultiPhoto && onRemovePhoto && totalPhotos > 1 && (
          <button
            onClick={() => onRemovePhoto(currentPhoto.id)}
            className="flex items-center gap-1 px-2 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
            title="Удалить фото"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Replace photo button (same angle, new photo) */}
        {onReplacePhoto && (
          <button
            onClick={() => onReplacePhoto(currentPhoto.id)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg shadow-lg transition-colors ${
              depletedCount > 0
                ? 'bg-orange-500/90 hover:bg-orange-600 text-white animate-pulse'
                : 'bg-blue-500/90 hover:bg-blue-600 text-white'
            }`}
            title="Заменить фото (тот же ракурс)"
          >
            <Replace className="w-4 h-4" />
            <span className="text-sm font-medium">Заменить</span>
          </button>
        )}

        {/* Add more photos button */}
        {onAddPhoto && (
          <button
            onClick={onAddPhoto}
            className="flex items-center gap-1 px-3 py-2 bg-green-500/90 hover:bg-green-600 text-white rounded-lg shadow-lg transition-colors"
            title="Добавить ещё фото"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Ещё</span>
          </button>
        )}
      </div>

      {/* Swipe hint for mobile */}
      {totalPhotos > 1 && currentPhotoIndex === 0 && (
        <div className="absolute bottom-20 right-4 px-3 py-1 bg-black/40 text-white text-xs rounded-full animate-pulse">
          Листайте →
        </div>
      )}
    </div>
  );
};

export default StoragePhoto;
