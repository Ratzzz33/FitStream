/**
 * Permission Service
 *
 * Centralized handling of all runtime permissions on Android/iOS.
 * Provides user-friendly permission request flow with rationale dialogs.
 */

import { Capacitor } from '@capacitor/core';

// Dynamic imports to avoid build errors
const getCamera = async () => {
  try {
    const { Camera } = await import('@capacitor/camera');
    return Camera;
  } catch {
    return null;
  }
};

const getBleClient = async () => {
  try {
    const { BleClient } = await import('@capacitor-community/bluetooth-le');
    return BleClient;
  } catch {
    return null;
  }
};

const getHealthPlugin = async () => {
  try {
    const module = await import('capacitor-health');
    return module.Health;
  } catch {
    return null;
  }
};

export type PermissionType =
  | 'camera'
  | 'bluetooth'
  | 'health_connect'
  | 'location'
  | 'notifications';

export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'denied_forever'
  | 'not_requested'
  | 'unavailable';

export interface PermissionInfo {
  type: PermissionType;
  status: PermissionStatus;
  canRequest: boolean;
  requiresSettings: boolean;
}

export interface PermissionRationale {
  title: string;
  message: string;
  icon: string;
  benefits: string[];
}

// Permission rationales in Russian
const RATIONALES: Record<PermissionType, PermissionRationale> = {
  camera: {
    title: 'Доступ к камере',
    message: 'FitStream использует камеру для:',
    icon: '📷',
    benefits: [
      'Распознавание упражнений и подсчёт повторений',
      'Сканирование еды для подсчёта калорий',
      'Чтение показаний весов',
      'Сканирование чеков'
    ]
  },
  bluetooth: {
    title: 'Доступ к Bluetooth',
    message: 'FitStream использует Bluetooth для:',
    icon: '📶',
    benefits: [
      'Подключение к умным весам Xiaomi',
      'Автоматическое получение веса',
      'Синхронизация данных о составе тела'
    ]
  },
  health_connect: {
    title: 'Доступ к Health Connect',
    message: 'FitStream синхронизирует данные с:',
    icon: '❤️',
    benefits: [
      'Samsung Health — шаги, пульс, сон',
      'Google Fit — активность, калории',
      'Другие фитнес-приложения'
    ]
  },
  location: {
    title: 'Доступ к геолокации',
    message: 'FitStream использует геолокацию для:',
    icon: '📍',
    benefits: [
      'Поиск Bluetooth-устройств поблизости',
      'Отслеживание маршрутов пробежек'
    ]
  },
  notifications: {
    title: 'Уведомления',
    message: 'FitStream отправляет уведомления для:',
    icon: '🔔',
    benefits: [
      'Напоминания о тренировках',
      'Достижение целей',
      'Мотивационные сообщения'
    ]
  }
};

class PermissionService {
  private isNative = Capacitor.isNativePlatform();

  /**
   * Get rationale for a permission type
   */
  getRationale(type: PermissionType): PermissionRationale {
    return RATIONALES[type];
  }

  /**
   * Check current permission status
   */
  async checkPermission(type: PermissionType): Promise<PermissionInfo> {
    if (!this.isNative) {
      // Web - check via browser APIs
      return this.checkWebPermission(type);
    }

    switch (type) {
      case 'camera':
        return this.checkCameraPermission();
      case 'bluetooth':
        return this.checkBluetoothPermission();
      case 'health_connect':
        return this.checkHealthConnectPermission();
      default:
        return {
          type,
          status: 'unavailable',
          canRequest: false,
          requiresSettings: false
        };
    }
  }

  /**
   * Request permission with automatic rationale handling
   */
  async requestPermission(type: PermissionType): Promise<PermissionInfo> {
    if (!this.isNative) {
      return this.requestWebPermission(type);
    }

    switch (type) {
      case 'camera':
        return this.requestCameraPermission();
      case 'bluetooth':
        return this.requestBluetoothPermission();
      case 'health_connect':
        return this.requestHealthConnectPermission();
      default:
        return {
          type,
          status: 'unavailable',
          canRequest: false,
          requiresSettings: false
        };
    }
  }

