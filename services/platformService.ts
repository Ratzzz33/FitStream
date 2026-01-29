/**
 * Platform Service
 *
 * Detects the current platform (web, Android, iOS) and provides
 * unified access to platform-specific features.
 */

// Dynamic import helpers to avoid build errors when plugins aren't installed
// Using string concatenation to prevent Vite from statically analyzing these imports
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

const getNativeSettings = async () => {
  try {
    // @ts-ignore - Plugin may not be installed
    const moduleName = 'capacitor-native-' + 'settings';
    const module = await import(/* @vite-ignore */ moduleName);
    return {
      NativeSettings: module.NativeSettings,
      AndroidSettings: module.AndroidSettings,
      IOSSettings: module.IOSSettings
    };
  } catch {
    return null;
  }
};

export type Platform = 'web' | 'android' | 'ios';

interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isCapacitor: boolean;
  isPWA: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  version?: string;
}

class PlatformService {
  private _info: PlatformInfo | null = null;

  /**
   * Get platform information
   */
  getInfo(): PlatformInfo {
    if (this._info) return this._info;

    // Check for Capacitor
    const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
    const capacitor = (window as any).Capacitor;

    // User agent detection for fallback
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    const isMobile = isIOS || isAndroid || /mobile/.test(ua);

    // Check for PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true ||
                  document.referrer.includes('android-app://');

    let platform: Platform = 'web';
    let version: string | undefined;

    if (isCapacitor) {
      platform = capacitor.getPlatform?.() || (isIOS ? 'ios' : isAndroid ? 'android' : 'web');
      version = capacitor.Plugins?.Device?.getInfo?.()?.then?.((info: any) => info.osVersion);
    } else if (isIOS) {
      platform = 'ios';
    } else if (isAndroid) {
      platform = 'android';
    }

    this._info = {
      platform,
      isNative: isCapacitor && platform !== 'web',
      isCapacitor,
      isPWA,
      isMobile,
      isIOS,
      isAndroid,
      version
    };

    return this._info;
  }

  /**
   * Check if we're running as a native app
   */
  isNative(): boolean {
    return this.getInfo().isNative;
  }

  /**
   * Check if we're running as a PWA
   */
  isPWA(): boolean {
    return this.getInfo().isPWA;
  }

  /**
   * Check if Health APIs are available
   */
  async hasHealthSupport(): Promise<boolean> {
    const info = this.getInfo();

    if (!info.isNative) {
      // Web - check for experimental Health API or Sensor API
      return 'Accelerometer' in window || 'DeviceMotionEvent' in window;
    }

    // Native - check for respective health plugins
    if (info.platform === 'android') {
      return this.hasAndroidHealthConnect();
    } else if (info.platform === 'ios') {
      return this.hasIOSHealthKit();
    }

    return false;
  }

  /**
   * Check for Android Health Connect availability
   */
  private async hasAndroidHealthConnect(): Promise<boolean> {
    try {
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return false;
      const result = await HealthConnect.isAvailable();
      return result.available;
    } catch {
      return false;
    }
  }

  /**
   * Check for iOS HealthKit availability
   */
  private async hasIOSHealthKit(): Promise<boolean> {
    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return false;
      const result = await HealthKit.isAvailable();
      return result.available;
    } catch {
      return false;
    }
  }

  /**
   * Request necessary permissions based on platform
   */
  async requestPermissions(): Promise<boolean> {
    const info = this.getInfo();

    if (info.platform === 'android') {
      return this.requestAndroidPermissions();
    } else if (info.platform === 'ios') {
      return this.requestIOSPermissions();
    }

    return true; // Web doesn't need special permissions
  }

  private async requestAndroidPermissions(): Promise<boolean> {
    try {
      const HealthConnect = await getHealthConnect();
      if (!HealthConnect) return false;

      const result = await HealthConnect.requestAuthorization({
        read: ['Steps', 'Distance', 'ActiveCaloriesBurned'],
        write: []
      });

      return result.granted;
    } catch (error) {
      console.error('Failed to request Android permissions:', error);
      return false;
    }
  }

  private async requestIOSPermissions(): Promise<boolean> {
    try {
      const HealthKit = await getHealthKit();
      if (!HealthKit) return false;

      const result = await HealthKit.requestAuthorization({
        all: ['stepCount', 'distanceWalkingRunning', 'activeEnergyBurned']
      });

      return result.status === 'granted';
    } catch (error) {
      console.error('Failed to request iOS permissions:', error);
      return false;
    }
  }

  /**
   * Get safe area insets for notched devices
   */
  getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    const style = getComputedStyle(document.documentElement);

    return {
      top: parseInt(style.getPropertyValue('--sat') || '0') ||
           parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0') ||
              parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0') ||
            parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0') ||
             parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0')
    };
  }

  /**
   * Handle app lifecycle events (for Capacitor)
   */
  onAppStateChange(callback: (isActive: boolean) => void): () => void {
    if (!this.getInfo().isCapacitor) {
      // Web fallback using visibility API
      const handler = () => callback(document.visibilityState === 'visible');
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    }

    // Capacitor app lifecycle
    const { App } = (window as any).Capacitor?.Plugins || {};
    if (App) {
      const listener = App.addListener('appStateChange', (state: { isActive: boolean }) => {
        callback(state.isActive);
      });
      return () => listener.remove();
    }

    return () => {};
  }

  /**
   * Trigger haptic feedback
   */
  async haptic(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!this.getInfo().isCapacitor) {
      // Web fallback
      if ('vibrate' in navigator) {
        const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
        navigator.vibrate(duration);
      }
      return;
    }

    try {
      const { Haptics } = (window as any).Capacitor?.Plugins || {};
      if (Haptics) {
        const impactStyle = {
          light: 'Light',
          medium: 'Medium',
          heavy: 'Heavy'
        }[style];
        await Haptics.impact({ style: impactStyle });
      }
    } catch {
      // Haptics not available
    }
  }

  /**
   * Open app settings (for permissions)
   */
  async openAppSettings(): Promise<void> {
    if (!this.getInfo().isCapacitor) {
      console.log('Cannot open app settings on web');
      return;
    }

    try {
      const settings = await getNativeSettings();
      if (!settings) {
        console.warn('Native settings plugin not available');
        return;
      }

      const { NativeSettings, AndroidSettings, IOSSettings } = settings;

      if (this.getInfo().isAndroid) {
        await NativeSettings.openAndroid({
          option: AndroidSettings.ApplicationDetails
        });
      } else if (this.getInfo().isIOS) {
        await NativeSettings.openIOS({
          option: IOSSettings.App
        });
      }
    } catch {
      console.warn('Native settings plugin not available');
    }
  }
}

// Singleton export
export const platformService = new PlatformService();
