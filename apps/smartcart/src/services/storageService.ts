// SmartCart Storage Service
// Extends BaseStorageService with inventory, shopping, and kitchen storage methods

import {
    BaseStorageService,
    KitchenStorage, InventoryItem, StorageType, StoragePhoto, NutritionLog,
    UserSettings
} from '@fitstream/shared';
import { ApiService } from '@fitstream/shared';

const KEYS = {
    KITCHEN_STORAGES: 'fitstream_kitchen_storages',
    INVENTORY: 'fitstream_inventory',
    NUTRITION: 'fitstream_nutrition',
    RECENT_PRODUCTS: 'fitstream_recent_products',
};

// Default kitchen storages
const DEFAULT_STORAGES: KitchenStorage[] = [
    { id: 'fridge', name: 'Fridge', type: 'fridge', lastUpdated: new Date().toISOString() },
    { id: 'cabinet', name: 'Cabinet', type: 'cabinet', lastUpdated: new Date().toISOString() },
    { id: 'freezer', name: 'Freezer', type: 'freezer', lastUpdated: new Date().toISOString() }
];

export const StorageService = {
    // === Delegate to BaseStorageService ===
    getUserId: BaseStorageService.getUserId,
    setUserId: BaseStorageService.setUserId,
    isLoggedIn: BaseStorageService.isLoggedIn,
    getSettings: BaseStorageService.getSettings,
    saveSettings: BaseStorageService.saveSettings,
    logout: BaseStorageService.logout,

    // === Kitchen Storages ===
    getStorages: (): KitchenStorage[] => {
        const data = localStorage.getItem(KEYS.KITCHEN_STORAGES);
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
        storages[idx].photo = photoBase64;

        localStorage.setItem(KEYS.KITCHEN_STORAGES, JSON.stringify(storages));

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

    getInventoryByStorage: (storageId: string): InventoryItem[] => {
        return StorageService.getInventory().filter(item => item.storageId === storageId);
    },

    // === Inventory ===
    getInventory: (): InventoryItem[] => {
        const data = localStorage.getItem(KEYS.INVENTORY);
        return data ? JSON.parse(data) : [];
    },

    getActiveInventory: (): InventoryItem[] => {
        return StorageService.getInventory().filter(item => !item.depleted);
    },

    saveInventoryItem: (item: InventoryItem): void => {
        const inventory = StorageService.getInventory();
        const existingIdx = inventory.findIndex(i => i.id === item.id);
        if (existingIdx !== -1) {
            inventory[existingIdx] = item;
        } else {
            inventory.push(item);
        }
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
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
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
        // Sync to backend
        const s = StorageService.getSettings();
        ApiService.pushLog(StorageService.getUserId(), 'INVENTORY' as any, { inventory }, s.backendUrl);
    },

    removeInventoryItem: (id: string): void => {
        const inventory = StorageService.getInventory().filter(i => i.id !== id);
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
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
            localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
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
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
    },

    // === Recent Products for Autocomplete ===
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
        const saved = localStorage.getItem(KEYS.RECENT_PRODUCTS);
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
        localStorage.setItem(KEYS.RECENT_PRODUCTS, JSON.stringify(trimmed));
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

    // === Nutrition Logs (for showcase context) ===
    getNutritionLogs: (): NutritionLog[] => {
        const data = localStorage.getItem(KEYS.NUTRITION);
        return data ? JSON.parse(data) : [];
    },
};