  /**
   * Open app settings for manual permission grant
   */
  async openSettings(): Promise<void> {
    if (!this.isNative) {
      console.log('Cannot open settings on web');
      return;
    }

    try {
      const { NativeSettings, AndroidSettings, IOSSettings } = await import('capacitor-native-settings');

      if (Capacitor.getPlatform() === 'android') {
        await NativeSettings.openAndroid({
          option: AndroidSettings.ApplicationDetails
        });
      } else {
        await NativeSettings.openIOS({
          option: IOSSettings.App
        });
      }
    } catch (error) {
      console.error('Failed to open settings:', error);
      // Fallback - try App plugin
      try {
        const { App } = await import('@capacitor/app');
        // Can't open settings directly, but at least log
        console.log('Native settings not available');
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Open Health Connect app or Play Store
   */
  async openHealthConnect(): Promise<void> {
    if (!this.isNative) return;

    try {
      const Health = await getHealthPlugin();
      if (Health?.openHealthConnectSettings) {
        await Health.openHealthConnectSettings();
      } else {
        // Open Play Store
        window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata', '_system');
      }
    } catch {
      window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata', '_system');
    }
  }

  /**
   * Enable Bluetooth via system dialog
   */
  async enableBluetooth(): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const BleClient = await getBleClient();
      if (!BleClient) return false;

      // This will prompt user to enable Bluetooth
      await BleClient.initialize({ androidNeverForLocation: true });
      const enabled = await BleClient.isEnabled();

      if (!enabled) {
        // Try to request enable (Android only)
        try {
          await BleClient.requestEnable?.();
          return await BleClient.isEnabled();
        } catch {
          return false;
        }
      }

      return enabled;
    } catch {
      return false;
    }
  }

  // ============ Private Methods ============

  private async checkWebPermission(type: PermissionType): Promise<PermissionInfo> {
    if (type === 'camera') {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return {
          type,
          status: result.state === 'granted' ? 'granted' :
                  result.state === 'denied' ? 'denied' : 'not_requested',
          canRequest: result.state !== 'denied',
          requiresSettings: result.state === 'denied'
        };
      } catch {
        return { type, status: 'not_requested', canRequest: true, requiresSettings: false };
      }
    }

    // Other permissions not available on web
    return { type, status: 'unavailable', canRequest: false, requiresSettings: false };
  }

