/**
 * useOfflineStatus Hook
 *
 * Provides real-time offline status and sync queue information.
 */

import { useState, useEffect, useCallback } from 'react';
import { syncQueue } from '../services/syncQueue';

interface OfflineStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncTime: null
  });

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(s => ({ ...s, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(s => ({ ...s, isOnline: false }));
    };

    // Update offline indicator in DOM
    const updateDOMIndicator = (isOnline: boolean) => {
      const indicator = document.getElementById('offline-indicator');
      if (indicator) {
        indicator.classList.toggle('visible', !isOnline);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updateDOMIndicator(navigator.onLine);

    // Listen for online/offline to update DOM
    const domOnline = () => updateDOMIndicator(true);
    const domOffline = () => updateDOMIndicator(false);
    window.addEventListener('online', domOnline);
    window.addEventListener('offline', domOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', domOnline);
      window.removeEventListener('offline', domOffline);
    };
  }, []);

  // Listen for sync queue updates
  useEffect(() => {
    const handleQueueUpdate = (event: CustomEvent<{ pendingCount: number }>) => {
      setStatus(s => ({ ...s, pendingCount: event.detail.pendingCount }));
    };

    window.addEventListener('syncqueue-update', handleQueueUpdate as EventListener);

    // Initial count
    syncQueue.getPendingCount().then(count => {
      setStatus(s => ({ ...s, pendingCount: count }));
    });

    return () => {
      window.removeEventListener('syncqueue-update', handleQueueUpdate as EventListener);
    };
  }, []);

  // Manual sync trigger
  const sync = useCallback(async () => {
    if (!status.isOnline) return { success: 0, failed: 0 };

    setStatus(s => ({ ...s, isSyncing: true }));

    try {
      const result = await syncQueue.processQueue();
      setStatus(s => ({
        ...s,
        isSyncing: false,
        lastSyncTime: new Date()
      }));
      return result;
    } catch (error) {
      setStatus(s => ({ ...s, isSyncing: false }));
      return { success: 0, failed: 0 };
    }
  }, [status.isOnline]);

  return {
    ...status,
    sync
  };
}
