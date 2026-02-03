import React, { useState, useRef, TouchEvent } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Minus, PlusIcon } from 'lucide-react';
import { InventoryItem } from '@fitstream/shared';
import { StorageService } from '../services/storageService';

const SWIPE_THRESHOLD = 50;

interface ProductListProps {
  items: InventoryItem[];
  onUpdate: (item: InventoryItem) => void;
  onRemove: (id: string) => void;
  onAddMissing: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  items,
  onUpdate,
  onRemove,
  onAddMissing
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sort items: expiring soon first, then alphabetically
  const sortedItems = [...items].sort((a, b) => {
    if (a.expiresAt && b.expiresAt) {
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    }
    if (a.expiresAt) return -1;
    if (b.expiresAt) return 1;
    return a.name.localeCompare(b.name);
  });

  const getDaysUntilExpiry = (item: InventoryItem): number | null => {
    if (!item.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(item.expiresAt);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (item: InventoryItem) => {
    const days = getDaysUntilExpiry(item);
    if (days === null) return null;

    if (days < 0) {
      return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">Expired</span>;
    }
    if (days === 0) {
      return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full animate-pulse">Today!</span>;
    }
    if (days <= 2) {
      return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">{days}d</span>;
    }
    if (days <= 5) {
      return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">{days}d</span>;
    }
    return null;
  };

  const handleQuantityChange = (item: InventoryItem, delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    if (newQuantity === 0) {
      onRemove(item.id);
    } else {
      onUpdate({ ...item, quantity: newQuantity });
    }
  };

  // Swipe gesture handlers
  const touchStartRef = useRef<{ x: number; y: number; id: string } | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: TouchEvent, id: string) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      id
    };
  };

  const handleTouchMove = (e: TouchEvent, id: string) => {
    if (!touchStartRef.current || touchStartRef.current.id !== id) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    setSwipingId(id);
    setSwipeOffset(deltaX);
  };

  const handleTouchEnd = (item: InventoryItem) => {
    if (!touchStartRef.current || touchStartRef.current.id !== item.id) return;

    if (swipeOffset > SWIPE_THRESHOLD) {
      const newQuantity = Math.ceil(item.quantity * 1.5);
      onUpdate({ ...item, quantity: newQuantity });
    } else if (swipeOffset < -SWIPE_THRESHOLD) {
      const newQuantity = Math.max(1, Math.floor(item.quantity * 0.7));
      if (newQuantity <= 1) {
        onRemove(item.id);
      } else {
        onUpdate({ ...item, quantity: newQuantity });
      }
    }

    touchStartRef.current = null;
    setSwipingId(null);
    setSwipeOffset(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span>📋</span>
          <span className="font-medium dark:text-white">Products</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">({items.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Items list */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {sortedItems.map((item, index) => (
            <div
              key={item.id}
              onTouchStart={(e) => handleTouchStart(e, item.id)}
              onTouchMove={(e) => handleTouchMove(e, item.id)}
              onTouchEnd={() => handleTouchEnd(item)}
              style={{
                transform: swipingId === item.id ? `translateX(${swipeOffset}px)` : 'none',
                transition: swipingId === item.id ? 'none' : 'transform 0.2s ease-out',
                backgroundColor: swipingId === item.id && swipeOffset > SWIPE_THRESHOLD
                  ? 'rgba(34, 197, 94, 0.1)'
                  : swipingId === item.id && swipeOffset < -SWIPE_THRESHOLD
                    ? 'rgba(239, 68, 68, 0.1)'
                    : undefined
              }}
              className={`
                flex items-center gap-3 px-4 py-3 select-none touch-pan-y
                ${index !== sortedItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}
                hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
              `}
            >
              <span className="text-xl w-8 text-center">{item.emoji || '🍽️'}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium dark:text-white truncate">{item.name}</span>
                  {getExpiryBadge(item)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.quantity} {item.unit}
                  {item.caloriesPer100 > 0 && (
                    <span className="ml-2">· {item.caloriesPer100} kcal/100{item.unit === 'ml' ? 'ml' : 'g'}</span>
                  )}
                </div>
              </div>

              {editingId === item.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuantityChange(item, -getQuantityStep(item.unit))}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center font-medium dark:text-white">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item, getQuantityStep(item.unit))}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="ml-2 text-sm text-cyan-500"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingId(item.id)}
                    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={onAddMissing}
            className="w-full flex items-center justify-center gap-2 p-4 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add missing product</span>
          </button>
        </div>
      )}
    </div>
  );
};

const getQuantityStep = (unit: string): number => {
  switch (unit) {
    case 'pcs': return 1;
    case 'g': return 50;
    case 'ml': return 100;
    case 'kg': return 0.1;
    case 'l': return 0.1;
    default: return 1;
  }
};

export default ProductList;
