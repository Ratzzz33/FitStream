import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Tag, RefreshCw, Camera, MoreHorizontal, X } from 'lucide-react';
import { InventoryItem, StoragePhoto as StoragePhotoType } from '@fitstream/shared';
import { ProductMarker } from './ProductMarker';

interface StoragePhotoProps {
  photos?: StoragePhotoType[];
  photo?: string;
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  onRefresh: () => void;
  onAddPhoto?: () => void;
  onRemovePhoto?: (photoId: string) => void;
  onLabelPhoto?: (photoId: string) => void;
  onReplacePhoto?: (photoId: string) => void;
  onRetryParse?: (photoId: string) => void;
  isRetrying?: string | null;
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
  const [showActions, setShowActions] = useState(false);

  const isMultiPhoto = photos && photos.length > 0;
  const photoList = isMultiPhoto ? photos : (photo ? [{ id: 'legacy', base64: photo, createdAt: new Date().toISOString() }] : []);
  const totalPhotos = photoList.length;

  if (totalPhotos === 0) return null;

  const currentPhoto = photoList[Math.min(currentPhotoIndex, totalPhotos - 1)];

  const itemsForCurrentPhoto = isMultiPhoto
    ? items.filter(item =>
        item.photoId === currentPhoto.id ||
        item.mergedFromPhotoIds?.includes(currentPhoto.id) ||
        (!item.photoId && !item.mergedFromPhotoIds)
      )
    : items;

  const itemsWithPosition = itemsForCurrentPhoto.filter(item => item.position);
  const activeItemsCount = itemsForCurrentPhoto.filter(i => !i.depleted && i.quantity > 0).length;
  const depletedCount = itemsForCurrentPhoto.filter(item => item.depleted || item.quantity <= 0).length;
  const hasNoProducts = activeItemsCount === 0;
  const isParseEmpty = currentPhoto.parseStatus === 'empty' || hasNoProducts;
  const isCurrentRetrying = isRetrying === currentPhoto.id;

  const goToPrev = () => setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : totalPhotos - 1));
  const goToNext = () => setCurrentPhotoIndex(prev => (prev < totalPhotos - 1 ? prev + 1 : 0));

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-900">
      <img
        src={currentPhoto.base64}
        alt="Storage"
        className="w-full h-auto max-h-[280px] object-cover"
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

      {/* Top info bar */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              {activeItemsCount} products
            </span>
            {totalPhotos > 1 && (
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                {currentPhotoIndex + 1}/{totalPhotos}
              </span>
            )}
            {currentPhoto.label && (
              <span className="px-2.5 py-1 bg-cyan-500/80 text-white text-xs font-medium rounded-full">
                {currentPhoto.label}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowActions(!showActions)}
            className="w-8 h-8 flex items-center justify-center bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
          >
            {showActions ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Actions dropdown */}
      {showActions && (
        <div className="absolute top-14 right-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden z-20 min-w-[160px] border border-gray-100 dark:border-gray-700">
          {onReplacePhoto && (
            <button
              onClick={() => { onReplacePhoto(currentPhoto.id); setShowActions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Camera className="w-4 h-4 text-cyan-500" />
              <span className="text-sm dark:text-white">Retake</span>
            </button>
          )}
          {onAddPhoto && (
            <button
              onClick={() => { onAddPhoto(); setShowActions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4 text-green-500" />
              <span className="text-sm dark:text-white">Add photo</span>
            </button>
          )}
          {isMultiPhoto && onLabelPhoto && (
            <button
              onClick={() => { onLabelPhoto(currentPhoto.id); setShowActions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Tag className="w-4 h-4 text-purple-500" />
              <span className="text-sm dark:text-white">Label</span>
            </button>
          )}
          {onRetryParse && (
            <button
              onClick={() => { onRetryParse(currentPhoto.id); setShowActions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-orange-500" />
              <span className="text-sm dark:text-white">Re-scan</span>
            </button>
          )}
          {isMultiPhoto && onRemovePhoto && totalPhotos > 1 && (
            <button
              onClick={() => { onRemovePhoto(currentPhoto.id); setShowActions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete photo</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation arrows */}
      {totalPhotos > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Empty state overlay */}
      {isParseEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          {isCurrentRetrying ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm font-medium">Scanning products...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-white/60" />
              </div>
              <p className="text-white font-medium">No products found</p>
              <div className="flex gap-2">
                {onRetryParse && (
                  <button
                    onClick={() => onRetryParse(currentPhoto.id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                )}
                {onReplacePhoto && (
                  <button
                    onClick={() => onReplacePhoto(currentPhoto.id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium text-sm hover:bg-cyan-600 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Retake
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Depleted items indicator */}
      {depletedCount > 0 && !isParseEmpty && (
        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-orange-500/90 text-white text-xs font-medium rounded-full flex items-center gap-1.5 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          {depletedCount} depleted
        </div>
      )}

      {/* Dots indicator */}
      {totalPhotos > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photoList.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setCurrentPhotoIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPhotoIndex
                  ? 'bg-white w-4'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default StoragePhoto;
