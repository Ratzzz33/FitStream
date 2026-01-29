/**
 * Sync Queue Service
 *
 * Manages synchronization of offline data when connectivity is restored.
 * Processes pending items including those that need AI analysis.
 */

import { offlineStorage } from './offlineStorage';
import { StorageService } from './storageService';
import { NutritionLog, WeightLog, ExerciseLog, PendingItem } from '../types';
import * as GeminiService from './geminiService';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncTime: number | null;
  errorMessage?: string;
}

class SyncQueueService {
  private state: SyncState = {
    status: 'idle',
    pendingCount: 0,
    lastSyncTime: null
  };

  private listeners: Set<(state: SyncState) => void> = new Set();
  private isProcessing = false;
  private onlineHandler: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Update pending count on init
    this.state.pendingCount = await offlineStorage.getPendingCount();

    // Listen for online events
    if (typeof window !== 'undefined') {
      this.onlineHandler = () => this.processQueue();
      window.addEventListener('online', this.onlineHandler);

      // Process queue if already online
      if (navigator.onLine) {
        this.processQueue();
      }
    }
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state); // Immediately notify with current state
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private updateState(partial: Partial<SyncState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Add a nutrition log to the queue (with optional photo for AI analysis)
   */
  async queueNutritionLog(
    log: NutritionLog,
    photoBase64?: string,
    needsAiAnalysis: boolean = false
  ): Promise<void> {
    let photoId: string | undefined;

    // Save photo if provided
    if (photoBase64) {
      photoId = await offlineStorage.savePhoto(
        photoBase64,
        'image/jpeg',
        log.id,
        'NUTRITION'
      );
      log.photoId = photoId;
    }

    // If needs AI analysis and offline, queue for later
    if (needsAiAnalysis && !navigator.onLine) {
      await offlineStorage.addPendingItem({
        type: 'NUTRITION',
        data: log,
        photoId,
        needsAiAnalysis: true
      });
      log.pendingAiAnalysis = true;
    }

    // Save to local storage
    StorageService.saveNutrition(log);

    this.state.pendingCount = await offlineStorage.getPendingCount();
    this.notify();
  }

  /**
   * Add a weight log to the queue (with optional photo for AI analysis)
   */
  async queueWeightLog(
    log: WeightLog,
    photoBase64?: string,
    needsAiAnalysis: boolean = false
  ): Promise<void> {
    let photoId: string | undefined;

    // Save photo if provided
    if (photoBase64) {
      photoId = await offlineStorage.savePhoto(
        photoBase64,
        'image/jpeg',
        log.id,
        'WEIGHT'
      );
      log.photoId = photoId;
    }

    // If needs AI analysis and offline, queue for later
    if (needsAiAnalysis && !navigator.onLine) {
      await offlineStorage.addPendingItem({
        type: 'WEIGHT',
        data: log,
        photoId,
        needsAiAnalysis: true
      });
      log.pendingAiAnalysis = true;
    }

    // Save to local storage
    StorageService.saveWeight(log);

    this.state.pendingCount = await offlineStorage.getPendingCount();
    this.notify();
  }

  /**
   * Queue a photo for AI analysis when online
   */
  async queuePhotoForAnalysis(
    photoBase64: string,
    analysisType: 'FOOD' | 'SCALE' | 'MENU',
    metadata?: Record<string, any>
  ): Promise<string> {
    const photoId = await offlineStorage.savePendingPhoto(
      photoBase64,
      analysisType,
      metadata
    );

    this.state.pendingCount = await offlineStorage.getPendingCount();
    this.notify();

    return photoId;
  }

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    this.updateState({ status: 'syncing' });

    try {
      // Process pending items
      const pendingItems = await offlineStorage.getPendingItems();

      for (const item of pendingItems) {
        try {
          await this.processPendingItem(item);
          await offlineStorage.removePendingItem(item.id);
        } catch (error) {
          console.error('Error processing pending item:', error);
          // Increment retry count
          item.retryCount++;
          if (item.retryCount < 3) {
            await offlineStorage.updatePendingItem(item);
          } else {
            // Give up after 3 retries
            await offlineStorage.removePendingItem(item.id);
          }
        }
      }

      // Process pending photos for AI analysis
      const pendingPhotos = await offlineStorage.getPendingPhotos();

      for (const photo of pendingPhotos) {
        try {
          await this.processPhotoAnalysis(photo);
          await offlineStorage.removePendingPhoto(photo.id);
        } catch (error) {
          console.error('Error processing pending photo:', error);
        }
      }

      this.state.pendingCount = await offlineStorage.getPendingCount();
      this.updateState({
        status: 'idle',
        lastSyncTime: Date.now(),
        errorMessage: undefined
      });
    } catch (error) {
      console.error('Sync queue error:', error);
      this.updateState({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Sync failed'
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single pending item
   */
  private async processPendingItem(item: PendingItem): Promise<void> {
    if (!item.needsAiAnalysis) {
      // Just needs to sync to backend - already saved locally
      return;
    }

    // Get photo if exists
    let photoBase64: string | undefined;
    if (item.photoId) {
      const photo = await offlineStorage.getPhoto(item.photoId);
      if (photo) {
        photoBase64 = photo.data;
      }
    }

    switch (item.type) {
      case 'NUTRITION':
        if (photoBase64) {
          await this.processNutritionWithAi(item.data as NutritionLog, photoBase64);
        }
        break;
      case 'WEIGHT':
        if (photoBase64) {
          await this.processWeightWithAi(item.data as WeightLog, photoBase64);
        }
        break;
    }
  }

  /**
   * Process nutrition item with AI
   */
  private async processNutritionWithAi(log: NutritionLog, photoBase64: string): Promise<void> {
    const settings = StorageService.getSettings();

    try {
      const result = await GeminiService.analyzeFood(
        photoBase64,
        settings.referenceObject,
        settings.referenceDimensions
      );

      if (result) {
        // Update the log with AI results
        const updatedLog: NutritionLog = {
          ...log,
          name: result.name,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          pendingAiAnalysis: false
        };

        // Update in storage
        const logs = StorageService.getNutritionLogs();
        const index = logs.findIndex(l => l.id === log.id);
        if (index !== -1) {
          logs[index] = updatedLog;
          localStorage.setItem('fitstream_nutrition', JSON.stringify(logs));
        }
      }
    } catch (error) {
      console.error('AI nutrition analysis failed:', error);
      throw error;
    }
  }

  /**
   * Process weight item with AI
   */
  private async processWeightWithAi(log: WeightLog, photoBase64: string): Promise<void> {
    const settings = StorageService.getSettings();

    try {
      const result = await GeminiService.scanScaleDisplay(photoBase64);

      if (result && result.confidence === 'HIGH') {
        let weight = result.weight;

        // Subtract phone weight if set
        if (settings.phoneWeight && settings.phoneWeight > 0) {
          weight -= settings.phoneWeight;
        }

        // Update the log with AI results
        const updatedLog: WeightLog = {
          ...log,
          weight: Math.round(weight * 10) / 10,
          pendingAiAnalysis: false
        };

        // Update in storage
        const weights = StorageService.getWeights();
        const index = weights.findIndex(w => w.id === log.id);
        if (index !== -1) {
          weights[index] = updatedLog;
          localStorage.setItem('fitstream_weights', JSON.stringify(weights));
        }
      }
    } catch (error) {
      console.error('AI weight analysis failed:', error);
      throw error;
    }
  }

  /**
   * Process a pending photo analysis
   */
  private async processPhotoAnalysis(photo: {
    id: string;
    data: string;
    analysisType: 'FOOD' | 'SCALE' | 'MENU';
    metadata: Record<string, any>;
    createdAt: number;
  }): Promise<void> {
    const settings = StorageService.getSettings();

    switch (photo.analysisType) {
      case 'FOOD':
        const foodResult = await GeminiService.analyzeFood(
          photo.data,
          settings.referenceObject,
          settings.referenceDimensions
        );
        // Notify listeners with result
        this.dispatchAnalysisResult('FOOD', foodResult, photo.metadata);
        break;

      case 'SCALE':
        const scaleResult = await GeminiService.scanScaleDisplay(photo.data);
        this.dispatchAnalysisResult('SCALE', scaleResult, photo.metadata);
        break;

      case 'MENU':
        const menuResult = await GeminiService.analyzeMenu(photo.data);
        this.dispatchAnalysisResult('MENU', menuResult, photo.metadata);
        break;
    }
  }

  private analysisResultListeners: Map<string, (type: string, result: any, metadata: any) => void> = new Map();

  /**
   * Register for analysis result notifications
   */
  onAnalysisResult(id: string, callback: (type: string, result: any, metadata: any) => void): () => void {
    this.analysisResultListeners.set(id, callback);
    return () => this.analysisResultListeners.delete(id);
  }

  private dispatchAnalysisResult(type: string, result: any, metadata: any) {
    this.analysisResultListeners.forEach(callback => callback(type, result, metadata));
  }

  /**
   * Force sync now
   */
  async syncNow(): Promise<void> {
    if (navigator.onLine) {
      await this.processQueue();
    }
  }

  /**
   * Clear all pending items
   */
  async clearQueue(): Promise<void> {
    const items = await offlineStorage.getPendingItems();
    for (const item of items) {
      await offlineStorage.removePendingItem(item.id);
    }

    const photos = await offlineStorage.getPendingPhotos();
    for (const photo of photos) {
      await offlineStorage.removePendingPhoto(photo.id);
    }

    this.state.pendingCount = 0;
    this.notify();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.onlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
    }
    this.listeners.clear();
  }
}

// Singleton export
export const syncQueue = new SyncQueueService();
