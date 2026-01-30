/**
 * Google Fit / Health Connect Service (Android)
 *
 * Handles health data from Health Connect API on Android devices.
 * Works with Samsung Health, Google Fit, and other Health Connect providers.
 *
 * Supported data types:
 * - Steps, Distance, Calories
 * - Weight, Body Fat
 * - Heart Rate, Sleep, Exercise
 */

import { platformService } from './platformService';

// Dynamic import to avoid build errors when plugin isn't installed
const getHealthPlugin = async () => {
  try {
    const module = await import('capacitor-health');
    return module.Health;
  } catch {
    // Fallback to old plugin
    try {
      const moduleName = '@nicklassvensson/' + 'capacitor-health-connect';
      const module = await import(/* @vite-ignore */ moduleName);
      return module.HealthConnect;
    } catch {
      return null;
    }
  }
};

export interface StepData {
  date: string;
  steps: number;
  distance?: number;
  calories?: number;
}

export interface WeightData {
  date: string;
  weight: number; // kg
  bodyFat?: number; // percentage
  source?: string;
}

export interface HeartRateData {
  date: string;
  bpm: number;
  type?: 'resting' | 'active' | 'max';
}

export interface ExerciseData {
  date: string;
  type: string;
  duration: number; // minutes
  calories?: number;
  distance?: number;
}

export interface HealthPermissionStatus {
  steps: boolean;
  distance: boolean;
  calories: boolean;
  weight: boolean;
  heartRate: boolean;
  exercise: boolean;
  sleep: boolean;
}

class GoogleFitService {
  private isInitialized = false;
  private permissionsGranted = false;
  private healthPlugin: any = null;

  /**
   * Check if Health Connect is available
   */
  async isAvailable(): Promise<boolean> {
    const platform = platformService.getInfo();

    if (!platform.isNative || platform.platform !== 'android') {
      return false;
    }

    try {
      this.healthPlugin = await getHealthPlugin();
      if (!this.healthPlugin) return false;
      const result = await this.healthPlugin.isAvailable();
      return result.available || result.isAvailable || false;
    } catch (error) {
      console.warn('[HealthConnect] Not available:', error);
      return false;
    }
  }

