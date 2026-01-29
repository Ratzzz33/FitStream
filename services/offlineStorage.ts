/**
 * Offline Storage Service
 *
 * Uses IndexedDB to store photos and large data that can't fit in localStorage.
 * Handles sync queue for pending items that need to be processed when online.
 */

import { PendingItem, NutritionLog, WeightLog, ExerciseLog } from '../types';

const DB_NAME = 'fitstream_offline';
const DB_VERSION = 1;

// Store names
const STORES = {
  PHOTOS: 'photos',
  PENDING_ITEMS: 'pending_items',
  PENDING_PHOTOS: 'pending_photos' // Photos waiting for AI analysis
};

interface StoredPhoto {
  id: string;
  data: string; // Base64 encoded
  mimeType: string;
  createdAt: number;
  linkedItemId?: string; // ID of NutritionLog or WeightLog
  linkedItemType?: 'NUTRITION' | 'WEIGHT';
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Photos store
        if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
          const photoStore = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
          photoStore.createIndex('linkedItemId', 'linkedItemId', { unique: false });
          photoStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Pending items store (for sync queue)
        if (!db.objectStoreNames.contains(STORES.PENDING_ITEMS)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_ITEMS, { keyPath: 'id' });
          pendingStore.createIndex('type', 'type', { unique: false });
          pendingStore.createIndex('createdAt', 'createdAt', { unique: false });
          pendingStore.createIndex('needsAiAnalysis', 'needsAiAnalysis', { unique: false });
        }

        // Pending photos store (photos waiting for AI analysis)
        if (!db.objectStoreNames.contains(STORES.PENDING_PHOTOS)) {
          const pendingPhotosStore = db.createObjectStore(STORES.PENDING_PHOTOS, { keyPath: 'id' });
          pendingPhotosStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    await this.dbReady;
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
    return this.db;
  }

  // ============ PHOTO STORAGE ============

  /**
   * Save a photo to IndexedDB
   */
  async savePhoto(
    base64Data: string,
    mimeType: string = 'image/jpeg',
    linkedItemId?: string,
    linkedItemType?: 'NUTRITION' | 'WEIGHT'
  ): Promise<string> {
    const db = await this.ensureDB();
    const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const photo: StoredPhoto = {
      id,
      data: base64Data,
      mimeType,
      createdAt: Date.now(),
      linkedItemId,
      linkedItemType
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PHOTOS);
      const request = store.add(photo);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a photo by ID
   */
  async getPhoto(id: string): Promise<StoredPhoto | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readonly');
      const store = tx.objectStore(STORES.PHOTOS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a photo by ID
   */
  async deletePhoto(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PHOTOS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all photos for a linked item
   */
  async getPhotosForItem(linkedItemId: string): Promise<StoredPhoto[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readonly');
      const store = tx.objectStore(STORES.PHOTOS);
      const index = store.index('linkedItemId');
      const request = index.getAll(linkedItemId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ PENDING ITEMS QUEUE ============

  /**
   * Add item to sync queue
   */
  async addPendingItem(item: Omit<PendingItem, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const db = await this.ensureDB();
    const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pendingItem: PendingItem = {
      ...item,
      id,
      createdAt: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_ITEMS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_ITEMS);
      const request = store.add(pendingItem);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending items
   */
  async getPendingItems(): Promise<PendingItem[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_ITEMS, 'readonly');
      const store = tx.objectStore(STORES.PENDING_ITEMS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pending items that need AI analysis
   */
  async getPendingAiItems(): Promise<PendingItem[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_ITEMS, 'readonly');
      const store = tx.objectStore(STORES.PENDING_ITEMS);
      const index = store.index('needsAiAnalysis');
      const request = index.getAll(true);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a pending item
   */
  async updatePendingItem(item: PendingItem): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_ITEMS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_ITEMS);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove a pending item
   */
  async removePendingItem(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_ITEMS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_ITEMS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_ITEMS, 'readonly');
      const store = tx.objectStore(STORES.PENDING_ITEMS);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ PENDING PHOTOS (FOR AI ANALYSIS) ============

  /**
   * Save a photo that needs AI analysis when online
   */
  async savePendingPhoto(
    base64Data: string,
    analysisType: 'FOOD' | 'SCALE' | 'MENU',
    metadata?: Record<string, any>
  ): Promise<string> {
    const db = await this.ensureDB();
    const id = `pending_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pendingPhoto = {
      id,
      data: base64Data,
      analysisType,
      metadata: metadata || {},
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_PHOTOS);
      const request = store.add(pendingPhoto);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending photos
   */
  async getPendingPhotos(): Promise<Array<{
    id: string;
    data: string;
    analysisType: 'FOOD' | 'SCALE' | 'MENU';
    metadata: Record<string, any>;
    createdAt: number;
  }>> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_PHOTOS, 'readonly');
      const store = tx.objectStore(STORES.PENDING_PHOTOS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove a pending photo
   */
  async removePendingPhoto(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_PHOTOS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ CLEANUP ============

  /**
   * Clean up old photos (older than 30 days)
   */
  async cleanupOldPhotos(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const db = await this.ensureDB();
    const cutoff = Date.now() - maxAgeMs;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PHOTOS);
      const index = store.index('createdAt');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(deletedCount);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get storage usage estimate
   */
  async getStorageUsage(): Promise<{ photos: number; pending: number }> {
    const db = await this.ensureDB();

    const getCount = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };

    const [photos, pending] = await Promise.all([
      getCount(STORES.PHOTOS),
      getCount(STORES.PENDING_ITEMS)
    ]);

    return { photos, pending };
  }
}

// Singleton export
export const offlineStorage = new OfflineStorageService();
