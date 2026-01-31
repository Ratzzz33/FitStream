/**
 * Device Settings Component
 *
 * Unified settings for all health device connections:
 * - Smart Scales (Xiaomi Mi Scale via BLE)
 * - Health Connect (Samsung Health, Google Fit)
 * - Smartwatches (via Health Connect data sources)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale, Watch, Activity, Bluetooth, BluetoothSearching,
  Check, X, RefreshCw, Settings, AlertCircle, Heart,
  Footprints, Flame, Moon, ChevronRight, Smartphone,
  Link2, Unlink, Loader2, ExternalLink, Shield
} from 'lucide-react';
import { UserSettings, SmartScaleDevice } from '../types';
import { StorageService } from '../services/storageService';
import { scaleService } from '../services/scaleService';
import { healthService, HealthConnectionStatus } from '../services/healthService';
import { platformService } from '../services/platformService';
import { permissionService, PermissionInfo } from '../services/permissionService';
import { t } from '../services/i18n';

interface DeviceSettingsProps {
  settings: UserSettings;
  onUpdate: () => void;
  onClose?: () => void;
}

interface ConnectedScale {
  id: string;
  name: string;
  lastWeight?: number;
  lastSync?: string;
}

export const DeviceSettings: React.FC<DeviceSettingsProps> = ({ settings, onUpdate, onClose }) => {
  // Scale state
  const [isScanning, setIsScanning] = useState(false);
  const [foundScales, setFoundScales] = useState<SmartScaleDevice[]>([]);
  const [connectedScale, setConnectedScale] = useState<ConnectedScale | null>(null);
  const [scaleError, setScaleError] = useState<string | null>(null);
  const [bleAvailable, setBleAvailable] = useState(false);

  // Permission states
  const [bluetoothPermission, setBluetoothPermission] = useState<PermissionInfo | null>(null);
  const [healthPermission, setHealthPermission] = useState<PermissionInfo | null>(null);
  const [isRequestingBluetooth, setIsRequestingBluetooth] = useState(false);

  // Health Connect state
  const [healthStatus, setHealthStatus] = useState<HealthConnectionStatus | null>(null);
  const [isConnectingHealth, setIsConnectingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<string[]>([]);

  // Stats
  const [todaySteps, setTodaySteps] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);

  const platformInfo = platformService.getInfo();
  const isAndroid = platformInfo.platform === 'android';
  const isNative = platformInfo.isNative;

  // Load saved scale from settings
  useEffect(() => {
    const savedScale = (settings as any).connectedScale;
    if (savedScale) {
      setConnectedScale(savedScale);
    }
  }, [settings]);

  // Check permissions and BLE availability
  useEffect(() => {
    const checkPermissions = async () => {
      if (isNative) {
        // Check Bluetooth permission
        const btPerm = await permissionService.checkPermission('bluetooth');
        setBluetoothPermission(btPerm);
        setBleAvailable(btPerm.status === 'granted');

        // Check Health Connect permission
        const healthPerm = await permissionService.checkPermission('health_connect');
        setHealthPermission(healthPerm);
      }
    };
    checkPermissions();
  }, [isNative]);

  // Check Health Connect status when permission is granted
  useEffect(() => {
    const checkHealth = async () => {
      if (isNative && healthPermission?.status === 'granted') {
        try {
          const status = await healthService.getConnectionStatus();
          setHealthStatus(status);

          if (status.isConnected) {
            const steps = await healthService.getTodaySteps();
            const calories = await healthService.getTodayCalories();
            setTodaySteps(steps);
            setTodayCalories(calories);

            // Get data sources
            const sources = await healthService.getDataSources();
            setDataSources(sources);
          }
        } catch (e) {
          console.error('Health check failed:', e);
        }
      }
    };
    checkHealth();
  }, [isNative, healthPermission]);

  // Request Bluetooth permission
  const handleRequestBluetoothPermission = useCallback(async () => {
    setIsRequestingBluetooth(true);
    setScaleError(null);

    try {
      const result = await permissionService.requestPermission('bluetooth');
      setBluetoothPermission(result);
      setBleAvailable(result.status === 'granted');

      if (result.status !== 'granted') {
        if (result.status === 'denied' && result.type === 'bluetooth') {
          setScaleError('Включите Bluetooth в настройках телефона');
        } else if (result.requiresSettings) {
          setScaleError('Разрешение отклонено. Включите в настройках приложения.');
        }
      }
    } catch (error: any) {
      setScaleError(error.message || 'Ошибка запроса разрешения');
    } finally {
      setIsRequestingBluetooth(false);
    }
  }, []);

  // Enable Bluetooth
  const handleEnableBluetooth = useCallback(async () => {
    setIsRequestingBluetooth(true);
    setScaleError(null);

    try {
      const enabled = await permissionService.enableBluetooth();
      if (enabled) {
        const result = await permissionService.checkPermission('bluetooth');
        setBluetoothPermission(result);
        setBleAvailable(result.status === 'granted');
      } else {
        setScaleError('Не удалось включить Bluetooth');
      }
    } catch (error: any) {
      setScaleError(error.message || 'Ошибка включения Bluetooth');
    } finally {
      setIsRequestingBluetooth(false);
    }
  }, []);

  // Scan for scales
  const handleScanScales = useCallback(async () => {
    // Check permission first
    if (!bleAvailable) {
      await handleRequestBluetoothPermission();
      return;
    }

    setIsScanning(true);
    setScaleError(null);
    setFoundScales([]);

    try {
      await scaleService.initialize();

      await scaleService.scanForScales((device) => {
        setFoundScales(prev => {
          if (prev.find(d => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }, 15000);
    } catch (error: any) {
      setScaleError(error.message || 'Ошибка сканирования');
    } finally {
      setIsScanning(false);
    }
  }, [bleAvailable, handleRequestBluetoothPermission]);

  // Connect to scale
  const handleConnectScale = useCallback(async (device: SmartScaleDevice) => {
    setScaleError(null);

    try {
      const connected = await scaleService.connect(
        device.id,
        (_reading) => {}, // onReading callback - not used in settings
        (_connected, _device) => {} // onConnectionChange callback - handled manually below
      );

      if (connected) {
        const newConnectedScale: ConnectedScale = {
          id: device.id,
          name: device.name,
          lastSync: new Date().toISOString()
        };

        setConnectedScale(newConnectedScale);
        setFoundScales([]);

        // Save to settings
        const newSettings = { ...settings, connectedScale: newConnectedScale };
        StorageService.saveSettings(newSettings);
        onUpdate();
      }
    } catch (error: any) {
      setScaleError(error.message || 'Connection failed');
    }
  }, [settings, onUpdate]);

  // Disconnect scale
  const handleDisconnectScale = useCallback(async () => {
    try {
      await scaleService.disconnect();
      setConnectedScale(null);

      const newSettings = { ...settings };
      delete (newSettings as any).connectedScale;
      StorageService.saveSettings(newSettings);
      onUpdate();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, [settings, onUpdate]);

  // Connect to Health Connect
  const handleConnectHealth = useCallback(async () => {
    setIsConnectingHealth(true);
    setHealthError(null);

    try {
      const connected = await healthService.connect();

      if (connected) {
        const status = await healthService.getConnectionStatus();
        setHealthStatus(status);

        const steps = await healthService.getTodaySteps();
        const calories = await healthService.getTodayCalories();
        setTodaySteps(steps);
        setTodayCalories(calories);

        const sources = await healthService.getDataSources();
        setDataSources(sources);

        // Update settings
        const newSettings = { ...settings };
        if (!newSettings.connectedPlatforms) {
          newSettings.connectedPlatforms = { googleFit: false, appleHealth: false, lastSync: null };
        }
        newSettings.connectedPlatforms.googleFit = true;
        newSettings.connectedPlatforms.lastSync = new Date().toISOString();
        StorageService.saveSettings(newSettings);
        onUpdate();
      } else {
        setHealthError('Permission denied. Enable in Health Connect settings.');
      }
    } catch (error: any) {
      setHealthError(error.message || 'Connection failed');
    } finally {
      setIsConnectingHealth(false);
    }
  }, [settings, onUpdate]);

  // Disconnect Health Connect
  const handleDisconnectHealth = useCallback(async () => {
    try {
      await healthService.disconnect();
      setHealthStatus(null);
      setTodaySteps(0);
      setTodayCalories(0);
      setDataSources([]);

      const newSettings = { ...settings };
      if (newSettings.connectedPlatforms) {
        newSettings.connectedPlatforms.googleFit = false;
      }
      StorageService.saveSettings(newSettings);
      onUpdate();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, [settings, onUpdate]);

  // Open Health Connect settings
  const handleOpenHealthSettings = useCallback(async () => {
    try {
      await healthService.openHealthSettings();
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  }, []);

  // Sync data
  const handleSync = useCallback(async () => {
    if (healthStatus?.isConnected) {
      await healthService.syncStepsToStorage();
      const steps = await healthService.getTodaySteps();
      const calories = await healthService.getTodayCalories();
      setTodaySteps(steps);
      setTodayCalories(calories);
      onUpdate();
    }
  }, [healthStatus, onUpdate]);

  if (!isNative) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone size={24} className="text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('deviceSettings') || 'Device Settings'}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('deviceSettingsNativeOnly') || 'Device connections are only available in the mobile app.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings size={20} className="text-blue-500" />
          {t('deviceSettings') || 'Device Connections'}
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Smart Scales Section */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Scale size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t('smartScales') || 'Smart Scales'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Xiaomi Mi Scale, Body Composition Scale
            </p>
          </div>
        </div>

        {/* Bluetooth Permission Request */}
        {bluetoothPermission && bluetoothPermission.status !== 'granted' ? (
          <div className={`p-4 rounded-xl border mb-3 ${
            bluetoothPermission.status === 'denied' || bluetoothPermission.status === 'denied_forever'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                bluetoothPermission.status === 'denied' ? 'bg-yellow-100 dark:bg-yellow-800' : 'bg-blue-100 dark:bg-blue-800'
              }`}>
                <Bluetooth size={20} className={bluetoothPermission.status === 'denied' ? 'text-yellow-600' : 'text-blue-600'} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Доступ к Bluetooth</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {bluetoothPermission.status === 'denied'
                    ? 'Bluetooth отключен'
                    : bluetoothPermission.status === 'denied_forever'
                      ? 'Разрешение отклонено'
                      : 'Требуется для поиска весов'}
                </p>
              </div>
            </div>

            {/* Benefits */}
            <ul className="space-y-1 mb-4 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Check size={12} className="text-green-500" />
                Автоматическое получение веса
              </li>
              <li className="flex items-center gap-2">
                <Check size={12} className="text-green-500" />
                Данные о составе тела
              </li>
            </ul>

            {/* Action button */}
            {bluetoothPermission.status === 'denied' ? (
              <button
                onClick={handleEnableBluetooth}
                disabled={isRequestingBluetooth}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRequestingBluetooth ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Bluetooth size={18} />
                    Включить Bluetooth
                  </>
                )}
              </button>
            ) : bluetoothPermission.requiresSettings ? (
              <button
                onClick={() => permissionService.openSettings()}
                className="w-full py-3 px-4 rounded-xl bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={18} />
                Открыть настройки
              </button>
            ) : (
              <button
                onClick={handleRequestBluetoothPermission}
                disabled={isRequestingBluetooth}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRequestingBluetooth ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Shield size={18} />
                    Разрешить доступ
                  </>
                )}
              </button>
            )}
          </div>
        ) : connectedScale ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <Check size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{connectedScale.name}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Bluetooth size={10} /> {t('connected') || 'Connected'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDisconnectScale}
                className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition flex items-center gap-1"
              >
                <Unlink size={12} />
                {t('disconnect') || 'Disconnect'}
              </button>
            </div>

            {connectedScale.lastWeight && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last: {connectedScale.lastWeight} kg
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {scaleError && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-xs text-red-700 dark:text-red-400">{scaleError}</span>
              </div>
            )}

            {foundScales.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t('foundDevices') || 'Found devices'}:
                </p>
                {foundScales.map(device => (
                  <button
                    key={device.id}
                    onClick={() => handleConnectScale(device)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Scale size={16} className="text-purple-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</p>
                        <p className="text-xs text-gray-500">{device.type}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleScanScales}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <BluetoothSearching size={18} className="animate-pulse" />
                  {t('scanning') || 'Scanning...'}
                </>
              ) : (
                <>
                  <Bluetooth size={18} />
                  {t('scanForScales') || 'Scan for Scales'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Health Connect Section */}
      {isAndroid && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white">Health Connect</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Samsung Health, Google Fit, Fitbit
              </p>
            </div>
          </div>

          {/* Health Connect not installed */}
          {healthPermission?.status === 'unavailable' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <Heart size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Health Connect не установлен</p>
                  <p className="text-xs text-gray-500">Установите из Play Store</p>
                </div>
              </div>
              <button
                onClick={() => permissionService.openHealthConnect()}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                Установить Health Connect
              </button>
            </div>
          )}

          {healthError && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5" />
              <div>
                <span className="text-xs text-red-700 dark:text-red-400">{healthError}</span>
                <button
                  onClick={handleOpenHealthSettings}
                  className="block text-xs text-red-600 underline mt-1"
                >
                  Открыть настройки Health Connect
                </button>
              </div>
            </div>
          )}

          {healthPermission?.status !== 'unavailable' && healthStatus?.isConnected ? (
            <div className="space-y-3">
              {/* Connection status */}
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {t('connected') || 'Connected'}
                  </span>
                </div>
                <button
                  onClick={handleDisconnectHealth}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  {t('disconnect') || 'Disconnect'}
                </button>
              </div>

              {/* Today's stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Footprints size={14} className="text-emerald-600" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">{t('steps') || 'Steps'}</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {todaySteps.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={14} className="text-orange-600" />
                    <span className="text-xs text-orange-600 dark:text-orange-400">{t('calories') || 'Calories'}</span>
                  </div>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                    {todayCalories.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Data sources */}
              {dataSources.length > 0 && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {t('dataSources') || 'Data Sources'}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dataSources.map((source, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync button */}
              <button
                onClick={handleSync}
                className="w-full flex items-center justify-center gap-2 p-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
              >
                <RefreshCw size={14} />
                {t('syncNow') || 'Sync Now'}
              </button>

              {/* Settings link */}
              <button
                onClick={handleOpenHealthSettings}
                className="w-full flex items-center justify-center gap-2 p-2 text-gray-500 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <Settings size={12} />
                {t('managePermissions') || 'Manage Permissions'}
              </button>
            </div>
          ) : healthPermission?.status !== 'unavailable' ? (
            <div className="space-y-3">
              {/* Permission rationale */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <Heart size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Синхронизация данных</p>
                    <p className="text-xs text-gray-500">Подключите Health Connect</p>
                  </div>
                </div>

                {/* Benefits */}
                <ul className="space-y-1 mb-4 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    Шаги из Samsung Health, Google Fit
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    Пульс с часов и фитнес-браслетов
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    Данные о сне и тренировках
                  </li>
                </ul>

                <button
                  onClick={handleConnectHealth}
                  disabled={isConnectingHealth}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isConnectingHealth ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Shield size={18} />
                      Подключить Health Connect
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Smartwatch Section */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Watch size={20} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t('smartwatch') || 'Smartwatch'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Galaxy Watch, Wear OS, Fitbit
            </p>
          </div>
        </div>

        {isAndroid && healthStatus?.isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Check size={14} className="text-green-500" />
              <span>{t('watchDataViaHealthConnect') || 'Watch data synced via Health Connect'}</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('watchNote') || 'Your watch data (steps, heart rate, workouts) is automatically synced through Health Connect. Make sure your watch app is connected to Health Connect.'}
              </p>
            </div>

            {/* Available data types */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Footprints size={16} className="mx-auto text-emerald-500 mb-1" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('steps') || 'Steps'}</span>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Heart size={16} className="mx-auto text-red-500 mb-1" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('heartRate') || 'Heart Rate'}</span>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Moon size={16} className="mx-auto text-purple-500 mb-1" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('sleep') || 'Sleep'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Watch size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isAndroid
                ? (t('connectHealthConnectFirst') || 'Connect Health Connect to sync watch data')
                : (t('watchNotSupported') || 'Watch sync not yet supported on this platform')
              }
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center px-4">
        {t('devicePrivacyNote') || 'Your health data stays on your device and is only synced with your connected accounts.'}
      </div>
    </div>
  );
};

export default DeviceSettings;
