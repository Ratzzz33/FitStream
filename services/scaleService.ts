/**
 * Smart Scale Service - Xiaomi Mi Scale BLE Integration
 *
 * Supports:
 * - Xiaomi Mi Scale V1 (XMTZC01HM)
 * - Xiaomi Mi Scale V2 / Body Composition Scale (XMTZC02HM, XMTZC05HM)
 *
 * Protocol based on openScale reverse engineering:
 * https://github.com/oliexdev/openScale/wiki/Xiaomi-Bluetooth-Mi-Scale
 */

import { BleClient, BleDevice, numberToUUID } from '@capacitor-community/bluetooth-le';
import { BodyComposition, SmartScaleDevice, WeightLog } from '../types';
import { StorageService } from './storageService';

// Xiaomi Mi Scale UUIDs
const XIAOMI_SCALE_SERVICE = '181d'; // Weight Scale Service
const XIAOMI_BODY_COMPOSITION_SERVICE = '181b'; // Body Composition Service
const WEIGHT_MEASUREMENT_CHAR = '2a9d';
const BODY_COMPOSITION_CHAR = '2a9c';

// Mi Scale V2 specific
const MI_SCALE_V2_SERVICE = 'f0170001-3001-0001-0000-00805f9b34fb';

// Scale detection patterns
const XIAOMI_MANUFACTURER_DATA_PREFIX = [0x57, 0x01]; // Mi Scale identifier

interface ScaleReading {
  weight: number;
  unit: 'kg' | 'lbs' | 'jin';
  isStabilized: boolean;
  hasImpedance: boolean;
  impedance?: number;
  timestamp: number;
}

type ScaleEventCallback = (reading: ScaleReading) => void;
type ConnectionCallback = (connected: boolean, device?: SmartScaleDevice) => void;

