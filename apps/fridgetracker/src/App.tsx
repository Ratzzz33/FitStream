import { useState } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel } from '@fitstream/shared';
import { Camera, Settings, Package, AlertTriangle } from 'lucide-react';

function FridgeTrackerApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState<'inventory' | 'scan' | 'settings'>('inventory');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="text-cyan-400" size={24} />
          FridgeTracker
        </h1>
        <p className="text-sm text-gray-400 mt-1">Kitchen Inventory Manager</p>
      </header>

      <main className="px-4 pb-24">
        {view === 'inventory' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center gap-2">
                <Package size={32} className="text-cyan-400" />
                <span className="text-sm font-medium">Fridge</span>
                <span className="text-xs text-gray-400">0 items</span>
              </button>
              <button className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center gap-2">
                <Package size={32} className="text-amber-400" />
                <span className="text-sm font-medium">Cabinet</span>
                <span className="text-xs text-gray-400">0 items</span>
              </button>
            </div>

            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex items-center gap-3">
              <AlertTriangle size={20} className="text-yellow-400" />
              <span className="text-sm">No items expiring soon</span>
            </div>
          </div>
        )}

        {view === 'scan' && (
          <div className="space-y-4">
            <button className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-dashed border-cyan-500/30 flex flex-col items-center justify-center gap-3">
              <Camera size={48} className="text-cyan-400" />
              <span className="text-lg font-medium">Scan Storage</span>
              <span className="text-sm text-gray-400">Take a photo of your fridge or cabinet</span>
            </button>
          </div>
        )}

        {view === 'settings' && <SettingsPanel appName="FridgeTracker" />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-white/10 px-6 py-3 flex justify-around">
        <button onClick={() => setView('inventory')} className={`flex flex-col items-center gap-1 ${view === 'inventory' ? 'text-cyan-400' : 'text-gray-500'}`}>
          <Package size={20} />
          <span className="text-xs">Inventory</span>
        </button>
        <button onClick={() => setView('scan')} className={`flex flex-col items-center gap-1 ${view === 'scan' ? 'text-cyan-400' : 'text-gray-500'}`}>
          <Camera size={20} />
          <span className="text-xs">Scan</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-cyan-400' : 'text-gray-500'}`}>
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
        <FridgeTrackerApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
