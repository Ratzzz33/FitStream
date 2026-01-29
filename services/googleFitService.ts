/**
 * Google Fit Service (Android Health Connect)
 *
 * Handles step counting and health data from Google Fit / Health Connect API
 * on Android devices via Capacitor.
 *
 * Note: The @nicklassvensson/capacitor-health-connect plugin is only available
 * when running as a native Android app. On web, this service returns mock/empty data.
 */

import { platformService } from './platformService';

// Dynamic import helper to avoid build errors when plugin isn't installed
// Using string concatenation to prevent Vite from statically analyzing this import
const getHealthConnect = async () => {
  try {
    // @ts-ignore - Plugin may not be installed
    const moduleName = '@nicklassvensson/' + 'capacitor-health-connect';
    const module = await import(/* @vite-ignore */ moduleName);
    return module.HealthConnect;
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

class GoogleFitService {
  private isInitialized = false;
  private permissionsGranted = false;

  /**
   * Check if Health Connect is available
   */
  async isAvailable(): Promise<boolean> {
    const platform = platformService.getInfo();

    if (!platform.isNative || platform.platform !== 'android') {
      return false;
    }

    try {
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return false;
      const result = await HealthConnect.isAvailable();
      return result.available;
    } catch (error) {
      console.warn('Health Connect not available:', error);
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
      console.log('GoogleFitService: Health Connect not available');
      return false;
    }

    try {
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return false;

      // Request permissions
      const permissions = await HealthConnect.requestAuthorization({
        read: ['Steps', 'Distance', 'ActiveCaloriesBurned'],
        write: []
      });

      this.permissionsGranted = permissions.granted;
      this.isInitialized = true;

      console.log('GoogleFitService: Initialized, permissions:', this.permissionsGranted);
      return this.permissionsGranted;
    } catch (error) {
      console.error('GoogleFitService: Initialization failed:', error);
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
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return { steps: false, distance: false, calories: false };

      const result = await HealthConnect.checkAuthorization({
        read: ['Steps', 'Distance', 'ActiveCaloriesBurned'],
        write: []
      });

      return {
        steps: result.grantedPermissions?.includes('Steps') ?? false,
        distance: result.grantedPermissions?.includes('Distance') ?? false,
        calories: result.grantedPermissions?.includes('ActiveCaloriesBurned') ?? false
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
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await HealthConnect.readData({
        dataType: 'Steps',
        startDate: today.toISOString(),
        endDate: new Date().toISOString()
      });

      // Aggregate all step records
      const totalSteps = result.records?.reduce((sum: number, record: any) => {
        return sum + (record.count || record.value || 0);
      }, 0) ?? 0;

      return totalSteps;
    } catch (error) {
      console.error('GoogleFitService: Failed to get today steps:', error);
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
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return [];

      const result = await HealthConnect.readData({
        dataType: 'Steps',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Group by day
      const dailySteps = new Map<string, number>();

      result.records?.forEach((record: any) => {
        const date = new Date(record.startTime || record.time).toISOString().split('T')[0];
        const current = dailySteps.get(date) || 0;
        dailySteps.set(date, current + (record.count || record.value || 0));
      });

      return Array.from(dailySteps.entries()).map(([date, steps]) => ({
        date,
        steps
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('GoogleFitService: Failed to get step range:', error);
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
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await HealthConnect.readData({
        dataType: 'Distance',
        startDate: today.toISOString(),
        endDate: new Date().toISOString()
      });

      // Aggregate distance
      const totalDistance = result.records?.reduce((sum: number, record: any) => {
        return sum + (record.distance?.inMeters || record.value || 0);
      }, 0) ?? 0;

      return Math.round(totalDistance);
    } catch (error) {
      console.error('GoogleFitService: Failed to get distance:', error);
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
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await HealthConnect.readData({
        dataType: 'ActiveCaloriesBurned',
        startDate: today.toISOString(),
        endDate: new Date().toISOString()
      });

      // Aggregate calories
      const totalCalories = result.records?.reduce((sum: number, record: any) => {
        return sum + (record.energy?.inKilocalories || record.value || 0);
      }, 0) ?? 0;

      return Math.round(totalCalories);
    } catch (error) {
      console.error('GoogleFitService: Failed to get calories:', error);
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
   * Open Health Connect app settings
   */
  async openHealthSettings(): Promise<void> {
    try {
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return;
      await HealthConnect.openHealthConnectSettings();
    } catch (error) {
      console.error('Failed to open Health Connect settings:', error);
      // Fallback to app settings
      platformService.openAppSettings();
    }
  }

  /**
   * Revoke permissions (for testing)
   */
  async revokePermissions(): Promise<void> {
    try {
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return;
      await HealthConnect.revokeAllAuthorization();
      this.permissionsGranted = false;
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to revoke permissions:', error);
    }
  }
}

// Singleton export
export const googleFitService = new GoogleFitService();
