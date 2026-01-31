/**
 * Background-aware Timer Service
 *
 * Uses Capacitor Local Notifications to ensure timers work
 * even when app is in background or screen is off.
 */

import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface ActiveTimer {
  id: string;
  endTime: number; // Unix timestamp when timer should complete
  notificationId: number;
  label: string;
}

const TIMER_STORAGE_KEY = 'fitstream_active_timers';
const NOTIFICATION_CHANNEL_ID = 'cooking_timers';

// Generate unique notification ID
let notificationCounter = Date.now() % 100000;
const getNextNotificationId = () => ++notificationCounter;

/**
 * Initialize the timer service
 * Should be called once when app starts
 */
export const initTimerService = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Timer service: Running in browser, notifications limited');
    return;
  }

  try {
    // Request notification permissions
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display !== 'granted') {
      console.warn('Notification permissions not granted');
    }

    // Create notification channel for Android
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Таймеры готовки',
      description: 'Уведомления о завершении таймеров при готовке',
      importance: 5, // Max importance for heads-up notifications
      visibility: 1, // Public
      sound: 'beep.wav',
      vibration: true,
      lights: true,
    });

    // Listen for app state changes to sync timers
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground - check active timers
        syncTimersWithStorage();
      }
    });

    // Check for any pending timers on startup
    await syncTimersWithStorage();
  } catch (error) {
    console.error('Failed to initialize timer service:', error);
  }
};

/**
 * Start a background-aware timer
 */
export const startTimer = async (
  id: string,
  durationSeconds: number,
  label: string,
  onComplete?: () => void
): Promise<{ endTime: number; notificationId: number }> => {
  const endTime = Date.now() + durationSeconds * 1000;
  const notificationId = getNextNotificationId();

  // Save to storage for persistence
  const timer: ActiveTimer = { id, endTime, notificationId, label };
  saveTimerToStorage(timer);

  // Schedule notification
  if (Capacitor.isNativePlatform()) {
    try {
      const scheduleOptions: ScheduleOptions = {
        notifications: [
          {
            id: notificationId,
            title: 'Таймер завершён!',
            body: label || 'Время вышло!',
            schedule: {
              at: new Date(endTime),
              allowWhileIdle: true, // Important for Doze mode
            },
            sound: 'beep.wav',
            channelId: NOTIFICATION_CHANNEL_ID,
            extra: { timerId: id },
            actionTypeId: 'TIMER_COMPLETE',
          },
        ],
      };
      await LocalNotifications.schedule(scheduleOptions);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  // Also set up a foreground callback if provided
  if (onComplete) {
    const timeoutId = setTimeout(() => {
      onComplete();
      removeTimerFromStorage(id);
    }, durationSeconds * 1000);

    // Store timeout ID for cleanup
    foregroundTimeouts.set(id, timeoutId);
  }

  return { endTime, notificationId };
};

/**
 * Cancel an active timer
 */
export const cancelTimer = async (id: string): Promise<void> => {
  const timers = getTimersFromStorage();
  const timer = timers.find(t => t.id === id);

  if (timer) {
    // Cancel the scheduled notification
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({
          notifications: [{ id: timer.notificationId }],
        });
      } catch (error) {
        console.error('Failed to cancel notification:', error);
      }
    }

    // Remove from storage
    removeTimerFromStorage(id);
  }

  // Clear foreground timeout
  const timeoutId = foregroundTimeouts.get(id);
  if (timeoutId) {
    clearTimeout(timeoutId);
    foregroundTimeouts.delete(id);
  }
};

/**
 * Get remaining time for a timer
 * Returns 0 if timer has completed or doesn't exist
 */
export const getRemainingTime = (id: string): number => {
  const timers = getTimersFromStorage();
  const timer = timers.find(t => t.id === id);

  if (!timer) return 0;

  const remaining = Math.max(0, timer.endTime - Date.now());
  return Math.ceil(remaining / 1000);
};

/**
 * Check if a timer exists and is still running
 */
export const isTimerActive = (id: string): boolean => {
  return getRemainingTime(id) > 0;
};

/**
 * Get timer end time
 */
export const getTimerEndTime = (id: string): number | null => {
  const timers = getTimersFromStorage();
  const timer = timers.find(t => t.id === id);
  return timer?.endTime || null;
};

// Foreground timeout tracking
const foregroundTimeouts = new Map<string, NodeJS.Timeout>();

// Storage helpers
const getTimersFromStorage = (): ActiveTimer[] => {
  try {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveTimerToStorage = (timer: ActiveTimer): void => {
  const timers = getTimersFromStorage().filter(t => t.id !== timer.id);
  timers.push(timer);
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
};

const removeTimerFromStorage = (id: string): void => {
  const timers = getTimersFromStorage().filter(t => t.id !== id);
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
};

/**
 * Sync timers when app resumes
 * Removes expired timers and fires callbacks for completed ones
 */
const syncTimersWithStorage = async (): Promise<void> => {
  const timers = getTimersFromStorage();
  const now = Date.now();
  const expiredTimers: string[] = [];

  for (const timer of timers) {
    if (timer.endTime <= now) {
      expiredTimers.push(timer.id);
    }
  }

  // Remove expired timers
  if (expiredTimers.length > 0) {
    const activeTimers = timers.filter(t => !expiredTimers.includes(t.id));
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(activeTimers));
  }
};

/**
 * Register a listener for timer completion
 * This is useful for updating UI when notification fires while app is open
 */
export const addTimerCompletionListener = (
  callback: (timerId: string) => void
): (() => void) => {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const handler = LocalNotifications.addListener(
    'localNotificationReceived',
    (notification) => {
      const timerId = notification.extra?.timerId;
      if (timerId) {
        callback(timerId);
        removeTimerFromStorage(timerId);
      }
    }
  );

  // Return cleanup function
  return () => {
    handler.then(h => h.remove());
  };
};

export default {
  initTimerService,
  startTimer,
  cancelTimer,
  getRemainingTime,
  isTimerActive,
  getTimerEndTime,
  addTimerCompletionListener,
};
