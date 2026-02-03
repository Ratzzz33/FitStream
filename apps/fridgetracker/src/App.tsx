import { useState, useCallback } from 'react';
import { AuthProvider, ThemeProvider, useTheme, SettingsPanel } from '@fitstream/shared';
import { Camera, Settings, Package } from 'lucide-react';
import { KitchenHub } from './components/KitchenHub';
import { BatchCamera } from './components/BatchCamera';

type View = 'inventory' | 'scan' | 'settings';

function FridgeTrackerApp() {
  const { theme } = useTheme();
  const [view, setView] = useState<View>('inventory');

  // When Kitchen requests a scan, switch to scan view
  const handleScanRequest = useCallback(() => {
    setView('scan');
  }, []);

  // When BatchCamera finishes, go back to inventory
  const handleScanComplete = useCallback(() => {
    setView('inventory');
  }, []);

  const handleScanClose = useCallback(() => {
    setView('inventory');
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Main content area */}
      <main className="flex-1 pb-[68px] overflow-auto">
        {view === 'inventory' && (
          <KitchenHub onScanRequest={handleScanRequest} />
        )}

        {view === 'scan' && (
          <BatchCamera
            onClose={handleScanClose}
            onComplete={handleScanComplete}
          />
        )}

        {view === 'settings' && (
          <div className="pt-12 px-4">
            <div className="flex items-center gap-2 mb-6">
              <Package className="text-cyan-400" size={24} />
              <h1 className="text-xl font-bold">FridgeTracker Settings</h1>
            </div>
            <SettingsPanel appName="FridgeTracker" />
          </div>
        )}
      </main>

      {/* Bottom navigation - hidden during camera mode */}
      {view !== 'scan' && (
        <nav className={`fixed bottom-0 inset-x-0 z-40 backdrop-blur border-t px-6 py-3 flex justify-around
          ${isDark
            ? 'bg-gray-900/95 border-white/10'
            : 'bg-white/95 border-gray-200'
          }`}
        >
          <button
            onClick={() => setView('inventory')}
            className={`flex flex-col items-center gap-1 transition-colors
              ${view === 'inventory'
                ? 'text-cyan-500'
                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <Package size={20} />
            <span className="text-xs font-medium">Inventory</span>
          </button>
          <button
            onClick={() => setView('scan')}
            className={`flex flex-col items-center gap-1 transition-colors
              ${view === 'scan'
                ? 'text-cyan-500'
                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <Camera size={20} />
            <span className="text-xs font-medium">Scan</span>
          </button>
          <button
            onClick={() => setView('settings')}
            className={`flex flex-col items-center gap-1 transition-colors
              ${view === 'settings'
                ? 'text-cyan-500'
                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <Settings size={20} />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </nav>
      )}
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
