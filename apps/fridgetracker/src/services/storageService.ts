// FridgeTracker Storage Service
// Kitchen inventory management extending BaseStorageService from @fitstream/shared

import { KitchenStorage, InventoryItem, StorageType, StoragePhoto } from '@fitstream/shared';
import { BaseStorageService, ApiService } from '@fitstream/shared';

const KITCHEN_KEYS = {
  KITCHEN_STORAGES: 'fitstream_kitchen_storages',
  INVENTORY: 'fitstream_inventory',
  RECENT_PRODUCTS: 'fitstream_recent_products',
};

// Default kitchen storages
const DEFAULT_STORAGES: KitchenStorage[] = [
  { id: 'fridge', name: 'Fridge', type: 'fridge', lastUpdated: new Date().toISOString() },
  { id: 'cabinet', name: 'Cabinet', type: 'cabinet', lastUpdated: new Date().toISOString() },
  { id: 'freezer', name: 'Freezer', type: 'freezer', lastUpdated: new Date().toISOString() }
];

export const StorageService = {
  // Re-export base methods
  ...BaseStorageService,

  // === KITCHEN STORAGES ===

  getStorages: (): KitchenStorage[] => {
    const data = localStorage.getItem(KITCHEN_KEYS.KITCHEN_STORAGES);
    const storages = data ? JSON.parse(data) : DEFAULT_STORAGES;
    // Migration: convert old single photo to array
    return storages.map((s: KitchenStorage) => {
      if (s.photo && (!s.photos || s.photos.length === 0)) {
        s.photos = [{
          id: `photo_migrated_${Date.now()}`,
          base64: s.photo,
          createdAt: s.lastUpdated || new Date().toISOString()
        }];
      }
      return s;
    });
  },

  // Deprecated: for backward compatibility
  saveStoragePhoto: (storageId: string, photo: string): void => {
    StorageService.addStoragePhoto(storageId, photo);
    const storages = StorageService.getStorages();
    const idx = storages.findIndex(s => s.id === storageId);
    if (idx !== -1) {
      storages[idx].photo = photo;
      localStorage.setItem(KITCHEN_KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
    }
  },

  // === Multi-photo methods ===

  addStoragePhoto: (storageId: string, photoBase64: string, label?: string): string => {
    const storages = StorageService.getStorages();
    const idx = storages.findIndex(s => s.id === storageId);
    if (idx === -1) return '';

    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPhoto: StoragePhoto = {
      id: photoId,
      base64: photoBase64,
      createdAt: new Date().toISOString(),
      label
    };

    if (!storages[idx].photos) {
      storages[idx].photos = [];
    }
    storages[idx].photos!.push(newPhoto);
    storages[idx].lastUpdated = new Date().toISOString();
    storages[idx].photo = photoBase64; // legacy

    localStorage.setItem(KITCHEN_KEYS.KITCHEN_STORAGES, JSON.stringify(storages));

    // Sync to backend
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'KITCHEN_STORAGES' as any, { storages }, s.backendUrl);
    return photoId;
  },

  getStoragePhotos: (storageId: string): StoragePhoto[] => {
    const storages = StorageService.getStorages();
    const storage = storages.find(s => s.id === storageId);
    return storage?.photos || [];
  },

  removeStoragePhoto: (storageId: string, photoId: string): void => {
    const storages = StorageService.getStorages();
    const idx = storages.findIndex(s => s.id === storageId);
    if (idx === -1 || !storages[idx].photos) return;

    storages[idx].photos = storages[idx].photos!.filter(p => p.id !== photoId);
    storages[idx].lastUpdated = new Date().toISOString();

    // Update legacy field
    storages[idx].photo = storages[idx].photos!.length > 0
      ? storages[idx].photos![storages[idx].photos!.length - 1].base64
      : undefined;

    // Remove inventory items linked only to this photo
    const inventory = StorageService.getInventory();
    const updatedInventory = inventory.filter(item => {
      if (item.source !== 'photo') return true;
      if (item.photoId !== photoId) {
        if (item.mergedFromPhotoIds?.includes(photoId)) {
          item.mergedFromPhotoIds = item.mergedFromPhotoIds.filter(id => id !== photoId);
          return item.mergedFromPhotoIds.length > 0 || (item.photoId && item.photoId !== photoId);
        }
        return true;
      }
      return item.mergedFromPhotoIds && item.mergedFromPhotoIds.length > 0;
    });

    localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(updatedInventory));
    localStorage.setItem(KITCHEN_KEYS.KITCHEN_STORAGES, JSON.stringify(storages));

    // Sync to backend
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'KITCHEN_STORAGES' as any, { storages }, s.backendUrl);
    ApiService.pushLog(StorageService.getUserId(), 'INVENTORY' as any, { inventory: updatedInventory }, s.backendUrl);
  },

  updateStoragePhotoLabel: (storageId: string, photoId: string, label: string): void => {
    const storages = StorageService.getStorages();
    const storage = storages.find(s => s.id === storageId);
    if (!storage?.photos) return;

    const photo = storage.photos.find(p => p.id === photoId);
    if (photo) {
      photo.label = label;
      localStorage.setItem(KITCHEN_KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
    }
  },

  updateStoragePhotoParseStatus: (storageId: string, photoId: string, status: 'success' | 'empty' | 'error'): void => {
    const storages = StorageService.getStorages();
    const storage = storages.find(s => s.id === storageId);
    if (!storage?.photos) return;

    const photo = storage.photos.find(p => p.id === photoId);
    if (photo) {
      photo.parseStatus = status;
      localStorage.setItem(KITCHEN_KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
    }
  },

  replaceStoragePhoto: (storageId: string, oldPhotoId: string, newPhotoBase64: string): string => {
    const storages = StorageService.getStorages();
    const storage = storages.find(s => s.id === storageId);
    if (!storage?.photos) return '';

    const photoIdx = storage.photos.findIndex(p => p.id === oldPhotoId);
    if (photoIdx === -1) return '';

    const oldLabel = storage.photos[photoIdx].label;
    const newPhotoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storage.photos[photoIdx] = {
      id: newPhotoId,
      base64: newPhotoBase64,
      createdAt: new Date().toISOString(),
      label: oldLabel
    };

    storage.lastUpdated = new Date().toISOString();
    storage.photo = newPhotoBase64; // legacy

    // Update inventory items - transfer from old photoId to new
    const inventory = StorageService.getInventory();
    inventory.forEach(item => {
      if (item.photoId === oldPhotoId) {
        item.photoId = newPhotoId;
      }
      if (item.mergedFromPhotoIds?.includes(oldPhotoId)) {
        item.mergedFromPhotoIds = item.mergedFromPhotoIds.map(id =>
          id === oldPhotoId ? newPhotoId : id
        );
      }
    });

    localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(inventory));
    localStorage.setItem(KITCHEN_KEYS.KITCHEN_STORAGES, JSON.stringify(storages));

    return newPhotoId;
  },

  clearStoragePhotos: (storageId: string): void => {
    const storages = StorageService.getStorages();
    const idx = storages.findIndex(s => s.id === storageId);
    if (idx === -1) return;

    storages[idx].photos = [];
    storages[idx].photo = undefined;
    storages[idx].lastUpdated = new Date().toISOString();

    // Remove all photo-based inventory items for this storage
    const inventory = StorageService.getInventory().filter(
      item => item.storageId !== storageId || item.source !== 'photo'
    );

    localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(inventory));
    localStorage.setItem(KITCHEN_KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
  },

  clearDepletedForPhoto: (photoId: string): void => {
    const inventory = StorageService.getInventory().filter(item => {
      if (item.depleted && item.photoId === photoId) {
        return false;
      }
      if (item.depleted && item.mergedFromPhotoIds?.includes(photoId)) {
        item.mergedFromPhotoIds = item.mergedFromPhotoIds.filter(id => id !== photoId);
        return item.mergedFromPhotoIds.length > 0;
      }
      return true;
    });
    localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(inventory));
  },

  // === INVENTORY ===

  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(KITCHEN_KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  },

  getActiveInventory: (): InventoryItem[] => {
    return StorageService.getInventory().filter(item => !item.depleted);
  },

  getInventoryWithDepleted: (storageId?: string): InventoryItem[] => {
    const inventory = StorageService.getInventory();
    return storageId
      ? inventory.filter(i => i.storageId === storageId)
      : inventory;
  },

  getInventoryByStorage: (storageId: string): InventoryItem[] => {
    return StorageService.getInventory().filter(item => item.storageId === storageId);
  },

  getInventoryByPhoto: (photoId: string): InventoryItem[] => {
    return StorageService.getInventory().filter(item =>
      item.photoId === photoId || item.mergedFromPhotoIds?.includes(photoId)
    );
  },

  saveInventoryItem: (item: InventoryItem): void => {
    const inventory = StorageService.getInventory();
    const existingIdx = inventory.findIndex(i => i.id === item.id);
    if (existingIdx !== -1) {
      inventory[existingIdx] = item;
    } else {
      inventory.push(item);
    }
    localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(inventory));
    // Sync to backend
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'INVENTORY' as any, { inventory }, s.backendUrl);
  },

  saveInventoryBulk: (items: InventoryItem[]): void => {
    const inventory = StorageService.getInventory();
    items.forEach(item => {
      const existingIdx = inventory.findIndex(i => i.id === item.id);
      if (existingIdx !== -1) {
        inventory[existingIdx] = item;
      } else {
        inventory.push(item);
      }
    });
    localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(inventory));
    // Sync to backend
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'INVENTORY' as any, { inventory }, s.backendUrl);
  },

  removeInventoryItem: (id: string): void => {
    const inventory = StorageService.getInventory().filter(i => i.id !== id);
    localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(inventory));
    // Sync to backend
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'INVENTORY' as any, { inventory }, s.backendUrl);
  },

  updateInventoryQuantity: (id: string, newQuantity: number): void => {
    const inventory = StorageService.getInventory();
    const idx = inventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      if (newQuantity <= 0) {
        inventory[idx].quantity = 0;
        inventory[idx].depleted = true;
        inventory[idx].depletedAt = new Date().toISOString();
      } else {
        inventory[idx].quantity = newQuantity;
        if (inventory[idx].depleted) {
          inventory[idx].depleted = false;
          inventory[idx].depletedAt = undefined;
        }
      }
      localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(inventory));
    }
  },

  consumeInventoryItems: (items: { itemId: string; quantity: number }[]): void => {
    const inventory = StorageService.getInventory();
    items.forEach(({ itemId, quantity }) => {
      const idx = inventory.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        inventory[idx].quantity -= quantity;
        if (inventory[idx].quantity <= 0) {
          inventory.splice(idx, 1);
        }
      }
    });
    localStorage.setItem(KITCHEN_KEYS.INVENTORY, JSON.stringify(inventory));
  },

  // === EXPIRATION ===

  getExpiringItems: (days: number = 3): InventoryItem[] => {
    const inventory = StorageService.getInventory();
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return inventory.filter(item => {
      if (!item.expiresAt) return false;
      const expDate = new Date(item.expiresAt);
      return expDate <= threshold && expDate >= now;
    }).sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());
  },

  getExpiredItems: (): InventoryItem[] => {
    const inventory = StorageService.getInventory();
    const now = new Date();
    return inventory.filter(item => {
      if (!item.expiresAt) return false;
      return new Date(item.expiresAt) < now;
    });
  },

  // === RECENT PRODUCTS (Quick-Add Autocomplete) ===

  getRecentProducts: (): Array<{
    name: string;
    emoji: string;
    unit: string;
    caloriesPer100: number;
    typicalQuantity: number;
    storageId: StorageType;
    lastUsed: string;
    useCount: number;
  }> => {
    const saved = localStorage.getItem(KITCHEN_KEYS.RECENT_PRODUCTS);
    return saved ? JSON.parse(saved) : [];
  },

  trackProductUsage: (item: InventoryItem): void => {
    const recent = StorageService.getRecentProducts();
    const existingIndex = recent.findIndex(
      (p: { name: string }) => p.name.toLowerCase() === item.name.toLowerCase()
    );

    const productData = {
      name: item.name,
      emoji: item.emoji || '',
      unit: item.unit,
      caloriesPer100: item.caloriesPer100 || 0,
      typicalQuantity: item.quantity,
      storageId: item.storageId as StorageType,
      lastUsed: new Date().toISOString(),
      useCount: 1
    };

    if (existingIndex >= 0) {
      productData.useCount = recent[existingIndex].useCount + 1;
      recent.splice(existingIndex, 1);
    }

    recent.unshift(productData);

    // Keep last 50 products
    const trimmed = recent.slice(0, 50);
    localStorage.setItem(KITCHEN_KEYS.RECENT_PRODUCTS, JSON.stringify(trimmed));
  },

  getFrequentProducts: (limit: number = 5): Array<{
    name: string;
    emoji: string;
    unit: string;
    caloriesPer100: number;
    typicalQuantity: number;
    storageId: StorageType;
  }> => {
    const recent = StorageService.getRecentProducts();
    return recent
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, limit)
      .map(({ name, emoji, unit, caloriesPer100, typicalQuantity, storageId }) => ({
        name, emoji, unit, caloriesPer100, typicalQuantity, storageId
      }));
  },

  searchRecentProducts: (query: string): Array<{
    name: string;
    emoji: string;
    unit: string;
    caloriesPer100: number;
    typicalQuantity: number;
    storageId: StorageType;
  }> => {
    const recent = StorageService.getRecentProducts();
    const lowerQuery = query.toLowerCase();
    return recent
      .filter((p) => p.name.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .map(({ name, emoji, unit, caloriesPer100, typicalQuantity, storageId }) => ({
        name, emoji, unit, caloriesPer100, typicalQuantity, storageId
      }));
  },

  // === SYNC ===

  syncKitchenData: () => {
    const s = StorageService.getSettings();
    const userId = StorageService.getUserId();

    const inventory = StorageService.getInventory();
    ApiService.pushLog(userId, 'INVENTORY' as any, { items: inventory }, s.backendUrl);

    const storages = StorageService.getStorages();
    ApiService.pushLog(userId, 'KITCHEN_STORAGES' as any, { storages }, s.backendUrl);
  },
};
