/**
 * Unified Health Service
 *
 * Provides a unified API for accessing health data across platforms:
 * - Google Fit / Health Connect (Android)
 * - Apple HealthKit (iOS)
 * - Web fallback (accelerometer-based step estimation)
 */

import { platformService, Platform } from './platformService';
import { googleFitService, StepData } from './googleFitService';
import { appleHealthService } from './appleHealthService';

export type { StepData } from './googleFitService';

export interface HealthSummary {
  steps: number;
  distance: number; // meters
  calories: number;
  source: 'google_fit' | 'apple_health' | 'web' | 'none';
  lastSync: string | null;
}

export interface HealthConnectionStatus {
  isAvailable: boolean;
  isConnected: boolean;
  platform: Platform;
  permissionStatus: {
    steps: boolean;
    distance: boolean;
    calories: boolean;
  };
}

class HealthService {
  private webStepCounter = 0;
  private webStepSubscription: (() => void) | null = null;

  /**
   * Check if health features are available on this device
   */
  async isAvailable(): Promise<boolean> {
    const platform = platformService.getInfo();

    if (platform.platform === 'android') {
      return googleFitService.isAvailable();
    } else if (platform.platform === 'ios') {
      return appleHealthService.isAvailable();
    }

    // Web - check for motion sensors
    return 'DeviceMotionEvent' in window || 'Accelerometer' in window;
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<HealthConnectionStatus> {
    const platform = platformService.getInfo();
    const isAvailable = await this.isAvailable();

    let permissionStatus = { steps: false, distance: false, calories: false };
    let isConnected = false;

    if (platform.platform === 'android' && isAvailable) {
      permissionStatus = await googleFitService.checkPermissions();
      isConnected = permissionStatus.steps;
    } else if (platform.platform === 'ios' && isAvailable) {
      permissionStatus = await appleHealthService.checkPermissions();
      isConnected = permissionStatus.steps;
    } else if (isAvailable) {
      // Web - assume connected if motion API is available
      isConnected = true;
      permissionStatus = { steps: true, distance: false, calories: false };
    }

    return {
      isAvailable,
      isConnected,
      platform: platform.platform,
      permissionStatus
    };
  }

  /**
   * Connect to health service (request permissions)
   */
  async connect(): Promise<boolean> {
    const platform = platformService.getInfo();

    if (platform.platform === 'android') {
      return googleFitService.initialize();
    } else if (platform.platform === 'ios') {
      return appleHealthService.initialize();
    }

    // Web - request motion permission if needed
    return this.initializeWebStepCounter();
  }

  /**
   * Initialize web-based step counter
   */
  private async initializeWebStepCounter(): Promise<boolean> {
    try {
      // Request permission for DeviceMotion on iOS Safari
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get today's health summary
   */
  async getTodaySummary(): Promise<HealthSummary> {
    const platform = platformService.getInfo();

    if (platform.platform === 'android') {
      try {
        const summary = await googleFitService.getTodaySummary();
        return {
          ...summary,
          source: 'google_fit',
          lastSync: new Date().toISOString()
        };
      } catch {
        return this.getEmptySummary('google_fit');
      }
    } else if (platform.platform === 'ios') {
      try {
        const summary = await appleHealthService.getTodaySummary();
        return {
          ...summary,
          source: 'apple_health',
          lastSync: new Date().toISOString()
        };
      } catch {
        return this.getEmptySummary('apple_health');
      }
    }

    // Web fallback
    return {
      steps: this.webStepCounter,
      distance: Math.round(this.webStepCounter * 0.762), // Approximate stride length
      calories: Math.round(this.webStepCounter * 0.04), // Approximate calories per step
      source: 'web',
      lastSync: new Date().toISOString()
    };
  }

  /**
   * Get today's step count
   */
  async getTodaySteps(): Promise<number> {
    const platform = platformService.getInfo();

    if (platform.platform === 'android') {
      return googleFitService.getTodaySteps();
    } else if (platform.platform === 'ios') {
      return appleHealthService.getTodaySteps();
    }

    return this.webStepCounter;
  }

  /**
   * Get step history for past N days
   */
  async getStepHistory(days: number = 7): Promise<StepData[]> {
    const platform = platformService.getInfo();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    if (platform.platform === 'android') {
      return googleFitService.getStepsForRange(startDate, endDate);
    } else if (platform.platform === 'ios') {
      return appleHealthService.getStepsForRange(startDate, endDate);
    }

    // Web - return empty or stored history
    return [];
  }

  /**
   * Get weekly step summary
   */
  async getWeeklySteps(): Promise<StepData[]> {
    const platform = platformService.getInfo();

    if (platform.platform === 'android') {
      return googleFitService.getWeeklySteps();
    } else if (platform.platform === 'ios') {
      return appleHealthService.getWeeklySteps();
    }

    return [];
  }

  /**
   * Subscribe to step count updates
   */
  subscribeToSteps(callback: (steps: number) => void): () => void {
    const platform = platformService.getInfo();

    if (platform.platform === 'ios') {
      // iOS has background delivery support
      appleHealthService.subscribeToStepUpdates(callback);
    }

    // For all platforms, also use polling
    const interval = setInterval(async () => {
      const steps = await this.getTodaySteps();
      callback(steps);
    }, 60000); // Poll every minute

    // Initial fetch
    this.getTodaySteps().then(callback);

    return () => {
      clearInterval(interval);
      if (this.webStepSubscription) {
        this.webStepSubscription();
        this.webStepSubscription = null;
      }
    };
  }

  /**
   * Start web-based step detection using accelerometer
   */
  startWebStepDetection(onStep: (totalSteps: number) => void): () => void {
    if (this.webStepSubscription) {
      this.webStepSubscription();
    }

    let lastAcceleration = 0;
    let stepThreshold = 1.2; // Adjust based on calibration
    let lastStepTime = 0;
    const minStepInterval = 250; // Minimum ms between steps

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const totalAccel = Math.sqrt(
        (acceleration.x || 0) ** 2 +
        (acceleration.y || 0) ** 2 +
        (acceleration.z || 0) ** 2
      );

      const now = Date.now();
      const accelDelta = Math.abs(totalAccel - lastAcceleration);

      // Detect step when acceleration change exceeds threshold
      if (accelDelta > stepThreshold && now - lastStepTime > minStepInterval) {
        this.webStepCounter++;
        lastStepTime = now;
        onStep(this.webStepCounter);
      }

      lastAcceleration = totalAccel;
    };

    window.addEventListener('devicemotion', handleMotion);

    this.webStepSubscription = () => {
      window.removeEventListener('devicemotion', handleMotion);
    };

    return this.webStepSubscription;
  }

  /**
   * Open platform-specific health settings
   */
  async openHealthSettings(): Promise<void> {
    const platform = platformService.getInfo();

    if (platform.platform === 'android') {
      return googleFitService.openHealthSettings();
    } else if (platform.platform === 'ios') {
      return appleHealthService.openHealthSettings();
    }

    // Web - nothing to open
    console.log('Health settings not available on web');
  }

  /**
   * Disconnect from health service
   */
  async disconnect(): Promise<void> {
    const platform = platformService.getInfo();

    if (platform.platform === 'android') {
      return googleFitService.revokePermissions();
    }

    // iOS doesn't support programmatic disconnection
    // Web - just stop the counter
    if (this.webStepSubscription) {
      this.webStepSubscription();
      this.webStepSubscription = null;
    }
    this.webStepCounter = 0;
  }

  /**
   * Get empty summary with source
   */
  private getEmptySummary(source: HealthSummary['source']): HealthSummary {
    return {
      steps: 0,
      distance: 0,
      calories: 0,
      source,
      lastSync: null
    };
  }

  /**
   * Sync steps to storage service
   */
  async syncStepsToStorage(): Promise<number> {
    const { StorageService } = await import('./storageService');
    const settings = StorageService.getSettings();

    // Get current step goal progress
    const stepGoal = settings.goals.find(g => g.type === 'STEPS');
    if (!stepGoal) return 0;

    // Get steps from health service
    const healthSteps = await this.getTodaySteps();

    // Calculate new steps to add (avoid double counting)
    const lastSync = settings.connectedPlatforms.lastSync;
    const currentSteps = stepGoal.current;

    // If we have a last sync time and health steps are higher, update
    if (healthSteps > currentSteps) {
      const stepsToAdd = healthSteps - currentSteps;
      StorageService.syncExternalSteps(stepsToAdd);
      return stepsToAdd;
    }

    return 0;
  }
}

// Singleton export
export const healthService = new HealthService();
