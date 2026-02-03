import { useState } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel } from '@fitstream/shared';
import { ChefHat, BookOpen, Settings, Sparkles } from 'lucide-react';

function CookBotApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState<'generate' | 'saved' | 'settings'>('generate');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChefHat className="text-amber-400" size={24} />
          CookBot
        </h1>
        <p className="text-sm text-gray-400 mt-1">AI Recipe Generator</p>
      </header>

      <main className="px-4 pb-24">
        {view === 'generate' && (
          <div className="space-y-4">
            <button className="w-full p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-dashed border-amber-500/30 flex flex-col items-center gap-3">
              <Sparkles size={48} className="text-amber-400" />
              <span className="text-lg font-medium">Generate Recipe</span>
              <span className="text-sm text-gray-400">AI creates recipes from your ingredients</span>
            </button>
          </div>
        )}

        {view === 'saved' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen size={20} />
              Saved Recipes
            </h2>
            <p className="text-gray-400">No recipes saved yet.</p>
          </div>
        )}

        {view === 'settings' && <SettingsPanel appName="CookBot" />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-white/10 px-6 py-3 flex justify-around">
        <button onClick={() => setView('generate')} className={`flex flex-col items-center gap-1 ${view === 'generate' ? 'text-amber-400' : 'text-gray-500'}`}>
          <Sparkles size={20} />
          <span className="text-xs">Create</span>
        </button>
        <button onClick={() => setView('saved')} className={`flex flex-col items-center gap-1 ${view === 'saved' ? 'text-amber-400' : 'text-gray-500'}`}>
          <BookOpen size={20} />
          <span className="text-xs">Recipes</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-amber-400' : 'text-gray-500'}`}>
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
        <CookBotApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