  private async requestWebPermission(type: PermissionType): Promise<PermissionInfo> {
    if (type === 'camera') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        return { type, status: 'granted', canRequest: false, requiresSettings: false };
      } catch (error: any) {
        const isDenied = error.name === 'NotAllowedError';
        return {
          type,
          status: isDenied ? 'denied' : 'unavailable',
          canRequest: !isDenied,
          requiresSettings: isDenied
        };
      }
    }

    return { type, status: 'unavailable', canRequest: false, requiresSettings: false };
  }

  private async checkCameraPermission(): Promise<PermissionInfo> {
    try {
      const Camera = await getCamera();
      if (!Camera) {
        return { type: 'camera', status: 'unavailable', canRequest: false, requiresSettings: false };
      }

      const result = await Camera.checkPermissions();
      const status = this.mapCapacitorStatus(result.camera);

      return {
        type: 'camera',
        status,
        canRequest: status === 'not_requested' || status === 'denied',
        requiresSettings: status === 'denied_forever'
      };
    } catch {
      return { type: 'camera', status: 'unavailable', canRequest: false, requiresSettings: false };
    }
  }

  private async requestCameraPermission(): Promise<PermissionInfo> {
    try {
      const Camera = await getCamera();
      if (!Camera) {
        return { type: 'camera', status: 'unavailable', canRequest: false, requiresSettings: false };
      }

      const result = await Camera.requestPermissions({ permissions: ['camera'] });
      const status = this.mapCapacitorStatus(result.camera);

      return {
        type: 'camera',
        status,
        canRequest: false,
        requiresSettings: status === 'denied' || status === 'denied_forever'
      };
    } catch {
      return { type: 'camera', status: 'denied', canRequest: false, requiresSettings: true };
    }
  }

  private async checkBluetoothPermission(): Promise<PermissionInfo> {
    try {
      const BleClient = await getBleClient();
      if (!BleClient) {
        return { type: 'bluetooth', status: 'unavailable', canRequest: false, requiresSettings: false };
      }

      // Check if Bluetooth is enabled
      const enabled = await BleClient.isEnabled();
      if (!enabled) {
        return {
          type: 'bluetooth',
          status: 'denied',
          canRequest: true,
          requiresSettings: false
        };
      }

      // Try a quick scan to check permissions
      return {
        type: 'bluetooth',
        status: 'not_requested',
        canRequest: true,
        requiresSettings: false
      };
    } catch {
      return { type: 'bluetooth', status: 'unavailable', canRequest: false, requiresSettings: false };
    }
  }

  private async requestBluetoothPermission(): Promise<PermissionInfo> {
    try {
      const BleClient = await getBleClient();
      if (!BleClient) {
        return { type: 'bluetooth', status: 'unavailable', canRequest: false, requiresSettings: false };
      }

      // Initialize BLE (this requests permissions on Android 12+)
      await BleClient.initialize({ androidNeverForLocation: true });

      // Check if enabled
      const enabled = await BleClient.isEnabled();
      if (!enabled) {
        // Try to enable
        try {
          await BleClient.requestEnable?.();
        } catch {
          return {
            type: 'bluetooth',
            status: 'denied',
            canRequest: false,
            requiresSettings: true
          };
        }
      }

      // Try a scan to verify permissions work
      try {
        await BleClient.requestLEScan({ services: [] }, () => {});
        await BleClient.stopLEScan();
        return { type: 'bluetooth', status: 'granted', canRequest: false, requiresSettings: false };
      } catch {
        return { type: 'bluetooth', status: 'denied', canRequest: false, requiresSettings: true };
      }
    } catch (error) {
      console.error('Bluetooth permission error:', error);
      return { type: 'bluetooth', status: 'denied', canRequest: false, requiresSettings: true };
    }
  }

  private async checkHealthConnectPermission(): Promise<PermissionInfo> {
    try {
      const Health = await getHealthPlugin();
      if (!Health) {
        return { type: 'health_connect', status: 'unavailable', canRequest: false, requiresSettings: false };
      }

      // Check if Health Connect is available (installed)
      const available = await Health.isAvailable();
      if (!available?.available && !available?.isAvailable) {
        return {
          type: 'health_connect',
          status: 'unavailable',
          canRequest: false,
          requiresSettings: false
        };
      }

      // Check if we have permissions
      try {
        const auth = await Health.checkAuthorization({
          read: ['Steps'],
          write: []
        });

        const hasPermission = auth.grantedPermissions?.includes('Steps') ||
                              auth.granted ||
                              auth.success;

        return {
          type: 'health_connect',
          status: hasPermission ? 'granted' : 'not_requested',
          canRequest: !hasPermission,
          requiresSettings: false
        };
      } catch {
        return { type: 'health_connect', status: 'not_requested', canRequest: true, requiresSettings: false };
      }
    } catch {
      return { type: 'health_connect', status: 'unavailable', canRequest: false, requiresSettings: false };
    }
  }

  private async requestHealthConnectPermission(): Promise<PermissionInfo> {
    try {
      const Health = await getHealthPlugin();
      if (!Health) {
        return { type: 'health_connect', status: 'unavailable', canRequest: false, requiresSettings: false };
      }

      // Check availability first
      const available = await Health.isAvailable();
      if (!available?.available && !available?.isAvailable) {
        return {
          type: 'health_connect',
          status: 'unavailable',
          canRequest: false,
          requiresSettings: false
        };
      }

      // Request permissions
      const result = await Health.requestAuthorization({
        read: [
          'Steps',
          'Distance',
          'ActiveCaloriesBurned',
          'TotalCaloriesBurned',
          'Weight',
          'BodyFat',
          'HeartRate',
          'ExerciseSession',
          'SleepSession'
        ],
        write: ['Weight', 'BodyFat']
      });

      const granted = result.granted || result.success || false;

      return {
        type: 'health_connect',
        status: granted ? 'granted' : 'denied',
        canRequest: false,
        requiresSettings: !granted
      };
    } catch (error) {
      console.error('Health Connect permission error:', error);
      return { type: 'health_connect', status: 'denied', canRequest: false, requiresSettings: true };
    }
  }

  private mapCapacitorStatus(status: string): PermissionStatus {
    switch (status) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied_forever';
      case 'prompt':
      case 'prompt-with-rationale':
        return 'not_requested';
      default:
        return 'not_requested';
    }
  }
}

export const permissionService = new PermissionService();
