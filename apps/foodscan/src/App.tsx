import { useState } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel, t } from '@fitstream/shared';
import { Camera, Utensils, Scale, Settings, BarChart3 } from 'lucide-react';

function FoodScanApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState<'scan' | 'history' | 'settings'>('scan');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Utensils className="text-orange-400" size={24} />
          FoodScan
        </h1>
        <p className="text-sm text-gray-400 mt-1">AI Nutrition Scanner</p>
      </header>

      <main className="px-4 pb-24">
        {view === 'scan' && (
          <div className="space-y-4">
            <button className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-dashed border-orange-500/30 flex flex-col items-center justify-center gap-3 hover:border-orange-500/50 transition-colors">
              <Camera size={48} className="text-orange-400" />
              <span className="text-lg font-medium">Scan Food</span>
              <span className="text-sm text-gray-400">Take a photo to analyze nutrition</span>
            </button>

            <button className="w-full p-4 rounded-xl bg-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
              <Scale size={24} className="text-blue-400" />
              <div className="text-left">
                <div className="font-medium">{t('scanScale') || 'Scan Scale Display'}</div>
                <div className="text-sm text-gray-400">Read weight from your scale photo</div>
              </div>
            </button>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} />
              Nutrition History
            </h2>
            <p className="text-gray-400">No scans yet. Start by scanning your food!</p>
          </div>
        )}

        {view === 'settings' && <SettingsPanel appName="FoodScan" />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-white/10 px-6 py-3 flex justify-around">
        <button onClick={() => setView('scan')} className={`flex flex-col items-center gap-1 ${view === 'scan' ? 'text-orange-400' : 'text-gray-500'}`}>
          <Camera size={20} />
          <span className="text-xs">Scan</span>
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-orange-400' : 'text-gray-500'}`}>
          <BarChart3 size={20} />
          <span className="text-xs">History</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-orange-400' : 'text-gray-500'}`}>
          <Settings size={20} />
          <span className="text-xs">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider initialTheme="dark">
        <FoodScanApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
