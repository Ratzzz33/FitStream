import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface PermissionStatus {
  camera: 'granted' | 'denied' | 'prompt';
  location: 'granted' | 'denied' | 'prompt';
  bluetooth: 'granted' | 'denied' | 'prompt';
}

class PermissionsService {
  private isNative = Capacitor.isNativePlatform();

  async checkAllPermissions(): Promise<PermissionStatus> {
    if (!this.isNative) {
      return {
        camera: 'granted',
        location: 'granted',
        bluetooth: 'granted',
      };
    }

    const [cameraStatus, locationStatus] = await Promise.all([
      this.checkCameraPermission(),
      this.checkLocationPermission(),
    ]);

    return {
      camera: cameraStatus,
      location: locationStatus,
      bluetooth: 'prompt',
    };
  }

  async checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isNative) return 'granted';

    try {
      const status = await Camera.checkPermissions();
      return status.camera as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      console.error('[Permissions] Camera check failed:', error);
      return 'prompt';
    }
  }

  async checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isNative) return 'granted';

    try {
      const status = await Geolocation.checkPermissions();
      return status.location as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      console.error('[Permissions] Location check failed:', error);
      return 'prompt';
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    if (!this.isNative) return true;

    try {
      const status = await Camera.requestPermissions({ permissions: ['camera'] });
      console.log('[Permissions] Camera permission:', status.camera);
      return status.camera === 'granted';
    } catch (error) {
      console.error('[Permissions] Camera request failed:', error);
      return false;
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    if (!this.isNative) return true;

    try {
      const status = await Geolocation.requestPermissions();
      console.log('[Permissions] Location permission:', status.location);
      return status.location === 'granted';
    } catch (error) {
      console.error('[Permissions] Location request failed:', error);
      return false;
    }
  }

  async requestAllPermissions(): Promise<PermissionStatus> {
    if (!this.isNative) {
      return {
        camera: 'granted',
        location: 'granted',
        bluetooth: 'granted',
      };
    }

    console.log('[Permissions] Requesting all permissions...');

    const cameraGranted = await this.requestCameraPermission();
    const locationGranted = await this.requestLocationPermission();

    const status: PermissionStatus = {
      camera: cameraGranted ? 'granted' : 'denied',
      location: locationGranted ? 'granted' : 'denied',
      bluetooth: 'prompt',
    };

    console.log('[Permissions] Final status:', status);
    return status;
  }

  async ensureCameraPermission(): Promise<boolean> {
    const status = await this.checkCameraPermission();
    if (status === 'granted') return true;
    if (status === 'denied') return false;
    return this.requestCameraPermission();
  }

  async ensureLocationPermission(): Promise<boolean> {
    const status = await this.checkLocationPermission();
    if (status === 'granted') return true;
    if (status === 'denied') return false;
    return this.requestLocationPermission();
  }
}

export const permissionsService = new PermissionsService();