class ScaleService {
  private isInitialized = false;
  private connectedDevice: BleDevice | null = null;
  private onReading: ScaleEventCallback | null = null;
  private onConnectionChange: ConnectionCallback | null = null;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize BLE client
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await BleClient.initialize({ androidNeverForLocation: true });
      this.isInitialized = true;
      console.log('[ScaleService] BLE initialized');
      return true;
    } catch (error) {
      console.error('[ScaleService] BLE init failed:', error);
      return false;
    }
  }

  /**
   * Check if BLE is available on this device
   */
  async isAvailable(): Promise<boolean> {
    try {
      const enabled = await BleClient.isEnabled();
      return enabled;
    } catch {
      return false;
    }
  }

  /**
   * Request BLE permissions (Android 12+)
   */
  async requestPermissions(): Promise<boolean> {
    try {
      await BleClient.requestLEScan({ services: [] }, () => {});
      await BleClient.stopLEScan();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scan for Xiaomi Mi Scale devices
   */
  async scanForScales(
    onDeviceFound: (device: SmartScaleDevice) => void,
    duration: number = 10000
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const foundDevices = new Set<string>();

    try {
      await BleClient.requestLEScan(
        {
          // Scan for weight scale and body composition services
          services: [numberToUUID(0x181d), numberToUUID(0x181b)],
          allowDuplicates: false,
        },
        (result) => {
          if (foundDevices.has(result.device.deviceId)) return;

          const device = this.identifyDevice(result);
          if (device) {
            foundDevices.add(result.device.deviceId);
            onDeviceFound(device);
          }
        }
      );

      // Also scan by name pattern for devices that don't advertise standard services
      await BleClient.requestLEScan(
        {
          namePrefix: 'MI',
          allowDuplicates: false,
        },
        (result) => {
          if (foundDevices.has(result.device.deviceId)) return;

          const name = result.device.name || result.localName || '';
          if (name.includes('MIBFS') || name.includes('MI_SCALE') || name.includes('XMTZC')) {
            foundDevices.add(result.device.deviceId);
            onDeviceFound({
              id: result.device.deviceId,
              name: name || 'Mi Scale',
              type: name.includes('MIBFS') ? 'xiaomi_v2' : 'xiaomi_v1',
              connected: false,
              lastSeen: Date.now(),
            });
          }
        }
      );

      this.scanTimeout = setTimeout(async () => {
        await this.stopScan();
      }, duration);
    } catch (error) {
      console.error('[ScaleService] Scan error:', error);
      throw error;
    }
  }

  /**
   * Stop BLE scanning
   */
  async stopScan(): Promise<void> {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    try {
      await BleClient.stopLEScan();
    } catch {
      // Ignore stop errors
    }
  }

  /**
   * Connect to a scale device
   */
  async connect(
    deviceId: string,
    onReading: ScaleEventCallback,
    onConnectionChange: ConnectionCallback
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.onReading = onReading;
    this.onConnectionChange = onConnectionChange;

    try {
      await BleClient.connect(deviceId, (disconnectedId) => {
        console.log('[ScaleService] Disconnected:', disconnectedId);
        this.connectedDevice = null;
        this.onConnectionChange?.(false);
      });

      this.connectedDevice = { deviceId } as BleDevice;

      // Try to subscribe to weight notifications
      await this.subscribeToWeightNotifications(deviceId);

      const device: SmartScaleDevice = {
        id: deviceId,
        name: 'Mi Scale',
        type: 'xiaomi_v2',
        connected: true,
        lastSeen: Date.now(),
      };

      onConnectionChange(true, device);
      console.log('[ScaleService] Connected to:', deviceId);
      return true;
    } catch (error) {
      console.error('[ScaleService] Connect error:', error);
      onConnectionChange(false);
      return false;
    }
  }

  /**
   * Disconnect from current scale
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await BleClient.disconnect(this.connectedDevice.deviceId);
      } catch {
        // Ignore disconnect errors
      }
      this.connectedDevice = null;
      this.onConnectionChange?.(false);
    }
  }

  /**
   * Subscribe to weight measurement notifications
   */
  private async subscribeToWeightNotifications(deviceId: string): Promise<void> {
    try {
      // Try standard Weight Scale service first
      await BleClient.startNotifications(
        deviceId,
        numberToUUID(0x181d),
        numberToUUID(0x2a9d),
        (value) => this.handleWeightData(value)
      );
    } catch {
      // Try Body Composition service
      try {
        await BleClient.startNotifications(
          deviceId,
          numberToUUID(0x181b),
          numberToUUID(0x2a9c),
          (value) => this.handleBodyCompositionData(value)
        );
      } catch (error) {
        console.error('[ScaleService] Failed to subscribe:', error);
        throw error;
      }
    }
  }

  /**
   * Parse weight data from BLE notification
   * Mi Scale protocol: https://github.com/oliexdev/openScale/wiki/Xiaomi-Bluetooth-Mi-Scale
   */
  private handleWeightData(value: DataView): void {
    if (value.byteLength < 10) return;

    const ctrlByte = value.getUint8(0);
    const isStabilized = (ctrlByte & 0x20) !== 0;
    const weightRemoved = (ctrlByte & 0x80) !== 0;
    const hasImpedance = (ctrlByte & 0x02) !== 0;

    // Unit: bits 0-1 of control byte
    // 0x00 = kg, 0x01 = lbs, 0x02 = jin
    const unitBits = ctrlByte & 0x03;
    const unit: 'kg' | 'lbs' | 'jin' = unitBits === 0x01 ? 'lbs' : unitBits === 0x02 ? 'jin' : 'kg';

    // Weight is at bytes 1-2 (little endian)
    let weight = value.getUint16(1, true);

    // Convert to kg
    if (unit === 'lbs' || unit === 'jin') {
      weight = weight / 100;
    } else {
      weight = weight / 200;
    }

    // Impedance at bytes 9-10 if available
    let impedance: number | undefined;
    if (hasImpedance && value.byteLength >= 12) {
      impedance = value.getUint16(9, true);
    }

    if (weightRemoved) {
      console.log('[ScaleService] Weight removed from scale');
      return;
    }

    const reading: ScaleReading = {
      weight: Math.round(weight * 100) / 100,
      unit: 'kg',
      isStabilized,
      hasImpedance,
      impedance,
      timestamp: Date.now(),
    };

    console.log('[ScaleService] Weight reading:', reading);

    if (isStabilized) {
      this.onReading?.(reading);
    }
  }

  /**
   * Parse body composition data from BLE notification
   */
  private handleBodyCompositionData(value: DataView): void {
    // Body composition format includes weight + impedance
    this.handleWeightData(value);
  }

  /**
   * Calculate body composition from weight and impedance
   * Formulas based on openScale and academic papers
   */
  calculateBodyComposition(
    weight: number,
    impedance: number,
    age: number,
    height: number,
    gender: 'MALE' | 'FEMALE' | 'OTHER'
  ): BodyComposition {
    const isMale = gender === 'MALE';
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    // Lean Body Mass calculation (Hume formula variation)
    let lbm: number;
    if (isMale) {
      lbm = (0.32810 * weight) + (0.33929 * height) - 29.5336;
    } else {
      lbm = (0.29569 * weight) + (0.41813 * height) - 43.2933;
    }
    lbm = Math.max(lbm, weight * 0.5);

    // Body fat percentage (using impedance)
    let bodyFat: number;
    if (impedance > 0) {
      // BIA formula with impedance
      const impedanceFactor = impedance / 100;
      if (isMale) {
        bodyFat = (1.20 * bmi) + (0.23 * age) - (10.8 * 1) - 5.4 - (impedanceFactor * 0.1);
      } else {
        bodyFat = (1.20 * bmi) + (0.23 * age) - (10.8 * 0) - 5.4 - (impedanceFactor * 0.08);
      }
    } else {
      // Fallback without impedance (less accurate)
      if (isMale) {
        bodyFat = (1.20 * bmi) + (0.23 * age) - 16.2;
      } else {
        bodyFat = (1.20 * bmi) + (0.23 * age) - 5.4;
      }
    }
    bodyFat = Math.max(3, Math.min(60, bodyFat));

    // Muscle mass (lean body mass minus bone mass)
    const boneMass = isMale
      ? 0.18016 + (0.02502 * weight)
      : 0.245691 + (0.01665 * weight);

    const muscleMass = lbm - boneMass;

    // Water percentage (typically 50-65% of lean mass)
    const waterPercent = ((lbm / weight) * 100) * 0.73;

    // Visceral fat (approximation based on waist-to-height ratio proxy)
    let visceralFat = (bmi - 10) * 0.5;
    if (!isMale) visceralFat *= 0.8;
    visceralFat = Math.max(1, Math.min(30, Math.round(visceralFat)));

    // BMR (Mifflin-St Jeor)
    let bmr: number;
    if (isMale) {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Metabolic age (approximation)
    const idealBMI = 22;
    const bmiDiff = bmi - idealBMI;
    const metabolicAge = Math.round(age + (bmiDiff * 0.5) + ((bodyFat - 20) * 0.3));

    // Protein percentage
    const proteinPercent = (muscleMass / weight) * 100 * 0.2;

    return {
      bodyFat: Math.round(bodyFat * 10) / 10,
      muscleMass: Math.round(muscleMass * 100) / 100,
      boneMass: Math.round(boneMass * 100) / 100,
      waterPercent: Math.round(waterPercent * 10) / 10,
      visceralFat: Math.round(visceralFat),
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      metabolicAge: Math.max(18, Math.min(80, metabolicAge)),
      proteinPercent: Math.round(proteinPercent * 10) / 10,
      lbm: Math.round(lbm * 100) / 100,
      impedance,
    };
  }

  /**
   * Create and save a weight log from scale reading
   */
  saveScaleReading(reading: ScaleReading): WeightLog {
    const settings = StorageService.getSettings();

    let bodyComposition: BodyComposition | undefined;
    if (reading.impedance && reading.impedance > 0) {
      bodyComposition = this.calculateBodyComposition(
        reading.weight,
        reading.impedance,
        settings.age,
        settings.height,
        settings.gender
      );
    } else {
      // Calculate basic metrics without impedance
      const heightM = settings.height / 100;
      bodyComposition = {
        bmi: Math.round((reading.weight / (heightM * heightM)) * 10) / 10,
      };
    }

    const log: WeightLog = {
      id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: reading.timestamp,
      weight: reading.weight,
      source: 'smart_scale',
      bodyComposition,
    };

    StorageService.saveWeight(log);
    return log;
  }

  /**
   * Identify device type from scan result
   */
  private identifyDevice(result: any): SmartScaleDevice | null {
    const name = result.device.name || result.localName || '';

    // Check for Xiaomi scale patterns
    if (
      name.includes('MIBFS') ||
      name.includes('MI_SCALE') ||
      name.includes('XMTZC') ||
      name.includes('Mi Body')
    ) {
      return {
        id: result.device.deviceId,
        name: name || 'Mi Scale',
        type: name.includes('MIBFS') || name.includes('XMTZC02') ? 'xiaomi_v2' : 'xiaomi_v1',
        connected: false,
        lastSeen: Date.now(),
      };
    }

    // Check manufacturer data for Xiaomi identifier
    if (result.manufacturerData) {
      const mfData = new Uint8Array(result.manufacturerData);
      if (mfData[0] === 0x57 && mfData[1] === 0x01) {
        return {
          id: result.device.deviceId,
          name: name || 'Mi Scale',
          type: 'xiaomi_v2',
          connected: false,
          lastSeen: Date.now(),
        };
      }
    }

    return null;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }
}

export const scaleService = new ScaleService();
