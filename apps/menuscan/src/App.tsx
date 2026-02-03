import { useState } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel } from '@fitstream/shared';
import { Camera, Settings, MapPin, History } from 'lucide-react';

function MenuScanApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState<'scan' | 'history' | 'settings'>('scan');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="text-rose-400" size={24} />
          MenuScan
        </h1>
        <p className="text-sm text-gray-400 mt-1">Restaurant Menu Analyzer</p>
      </header>

      <main className="px-4 pb-24">
        {view === 'scan' && (
          <div className="space-y-4">
            <button className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-2 border-dashed border-rose-500/30 flex flex-col items-center justify-center gap-3">
              <Camera size={48} className="text-rose-400" />
              <span className="text-lg font-medium">Scan Menu</span>
              <span className="text-sm text-gray-400">Photo a menu for healthy recommendations</span>
            </button>

            <button className="w-full p-4 rounded-xl bg-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
              <MapPin size={24} className="text-blue-400" />
              <div className="text-left">
                <div className="font-medium">Nearby Restaurants</div>
                <div className="text-sm text-gray-400">Find healthy options near you</div>
              </div>
            </button>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History size={20} />
              Scan History
            </h2>
            <p className="text-gray-400">No menus scanned yet.</p>
          </div>
        )}

        {view === 'settings' && <SettingsPanel appName="MenuScan" />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-white/10 px-6 py-3 flex justify-around">
        <button onClick={() => setView('scan')} className={`flex flex-col items-center gap-1 ${view === 'scan' ? 'text-rose-400' : 'text-gray-500'}`}>
          <Camera size={20} />
          <span className="text-xs">Scan</span>
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-rose-400' : 'text-gray-500'}`}>
          <History size={20} />
          <span className="text-xs">History</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-rose-400' : 'text-gray-500'}`}>
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
        <MenuScanApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
