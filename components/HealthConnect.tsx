import React, { useState, useEffect } from 'react';
import { Activity, Smartphone, Check, RefreshCw, AlertCircle, Bell } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UserSettings } from '../types';
import { t } from '../services/i18n';

interface HealthConnectProps {
  settings: UserSettings;
  onUpdate: () => void;
}

export const HealthConnect: React.FC<HealthConnectProps> = ({ settings, onUpdate }) => {
  const [connecting, setConnecting] = useState<'google' | 'apple' | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);

  const platforms = settings.connectedPlatforms || { googleFit: false, appleHealth: false, lastSync: null };

  // Check for stale data (simulate lack of background sync)
  useEffect(() => {
    if (!platforms.googleFit && !platforms.appleHealth) {
        setNeedsSync(false);
        return;
    }

    if (!platforms.lastSync) {
        setNeedsSync(true);
        return;
    }

    const last = new Date(platforms.lastSync).getTime();
    const now = Date.now();
    const hoursSinceSync = (now - last) / (1000 * 60 * 60);

    // Prompt if data is older than 4 hours
    if (hoursSinceSync > 4) {
        setNeedsSync(true);
    } else {
        setNeedsSync(false);
    }
  }, [platforms]);

  const handleConnect = (platform: 'google' | 'apple') => {
    setConnecting(platform);
    
    // Simulate OAuth / Permission Flow
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
        setConnecting(null);
        onUpdate();
        
        // If connected, trigger an immediate "sync"
        if (newSettings.connectedPlatforms.googleFit || newSettings.connectedPlatforms.appleHealth) {
            handleSync();
        }
    }, 1500);
  };

  const handleSync = () => {
      setSyncing(true);
      
      // Simulate fetching data from API
      setTimeout(() => {
          // Simulate finding some steps from the "cloud"
          const randomSteps = Math.floor(Math.random() * 500) + 100;
          StorageService.syncExternalSteps(randomSteps);
          setSyncing(false);
          setNeedsSync(false);
          onUpdate();
      }, 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <h4 className="text-gray-900 dark:text-white font-bold mb-2 flex items-center gap-2">
            <Activity size={18} className="text-red-500" />
            {t('healthIntegrations')}
        </h4>
        
        {needsSync && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Bell size={16} className="text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                    <p className="text-xs font-bold text-orange-800 dark:text-orange-200">Sync Required</p>
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 leading-relaxed">
                        Background sync is unavailable in browser mode. It has been a while since your last update.
                    </p>
                </div>
                <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-orange-100 dark:bg-orange-800 hover:bg-orange-200 dark:hover:bg-orange-700 text-orange-700 dark:text-orange-200 text-[10px] font-bold px-3 py-1.5 rounded transition"
                >
                    {syncing ? <RefreshCw size={12} className="animate-spin" /> : 'Sync'}
                </button>
            </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('integrationNote')}
        </p>

        <div className="space-y-3">
            {/* Google Fit */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <span className="text-lg">🇬</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Google Fit</p>
                        {platforms.googleFit && (
                            <p className="text-[10px] text-green-500 flex items-center gap-1">
                                <Check size={10} /> {t('connected')}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => handleConnect('google')}
                    disabled={connecting !== null}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        platforms.googleFit 
                        ? 'bg-red-50 text-red-500 border border-red-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                >
                    {connecting === 'google' 
                        ? <RefreshCw size={14} className="animate-spin" /> 
                        : (platforms.googleFit ? t('dismiss') : t('connect'))}
                </button>
            </div>

            {/* Apple Health */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-black">
                        <AlertCircle size={20} fill="black" className="text-white" />
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
                     onClick={() => handleConnect('apple')}
                     disabled={connecting !== null}
                     className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        platforms.appleHealth 
                        ? 'bg-red-50 text-red-500 border border-red-200' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                >
                    {connecting === 'apple' 
                        ? <RefreshCw size={14} className="animate-spin" /> 
                        : (platforms.appleHealth ? t('dismiss') : t('connect'))}
                </button>
            </div>
        </div>

        {(platforms.googleFit || platforms.appleHealth) && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                    {platforms.lastSync ? `${t('lastSync')}: ${new Date(platforms.lastSync).toLocaleTimeString()}` : ''}
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