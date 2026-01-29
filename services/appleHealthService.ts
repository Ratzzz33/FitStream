/**
 * Apple Health Service (HealthKit)
 *
 * Handles step counting and health data from Apple HealthKit
 * on iOS devices via Capacitor.
 *
 * Note: The capacitor-plugin-healthkit plugin is only available
 * when running as a native iOS app. On web, this service returns mock/empty data.
 */

import { platformService } from './platformService';

// Dynamic import helper to avoid build errors when plugin isn't installed
// Using string concatenation to prevent Vite from statically analyzing this import
const getHealthKit = async () => {
  try {
    // @ts-ignore - Plugin may not be installed
    const moduleName = 'capacitor-plugin-' + 'healthkit';
    const module = await import(/* @vite-ignore */ moduleName);
    return module.HealthKit;
  } catch {
    return null;
  }
};

export interface StepData {
  date: string;
  steps: number;
  distance?: number;
  calories?: number;
}

export interface HealthPermissionStatus {
  steps: boolean;
  distance: boolean;
  calories: boolean;
}

class AppleHealthService {
  private isInitialized = false;
  private permissionsGranted = false;

  /**
   * Check if HealthKit is available
   */
  async isAvailable(): Promise<boolean> {
    const platform = platformService.getInfo();

    if (!platform.isNative || platform.platform !== 'ios') {
      return false;
    }

    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return false;
      const result = await HealthKit.isAvailable();
      return result.available;
    } catch (error) {
      console.warn('HealthKit not available:', error);
      return false;
    }
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return this.permissionsGranted;

    const available = await this.isAvailable();
    if (!available) {
      console.log('AppleHealthService: HealthKit not available');
      return false;
    }

    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return false;

      // Request authorization for reading health data
      const result = await HealthKit.requestAuthorization({
        all: ['stepCount', 'distanceWalkingRunning', 'activeEnergyBurned']
      });

      this.permissionsGranted = result.status === 'granted';
      this.isInitialized = true;

      console.log('AppleHealthService: Initialized, permissions:', this.permissionsGranted);
      return this.permissionsGranted;
    } catch (error) {
      console.error('AppleHealthService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Check permission status
   */
  async checkPermissions(): Promise<HealthPermissionStatus> {
    if (!await this.isAvailable()) {
      return { steps: false, distance: false, calories: false };
    }

    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return { steps: false, distance: false, calories: false };

      // Check each permission individually
      const [stepsResult, distanceResult, caloriesResult] = await Promise.all([
        HealthKit.checkAuthorization({ sampleType: 'stepCount' }).catch(() => ({ status: 'denied' })),
        HealthKit.checkAuthorization({ sampleType: 'distanceWalkingRunning' }).catch(() => ({ status: 'denied' })),
        HealthKit.checkAuthorization({ sampleType: 'activeEnergyBurned' }).catch(() => ({ status: 'denied' }))
      ]);

      return {
        steps: stepsResult.status === 'granted',
        distance: distanceResult.status === 'granted',
        calories: caloriesResult.status === 'granted'
      };
    } catch {
      return { steps: false, distance: false, calories: false };
    }
  }

  /**
   * Get steps for today
   */
  async getTodaySteps(): Promise<number> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return 0;
    }

    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await HealthKit.queryQuantitySamples({
        sampleType: 'stepCount',
        startDate: today.toISOString(),
        endDate: new Date().toISOString()
      });

      // Sum all step samples
      const totalSteps = result.samples?.reduce((sum: number, sample: any) => {
        return sum + (sample.quantity || 0);
      }, 0) ?? 0;

      return Math.round(totalSteps);
    } catch (error) {
      console.error('AppleHealthService: Failed to get today steps:', error);
      return 0;
    }
  }

  /**
   * Get steps for a date range
   */
  async getStepsForRange(startDate: Date, endDate: Date): Promise<StepData[]> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return [];
    }

    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return [];

      const result = await HealthKit.queryQuantitySamples({
        sampleType: 'stepCount',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Group by day
      const dailySteps = new Map<string, number>();

      result.samples?.forEach((sample: any) => {
        const date = new Date(sample.startDate).toISOString().split('T')[0];
        const current = dailySteps.get(date) || 0;
        dailySteps.set(date, current + (sample.quantity || 0));
      });

      return Array.from(dailySteps.entries()).map(([date, steps]) => ({
        date,
        steps: Math.round(steps)
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('AppleHealthService: Failed to get step range:', error);
      return [];
    }
  }

  /**
   * Get weekly step summary
   */
  async getWeeklySteps(): Promise<StepData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    return this.getStepsForRange(startDate, endDate);
  }

  /**
   * Get monthly step summary
   */
  async getMonthlySteps(): Promise<StepData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    return this.getStepsForRange(startDate, endDate);
  }

  /**
   * Get today's distance walked (in meters)
   */
  async getTodayDistance(): Promise<number> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return 0;
    }

    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await HealthKit.queryQuantitySamples({
        sampleType: 'distanceWalkingRunning',
        startDate: today.toISOString(),
        endDate: new Date().toISOString(),
        unit: 'm' // meters
      });

      const totalDistance = result.samples?.reduce((sum: number, sample: any) => {
        return sum + (sample.quantity || 0);
      }, 0) ?? 0;

      return Math.round(totalDistance);
    } catch (error) {
      console.error('AppleHealthService: Failed to get distance:', error);
      return 0;
    }
  }

  /**
   * Get today's active calories burned
   */
  async getTodayCalories(): Promise<number> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return 0;
    }

    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await HealthKit.queryQuantitySamples({
        sampleType: 'activeEnergyBurned',
        startDate: today.toISOString(),
        endDate: new Date().toISOString(),
        unit: 'kcal'
      });

      const totalCalories = result.samples?.reduce((sum: number, sample: any) => {
        return sum + (sample.quantity || 0);
      }, 0) ?? 0;

      return Math.round(totalCalories);
    } catch (error) {
      console.error('AppleHealthService: Failed to get calories:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive health summary for today
   */
  async getTodaySummary(): Promise<{ steps: number; distance: number; calories: number }> {
    const [steps, distance, calories] = await Promise.all([
      this.getTodaySteps(),
      this.getTodayDistance(),
      this.getTodayCalories()
    ]);

    return { steps, distance, calories };
  }

  /**
   * Open iOS Health app
   */
  async openHealthSettings(): Promise<void> {
    // On iOS, we can't directly open Health app settings
    // We can only prompt the user to go there
    platformService.openAppSettings();
  }

  /**
   * Subscribe to step count updates (background)
   */
  async subscribeToStepUpdates(
    callback: (steps: number) => void
  ): Promise<() => void> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return () => {};
    }

    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return () => {};

      // Enable background delivery
      await HealthKit.enableBackgroundDelivery({
        sampleType: 'stepCount',
        frequency: 'hourly'
      });

      // Set up observer query
      const subscription = await HealthKit.startObserverQuery({
        sampleType: 'stepCount',
        onUpdate: async () => {
          const steps = await this.getTodaySteps();
          callback(steps);
        }
      });

      return () => {
        HealthKit.stopObserverQuery({ subscription });
      };
    } catch (error) {
      console.error('Failed to subscribe to step updates:', error);
      return () => {};
    }
  }
}

// Singleton export
export const appleHealthService = new AppleHealthService();
