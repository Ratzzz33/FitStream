
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Check, RefreshCw, Bell, Heart, Smartphone, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UserSettings } from '../types';
import { t } from '../services/i18n';
import { platformService } from '../services/platformService';
import { healthService, HealthConnectionStatus } from '../services/healthService';

interface HealthConnectProps {
  settings: UserSettings;
  onUpdate: () => void;
}

const GoogleFitLogo = () => (
  <Activity className="text-blue-500" size={24} />
);

const AppleHealthLogo = () => (
  <Heart className="text-red-500" size={24} fill="currentColor" />
);

export const HealthConnect: React.FC<HealthConnectProps> = ({ settings, onUpdate }) => {
  const [connecting, setConnecting] = useState<'google' | 'apple' | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<HealthConnectionStatus | null>(null);
  const [todaySteps, setTodaySteps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const platforms = settings.connectedPlatforms || { googleFit: false, appleHealth: false, lastSync: null };
  const platformInfo = platformService.getInfo();

  // Check health service availability on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await healthService.getConnectionStatus();
        setConnectionStatus(status);

        // If connected, get today's steps
        if (status.isConnected) {
          const steps = await healthService.getTodaySteps();
          setTodaySteps(steps);
        }
      } catch (e) {
        console.error('Failed to check health status:', e);
      }
    };

    checkStatus();
  }, []);

  // Check for stale data
  useEffect(() => {
    if (!platforms.googleFit && !platforms.appleHealth) {
      setNeedsSync(false);
      return;
    }

    if (!platforms.lastSync) {
      setNeedsSync(true);
      return;
    }

    const lastDate = new Date(platforms.lastSync);
    const last = isNaN(lastDate.getTime()) ? 0 : lastDate.getTime();
    const now = Date.now();
    const hoursSinceSync = (now - last) / (1000 * 60 * 60);

    // Prompt if data is older than 4 hours
    setNeedsSync(hoursSinceSync > 4);
  }, [platforms]);

  const handleConnect = useCallback(async (platform: 'google' | 'apple') => {
    setConnecting(platform);
    setError(null);

    try {
      // Check if we're on native platform
      if (platformInfo.isNative) {
        // Use real health service
        const connected = await healthService.connect();

        if (connected) {
          const newSettings = { ...settings };
          if (!newSettings.connectedPlatforms) {
            newSettings.connectedPlatforms = { googleFit: false, appleHealth: false, lastSync: null };
          }

          if (platform === 'google') {
            newSettings.connectedPlatforms.googleFit = true;
          } else {
            newSettings.connectedPlatforms.appleHealth = true;
          }

          StorageService.saveSettings(newSettings);
          onUpdate();

          // Immediately sync steps
          await handleSync();
        } else {
          setError(t('permissionDenied') || 'Permission denied. Please enable in settings.');
        }
      } else {
        // Web fallback - simulate connection
        setTimeout(() => {
          const newSettings = { ...settings };
          if (!newSettings.connectedPlatforms) {
            newSettings.connectedPlatforms = { googleFit: false, appleHealth: false, lastSync: null };
          }

          if (platform === 'google') {
            newSettings.connectedPlatforms.googleFit = !newSettings.connectedPlatforms.googleFit;
          } else {
            newSettings.connectedPlatforms.appleHealth = !newSettings.connectedPlatforms.appleHealth;
          }

          StorageService.saveSettings(newSettings);
          onUpdate();

          if (newSettings.connectedPlatforms.googleFit || newSettings.connectedPlatforms.appleHealth) {
            handleSync();
          }
        }, 1500);
      }
    } catch (e) {
      console.error('Connection error:', e);
      setError(t('connectionError') || 'Failed to connect. Please try again.');
    } finally {
      setConnecting(null);
    }
  }, [settings, platformInfo, onUpdate]);

  const handleDisconnect = useCallback(async (platform: 'google' | 'apple') => {
    setConnecting(platform);

    try {
      if (platformInfo.isNative) {
        await healthService.disconnect();
      }

      const newSettings = { ...settings };
      if (platform === 'google') {
        newSettings.connectedPlatforms.googleFit = false;
      } else {
        newSettings.connectedPlatforms.appleHealth = false;
      }

      StorageService.saveSettings(newSettings);
      onUpdate();
    } catch (e) {
      console.error('Disconnect error:', e);
    } finally {
      setConnecting(null);
    }
  }, [settings, platformInfo, onUpdate]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);

    try {
      if (platformInfo.isNative || connectionStatus?.isConnected) {
        // Real sync from health service
        const stepsAdded = await healthService.syncStepsToStorage();
        const newSteps = await healthService.getTodaySteps();
        setTodaySteps(newSteps);

        console.log(`Synced ${stepsAdded} new steps`);
      } else {
        // Web fallback - simulate
        await new Promise(resolve => setTimeout(resolve, 1500));
        const randomSteps = Math.floor(Math.random() * 500) + 100;
        StorageService.syncExternalSteps(randomSteps);
      }

      setNeedsSync(false);
      onUpdate();
    } catch (e) {
      console.error('Sync error:', e);
      setError(t('syncError') || 'Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  }, [platformInfo, connectionStatus, onUpdate]);

  const openSettings = useCallback(async () => {
    try {
      await healthService.openHealthSettings();
    } catch (e) {
      console.error('Failed to open settings:', e);
    }
  }, []);

  // Determine which platform to show based on device
  const showGoogleFit = !platformInfo.isIOS;
  const showAppleHealth = platformInfo.isIOS || !platformInfo.isMobile;

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
      <h4 className="text-gray-900 dark:text-white font-bold mb-2 flex items-center gap-2">
        <Activity size={18} className="text-red-500" />
        {t('healthIntegrations')}
      </h4>

      {/* Platform indicator */}
      {platformInfo.isNative && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
          <Smartphone size={14} />
          <span>
            {platformInfo.platform === 'android' ? 'Health Connect' : 'HealthKit'} {connectionStatus?.isAvailable ? 'available' : 'not available'}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 mt-0.5" />
          <div>
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            {platformInfo.isNative && (
              <button
                onClick={openSettings}
                className="text-xs text-red-600 dark:text-red-400 underline mt-1"
              >
                Open Settings
              </button>
            )}
          </div>
        </div>
      )}

      {needsSync && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <Bell size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-orange-800 dark:text-orange-200">{t('syncRequired')}</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 leading-relaxed">
              {t('backgroundSyncNote')}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-orange-100 dark:bg-orange-800 hover:bg-orange-200 dark:hover:bg-orange-700 text-orange-700 dark:text-orange-200 text-[10px] font-bold px-3 py-1.5 rounded transition"
          >
            {syncing ? <RefreshCw size={12} className="animate-spin" /> : t('sync')}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('integrationNote')}
      </p>

      {/* Today's steps from health service */}
      {(platforms.googleFit || platforms.appleHealth) && todaySteps > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-full text-white">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Today's Steps</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{todaySteps.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Google Fit */}
        {showGoogleFit && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm">
                <GoogleFitLogo />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {platformInfo.platform === 'android' ? 'Health Connect' : 'Google Fit'}
                </p>
                {platforms.googleFit && (
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <Check size={10} /> {t('connected')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => platforms.googleFit ? handleDisconnect('google') : handleConnect('google')}
              disabled={connecting !== null}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                platforms.googleFit
                  ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20'
              }`}
            >
              {connecting === 'google'
                ? <RefreshCw size={14} className="animate-spin" />
                : (platforms.googleFit ? t('disconnect') : t('connect'))}
            </button>
          </div>
        )}

        {/* Apple Health */}
        {showAppleHealth && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm">
                <AppleHealthLogo />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Apple Health</p>
                {platforms.appleHealth && (
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <Check size={10} /> {t('connected')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => platforms.appleHealth ? handleDisconnect('apple') : handleConnect('apple')}
              disabled={connecting !== null}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                platforms.appleHealth
                  ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                  : 'bg-black text-white hover:bg-gray-800 shadow-md shadow-black/20'
              }`}
            >
              {connecting === 'apple'
                ? <RefreshCw size={14} className="animate-spin" />
                : (platforms.appleHealth ? t('disconnect') : t('connect'))}
            </button>
          </div>
        )}
      </div>

      {(platforms.googleFit || platforms.appleHealth) && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {platforms.lastSync ? `${t('lastSync')}: ${(() => {
              const d = new Date(platforms.lastSync);
              return isNaN(d.getTime()) ? '' : d.toLocaleTimeString();
            })()}` : ''}
          </span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-400 transition"
          >
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {syncing ? t('syncing') : t('syncNow')}
          </button>
        </div>
      )}
    </div>
  );
};
