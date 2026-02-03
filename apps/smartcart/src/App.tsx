import { useState } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel } from '@fitstream/shared';
import { ShoppingCart, Receipt, Camera, Settings, List } from 'lucide-react';

function SmartCartApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState<'shop' | 'receipts' | 'settings'>('shop');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="text-green-400" size={24} />
          SmartCart
        </h1>
        <p className="text-sm text-gray-400 mt-1">AI Shopping Assistant</p>
      </header>

      <main className="px-4 pb-24">
        {view === 'shop' && (
          <div className="space-y-4">
            <button className="w-full p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-dashed border-green-500/30 flex flex-col items-center gap-3">
              <List size={48} className="text-green-400" />
              <span className="text-lg font-medium">Generate Shopping List</span>
              <span className="text-sm text-gray-400">AI plans meals and creates your list</span>
            </button>

            <button className="w-full p-4 rounded-xl bg-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
              <Receipt size={24} className="text-yellow-400" />
              <div className="text-left">
                <div className="font-medium">Scan Receipt</div>
                <div className="text-sm text-gray-400">Track spending and nutrition from receipts</div>
              </div>
            </button>

            <button className="w-full p-4 rounded-xl bg-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
              <Camera size={24} className="text-blue-400" />
              <div className="text-left">
                <div className="font-medium">Verify Product</div>
                <div className="text-sm text-gray-400">Scan product to check health score</div>
              </div>
            </button>
          </div>
        )}

        {view === 'receipts' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Receipt History</h2>
            <p className="text-gray-400">No receipts scanned yet.</p>
          </div>
        )}

        {view === 'settings' && <SettingsPanel appName="SmartCart" />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-white/10 px-6 py-3 flex justify-around">
        <button onClick={() => setView('shop')} className={`flex flex-col items-center gap-1 ${view === 'shop' ? 'text-green-400' : 'text-gray-500'}`}>
          <ShoppingCart size={20} />
          <span className="text-xs">Shop</span>
        </button>
        <button onClick={() => setView('receipts')} className={`flex flex-col items-center gap-1 ${view === 'receipts' ? 'text-green-400' : 'text-gray-500'}`}>
          <Receipt size={20} />
          <span className="text-xs">Receipts</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-green-400' : 'text-gray-500'}`}>
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
        <SmartCartApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
