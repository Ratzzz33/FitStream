/**
 * FoodScan - AI Nutrition Scanner
 * Standalone app with orange theme and 3-view navigation
 */

import { useState, useCallback, useEffect } from 'react';
import {
  AuthProvider, ThemeProvider, SettingsPanel,
  useAuth, useTheme, useBilling,
  t,
} from '@fitstream/shared';
import {
  Camera, BarChart3, Settings, Utensils,
  Scale, Coins, Smartphone,
} from 'lucide-react';
import { NutritionTracker } from './components/NutritionTracker';
import { WeightTracker } from './components/WeightTracker';
import { DeviceSettings } from './components/DeviceSettings';
import { StorageService } from './services/storageService';

type View = 'scan' | 'history' | 'settings';

function FoodScanApp() {
  const { settings, updateSettings, userId } = useAuth();
  const { theme } = useTheme();
  const { balance } = useBilling(userId);
  const [view, setView] = useState<View>('scan');
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [openCamera, setOpenCamera] = useState(false);
  const isDark = theme === 'dark';

  // Refresh settings when device settings change
  const handleSettingsUpdate = useCallback(() => {
    setSettingsVersion(v => v + 1);
    const fresh = StorageService.getSettings();
    updateSettings(fresh);
  }, [updateSettings]);

  // Nutrition history
  const todayNutrition = StorageService.getTodayNutrition();
  const dailyNeeds = StorageService.calculateDailyNeeds(settings);

  // Quick scan action from history tab
  const handleQuickScan = () => {
    setOpenCamera(true);
    setView('scan');
  };

  const handleCameraOpened = () => {
    setOpenCamera(false);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`px-4 pt-12 pb-3 flex items-center justify-between ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Utensils size={18} className="text-white" />
            </div>
            FoodScan
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('aiNutritionScanner') || 'AI Nutrition Scanner'}
          </p>
        </div>
        {balance && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'
          }`}>
            <Coins size={14} />
            <span>{balance.scansRemaining ?? balance.credits ?? 0}</span>
          </div>
        )}
      </header>

      {/* Daily Summary Bar (visible in scan view) */}
      {view === 'scan' && todayNutrition && (
        <div className={`mx-4 mb-3 p-3 rounded-xl flex items-center justify-between ${
          isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className={`font-bold text-base ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {todayNutrition.calories}
              </div>
              <div className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                {t('kcal') || 'kcal'}
              </div>
            </div>
            <div className={`w-px h-8 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
            <div className="flex gap-3">
              <div className="text-center">
                <div className="font-semibold">{todayNutrition.protein}g</div>
                <div className={`text-[10px] ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>{t('protein') || 'P'}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{todayNutrition.carbs}g</div>
                <div className={`text-[10px] ${isDark ? 'text-green-400' : 'text-green-500'}`}>{t('carbs') || 'C'}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{todayNutrition.fat}g</div>
                <div className={`text-[10px] ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`}>{t('fat') || 'F'}</div>
              </div>
            </div>
          </div>
          {dailyNeeds > 0 && (
            <div className="text-right">
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('goal') || 'Goal'}</div>
              <div className="text-sm font-semibold">{dailyNeeds} {t('kcal') || 'kcal'}</div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="pb-24 overflow-y-auto">
        {view === 'scan' && (
          <NutritionTracker
            onRequestPro={() => {}}
            openCameraOnMount={openCamera}
            onCameraOpened={handleCameraOpened}
          />
        )}

        {view === 'history' && (
          <div className="px-4 space-y-6">
            {/* Today's Nutrition Summary */}
            <div className={`rounded-2xl p-5 border shadow-sm ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <BarChart3 size={20} className="text-orange-500" />
                {t('todayNutrition') || "Today's Nutrition"}
              </h2>

              {todayNutrition && todayNutrition.calories > 0 ? (
                <div className="space-y-4">
                  {/* Calorie progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('calories') || 'Calories'}</span>
                      <span className="text-sm font-bold">
                        {todayNutrition.calories} / {dailyNeeds || '—'} {t('kcal') || 'kcal'}
                      </span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, dailyNeeds > 0 ? (todayNutrition.calories / dailyNeeds) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-3">
                    <MacroCard label={t('protein') || 'Protein'} value={todayNutrition.protein} unit="g" color="blue" isDark={isDark} />
                    <MacroCard label={t('carbs') || 'Carbs'} value={todayNutrition.carbs} unit="g" color="green" isDark={isDark} />
                    <MacroCard label={t('fat') || 'Fat'} value={todayNutrition.fat} unit="g" color="yellow" isDark={isDark} />
                  </div>

                  {/* Quick scan button */}
                  <button
                    onClick={handleQuickScan}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-600 transition shadow-lg shadow-orange-500/20"
                  >
                    <Camera size={18} />
                    {t('scanFood') || 'Scan Food'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <Camera size={28} className="text-orange-500" />
                  </div>
                  <p className={`font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('noScansToday') || 'No scans today'}
                  </p>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('startScanningFood') || 'Start by scanning your food!'}
                  </p>
                  <button
                    onClick={handleQuickScan}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition"
                  >
                    <Camera size={16} className="inline mr-2" />
                    {t('scanFood') || 'Scan Food'}
                  </button>
                </div>
              )}
            </div>

            {/* Recent Food Logs */}
            <RecentFoodLogs isDark={isDark} />

            {/* Weight Tracker */}
            <WeightTracker />
          </div>
        )}

        {view === 'settings' && (
          <div className="px-4 space-y-6">
            {/* Device Settings (phone calibration + reference object) */}
            <DeviceSettings
              settings={settings}
              onUpdate={handleSettingsUpdate}
            />

            {/* Shared Settings Panel (profile, language, theme) */}
            <SettingsPanel appName="FoodScan" />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 inset-x-0 backdrop-blur-lg border-t px-6 py-3 flex justify-around z-40 ${
        isDark
          ? 'bg-gray-950/95 border-gray-800'
          : 'bg-white/95 border-gray-200'
      }`}>
        <NavButton
          icon={<Camera size={22} />}
          label={t('scan') || 'Scan'}
          active={view === 'scan'}
          onClick={() => setView('scan')}
          isDark={isDark}
        />
        <NavButton
          icon={<BarChart3 size={22} />}
          label={t('history') || 'History'}
          active={view === 'history'}
          onClick={() => setView('history')}
          isDark={isDark}
        />
        <NavButton
          icon={<Settings size={22} />}
          label={t('settings') || 'Settings'}
          active={view === 'settings'}
          onClick={() => setView('settings')}
          isDark={isDark}
        />
      </nav>
    </div>
  );
}

// --- Sub-components ---

function NavButton({ icon, label, active, onClick, isDark }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors min-w-[60px] ${
        active
          ? 'text-orange-500'
          : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      <span className={`text-xs font-medium ${active ? 'text-orange-500' : ''}`}>{label}</span>
      {active && <div className="w-1 h-1 rounded-full bg-orange-500" />}
    </button>
  );
}

function MacroCard({ label, value, unit, color, isDark }: {
  label: string;
  value: number;
  unit: string;
  color: string;
  isDark: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: isDark ? 'text-blue-400 bg-blue-900/20 border-blue-800' : 'text-blue-600 bg-blue-50 border-blue-200',
    green: isDark ? 'text-green-400 bg-green-900/20 border-green-800' : 'text-green-600 bg-green-50 border-green-200',
    yellow: isDark ? 'text-yellow-400 bg-yellow-900/20 border-yellow-800' : 'text-yellow-600 bg-yellow-50 border-yellow-200',
  };
  const classes = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-3 rounded-xl border text-center ${classes}`}>
      <div className="text-lg font-bold">{value}{unit}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

function RecentFoodLogs({ isDark }: { isDark: boolean }) {
  const logs = StorageService.getNutritionLogs();
  const recent = logs.slice(-10).reverse();

  if (recent.length === 0) return null;

  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <Utensils size={16} className="text-orange-500" />
        {t('recentScans') || 'Recent Scans'}
      </h3>
      <div className="space-y-2">
        {recent.map((log) => (
          <div
            key={log.id}
            className={`flex items-center justify-between p-3 rounded-xl ${
              isDark ? 'bg-gray-900/50 hover:bg-gray-900' : 'bg-gray-50 hover:bg-gray-100'
            } transition`}
          >
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {log.foodName || t('unknownFood') || 'Food item'}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {log.date} {log.mealType && `• ${log.mealType}`}
              </p>
            </div>
            <div className="text-right ml-3">
              <span className={`text-sm font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {log.calories} {t('kcal') || 'kcal'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Root App with Providers ---

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider initialTheme="dark">
        <FoodScanApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
