import { useState } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel } from '@fitstream/shared';
import { ShoppingCart, Wallet, Settings } from 'lucide-react';
import ShoppingAssistant from './components/ShoppingAssistant';
import { FoodFinance } from './components/FoodFinance';

type Tab = 'shop' | 'finance' | 'settings';

function SmartCartApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('shop');

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Main content area */}
      <main className="pb-20">
        {activeTab === 'shop' && <ShoppingAssistant />}
        {activeTab === 'finance' && <FoodFinance />}
        {activeTab === 'settings' && (
          <div className="pt-12 px-4">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Settings className="text-green-500" size={24} />
              Settings
            </h1>
            <SettingsPanel appName="SmartCart" />
          </div>
        )}
      </main>

      {/* Bottom Tab Bar - green theme */}
      <nav className={`fixed bottom-0 inset-x-0 z-50 ${
        isDark
          ? 'bg-gray-900/95 border-gray-800'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-lg border-t px-6 py-2 flex justify-around safe-area-bottom`}>
        {([
          { id: 'shop' as Tab, icon: ShoppingCart, label: 'Shop' },
          { id: 'finance' as Tab, icon: Wallet, label: 'Finance' },
          { id: 'settings' as Tab, icon: Settings, label: 'Settings' },
        ]).map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-green-500'
                  : isDark
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-green-500' : ''}`}>
                {label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-green-500 -mt-0.5" />
              )}
            </button>
          );
        })}
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