  /**
   * Initialize the service and request permissions
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return this.permissionsGranted;

    const available = await this.isAvailable();
    if (!available) {
      console.log('[HealthConnect] Not available');
      return false;
    }

    try {
      if (!this.healthPlugin) {
        this.healthPlugin = await getHealthPlugin();
      }
      if (!this.healthPlugin) return false;

      // Request comprehensive permissions
      const permissions = await this.healthPlugin.requestAuthorization({
        read: [
          'Steps',
          'Distance',
          'ActiveCaloriesBurned',
          'TotalCaloriesBurned',
          'Weight',
          'BodyFat',
          'HeartRate',
          'ExerciseSession',
          'SleepSession',
          'Hydration'
        ],
        write: ['Weight', 'BodyFat']
      });

      this.permissionsGranted = permissions.granted || permissions.success || false;
      this.isInitialized = true;

      console.log('[HealthConnect] Initialized, permissions:', this.permissionsGranted);
      return this.permissionsGranted;
    } catch (error) {
      console.error('[HealthConnect] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Check permission status
   */
  async checkPermissions(): Promise<HealthPermissionStatus> {
    if (!await this.isAvailable()) {
      return {
        steps: false, distance: false, calories: false,
        weight: false, heartRate: false, exercise: false, sleep: false
      };
    }

    try {
      if (!this.healthPlugin) {
        this.healthPlugin = await getHealthPlugin();
      }
      if (!this.healthPlugin) {
        return {
          steps: false, distance: false, calories: false,
          weight: false, heartRate: false, exercise: false, sleep: false
        };
      }

      const result = await this.healthPlugin.checkAuthorization({
        read: ['Steps', 'Distance', 'ActiveCaloriesBurned', 'Weight', 'HeartRate', 'ExerciseSession', 'SleepSession'],
        write: ['Weight']
      });

      const granted = result.grantedPermissions || [];
      return {
        steps: granted.includes('Steps'),
        distance: granted.includes('Distance'),
        calories: granted.includes('ActiveCaloriesBurned'),
        weight: granted.includes('Weight'),
        heartRate: granted.includes('HeartRate'),
        exercise: granted.includes('ExerciseSession'),
        sleep: granted.includes('SleepSession')
      };
    } catch {
      return {
        steps: false, distance: false, calories: false,
        weight: false, heartRate: false, exercise: false, sleep: false
      };
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await this.healthPlugin.readData({
        dataType: 'Steps',
        startDate: today.toISOString(),
        endDate: new Date().toISOString()
      });

      const totalSteps = result.records?.reduce((sum: number, record: any) => {
        return sum + (record.count || record.value || record.steps || 0);
      }, 0) ?? 0;

      return totalSteps;
    } catch (error) {
      console.error('[HealthConnect] Failed to get today steps:', error);
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
      const result = await this.healthPlugin.readData({
        dataType: 'Steps',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Group by day
      const dailySteps = new Map<string, number>();

      result.records?.forEach((record: any) => {
        const date = new Date(record.startTime || record.time).toISOString().split('T')[0];
        const current = dailySteps.get(date) || 0;
        dailySteps.set(date, current + (record.count || record.value || record.steps || 0));
      });

      return Array.from(dailySteps.entries()).map(([date, steps]) => ({
        date,
        steps
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('[HealthConnect] Failed to get step range:', error);
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
   * Get today's distance walked (in meters)
   */
  async getTodayDistance(): Promise<number> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return 0;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await this.healthPlugin.readData({
        dataType: 'Distance',
        startDate: today.toISOString(),
        endDate: new Date().toISOString()
      });

      const totalDistance = result.records?.reduce((sum: number, record: any) => {
        return sum + (record.distance?.inMeters || record.value || record.distance || 0);
      }, 0) ?? 0;

      return Math.round(totalDistance);
    } catch (error) {
      console.error('[HealthConnect] Failed to get distance:', error);
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await this.healthPlugin.readData({
        dataType: 'ActiveCaloriesBurned',
        startDate: today.toISOString(),
        endDate: new Date().toISOString()
      });

      const totalCalories = result.records?.reduce((sum: number, record: any) => {
        return sum + (record.energy?.inKilocalories || record.value || record.calories || 0);
      }, 0) ?? 0;

      return Math.round(totalCalories);
    } catch (error) {
      console.error('[HealthConnect] Failed to get calories:', error);
      return 0;
    }
  }

  /**
   * Get weight history
   */
  async getWeightHistory(days: number = 30): Promise<WeightData[]> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return [];
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const result = await this.healthPlugin.readData({
        dataType: 'Weight',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      return result.records?.map((record: any) => ({
        date: new Date(record.time || record.startTime).toISOString().split('T')[0],
        weight: record.weight?.inKilograms || record.value || record.weight || 0,
        source: record.metadata?.dataOrigin || 'Health Connect'
      })) ?? [];
    } catch (error) {
      console.error('[HealthConnect] Failed to get weight history:', error);
      return [];
    }
  }

  /**
   * Write weight to Health Connect (syncs to Samsung Health)
   */
  async writeWeight(weight: number, bodyFat?: number): Promise<boolean> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return false;
    }

    try {
      await this.healthPlugin.writeData({
        dataType: 'Weight',
        value: weight,
        unit: 'kg',
        time: new Date().toISOString()
      });

      if (bodyFat !== undefined) {
        await this.healthPlugin.writeData({
          dataType: 'BodyFat',
          value: bodyFat,
          time: new Date().toISOString()
        });
      }

      console.log('[HealthConnect] Weight written:', weight, 'kg');
      return true;
    } catch (error) {
      console.error('[HealthConnect] Failed to write weight:', error);
      return false;
    }
  }

  /**
   * Get heart rate data
   */
  async getHeartRateHistory(days: number = 7): Promise<HeartRateData[]> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return [];
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const result = await this.healthPlugin.readData({
        dataType: 'HeartRate',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      return result.records?.map((record: any) => ({
        date: new Date(record.time || record.startTime).toISOString(),
        bpm: record.samples?.[0]?.beatsPerMinute || record.value || record.bpm || 0,
        type: 'active' as const
      })) ?? [];
    } catch (error) {
      console.error('[HealthConnect] Failed to get heart rate:', error);
      return [];
    }
  }

  /**
   * Get exercise sessions
   */
  async getExerciseHistory(days: number = 7): Promise<ExerciseData[]> {
    if (!this.permissionsGranted && !await this.initialize()) {
      return [];
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const result = await this.healthPlugin.readData({
        dataType: 'ExerciseSession',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      return result.records?.map((record: any) => {
        const start = new Date(record.startTime);
        const end = new Date(record.endTime);
        const duration = (end.getTime() - start.getTime()) / 60000; // minutes

        return {
          date: start.toISOString().split('T')[0],
          type: record.exerciseType || record.type || 'Unknown',
          duration: Math.round(duration),
          calories: record.totalCalories || 0,
          distance: record.totalDistance?.inMeters || 0
        };
      }) ?? [];
    } catch (error) {
      console.error('[HealthConnect] Failed to get exercises:', error);
      return [];
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
   * Open Health Connect app settings
   */
  async openHealthSettings(): Promise<void> {
    try {
      if (!this.healthPlugin) {
        this.healthPlugin = await getHealthPlugin();
      }
      if (this.healthPlugin?.openHealthConnectSettings) {
        await this.healthPlugin.openHealthConnectSettings();
      } else if (this.healthPlugin?.openSettings) {
        await this.healthPlugin.openSettings();
      } else {
        platformService.openAppSettings();
      }
    } catch (error) {
      console.error('[HealthConnect] Failed to open settings:', error);
      platformService.openAppSettings();
    }
  }

  /**
   * Revoke permissions
   */
  async revokePermissions(): Promise<void> {
    try {
      if (this.healthPlugin?.revokeAllAuthorization) {
        await this.healthPlugin.revokeAllAuthorization();
      } else if (this.healthPlugin?.revokeAccess) {
        await this.healthPlugin.revokeAccess();
      }
      this.permissionsGranted = false;
      this.isInitialized = false;
    } catch (error) {
      console.error('[HealthConnect] Failed to revoke permissions:', error);
    }
  }

  /**
   * Get data sources (Samsung Health, Google Fit, etc.)
   */
  async getDataSources(): Promise<string[]> {
    try {
      if (!this.healthPlugin) return [];

      const result = await this.healthPlugin.getDataSources?.() || { sources: [] };
      return result.sources || [];
    } catch {
      return [];
    }
  }
}

// Singleton export
export const googleFitService = new GoogleFitService();
