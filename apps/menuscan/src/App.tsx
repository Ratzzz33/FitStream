import { useState, useCallback } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel } from '@fitstream/shared';
import { Camera, Settings, History, Flame, Zap } from 'lucide-react';
import { MenuScanner } from './components/MenuScanner';
import { RestaurantHistory } from './components/RestaurantHistory';
import { StorageService } from './services/storageService';
import type { NutritionLog } from './types';

type AppView = 'scan' | 'history' | 'settings';

function MenuScanApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [view, setView] = useState<AppView>('scan');
  const [todayCalories, setTodayCalories] = useState(() => StorageService.getTodayNutrition().calories);

  const handleMealLogged = useCallback((log: NutritionLog) => {
    setTodayCalories(StorageService.getTodayNutrition().calories);
  }, []);

  const needs = StorageService.calculateDailyNeeds();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="text-rose-400" size={24} />
              MenuScan
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Restaurant Menu Analyzer
            </p>
          </div>
          {/* Quick calorie badge */}
          {todayCalories > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            }`}>
              <Flame size={14} className="text-orange-400" />
              <span className="font-medium">{todayCalories}</span>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                / {needs.calories}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-24">
        {view === 'scan' && (
          <MenuScanner onMealLogged={handleMealLogged} />
        )}

        {view === 'history' && (
          <RestaurantHistory onMealLogged={handleMealLogged} />
        )}

        {view === 'settings' && <SettingsPanel appName="MenuScan" />}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 inset-x-0 backdrop-blur border-t px-6 py-3 flex justify-around z-50 ${
        isDark
          ? 'bg-gray-950/95 border-white/10'
          : 'bg-white/95 border-gray-200'
      }`}>
        <NavButton
          icon={<Camera size={20} />}
          label="Scan"
          active={view === 'scan'}
          onClick={() => setView('scan')}
          isDark={isDark}
        />
        <NavButton
          icon={<History size={20} />}
          label="History"
          active={view === 'history'}
          onClick={() => setView('history')}
          isDark={isDark}
        />
        <NavButton
          icon={<Settings size={20} />}
          label="Settings"
          active={view === 'settings'}
          onClick={() => setView('settings')}
          isDark={isDark}
        />
      </nav>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${
        active
          ? 'text-rose-400'
          : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider initialTheme="dark">
        <MenuScanApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
