// components/UpdateBanner.tsx
import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { APP_VERSION } from '../version';

interface UpdateBannerProps {
  onDismiss?: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ onDismiss }) => {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [apkUrl, setApkUrl] = useState<string>('https://fitstream.health/downloads/fitstream-1.3.0.apk');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check for updates from server
    const checkForUpdates = async () => {
      try {
        const response = await fetch('https://fitstream-server.fly.dev/api/version');
        const data = await response.json();
        if (data.version && data.version !== APP_VERSION) {
          // Check if this version was already dismissed
          const dismissedVersion = localStorage.getItem('dismissedUpdateVersion');
          if (dismissedVersion !== data.version) {
            setLatestVersion(data.version);
            if (data.apkUrl) {
              setApkUrl(data.apkUrl);
            }
          }
        }
      } catch (e) {
        // Silently fail - not critical
      }
    };

    checkForUpdates();
  }, []);

  const handleDismiss = () => {
    if (latestVersion) {
      localStorage.setItem('dismissedUpdateVersion', latestVersion);
    }
    setDismissed(true);
    onDismiss?.();
  };

  const handleUpdate = () => {
    window.open(apkUrl, '_blank');
  };

  if (!latestVersion || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-4 py-3 z-50 shadow-lg">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Download size={20} />
          <div>
            <p className="font-medium text-sm">Доступна новая версия {latestVersion}</p>
            <p className="text-xs opacity-80">Текущая: {APP_VERSION}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-50 transition"
          >
            Обновить
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
