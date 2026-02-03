// FridgeTracker-specific types
// Re-export shared inventory types for convenience
export type { KitchenStorage, InventoryItem, StoragePhoto, StorageType } from '@fitstream/shared';

// Re-export AI service types
export type {
  ScannedProduct,
  ProductWithPhotoId,
  DeduplicatedProduct,
  ScannedReceiptItem,
  ScannedReceipt,
} from './services/geminiService';

// App-specific types
export interface RecentProduct {
  name: string;
  emoji: string;
  unit: string;
  caloriesPer100: number;
  typicalQuantity: number;
  storageId: import('@fitstream/shared').StorageType;
}

export type AppView = 'inventory' | 'scan' | 'settings';
