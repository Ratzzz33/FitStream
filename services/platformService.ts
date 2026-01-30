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

export type WebViewType = 'telegram' | 'instagram' | 'facebook' | 'vk' | 'tiktok' | 'snapchat' | 'twitter' | 'linkedin' | 'unknown';

interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isCapacitor: boolean;
  isPWA: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTelegramMiniApp: boolean;
  isInAppBrowser: boolean;
  inAppBrowserType: WebViewType | null;
  isBrowser: boolean;
  version?: string;
}

export interface CameraCapability {
  available: boolean;
  reason?: 'not_supported' | 'permission_denied' | 'webview_restricted' | 'insecure_context';
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

    // Check for Telegram Mini App
    const isTelegramMiniApp = this.detectTelegramMiniApp();

    // Check for in-app browsers (Instagram, Facebook, VK, etc.)
    const inAppBrowserType = this.detectInAppBrowser();
    const isInAppBrowser = inAppBrowserType !== null;

    // Is running in regular browser (not native, not PWA, not in-app browser)
    const isBrowser = !isCapacitor && !isPWA && !isTelegramMiniApp && !isInAppBrowser;

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
      isTelegramMiniApp,
      isInAppBrowser,
      inAppBrowserType,
      isBrowser,
      version
    };

    return this._info;
  }

  /**
   * Detect if running inside Telegram Mini App (WebApp)
   */
  private detectTelegramMiniApp(): boolean {
    // Check for Telegram WebApp object
    if (typeof (window as any).Telegram !== 'undefined') {
      const telegram = (window as any).Telegram;
      if (telegram.WebApp) {
        return true;
      }
    }

    // Fallback: check URL parameters that Telegram uses
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('tgWebAppData') || urlParams.has('tgWebAppStartParam')) {
      return true;
    }

    // Check hash for Telegram data
    if (window.location.hash.includes('tgWebAppData')) {
      return true;
    }

    return false;
  }

  /**
   * Detect if running inside an in-app browser (Instagram, Facebook, VK, etc.)
   * These browsers often restrict camera access
   */
  private detectInAppBrowser(): WebViewType | null {
    const ua = navigator.userAgent.toLowerCase();

    // Instagram in-app browser
    if (ua.includes('instagram')) {
      return 'instagram';
    }

    // Facebook in-app browser (FBAN = Facebook App Native, FBAV = Facebook App Version)
    if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab')) {
      return 'facebook';
    }

    // VK (VKontakte) in-app browser
    if (ua.includes('vkandroidapp') || ua.includes('vkclient')) {
      return 'vk';
    }

    // TikTok in-app browser
    if (ua.includes('bytedance') || ua.includes('musical_ly') || ua.includes('tiktok')) {
      return 'tiktok';
    }

    // Snapchat in-app browser
    if (ua.includes('snapchat')) {
      return 'snapchat';
    }

    // Twitter/X in-app browser
    if (ua.includes('twitter')) {
      return 'twitter';
    }

    // LinkedIn in-app browser
    if (ua.includes('linkedinapp')) {
      return 'linkedin';
    }

    // Telegram check (already handled separately but include for completeness)
    if (this.detectTelegramMiniApp()) {
      return 'telegram';
    }

    // Generic WebView detection (last resort)
    // Android WebView
    if (ua.includes('wv') && ua.includes('android')) {
      return 'unknown';
    }

    // iOS WebView (not Safari, but webkit-based)
    if ((ua.includes('iphone') || ua.includes('ipad')) &&
        !ua.includes('safari') &&
        ua.includes('webkit')) {
      return 'unknown';
    }

    return null;
  }

  /**
   * Check if running in Telegram Mini App
   */
  isTelegramMiniApp(): boolean {
    return this.getInfo().isTelegramMiniApp;
  }

  /**
   * Check if running in any in-app browser
   */
  isInAppBrowser(): boolean {
    return this.getInfo().isInAppBrowser;
  }

  /**
   * Get the type of in-app browser
   */
  getInAppBrowserType(): WebViewType | null {
    return this.getInfo().inAppBrowserType;
  }

  /**
   * Get localized name of the in-app browser
   */
  getInAppBrowserNameRu(): string {
    const type = this.getInAppBrowserType();
    const names: Record<WebViewType, string> = {
      telegram: 'Telegram',
      instagram: 'Instagram',
      facebook: 'Facebook',
      vk: 'ВКонтакте',
      tiktok: 'TikTok',
      snapchat: 'Snapchat',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
      unknown: 'встроенный браузер'
    };
    return type ? names[type] : 'браузер';
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
   * Check if camera is available for exercise recognition
   * Returns detailed information about camera availability
   */
  async checkCameraCapability(): Promise<CameraCapability> {
    const info = this.getInfo();

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      return { available: false, reason: 'insecure_context' };
    }

    // Check if mediaDevices API exists
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // In-app browsers often restrict camera access
      if (info.isTelegramMiniApp || info.isInAppBrowser) {
        return { available: false, reason: 'webview_restricted' };
      }
      return { available: false, reason: 'not_supported' };
    }

    // For in-app browsers, camera access is often blocked even if API exists
    // We need to actually try to access it
    if (info.isTelegramMiniApp || info.isInAppBrowser) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // If we got here, camera works - stop the stream
        stream.getTracks().forEach(track => track.stop());
        return { available: true };
      } catch (error: any) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          return { available: false, reason: 'permission_denied' };
        }
        return { available: false, reason: 'webview_restricted' };
      }
    }

    // For other platforms, just check if API exists (permission will be requested later)
    return { available: true };
  }

  /**
   * Check if exercise recognition with camera is supported
   */
  async canUseExerciseRecognition(): Promise<boolean> {
    const capability = await this.checkCameraCapability();
    return capability.available;
  }

  /**
   * Get user-friendly message explaining why exercise recognition is unavailable
   */
  getExerciseRecognitionUnavailableReason(): {
    title: string;
    message: string;
    action: string;
    browserName?: string;
  } {
    const info = this.getInfo();

    if (info.isTelegramMiniApp) {
      return {
        title: 'Камера недоступна в Telegram',
        message: 'Распознавание упражнений требует доступа к камере, который ограничен в Telegram Mini App.',
        action: 'Скачайте приложение FitStream для полного функционала или добавьте результат вручную.',
        browserName: 'Telegram'
      };
    }

    if (info.isInAppBrowser) {
      const browserName = this.getInAppBrowserNameRu();
      return {
        title: `Камера недоступна в ${browserName}`,
        message: `Встроенный браузер ${browserName} ограничивает доступ к камере для безопасности.`,
        action: 'Откройте ссылку в браузере или скачайте приложение FitStream.',
        browserName
      };
    }

    if (info.isBrowser && !info.isMobile) {
      return {
        title: 'Функция для мобильных устройств',
        message: 'Распознавание упражнений оптимизировано для мобильных устройств с камерой.',
        action: 'Откройте приложение на телефоне или добавьте результат вручную.'
      };
    }

    if (!window.isSecureContext) {
      return {
        title: 'Требуется защищённое соединение',
        message: 'Доступ к камере требует HTTPS соединения.',
        action: 'Откройте приложение через защищённое соединение (https://).'
      };
    }

    return {
      title: 'Камера недоступна',
      message: 'Не удалось получить доступ к камере устройства.',
      action: 'Проверьте разрешения камеры в настройках или добавьте результат вручную.'
    };
  }

  /**
   * Get deep link URL to open the native app
   * Returns null if deep links are not configured
   */
  getDeepLinkUrl(path?: string): string {
    const appScheme = 'fitstream://';
    return path ? `${appScheme}${path}` : appScheme;
  }

  /**
   * Try to open the native app via deep link
   * Returns true if deep link was triggered (but doesn't guarantee app opened)
   */
  async tryOpenNativeApp(path?: string): Promise<boolean> {
    const deepLink = this.getDeepLinkUrl(path);

    return new Promise((resolve) => {
      // Create a hidden iframe to try opening the deep link
      // This method is more reliable than window.location for detecting if app is installed
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        resolve(false); // App probably not installed
      }, 2500);

      // If page becomes hidden, app likely opened
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearTimeout(timeout);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          document.body.removeChild(iframe);
          resolve(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Try to open deep link
      iframe.src = deepLink;
    });
  }

  /**
   * Get the URL to open current page in system browser
   * Useful for escaping in-app browsers
   */
  getOpenInBrowserUrl(): string {
    const currentUrl = window.location.href;
    const info = this.getInfo();

    // For Android, use intent URL
    if (info.isAndroid) {
      return `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
    }

    // For iOS, try universal link or just return the URL
    return currentUrl;
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
