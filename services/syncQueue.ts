/**
 * SyncQueue Service
 *
 * Handles offline-first data synchronization with Background Sync API.
 * Stores failed requests in IndexedDB and processes them when online.
 */

const DB_NAME = 'fitstream_sync';
const DB_VERSION = 1;
const STORE_NAME = 'pending_requests';

interface PendingRequest {
  id: string;
  type: 'EXERCISE' | 'WEIGHT' | 'NUTRITION' | 'SETTINGS' | 'BULK';
  data: any;
  userId: string;
  timestamp: number;
  retryCount: number;
  backendUrl: string;
}

class SyncQueueService {
  private db: IDBDatabase | null = null;
  private isProcessing = false;
  private onlineHandler: (() => void) | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not supported, sync queue disabled');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('SyncQueue: IndexedDB initialized');
        this.setupOnlineListener();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Setup listener for when device comes back online
   */
  private setupOnlineListener(): void {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }

    this.onlineHandler = () => {
      console.log('SyncQueue: Online detected, processing queue...');
      this.processQueue();
    };

    window.addEventListener('online', this.onlineHandler);

    // Also try Background Sync API if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        // @ts-ignore - SyncManager types
        registration.sync?.register('fitstream-sync').catch((err: Error) => {
          console.warn('Background Sync registration failed:', err);
        });
      });
    }
  }

  /**
   * Add a failed request to the queue
   */
  async addToQueue(request: Omit<PendingRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.db) {
      console.warn('SyncQueue: DB not initialized, skipping queue');
      return;
    }

    const pendingRequest: PendingRequest = {
      ...request,
      id: `${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const addRequest = store.add(pendingRequest);

      addRequest.onsuccess = () => {
        console.log(`SyncQueue: Added ${request.type} to queue`);
        this.dispatchQueueUpdate();
        resolve();
      };

      addRequest.onerror = () => {
        console.error('SyncQueue: Failed to add to queue:', addRequest.error);
        reject(addRequest.error);
      };
    });
  }

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();

      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => resolve(0);
    });
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<PendingRequest[]> {
    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => resolve([]);
    });
  }

  /**
   * Remove a processed request from queue
   */
  private async removeFromQueue(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        this.dispatchQueueUpdate();
        resolve();
      };
      deleteRequest.onerror = () => resolve();
    });
  }

  /**
   * Update retry count for a failed request
   */
  private async updateRetryCount(request: PendingRequest): Promise<void> {
    if (!this.db) return;

    request.retryCount += 1;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(request);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => resolve();
    });
  }

  /**
   * Process all pending requests
   */
  async processQueue(): Promise<{ success: number; failed: number }> {
    if (this.isProcessing || !navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    this.isProcessing = true;
    let success = 0;
    let failed = 0;

    try {
      const pending = await this.getPendingRequests();
      console.log(`SyncQueue: Processing ${pending.length} pending requests`);

      for (const request of pending) {
        // Skip if too many retries
        if (request.retryCount >= 5) {
          console.warn(`SyncQueue: Removing ${request.id} after 5 failed attempts`);
          await this.removeFromQueue(request.id);
          failed++;
          continue;
        }

        const processed = await this.processRequest(request);

        if (processed) {
          await this.removeFromQueue(request.id);
          success++;
        } else {
          await this.updateRetryCount(request);
          failed++;
        }
      }

      console.log(`SyncQueue: Processed ${success} success, ${failed} failed`);
    } finally {
      this.isProcessing = false;
    }

    return { success, failed };
  }

  /**
   * Process a single pending request
   */
  private async processRequest(request: PendingRequest): Promise<boolean> {
    const { ApiService } = await import('./api');

    try {
      switch (request.type) {
        case 'EXERCISE':
        case 'WEIGHT':
        case 'NUTRITION':
          return await ApiService.pushLog(
            request.userId,
            request.type,
            request.data,
            request.backendUrl
          );

        case 'SETTINGS':
          const result = await ApiService.syncUser(
            request.userId,
            request.data,
            request.backendUrl
          );
          return result !== null;

        case 'BULK':
          return await ApiService.pushBulk(
            request.userId,
            request.data,
            request.backendUrl
          );

        default:
          console.warn(`SyncQueue: Unknown request type: ${request.type}`);
          return false;
      }
    } catch (error) {
      console.error(`SyncQueue: Failed to process request:`, error);
      return false;
    }
  }

  /**
   * Dispatch custom event for UI updates
   */
  private dispatchQueueUpdate(): void {
    this.getPendingCount().then(count => {
      window.dispatchEvent(new CustomEvent('syncqueue-update', {
        detail: { pendingCount: count }
      }));
    });
  }

  /**
   * Clear all pending requests (use with caution)
   */
  async clearQueue(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        this.dispatchQueueUpdate();
        resolve();
      };
      clearRequest.onerror = () => resolve();
    });
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }
}

// Singleton instance
export const syncQueue = new SyncQueueService();

// Initialize on load
if (typeof window !== 'undefined') {
  syncQueue.init().catch(console.error);
}
